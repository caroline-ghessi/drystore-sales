-- 1. Adicionar coluna updated_at à tabela message_buffers
ALTER TABLE public.message_buffers 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Criar trigger para atualização automática
CREATE OR REPLACE FUNCTION public.update_message_buffers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Remover trigger se existir (para evitar erro de duplicação)
DROP TRIGGER IF EXISTS update_message_buffers_updated_at ON public.message_buffers;

-- Criar trigger
CREATE TRIGGER update_message_buffers_updated_at
BEFORE UPDATE ON public.message_buffers
FOR EACH ROW
EXECUTE FUNCTION public.update_message_buffers_updated_at();

-- 3. Limpar fila travada - arquivar todas as mensagens antigas (mais de 1 hora)
-- Primeiro vamos ver o que tem na fila e arquivar
DO $$
DECLARE
  msg_record RECORD;
  archived_count INTEGER := 0;
BEGIN
  -- Arquivar mensagens travadas (enqueued há mais de 1 hora)
  FOR msg_record IN 
    SELECT msg_id FROM pgmq.q_whatsapp_messages_queue 
    WHERE enqueued_at < NOW() - INTERVAL '1 hour'
  LOOP
    PERFORM pgmq.archive('whatsapp_messages_queue', msg_record.msg_id);
    archived_count := archived_count + 1;
  END LOOP;
  
  -- Log da limpeza
  INSERT INTO public.system_logs (level, source, message, data)
  VALUES (
    'info',
    'queue_cleanup_migration',
    'Stale queue messages archived',
    jsonb_build_object(
      'archived_count', archived_count,
      'executed_at', NOW()
    )
  );
END $$;

-- 4. Resetar buffers não processados para permitir reprocessamento
UPDATE public.message_buffers
SET 
  processed = false,
  processing_started_at = NULL,
  should_process_at = NOW() + INTERVAL '30 seconds'
WHERE processed = false 
  AND processing_started_at IS NOT NULL 
  AND processing_started_at < NOW() - INTERVAL '30 minutes';