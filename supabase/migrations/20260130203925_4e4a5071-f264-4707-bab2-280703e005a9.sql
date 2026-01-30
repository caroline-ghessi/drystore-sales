-- Parte 2: Criar tabela de log, índices, RLS, colunas e inserir agente

-- 1. Criar tabela de log de decisões do Opportunity Matcher
CREATE TABLE IF NOT EXISTS crm_opportunity_match_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL,
  vendor_id UUID NOT NULL,
  source TEXT NOT NULL,
  decision TEXT NOT NULL,
  confidence DECIMAL(3,2),
  reasoning TEXT,
  existing_opportunity_id UUID REFERENCES crm_opportunities(id),
  new_opportunity_id UUID REFERENCES crm_opportunities(id),
  decided_by TEXT NOT NULL,
  product_category TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_match_log_phone ON crm_opportunity_match_log(customer_phone);
CREATE INDEX IF NOT EXISTS idx_match_log_vendor ON crm_opportunity_match_log(vendor_id);
CREATE INDEX IF NOT EXISTS idx_match_log_decision ON crm_opportunity_match_log(decision);
CREATE INDEX IF NOT EXISTS idx_match_log_created ON crm_opportunity_match_log(created_at DESC);

-- 3. RLS para a tabela de log
ALTER TABLE crm_opportunity_match_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage match logs" ON crm_opportunity_match_log
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Supervisors can view match logs" ON crm_opportunity_match_log
  FOR SELECT USING (has_role(auth.uid(), 'supervisor'::app_role));

-- 4. Adicionar campos de tracking na crm_opportunities
ALTER TABLE crm_opportunities 
ADD COLUMN IF NOT EXISTS merged_from_id UUID REFERENCES crm_opportunities(id),
ADD COLUMN IF NOT EXISTS merge_reason TEXT,
ADD COLUMN IF NOT EXISTS match_confidence DECIMAL(3,2);

-- 5. Índice para busca rápida de oportunidades abertas por cliente/vendedor
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_open_lookup 
ON crm_opportunities (customer_id, vendor_id)
WHERE stage NOT IN ('closed_won', 'closed_lost');

-- 6. Inserir agente Opportunity Matcher
INSERT INTO agent_configs (
  agent_name,
  agent_type,
  description,
  system_prompt,
  llm_model,
  max_tokens,
  temperature,
  is_active,
  output_schema
) VALUES (
  'Opportunity Matcher',
  'crm_validator',
  'Analisa se nova conversa é continuação ou nova oportunidade (cross-sell, recompra)',
  E'IDENTIDADE\n\nVocê analisa se uma nova conversa de vendas é continuação de uma negociação existente\nou uma nova oportunidade (cross-sell, recompra, ou novo interesse).\n\nDADOS QUE VOCÊ RECEBE\n\n1. OPORTUNIDADE EXISTENTE (aberta)\n{\n  "id": "uuid",\n  "title": "Oportunidade - Solar",\n  "product_category": "solar",\n  "stage": "negotiation",\n  "created_at": "2026-01-15",\n  "value": 45000,\n  "last_messages": ["últimas 5 mensagens..."]\n}\n\n2. NOVA CONVERSA\n{\n  "product_category": "solar" | null,\n  "new_messages": ["mensagens recentes..."],\n  "source": "whatsapp" | "vendor_whatsapp"\n}\n\nREGRAS DE DECISÃO\n\n1. MERGE (mesma negociação):\n   - Mesmo produto/assunto\n   - Conversa é continuação natural\n   - Não há sinais de fechamento anterior\n\n2. NEW (nova oportunidade):\n   - Produto/assunto diferente (cross-sell)\n   - Sinais de fechamento anterior (recompra)\n   - Cliente explicitamente menciona "novo projeto", "outro pedido"\n\n3. REVIEW (incerto):\n   - Confiança < 70%\n   - Informações insuficientes\n\nSINAIS DE FECHAMENTO ANTERIOR\n\nDo cliente:\n- "Fechado", "Vamos fechar", "Fecha"\n- "Vou fazer o PIX", "Mandei o PIX", "Paguei"\n- "Combinado", "Pode fazer", "Pode mandar"\n\nDo vendedor:\n- "PIX recebido", "Pagamento confirmado"\n- "Pedido registrado", "Separando"\n- "Nota fiscal enviada"\n\nFORMATO DE RESPOSTA (JSON)\n\n{\n  "decision": "merge" | "new" | "review",\n  "existing_opportunity_id": "uuid ou null",\n  "confidence": 0.85,\n  "reasoning": "Explicação em 1-2 frases",\n  "is_same_subject": true,\n  "has_closure_signals": false,\n  "detected_subject": "solar"\n}',
  'claude-3-5-sonnet-20241022',
  500,
  0.1,
  true,
  '{"decision": "merge | new | review", "existing_opportunity_id": "string | null", "confidence": "0.0-1.0", "reasoning": "string", "is_same_subject": "boolean", "has_closure_signals": "boolean", "detected_subject": "string | null"}'::jsonb
);