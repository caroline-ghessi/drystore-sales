-- Limpar buffers órfãos antigos (anteriores a novembro 2025)
-- Estes são registros históricos de conversas já encerradas ou com agente

UPDATE public.message_buffers
SET 
  processed = true,
  processed_at = NOW()
WHERE processed = false 
  AND buffer_started_at < '2025-11-01'::timestamp;

-- Log da limpeza
INSERT INTO public.system_logs (level, source, message, data)
VALUES (
  'info',
  'orphan_buffers_cleanup',
  'Cleaned up orphan message buffers from before November 2025',
  jsonb_build_object(
    'cleanup_criteria', 'buffer_started_at < 2025-11-01',
    'executed_at', NOW()
  )
);