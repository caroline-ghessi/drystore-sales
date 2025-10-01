-- Criar fila principal para mensagens do WhatsApp
SELECT pgmq.create('whatsapp_messages_queue');

-- Criar tabela de Dead Letter Queue (DLQ) para mensagens que falharam após 3 tentativas
CREATE TABLE IF NOT EXISTS public.failed_whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  message_content TEXT NOT NULL,
  whatsapp_number VARCHAR NOT NULL,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  failed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS na tabela de mensagens falhadas
ALTER TABLE public.failed_whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados gerenciarem mensagens falhadas
CREATE POLICY "Enable all for authenticated users on failed_messages" 
  ON public.failed_whatsapp_messages 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_failed_messages_conversation 
  ON public.failed_whatsapp_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_failed_messages_failed_at 
  ON public.failed_whatsapp_messages(failed_at DESC);

-- Log da migração
INSERT INTO public.system_logs (level, source, message, data)
VALUES (
  'info',
  'migration',
  'Supabase Queues (pgmq) infrastructure created',
  jsonb_build_object(
    'queue_name', 'whatsapp_messages_queue',
    'dlq_table', 'failed_whatsapp_messages',
    'visibility_timeout_seconds', 60,
    'max_retries', 3
  )
);