-- 1. Adicionar coluna para rastrear duplicatas
ALTER TABLE crm_opportunities 
  ADD COLUMN IF NOT EXISTS duplicate_of_id UUID REFERENCES crm_opportunities(id);

-- 2. Comentário explicativo
COMMENT ON COLUMN crm_opportunities.duplicate_of_id IS 'ID da oportunidade original quando esta foi marcada como duplicata';

-- 3. Índice para busca eficiente de duplicatas
CREATE INDEX IF NOT EXISTS idx_crm_opps_duplicate_lookup 
  ON crm_opportunities(customer_id, vendor_id, product_category)
  WHERE duplicate_of_id IS NULL AND stage NOT IN ('closed_won', 'closed_lost');

-- 4. Índice para encontrar oportunidades que são duplicatas
CREATE INDEX IF NOT EXISTS idx_crm_opps_duplicates
  ON crm_opportunities(duplicate_of_id)
  WHERE duplicate_of_id IS NOT NULL;