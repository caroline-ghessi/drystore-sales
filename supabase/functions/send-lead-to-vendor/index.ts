import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { normalizePhone } from '../_shared/phone-utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, vendorId, summary, sentByAgentId } = await req.json();

    if (!conversationId || !vendorId || !summary) {
      return new Response(
        JSON.stringify({ error: 'conversationId, vendorId e summary são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Buscar configuração do bot de leads
    const leadBotToken = Deno.env.get('LEAD_BOT_WHAPI_TOKEN');
    
    if (!leadBotToken || leadBotToken === 'TOKEN_PLACEHOLDER') {
      return new Response(
        JSON.stringify({ error: 'Token do Bot de Leads não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Buscar dados do vendedor
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return new Response(
        JSON.stringify({ error: 'Vendedor não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Buscar dados da conversa para contexto
    const { data: conversation } = await supabase
      .from('conversations')
      .select('customer_name, whatsapp_number, customer_email, customer_city, customer_state, product_group, lead_temperature')
      .eq('id', conversationId)
      .single();

    // 4. Preparar mensagem para o vendedor
    const messageHeader = `🚀 **NOVO LEAD** - ${conversation?.customer_name || 'Cliente'}\n`;
    const messageFooter = `\n---\n📱 WhatsApp do cliente: ${conversation?.whatsapp_number}\n⏰ Enviado em: ${new Date().toLocaleString('pt-BR')}`;
    
    const fullMessage = messageHeader + summary + messageFooter;

    // 5. Enviar mensagem via Whapi usando o BOT DE LEADS
    const whapiResponse = await fetch(`https://gate.whapi.cloud/messages/text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${leadBotToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: vendor.phone_number,
        body: fullMessage
      }),
    });

    const whapiData = await whapiResponse.json();

    if (!whapiResponse.ok) {
      throw new Error(`Erro na Whapi: ${whapiData.message || 'Erro desconhecido'}`);
    }

    // 6. Registrar distribuição na tabela
    const { data: distribution, error: distError } = await supabase
      .from('lead_distributions')
      .insert({
        conversation_id: conversationId,
        vendor_id: vendorId,
        summary_text: summary,
        sent_by_agent_id: sentByAgentId,
        status: 'sent',
        metadata: {
          whapi_message_id: whapiData.id,
          vendor_phone: vendor.phone_number,
          bot_used: 'BOT DE LEADS'
        }
      })
      .select()
      .single();

    if (distError) {
      console.error('Erro ao registrar distribuição:', distError);
    }

    // 7. NOVO: Criar/atualizar crm_customers e crm_opportunities
    let customerId: string | null = null;
    let opportunityId: string | null = null;

    try {
      // 7.1 Criar ou atualizar cliente no CRM
      const normalizedPhone = normalizePhone(conversation?.whatsapp_number || '');
      
      const { data: customer, error: customerError } = await supabase
        .from('crm_customers')
        .upsert({
          phone: normalizedPhone,
          name: conversation?.customer_name || 'Cliente sem nome',
          city: conversation?.customer_city,
          state: conversation?.customer_state,
          email: conversation?.customer_email,
          source: 'whatsapp',
          conversation_id: conversationId,
          last_interaction_at: new Date().toISOString(),
          status: 'lead',
        }, { 
          onConflict: 'phone',
          ignoreDuplicates: false 
        })
        .select('id')
        .single();

      if (customerError) {
        console.error('Erro ao criar/atualizar cliente CRM:', customerError);
      } else {
        customerId = customer?.id;
        console.log(`Cliente CRM criado/atualizado: ${customerId}`);

        // 7.2 Criar oportunidade no CRM
        const { data: opportunity, error: oppError } = await supabase
          .from('crm_opportunities')
          .insert({
            customer_id: customerId,
            conversation_id: conversationId,
            title: `Oportunidade - ${conversation?.product_group || 'Nova'}`,
            source: 'whatsapp',
            product_category: conversation?.product_group,
            stage: 'prospecting',
            probability: 20,
            value: 0,
            validation_status: 'ai_generated',
            temperature: conversation?.lead_temperature || 'cold',
          })
          .select('id')
          .single();

        if (oppError) {
          console.error('Erro ao criar oportunidade CRM:', oppError);
        } else {
          opportunityId = opportunity?.id;
          console.log(`Oportunidade CRM criada: ${opportunityId}`);
        }
      }

      // 7.3 Atualizar conversations.last_lead_sent_at
      await supabase
        .from('conversations')
        .update({ last_lead_sent_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (crmError) {
      console.error('Erro ao processar CRM:', crmError);
      // Não falha a função principal se o CRM falhar
    }

    // 8. Log do envio
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'send-lead-to-vendor',
      message: 'Lead enviado com sucesso',
      data: {
        conversation_id: conversationId,
        vendor_id: vendorId,
        vendor_name: vendor.name,
        whapi_message_id: whapiData.id,
        distribution_id: distribution?.id,
        crm_customer_id: customerId,
        crm_opportunity_id: opportunityId
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Lead enviado com sucesso',
        distributionId: distribution?.id,
        whapiMessageId: whapiData.id,
        vendorName: vendor.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Erro ao enviar lead:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'send-lead-to-vendor',
      message: 'Erro ao enviar lead',
      data: { error: errorMessage }
    });

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});