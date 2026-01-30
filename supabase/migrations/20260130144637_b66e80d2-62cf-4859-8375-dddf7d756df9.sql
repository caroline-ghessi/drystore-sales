-- Adicionar campos de processamento de mídia à tabela vendor_messages
ALTER TABLE public.vendor_messages 
ADD COLUMN IF NOT EXISTS processed_content TEXT,
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20),
ADD COLUMN IF NOT EXISTS processing_error TEXT,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Índice para buscar mensagens pendentes de processamento
CREATE INDEX IF NOT EXISTS idx_vendor_messages_processing_pending 
ON public.vendor_messages(processing_status, message_type) 
WHERE processing_status = 'pending' OR processing_status IS NULL;

-- Índice para buscar mensagens por tipo que precisam processamento
CREATE INDEX IF NOT EXISTS idx_vendor_messages_media_type 
ON public.vendor_messages(message_type, processing_status)
WHERE message_type IN ('voice', 'audio', 'image', 'document');

-- Comentários para documentação
COMMENT ON COLUMN public.vendor_messages.processed_content IS 'Transcrição de áudio, descrição de imagem ou texto extraído de PDF';
COMMENT ON COLUMN public.vendor_messages.processing_status IS 'Status: pending, processing, completed, failed';
COMMENT ON COLUMN public.vendor_messages.processing_error IS 'Mensagem de erro se o processamento falhou';
COMMENT ON COLUMN public.vendor_messages.processed_at IS 'Timestamp de quando o processamento foi concluído';