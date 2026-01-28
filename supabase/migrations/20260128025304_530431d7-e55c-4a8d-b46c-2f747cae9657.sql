-- Adicionar campos para suporte a re-engajamento na tabela conversations
-- Permite identificar clientes que retornam e seus interesses anteriores

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS is_returning_customer BOOLEAN DEFAULT FALSE;

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS previous_product_groups JSONB DEFAULT '[]'::jsonb;

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS last_lead_sent_at TIMESTAMPTZ;

-- Índice para busca rápida de clientes retornando
CREATE INDEX IF NOT EXISTS idx_conversations_returning 
ON conversations(is_returning_customer) 
WHERE is_returning_customer = true;

-- Índice para busca por último lead enviado
CREATE INDEX IF NOT EXISTS idx_conversations_last_lead 
ON conversations(last_lead_sent_at) 
WHERE last_lead_sent_at IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN conversations.is_returning_customer IS 'Indica se o cliente já foi atendido anteriormente e está retornando';
COMMENT ON COLUMN conversations.previous_product_groups IS 'Array JSON com categorias de produtos que o cliente demonstrou interesse anteriormente';
COMMENT ON COLUMN conversations.last_lead_sent_at IS 'Timestamp de quando o último lead foi enviado para vendedor';