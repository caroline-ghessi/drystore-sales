import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LandingPageSubmission {
  name: string;
  whatsapp: string;
  email?: string;
  city?: string;
  state?: string;
  productInterest: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  landingPageId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: LandingPageSubmission = await req.json();
    
    // Validação básica
    if (!body.name || !body.whatsapp) {
      return new Response(
        JSON.stringify({ error: 'Nome e WhatsApp são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Formatar número de WhatsApp (remover máscara e adicionar código do país)
    const formattedWhatsapp = formatWhatsappNumber(body.whatsapp);
    
    // Mapear productInterest para product_category válida
    const productGroup = mapProductInterest(body.productInterest);

    // Montar metadata com UTMs
    const metadata = {
      source_type: 'landing_page',
      landing_page_id: body.landingPageId || 'generic',
      requires_qualification: true,
      submitted_at: new Date().toISOString(),
      utm: {
        source: body.utmSource || null,
        medium: body.utmMedium || null,
        campaign: body.utmCampaign || null,
        content: body.utmContent || null,
        term: body.utmTerm || null,
      },
      gclid: body.gclid || null,
      fbclid: body.fbclid || null,
    };

    console.log('[submit-landing-page] Processing submission:', {
      name: body.name,
      whatsapp: formattedWhatsapp,
      productGroup,
      metadata,
    });

    // Verificar se já existe conversa com esse número
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id, status, source')
      .eq('whatsapp_number', formattedWhatsapp)
      .maybeSingle();

    let conversationId: string;

    if (existingConversation) {
      // Atualizar conversa existente se estiver fechada ou aguardando
      conversationId = existingConversation.id;
      
      console.log('[submit-landing-page] Found existing conversation:', conversationId);

      // Atualizar dados da conversa
      await supabase
        .from('conversations')
        .update({
          customer_name: body.name,
          customer_email: body.email || null,
          customer_city: body.city || null,
          customer_state: body.state || null,
          product_group: productGroup,
          status: existingConversation.status === 'closed' ? 'waiting' : existingConversation.status,
          metadata: {
            ...metadata,
            previous_source: existingConversation.source,
            resubmitted_from_lp: true,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

    } else {
      // Criar nova conversa
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          whatsapp_number: formattedWhatsapp,
          whatsapp_name: body.name,
          customer_name: body.name,
          customer_email: body.email || null,
          customer_city: body.city || null,
          customer_state: body.state || null,
          product_group: productGroup,
          source: 'landing_page',
          status: 'waiting',
          lead_score: 0,
          lead_temperature: 'cold',
          metadata,
          first_message_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (convError) {
        console.error('[submit-landing-page] Error creating conversation:', convError);
        throw convError;
      }

      conversationId = newConversation.id;
      console.log('[submit-landing-page] Created new conversation:', conversationId);
    }

    // Criar ou atualizar project_contexts
    const { data: existingContext } = await supabase
      .from('project_contexts')
      .select('id')
      .eq('conversation_id', conversationId)
      .maybeSingle();

    if (existingContext) {
      await supabase
        .from('project_contexts')
        .update({
          desired_product: body.productInterest,
          updated_at: new Date().toISOString(),
        })
        .eq('conversation_id', conversationId);
    } else {
      await supabase
        .from('project_contexts')
        .insert({
          conversation_id: conversationId,
          desired_product: body.productInterest,
        });
    }

    // Criar mensagem inicial simulando o interesse do lead
    const initialMessage = buildInitialMessage(body);
    
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'customer',
        sender_name: body.name,
        content: initialMessage,
        metadata: {
          source: 'landing_page',
          landing_page_id: body.landingPageId || 'generic',
          is_initial_lp_message: true,
        },
      });

    // Log do sucesso
    await supabase
      .from('system_logs')
      .insert({
        level: 'info',
        source: 'submit-landing-page',
        message: 'Landing page lead captured successfully',
        data: {
          conversation_id: conversationId,
          product_interest: body.productInterest,
          has_email: !!body.email,
          has_location: !!(body.city || body.state),
          has_utms: !!(body.utmSource || body.utmCampaign),
          has_gclid: !!body.gclid,
          has_fbclid: !!body.fbclid,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        conversationId,
        message: 'Lead capturado com sucesso',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[submit-landing-page] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar cadastro',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatWhatsappNumber(phone: string): string {
  // Remove tudo que não é número
  const cleaned = phone.replace(/\D/g, '');
  
  // Se já tem código do país (55), retorna
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    return cleaned;
  }
  
  // Adiciona código do Brasil
  return `55${cleaned}`;
}

function mapProductInterest(interest: string): string {
  const mapping: Record<string, string> = {
    'telha_shingle': 'telhas',
    'telha-shingle': 'telhas',
    'shingle': 'telhas',
    'telhas': 'telhas',
    'energia_solar': 'energia_solar',
    'energia-solar': 'energia_solar',
    'solar': 'energia_solar',
    'steel_frame': 'steel_frame',
    'steel-frame': 'steel_frame',
    'steelframe': 'steel_frame',
    'pisos': 'pisos',
    'piso': 'pisos',
    'ferramentas': 'ferramentas',
    'ferramenta': 'ferramentas',
    'geral': 'geral',
  };
  
  return mapping[interest.toLowerCase()] || 'geral';
}

function buildInitialMessage(data: LandingPageSubmission): string {
  const productNames: Record<string, string> = {
    'telha_shingle': 'Telha Shingle',
    'telha-shingle': 'Telha Shingle',
    'shingle': 'Telha Shingle',
    'telhas': 'Telhas',
    'energia_solar': 'Energia Solar',
    'energia-solar': 'Energia Solar',
    'solar': 'Energia Solar',
    'steel_frame': 'Steel Frame',
    'steel-frame': 'Steel Frame',
    'steelframe': 'Steel Frame',
    'pisos': 'Pisos',
    'piso': 'Pisos',
    'ferramentas': 'Ferramentas',
    'ferramenta': 'Ferramentas',
  };

  const productName = productNames[data.productInterest.toLowerCase()] || data.productInterest;
  
  let message = `[Lead via Landing Page]\n\n`;
  message += `Olá! Me chamo ${data.name} e tenho interesse em ${productName}.`;
  
  if (data.city || data.state) {
    message += `\n\nLocalização: ${[data.city, data.state].filter(Boolean).join(' - ')}`;
  }
  
  if (data.email) {
    message += `\nEmail: ${data.email}`;
  }

  return message;
}
