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

    // Ler até 10 mensagens da fila usando wrapper function
    const { data: messages, error: readError } = await supabase.rpc('read_whatsapp_queue', {
      p_vt: 60, // Visibility timeout de 60 segundos
      p_qty: 10 // Máximo de 10 mensagens por ciclo
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

        // 🆕 PASSO 1: Transformar mensagens PGMQ para formato do buffer
        const bufferMessages = messageArray.map(msg => ({
          content: msg.message.message || '',
          sender_type: msg.message.sender_type || 'customer',
          timestamp: msg.message.timestamp || new Date().toISOString(),
          whatsapp_number: msg.message.whatsappNumber || ''
        }));

        console.log(`[QueueWorker] Transformed ${bufferMessages.length} messages for buffer`);

        // 🆕 PASSO 2: Buscar buffer existente não processado
        const { data: existingBuffer, error: bufferSearchError } = await supabase
          .from('message_buffers')
          .select('*')
          .eq('conversation_id', conversationId)
          .eq('processed', false)
          .maybeSingle();

        if (bufferSearchError) {
          console.error(`[QueueWorker] Error searching for buffer:`, bufferSearchError);
        }

        // 🆕 PASSO 3: Criar ou atualizar o buffer
        if (existingBuffer) {
          // Atualizar buffer existente adicionando novas mensagens
          const updatedMessages = [
            ...(existingBuffer.messages || []),
            ...bufferMessages
          ];

          const { error: updateError } = await supabase
            .from('message_buffers')
            .update({
              messages: updatedMessages,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingBuffer.id);

          if (updateError) {
            console.error(`[QueueWorker] Error updating buffer:`, updateError);
            throw updateError;
          }

          console.log(`✅ [QueueWorker] Updated existing buffer ${existingBuffer.id} with ${bufferMessages.length} new messages`);
        } else {
          // Criar novo buffer
          const { error: insertError } = await supabase
            .from('message_buffers')
            .insert({
              conversation_id: conversationId,
              messages: bufferMessages,
              buffer_started_at: new Date().toISOString(),
              should_process_at: new Date().toISOString(), // Processar imediatamente
              processed: false,
              processing_started_at: null,
              processed_at: null
            });

          if (insertError) {
            console.error(`[QueueWorker] Error creating buffer:`, insertError);
            throw insertError;
          }

          console.log(`✅ [QueueWorker] Created new buffer for conversation ${conversationId} with ${bufferMessages.length} messages`);
        }

        // PASSO 4: Chamar process-message-buffer com a lógica existente
        const { data, error } = await supabase.functions.invoke('process-message-buffer', {
          body: { conversationId }
        });

        if (error) {
          throw error;
        }

        if (data?.success) {
          // Sucesso: deletar todas as mensagens usando wrapper function em paralelo
          const deletePromises = messageArray.map(msg => 
            supabase.rpc('delete_queue_message', {
              p_msg_id: msg.msg_id
            })
          );

          const deleteResults = await Promise.all(deletePromises);
          
          // Log erros se houver
          deleteResults.forEach((result, idx) => {
            if (result.error) {
              console.error(`[QueueWorker] Error deleting message ${messageArray[idx].msg_id}:`, result.error);
            }
          });

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
        const archivePromises = [];
        
        for (const msg of messageArray) {
          const retryCount = (msg.message.retry_count || 0) + 1;

          if (retryCount >= 3) {
            // Usar wrapper function para arquivar após 3 tentativas
            archivePromises.push(
              supabase.rpc('archive_queue_message', {
                p_msg_id: msg.msg_id
              }).then(result => ({ msg, result, retryCount }))
            );
          } else {
            // Mensagem voltará à fila após VT expirar automaticamente
            console.log(`⚠️ [QueueWorker] Retry ${retryCount}/3 for message ${msg.msg_id} (will retry automatically)`);
          }
        }

        // Arquivar mensagens que falharam 3x em paralelo
        if (archivePromises.length > 0) {
          const archiveResults = await Promise.all(archivePromises);
          
          archiveResults.forEach(({ msg, result, retryCount }) => {
            if (result.error) {
              console.error(`[QueueWorker] Error archiving message ${msg.msg_id}:`, result.error);
            } else {
              console.log(`🔴 [QueueWorker] Archived message ${msg.msg_id} after ${retryCount} failures`);
            }
          });
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
