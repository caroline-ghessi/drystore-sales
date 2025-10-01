import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, message, whatsappNumber } = await req.json();

    if (!conversationId || !message || !whatsappNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Received message for conversation ${conversationId}: ${message}`);

    // Enfileirar mensagem usando wrapper function (corrige ordem de parâmetros PGMQ)
    const { data: queueData, error: queueError } = await supabase.rpc('enqueue_whatsapp_message', {
      p_conversation_id: conversationId,
      p_message: message,
      p_whatsapp_number: whatsappNumber,
      p_delay: 60 // Buffer de 60 segundos
    });

    if (queueError) {
      console.error('Error enqueueing message:', queueError);
      throw new Error(`Failed to enqueue message: ${queueError.message}`);
    }

    console.log(`✅ Message enqueued with ID ${queueData} - will be processed in 60 seconds by worker`);

    return new Response(JSON.stringify({ 
      success: true, 
      enqueued: true,
      conversation_id: conversationId,
      queue_message_id: queueData,
      will_process_in_seconds: 60
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error processing WhatsApp message:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'process-whatsapp-message',
      message: 'Failed to process message',
      data: { error: errorMessage }
    });

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});