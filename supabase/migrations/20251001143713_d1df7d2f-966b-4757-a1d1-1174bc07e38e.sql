-- ============================================================================
-- WRAPPER FUNCTIONS PARA PGMQ (CORRIGE PROBLEMA DE ORDEM DE PARÂMETROS)
-- ============================================================================
-- Estas funções encapsulam as operações PGMQ garantindo a ordem correta
-- dos parâmetros quando chamadas via supabase.rpc() com named parameters
-- ============================================================================

-- 1. Wrapper para enfileirar mensagens do WhatsApp
CREATE OR REPLACE FUNCTION public.enqueue_whatsapp_message(
  p_conversation_id uuid,
  p_message text,
  p_whatsapp_number text,
  p_delay integer DEFAULT 60
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msg_id bigint;
BEGIN
  -- Chama pgmq.send com a ordem correta: queue_name, msg, delay
  v_msg_id := pgmq.send(
    'whatsapp_messages_queue',
    jsonb_build_object(
      'conversationId', p_conversation_id,
      'message', p_message,
      'whatsappNumber', p_whatsapp_number,
      'timestamp', now(),
      'sender_type', 'customer',
      'retry_count', 0
    ),
    p_delay
  );
  
  -- Log para debugging
  INSERT INTO system_logs (level, source, message, data)
  VALUES (
    'info',
    'enqueue_whatsapp_message',
    'Message enqueued successfully',
    jsonb_build_object(
      'msg_id', v_msg_id,
      'conversation_id', p_conversation_id,
      'delay', p_delay
    )
  );
  
  RETURN v_msg_id;
END;
$$;

-- 2. Wrapper para ler mensagens da fila
CREATE OR REPLACE FUNCTION public.read_whatsapp_queue(
  p_vt integer DEFAULT 60,
  p_qty integer DEFAULT 10
)
RETURNS TABLE (
  msg_id bigint,
  read_ct integer,
  enqueued_at timestamp with time zone,
  vt timestamp with time zone,
  message jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Chama pgmq.read com a ordem correta: queue_name, vt, qty
  RETURN QUERY
  SELECT * FROM pgmq.read(
    'whatsapp_messages_queue',
    p_vt,
    p_qty
  );
END;
$$;

-- 3. Wrapper para deletar mensagem da fila
CREATE OR REPLACE FUNCTION public.delete_queue_message(
  p_msg_id bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result boolean;
BEGIN
  -- Chama pgmq.delete com a ordem correta: queue_name, msg_id
  v_result := pgmq.delete(
    'whatsapp_messages_queue',
    p_msg_id
  );
  
  RETURN v_result;
END;
$$;

-- 4. Wrapper para arquivar mensagem (Dead Letter Queue)
CREATE OR REPLACE FUNCTION public.archive_queue_message(
  p_msg_id bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result boolean;
BEGIN
  -- Chama pgmq.archive com a ordem correta: queue_name, msg_id
  v_result := pgmq.archive(
    'whatsapp_messages_queue',
    p_msg_id
  );
  
  -- Log para auditoria
  IF v_result THEN
    INSERT INTO system_logs (level, source, message, data)
    VALUES (
      'warning',
      'archive_queue_message',
      'Message archived to DLQ',
      jsonb_build_object('msg_id', p_msg_id)
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.enqueue_whatsapp_message TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.read_whatsapp_queue TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_queue_message TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.archive_queue_message TO authenticated, service_role;