-- Adicionar campo notified_at na tabela quality_alerts para controle de envio
ALTER TABLE public.quality_alerts 
ADD COLUMN IF NOT EXISTS notified_at timestamp with time zone DEFAULT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.quality_alerts.notified_at IS 'Timestamp de quando o alerta foi notificado via WhatsApp';

-- Criar índice para consultas de alertas não notificados
CREATE INDEX IF NOT EXISTS idx_quality_alerts_not_notified 
ON public.quality_alerts (severity, resolved, notified_at) 
WHERE notified_at IS NULL AND resolved = false;