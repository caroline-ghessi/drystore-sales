import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json().catch(() => ({}));
    const automated = body.automated ?? false;

    console.log(`[daily-quality-analysis] Iniciando análise diária. Automated: ${automated}`);

    // Buscar todos os vendedores ativos
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, name, phone_number, is_active')
      .eq('is_active', true);

    if (vendorsError) {
      throw new Error(`Erro ao buscar vendedores: ${vendorsError.message}`);
    }

    if (!vendors || vendors.length === 0) {
      console.log('[daily-quality-analysis] Nenhum vendedor ativo encontrado');
      return new Response(
        JSON.stringify({ message: 'Nenhum vendedor ativo encontrado', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[daily-quality-analysis] ${vendors.length} vendedores ativos encontrados`);

    const results = {
      total_vendors: vendors.length,
      vendors_processed: 0,
      conversations_analyzed: 0,
      alerts_generated: 0,
      errors: [] as string[],
    };

    // Calcular período das últimas 24 horas
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const vendor of vendors) {
      try {
        console.log(`[daily-quality-analysis] Processando vendedor: ${vendor.name} (${vendor.id})`);

        // Buscar conversas do vendedor com atividade nas últimas 24h
        const { data: conversations, error: convError } = await supabase
          .from('vendor_conversations')
          .select('id, chat_id, customer_name, customer_phone, last_message_at, total_messages')
          .eq('vendor_id', vendor.id)
          .gte('last_message_at', yesterday.toISOString())
          .order('last_message_at', { ascending: false });

        if (convError) {
          console.error(`[daily-quality-analysis] Erro ao buscar conversas do vendedor ${vendor.id}:`, convError);
          results.errors.push(`Vendedor ${vendor.name}: ${convError.message}`);
          continue;
        }

        if (!conversations || conversations.length === 0) {
          console.log(`[daily-quality-analysis] Nenhuma conversa recente para ${vendor.name}`);
          continue;
        }

        console.log(`[daily-quality-analysis] ${conversations.length} conversas encontradas para ${vendor.name}`);

        // Para cada conversa, verificar se já foi analisada hoje
        for (const conversation of conversations) {
          try {
            // Verificar análise existente nas últimas 24h
            const { data: existingAnalysis } = await supabase
              .from('vendor_quality_analysis')
              .select('id')
              .eq('conversation_id', conversation.id)
              .eq('vendor_id', vendor.id)
              .gte('analyzed_at', yesterday.toISOString())
              .single();

            if (existingAnalysis) {
              console.log(`[daily-quality-analysis] Conversa ${conversation.id} já analisada nas últimas 24h`);
              continue;
            }

            // Chamar quality-analysis para esta conversa
            const analysisResponse = await fetch(
              `${Deno.env.get('SUPABASE_URL')}/functions/v1/quality-analysis`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                },
                body: JSON.stringify({
                  conversationId: conversation.id,
                  vendorId: vendor.id,
                  forceAnalysis: false
                })
              }
            );

            const analysisResult = await analysisResponse.json();

            if (analysisResponse.ok && analysisResult.success) {
              results.conversations_analyzed++;
              results.alerts_generated += analysisResult.alerts_generated || 0;
              console.log(`[daily-quality-analysis] ✓ Conversa ${conversation.id} analisada. Score: ${analysisResult.analysis?.quality_score || 'N/A'}`);
            } else {
              console.log(`[daily-quality-analysis] ⚠ Conversa ${conversation.id}: ${analysisResult.message || analysisResult.error || 'Sem resultado'}`);
            }

          } catch (convError) {
            const errorMsg = convError instanceof Error ? convError.message : String(convError);
            console.error(`[daily-quality-analysis] Erro na conversa ${conversation.id}:`, errorMsg);
            results.errors.push(`Conversa ${conversation.id}: ${errorMsg}`);
          }
        }

        results.vendors_processed++;

      } catch (vendorError) {
        const errorMsg = vendorError instanceof Error ? vendorError.message : String(vendorError);
        console.error(`[daily-quality-analysis] Erro no vendedor ${vendor.id}:`, errorMsg);
        results.errors.push(`Vendedor ${vendor.name}: ${errorMsg}`);
      }
    }

    const duration = Date.now() - startTime;
    
    // Log do resultado
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'daily-quality-analysis',
      message: `Análise diária concluída em ${duration}ms`,
      data: {
        automated,
        ...results,
        duration_ms: duration
      }
    });

    console.log(`[daily-quality-analysis] Concluído em ${duration}ms. Resultados:`, results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Análise diária concluída',
        duration_ms: duration,
        ...results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[daily-quality-analysis] Erro fatal:', errorMessage);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'daily-quality-analysis',
      message: 'Erro na análise diária',
      data: { error: errorMessage }
    });

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
