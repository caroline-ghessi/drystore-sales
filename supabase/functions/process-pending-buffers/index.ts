import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
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

    console.log('[Worker] Starting buffer processing cycle...');

    // Buscar buffers prontos para processar (máximo 10 por execução)
    const now = new Date().toISOString();
    
    const { data: pendingBuffers, error: fetchError } = await supabase
      .from('message_buffers')
      .select('id, conversation_id, messages, should_process_at, processing_started_at')
      .eq('processed', false)
      .lte('should_process_at', now)
      .is('processing_started_at', null) // Apenas buffers não sendo processados
      .order('should_process_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error('[Worker] Error fetching pending buffers:', fetchError);
      throw fetchError;
    }

    if (!pendingBuffers || pendingBuffers.length === 0) {
      console.log('[Worker] No pending buffers to process');
      return new Response(JSON.stringify({
        success: true,
        stats,
        message: 'No pending buffers',
        execution_time_ms: Date.now() - executionStart
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log(`[Worker] Found ${pendingBuffers.length} buffers to process`);

    // Processar cada buffer
    for (const buffer of pendingBuffers) {
      try {
        console.log(`[Worker] Processing buffer ${buffer.id} for conversation ${buffer.conversation_id}`);

        // Chamar process-message-buffer
        const { data, error } = await supabase.functions.invoke('process-message-buffer', {
          body: { conversationId: buffer.conversation_id }
        });

        if (error) {
          console.error(`[Worker] Error processing buffer ${buffer.id}:`, error);
          stats.failed++;
          stats.errors.push(`Buffer ${buffer.id}: ${error.message}`);
        } else if (data?.success) {
          console.log(`[Worker] Successfully processed buffer ${buffer.id}`);
          stats.processed++;
        } else {
          console.warn(`[Worker] Buffer ${buffer.id} processing returned non-success:`, data);
          stats.skipped++;
        }

      } catch (bufferError) {
        console.error(`[Worker] Exception processing buffer ${buffer.id}:`, bufferError);
        stats.failed++;
        stats.errors.push(`Buffer ${buffer.id}: ${bufferError.message}`);
      }
    }

    const executionTime = Date.now() - executionStart;

    // Log das estatísticas
    await supabase.from('system_logs').insert({
      level: stats.failed > 0 ? 'warning' : 'info',
      source: 'process-pending-buffers',
      message: `Processed ${stats.processed} buffers, ${stats.failed} failed, ${stats.skipped} skipped`,
      data: {
        stats,
        execution_time_ms: executionTime,
        buffers_found: pendingBuffers.length
      }
    });

    console.log(`[Worker] Cycle completed in ${executionTime}ms:`, stats);

    return new Response(JSON.stringify({
      success: true,
      stats,
      execution_time_ms: executionTime,
      buffers_found: pendingBuffers.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[Worker] Fatal error in process-pending-buffers:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stats,
      execution_time_ms: Date.now() - executionStart
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
