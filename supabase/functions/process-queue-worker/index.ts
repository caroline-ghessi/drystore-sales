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

  const executionStart = Date.now();
  const stats = {
    processed: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[]
  };

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[QueueWorker] Starting queue processing cycle...');

    // Ler até 10 mensagens da fila (VT de 60s garante buffer automático)
    const { data: messages, error: readError } = await supabase.rpc('pgmq.read', {
      queue_name: 'whatsapp_messages_queue',
      vt: 60, // Visibility timeout - mensagem fica invisível por 60s se falhar
      qty: 10
    });

    if (readError) {
      console.error('[QueueWorker] Error reading from queue:', readError);
      throw readError;
    }

    if (!messages || messages.length === 0) {
      console.log('[QueueWorker] No messages in queue');
      return new Response(JSON.stringify({
        success: true,
        stats,
        message: 'No messages in queue',
        execution_time_ms: Date.now() - executionStart
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log(`[QueueWorker] Found ${messages.length} messages to process`);

    // Agrupar mensagens por conversationId para processar juntas
    const groupedMessages = messages.reduce((acc: any, msg: any) => {
      const convId = msg.message.conversationId;
      if (!acc[convId]) acc[convId] = [];
      acc[convId].push(msg);
      return acc;
    }, {});

    console.log(`[QueueWorker] Grouped into ${Object.keys(groupedMessages).length} conversations`);

    // Processar cada conversa
    for (const [conversationId, msgs] of Object.entries(groupedMessages)) {
      const messageArray = msgs as any[];
      
      try {
        console.log(`[QueueWorker] Processing conversation ${conversationId} with ${messageArray.length} messages`);

        // Chamar process-message-buffer com a lógica existente
        const { data, error } = await supabase.functions.invoke('process-message-buffer', {
          body: { conversationId }
        });

        if (error) {
          throw error;
        }

        if (data?.success) {
          // Sucesso: deletar todas as mensagens da conversa da fila
          for (const msg of messageArray) {
            const { error: deleteError } = await supabase.rpc('pgmq.delete', {
              queue_name: 'whatsapp_messages_queue',
              msg_id: msg.msg_id
            });

            if (deleteError) {
              console.error(`[QueueWorker] Error deleting message ${msg.msg_id}:`, deleteError);
            }
          }

          console.log(`✅ [QueueWorker] Successfully processed and deleted ${messageArray.length} messages for conversation ${conversationId}`);
          stats.processed += messageArray.length;

        } else {
          console.warn(`[QueueWorker] Conversation ${conversationId} returned non-success:`, data);
          stats.skipped += messageArray.length;
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ [QueueWorker] Error processing conversation ${conversationId}:`, error);
        stats.failed += messageArray.length;
        stats.errors.push(`Conversation ${conversationId}: ${errorMessage}`);

        // Incrementar contador de retry e mover para DLQ se necessário
        for (const msg of messageArray) {
          const retryCount = (msg.message.retry_count || 0) + 1;

          if (retryCount >= 3) {
            // Mover para Dead Letter Queue após 3 tentativas
            const { error: dlqError } = await supabase
              .from('failed_whatsapp_messages')
              .insert({
                conversation_id: conversationId,
                message_content: msg.message.message,
                whatsapp_number: msg.message.whatsappNumber,
                retry_count: retryCount,
                last_error: errorMessage,
                metadata: msg.message
              });

            if (dlqError) {
              console.error(`[QueueWorker] Error inserting to DLQ:`, dlqError);
            }

            // Deletar da fila principal
            await supabase.rpc('pgmq.delete', {
              queue_name: 'whatsapp_messages_queue',
              msg_id: msg.msg_id
            });

            console.log(`🔴 [QueueWorker] Moved message ${msg.msg_id} to DLQ after ${retryCount} failures`);
          } else {
            // Atualizar retry count (mensagem voltará à fila após VT expirar)
            console.log(`⚠️ [QueueWorker] Retry ${retryCount}/3 for message ${msg.msg_id} (will retry automatically)`);
            // Não precisamos fazer nada - o VT fará a mensagem voltar automaticamente
          }
        }
      }
    }

    const executionTime = Date.now() - executionStart;

    // Log das estatísticas
    await supabase.from('system_logs').insert({
      level: stats.failed > 0 ? 'warning' : 'info',
      source: 'process-queue-worker',
      message: `Processed ${stats.processed} messages, ${stats.failed} failed, ${stats.skipped} skipped`,
      data: {
        stats,
        execution_time_ms: executionTime,
        messages_found: messages.length,
        conversations_processed: Object.keys(groupedMessages).length
      }
    });

    console.log(`[QueueWorker] Cycle completed in ${executionTime}ms:`, stats);

    return new Response(JSON.stringify({
      success: true,
      stats,
      execution_time_ms: executionTime,
      messages_found: messages.length,
      conversations_processed: Object.keys(groupedMessages).length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[QueueWorker] Fatal error in process-queue-worker:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      stats,
      execution_time_ms: Date.now() - executionStart
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
