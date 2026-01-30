/**
 * Process Vendor Media - Processa mídia de mensagens de vendedores
 * 
 * Endpoint para processar áudios, imagens e documentos
 * Pode processar mensagem individual ou em lote
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  processMediaMessage, 
  needsMediaProcessing,
  type VendorMessage 
} from "../_shared/media-processor.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessRequest {
  messageId?: number;      // Processar mensagem específica
  conversationId?: number; // Processar todas de uma conversa
  batchSize?: number;      // Processar lote de pendentes (máx 50)
  forceReprocess?: boolean; // Reprocessar mesmo se já processado
}

interface ProcessResponse {
  success: boolean;
  processed: number;
  failed: number;
  results: Array<{
    messageId: number;
    success: boolean;
    content?: string;
    error?: string;
    processingTimeMs: number;
  }>;
  totalProcessingTimeMs: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const results: ProcessResponse["results"] = [];
  let processed = 0;
  let failed = 0;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: ProcessRequest = await req.json();
    const { messageId, conversationId, batchSize = 10, forceReprocess = false } = body;

    console.log(`[process-vendor-media] Iniciando processamento...`, body);

    // Construir query baseada nos parâmetros
    let query = supabase
      .from("vendor_messages")
      .select("id, message_type, media_url, content, media_metadata")
      .in("message_type", ["audio", "voice", "ptt", "image", "document"])
      .not("media_url", "is", null);

    if (messageId) {
      // Processar mensagem específica
      query = query.eq("id", messageId);
    } else if (conversationId) {
      // Processar todas de uma conversa
      query = query.eq("conversation_id", conversationId);
    } else {
      // Processar lote de pendentes
      query = query.or("processing_status.is.null,processing_status.eq.pending");
    }

    if (!forceReprocess && !messageId) {
      query = query.or("processing_status.is.null,processing_status.eq.pending,processing_status.eq.failed");
    }

    query = query.order("id", { ascending: false }).limit(Math.min(batchSize, 50));

    const { data: messages, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Erro ao buscar mensagens: ${fetchError.message}`);
    }

    if (!messages || messages.length === 0) {
      console.log("[process-vendor-media] Nenhuma mensagem para processar");
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          failed: 0,
          results: [],
          totalProcessingTimeMs: Date.now() - startTime,
          message: "Nenhuma mensagem pendente de processamento",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-vendor-media] ${messages.length} mensagens para processar`);

    // Processar mensagens
    for (const msg of messages) {
      const vendorMessage: VendorMessage = {
        id: msg.id,
        message_type: msg.message_type,
        media_url: msg.media_url,
        content: msg.content || "",
        media_metadata: msg.media_metadata,
      };

      if (!needsMediaProcessing(vendorMessage)) {
        console.log(`[process-vendor-media] Mensagem ${msg.id} não precisa processamento`);
        continue;
      }

      // Marcar como processando
      await supabase
        .from("vendor_messages")
        .update({ processing_status: "processing" })
        .eq("id", msg.id);

      try {
        const result = await processMediaMessage(vendorMessage);

        if (result.success) {
          // Atualizar com o conteúdo processado
          await supabase
            .from("vendor_messages")
            .update({
              processed_content: result.content,
              processing_status: "completed",
              processing_error: null,
              processed_at: new Date().toISOString(),
            })
            .eq("id", msg.id);

          processed++;
          results.push({
            messageId: msg.id,
            success: true,
            content: result.content.substring(0, 200) + (result.content.length > 200 ? "..." : ""),
            processingTimeMs: result.processingTimeMs,
          });

          console.log(`[process-vendor-media] ✅ Mensagem ${msg.id} processada com sucesso`);
        } else {
          // Marcar como falha
          await supabase
            .from("vendor_messages")
            .update({
              processing_status: "failed",
              processing_error: result.error,
              processed_at: new Date().toISOString(),
            })
            .eq("id", msg.id);

          failed++;
          results.push({
            messageId: msg.id,
            success: false,
            error: result.error,
            processingTimeMs: result.processingTimeMs,
          });

          console.log(`[process-vendor-media] ❌ Mensagem ${msg.id} falhou: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        await supabase
          .from("vendor_messages")
          .update({
            processing_status: "failed",
            processing_error: errorMsg,
            processed_at: new Date().toISOString(),
          })
          .eq("id", msg.id);

        failed++;
        results.push({
          messageId: msg.id,
          success: false,
          error: errorMsg,
          processingTimeMs: 0,
        });

        console.error(`[process-vendor-media] ❌ Erro inesperado na mensagem ${msg.id}:`, errorMsg);
      }
    }

    const totalProcessingTimeMs = Date.now() - startTime;

    console.log(`[process-vendor-media] Concluído: ${processed} sucesso, ${failed} falhas em ${totalProcessingTimeMs}ms`);

    // Log de sistema
    await supabase.from("system_logs").insert({
      level: processed > 0 ? "info" : "warning",
      source: "process-vendor-media",
      message: `Processamento de mídia concluído: ${processed} sucesso, ${failed} falhas`,
      data: {
        processed,
        failed,
        totalProcessingTimeMs,
        messageId,
        conversationId,
        batchSize,
      },
    });

    const response: ProcessResponse = {
      success: failed === 0,
      processed,
      failed,
      results,
      totalProcessingTimeMs,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[process-vendor-media] Erro:", errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        processed,
        failed,
        results,
        totalProcessingTimeMs: Date.now() - startTime,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
