import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar buffers não processados com mais de 2 horas
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: oldBuffers, error: fetchError } = await supabase
      .from('message_buffers')
      .select('id, conversation_id, messages, buffer_started_at')
      .eq('processed', false)
      .lt('buffer_started_at', twoHoursAgo);

    if (fetchError) {
      console.error('Error fetching old buffers:', fetchError);
      throw fetchError;
    }

    if (!oldBuffers || oldBuffers.length === 0) {
      console.log('No old buffers to clean up');
      return new Response(JSON.stringify({
        success: true,
        cleaned: 0,
        message: 'No old buffers found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log(`Found ${oldBuffers.length} old buffers to discard`);

    // Marcar como processados sem enviar mensagens
    const bufferIds = oldBuffers.map(b => b.id);
    
    const { error: updateError } = await supabase
      .from('message_buffers')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        messages: oldBuffers.map(b => ({
          ...b.messages,
          metadata: { discarded: true, reason: 'timeout_cleanup' }
        }))
      })
      .in('id', bufferIds);

    if (updateError) {
      console.error('Error updating old buffers:', updateError);
      throw updateError;
    }

    // Log da limpeza
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'cleanup-old-buffers',
      message: `Discarded ${oldBuffers.length} old unprocessed buffers`,
      data: {
        buffer_ids: bufferIds,
        oldest_buffer: oldBuffers[0]?.buffer_started_at
      }
    });

    console.log(`Successfully discarded ${oldBuffers.length} old buffers`);

    return new Response(JSON.stringify({
      success: true,
      cleaned: oldBuffers.length,
      buffer_ids: bufferIds
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error in cleanup-old-buffers:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
