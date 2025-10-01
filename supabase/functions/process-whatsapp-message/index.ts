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

    // Este edge function agora apenas cria/atualiza o buffer de mensagens
    // O processamento real é feito pelo process-message-buffer após 60 segundos

    const bufferTime = 60; // 60 segundos de buffer
    const now = new Date();
    const shouldProcessAt = new Date(now.getTime() + bufferTime * 1000);

    // Buscar buffer existente ou criar novo
    const { data: existingBuffer } = await supabase
      .from('message_buffers')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('processed', false)
      .single();

    if (existingBuffer) {
      // Atualizar buffer existente com nova mensagem
      const currentMessages = existingBuffer.messages || [];
      const updatedMessages = [
        ...currentMessages,
        {
          content: message,
          timestamp: now.toISOString(),
          sender_type: 'customer'
        }
      ];

      await supabase
        .from('message_buffers')
        .update({
          messages: updatedMessages,
          should_process_at: shouldProcessAt.toISOString() // Resetar timer
        })
        .eq('id', existingBuffer.id);

      console.log(`Updated existing buffer ${existingBuffer.id} with new message`);
    } else {
      // Criar novo buffer
      const { data: newBuffer, error: bufferError } = await supabase
        .from('message_buffers')
        .insert({
          conversation_id: conversationId,
          messages: [{
            content: message,
            timestamp: now.toISOString(),
            sender_type: 'customer'
          }],
          buffer_started_at: now.toISOString(),
          should_process_at: shouldProcessAt.toISOString(),
          processed: false
        })
        .select()
        .single();

      if (bufferError) {
        throw new Error(`Failed to create buffer: ${bufferError.message}`);
      }

      console.log(`Created new buffer ${newBuffer.id} for conversation ${conversationId}`);
    }

    // A mensagem já foi salva pelo webhook, não precisamos salvar novamente
    // O buffer será processado automaticamente pelo worker periódico (process-pending-buffers)
    // que roda a cada 60 segundos no frontend

    console.log(`Buffer ${existingBuffer?.id || 'new'} ready for processing at ${shouldProcessAt.toISOString()}`);

    return new Response(JSON.stringify({ 
      success: true, 
      buffered: true,
      conversation_id: conversationId,
      should_process_at: shouldProcessAt.toISOString(),
      will_be_processed_by_worker: true
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