-- ============================================
-- CRM INVISÍVEL - FASE 1: Schema Updates
-- ============================================

-- 1. NOVA TABELA: vendor_sales_metrics (apenas para Ferramentas)
CREATE TABLE IF NOT EXISTS vendor_sales_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  vendor_conversation_id INTEGER NOT NULL REFERENCES vendor_conversations(id),
  
  -- Resultado da conversa
  converted BOOLEAN NOT NULL,
  sale_value NUMERIC,
  loss_reason TEXT CHECK (loss_reason IN ('price', 'stock', 'competitor', 'gave_up', 'other')),
  product_sold TEXT,
  
  -- Métricas de tempo
  cycle_time_hours INTEGER,
  messages_analyzed INTEGER,
  
  -- IA
  ai_model TEXT DEFAULT 'claude-sonnet',
  ai_confidence DECIMAL(3,2),
  
  -- Controle
  extraction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(vendor_conversation_id, extraction_date)
);

-- RLS para vendor_sales_metrics
ALTER TABLE vendor_sales_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users on vendor_sales_metrics"
  ON vendor_sales_metrics FOR ALL
  USING (true)
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_vendor_sales_metrics_vendor_id ON vendor_sales_metrics(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_sales_metrics_extraction_date ON vendor_sales_metrics(extraction_date);
CREATE INDEX IF NOT EXISTS idx_vendor_sales_metrics_converted ON vendor_sales_metrics(converted);

-- 2. ALTERAR crm_opportunities: adicionar campos para CRM Invisível
ALTER TABLE crm_opportunities
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id),
  ADD COLUMN IF NOT EXISTS vendor_conversation_id INTEGER REFERENCES vendor_conversations(id),
  ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'ai_generated' 
    CHECK (validation_status IN ('ai_generated', 'pending', 'validated', 'edited', 'rejected')),
  ADD COLUMN IF NOT EXISTS temperature TEXT CHECK (temperature IN ('hot', 'warm', 'cold')),
  ADD COLUMN IF NOT EXISTS objections TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS next_step TEXT,
  ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS ai_model TEXT,
  ADD COLUMN IF NOT EXISTS ai_extracted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES profiles(user_id);

-- Índices para crm_opportunities
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_vendor_id ON crm_opportunities(vendor_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_validation_status ON crm_opportunities(validation_status);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_temperature ON crm_opportunities(temperature);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_vendor_conversation_id ON crm_opportunities(vendor_conversation_id);

-- 3. ALTERAR vendor_conversations: adicionar classificação
ALTER TABLE vendor_conversations
  ADD COLUMN IF NOT EXISTS product_category product_category,
  ADD COLUMN IF NOT EXISTS has_opportunity BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_processed_at TIMESTAMPTZ;

-- Índices para vendor_conversations
CREATE INDEX IF NOT EXISTS idx_vendor_conversations_product_category ON vendor_conversations(product_category);
CREATE INDEX IF NOT EXISTS idx_vendor_conversations_has_opportunity ON vendor_conversations(has_opportunity);
CREATE INDEX IF NOT EXISTS idx_vendor_conversations_last_processed_at ON vendor_conversations(last_processed_at);

-- 4. Comentários para documentação
COMMENT ON TABLE vendor_sales_metrics IS 'Métricas de vendas para Ferramentas (Drytools) - ciclo curto, sem pipeline completo';
COMMENT ON COLUMN crm_opportunities.validation_status IS 'Status de validação: ai_generated, pending, validated, edited, rejected';
COMMENT ON COLUMN crm_opportunities.temperature IS 'Temperatura do lead: hot, warm, cold';
COMMENT ON COLUMN crm_opportunities.vendor_conversation_id IS 'FK para vendor_conversations - conversa do vendedor que originou a oportunidade';
COMMENT ON COLUMN vendor_conversations.product_category IS 'Categoria do produto classificada por IA no pipeline diário';