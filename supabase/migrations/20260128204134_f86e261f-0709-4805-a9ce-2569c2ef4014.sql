-- Limpar dados de seed/mock - respeitando foreign keys

-- 1. Deletar oportunidades mock (sem vendor_id e status ai_generated)
DELETE FROM crm_opportunities 
WHERE vendor_id IS NULL 
  AND validation_status = 'ai_generated';

-- 2. Deletar clientes que NÃO têm propostas NEM oportunidades vinculadas
DELETE FROM crm_customers 
WHERE id NOT IN (
  SELECT DISTINCT customer_id FROM proposals WHERE customer_id IS NOT NULL
  UNION
  SELECT DISTINCT customer_id FROM crm_opportunities WHERE customer_id IS NOT NULL
);