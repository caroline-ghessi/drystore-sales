import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { normalizePhone, isExcludedContact } from '../_shared/phone-utils.ts';
import { checkOpportunityDuplicate, logMatchDecision } from '../_shared/opportunity-matcher.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface VendorConversation {
  id: number;
  customer_name: string | null;
  customer_phone: string | null;
  vendor_id: string;
  product_category: string | null;
  metadata: { is_internal_contact?: boolean } | null;
  has_opportunity: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[VendorOpportunities] Iniciando processamento...');

  try {
    // 1. Buscar conversas não processadas (excluindo internas)
    const { data: conversations, error: fetchError } = await supabase
      .from('vendor_conversations')
      .select('id, customer_name, customer_phone, vendor_id, product_category, metadata, has_opportunity')
      .eq('has_opportunity', false)
      .limit(500); // Processar em lotes

    if (fetchError) {
      throw new Error(`Erro ao buscar conversas: ${fetchError.message}`);
    }

    if (!conversations || conversations.length === 0) {
      console.log('[VendorOpportunities] Nenhuma conversa para processar');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhuma conversa para processar',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Filtrar conversas excluindo contatos internos
    const validConversations = conversations.filter((conv: VendorConversation) => {
      const isInternal = conv.metadata?.is_internal_contact === true;
      if (isInternal) {
        console.log(`[VendorOpportunities] Ignorando conversa ${conv.id} - contato interno`);
      }
      return !isInternal;
    });

    console.log(`[VendorOpportunities] ${validConversations.length} conversas para processar (${conversations.length - validConversations.length} ignoradas como internas)`);

    let processed = 0;
    let merged = 0;
    let failed = 0;
    const errors: string[] = [];

    // 3. Processar cada conversa
    for (const conv of validConversations) {
      try {
        if (!conv.customer_phone) {
          console.log(`[VendorOpportunities] Conversa ${conv.id} sem telefone, pulando`);
          continue;
        }

        const normalizedPhone = normalizePhone(conv.customer_phone);
        
        if (!normalizedPhone) {
          console.log(`[VendorOpportunities] Conversa ${conv.id} telefone inválido: ${conv.customer_phone}, pulando`);
          continue;
        }

        // 3.1 VERIFICAÇÃO DUPLA: Checar lista de exclusão diretamente
        const isExcluded = await isExcludedContact(supabase, normalizedPhone);
        if (isExcluded) {
          console.log(`[VendorOpportunities] Telefone ${normalizedPhone} na lista de exclusão, pulando conversa ${conv.id}`);
          
          // Self-healing: Corrigir metadata se necessário
          if (!conv.metadata?.is_internal_contact) {
            await supabase
              .from('vendor_conversations')
              .update({ 
                metadata: { ...(conv.metadata || {}), is_internal_contact: true },
                has_opportunity: true
              })
              .eq('id', conv.id);
            console.log(`[VendorOpportunities] Conversa ${conv.id} corrigida como internal_contact`);
          }
          continue;
        }

        // 3.2 Verificar se cliente veio do bot oficial
        const { data: botConversation } = await supabase
          .from('conversations')
          .select('id, whatsapp_number')
          .eq('whatsapp_number', normalizedPhone)
          .limit(1)
          .maybeSingle();

        const isFromBot = !!botConversation;
        const opportunitySource = isFromBot ? 'whatsapp' : 'vendor_whatsapp';
        const botConversationId = isFromBot ? botConversation.id : null;

        if (isFromBot) {
          console.log(`[VendorOpportunities] Cliente ${normalizedPhone} veio do bot oficial (conversa ${botConversation.id})`);
        }

        // 3.3 Criar/atualizar cliente no CRM
        const { data: customer, error: customerError } = await supabase
          .from('crm_customers')
          .upsert({
            phone: normalizedPhone,
            name: conv.customer_name || 'Cliente sem nome',
            source: opportunitySource,
            conversation_id: botConversationId,
            last_interaction_at: new Date().toISOString(),
            status: 'lead',
          }, { 
            onConflict: 'phone',
            ignoreDuplicates: false 
          })
          .select('id')
          .single();

        if (customerError) {
          console.error(`[VendorOpportunities] Erro ao criar cliente para conversa ${conv.id}:`, customerError);
          failed++;
          errors.push(`Conv ${conv.id}: ${customerError.message}`);
          continue;
        }

        // 3.4 NOVO: Verificar duplicação antes de criar oportunidade
        const matchResult = await checkOpportunityDuplicate(supabase, {
          customer_phone: normalizedPhone,
          vendor_id: conv.vendor_id,
          product_category: conv.product_category || undefined,
          vendor_conversation_id: conv.id,
          source: 'vendor_whatsapp'
        });

        if (matchResult.action === 'merge' && matchResult.existing_opportunity_id) {
          // Atualizar oportunidade existente com vendor_conversation_id
          const { error: updateError } = await supabase
            .from('crm_opportunities')
            .update({
              vendor_conversation_id: conv.id,
              conversation_id: botConversationId || undefined,
              updated_at: new Date().toISOString(),
            })
            .eq('id', matchResult.existing_opportunity_id);
          
          if (updateError) {
            console.error(`[VendorOpportunities] Erro ao atualizar oportunidade:`, updateError);
            failed++;
            errors.push(`Conv ${conv.id} merge: ${updateError.message}`);
            continue;
          }
          
          console.log(`[VendorOpportunities] Oportunidade ${matchResult.existing_opportunity_id} atualizada com vendor_conversation ${conv.id}`);
          
          // Registrar decisão
          await logMatchDecision(supabase, {
            customer_phone: normalizedPhone,
            vendor_id: conv.vendor_id,
            product_category: conv.product_category || undefined,
            vendor_conversation_id: conv.id,
            source: 'vendor_whatsapp'
          }, matchResult);
          
          merged++;
          
        } else {
          // 3.5 Criar nova oportunidade
          const validationStatus = matchResult.action === 'needs_review' ? 'needs_review' : 'ai_generated';
          
          const { data: newOpp, error: oppError } = await supabase
            .from('crm_opportunities')
            .insert({
              customer_id: customer.id,
              vendor_conversation_id: conv.id,
              vendor_id: conv.vendor_id,
              conversation_id: botConversationId,
              title: `Oportunidade - ${conv.product_category || 'Nova'}`,
              source: opportunitySource,
              product_category: conv.product_category,
              stage: 'prospecting',
              probability: isFromBot ? 20 : 10,
              value: 0,
              validation_status: validationStatus,
              match_confidence: matchResult.confidence,
            })
            .select('id')
            .single();

          if (oppError) {
            console.error(`[VendorOpportunities] Erro ao criar oportunidade para conversa ${conv.id}:`, oppError);
            failed++;
            errors.push(`Conv ${conv.id} opp: ${oppError.message}`);
            continue;
          }
          
          // Registrar decisão
          await logMatchDecision(supabase, {
            customer_phone: normalizedPhone,
            vendor_id: conv.vendor_id,
            product_category: conv.product_category || undefined,
            vendor_conversation_id: conv.id,
            source: 'vendor_whatsapp'
          }, matchResult, newOpp?.id);
        }

        // 3.6 Marcar conversa como processada
        const { error: updateError } = await supabase
          .from('vendor_conversations')
          .update({ 
            has_opportunity: true,
            last_processed_at: new Date().toISOString()
          })
          .eq('id', conv.id);

        if (updateError) {
          console.error(`[VendorOpportunities] Erro ao atualizar conversa ${conv.id}:`, updateError);
        }

        processed++;
        
        // Log a cada 50 processados
        if (processed % 50 === 0) {
          console.log(`[VendorOpportunities] Progresso: ${processed}/${validConversations.length}`);
        }

      } catch (convError) {
        const errorMsg = convError instanceof Error ? convError.message : String(convError);
        console.error(`[VendorOpportunities] Erro na conversa ${conv.id}:`, errorMsg);
        failed++;
        errors.push(`Conv ${conv.id}: ${errorMsg}`);
      }
    }

    const duration = Date.now() - startTime;
    
    // 4. Log do processamento
    await supabase.from('system_logs').insert({
      level: failed > 0 ? 'warning' : 'info',
      source: 'process-vendor-opportunities',
      message: `Processamento concluído: ${processed} sucesso (${merged} merges), ${failed} falhas`,
      data: {
        total_found: conversations.length,
        valid_conversations: validConversations.length,
        processed,
        merged,
        failed,
        duration_ms: duration,
        errors: errors.slice(0, 10) // Limitar erros no log
      }
    });

    console.log(`[VendorOpportunities] Concluído em ${duration}ms: ${processed} processados (${merged} merges), ${failed} falhas`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Processamento concluído',
        stats: {
          total_found: conversations.length,
          valid_conversations: validConversations.length,
          processed,
          merged,
          failed,
          duration_ms: duration
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[VendorOpportunities] Erro fatal:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'process-vendor-opportunities',
      message: 'Erro fatal no processamento',
      data: { error: errorMessage }
    });

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
