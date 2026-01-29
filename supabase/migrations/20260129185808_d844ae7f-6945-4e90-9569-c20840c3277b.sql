
-- LIMPEZA RETROATIVA: Remover dados de contatos que já estão na lista de exclusão

-- 1. Deletar oportunidades de clientes com telefones excluídos
DELETE FROM crm_opportunities
WHERE customer_id IN (
  SELECT c.id 
  FROM crm_customers c
  JOIN excluded_contacts ec ON c.phone = ec.phone_number
  WHERE ec.is_active = true
);

-- 2. Deletar clientes com telefones excluídos (que não têm mais oportunidades)
DELETE FROM crm_customers
WHERE phone IN (
  SELECT phone_number FROM excluded_contacts WHERE is_active = true
)
AND NOT EXISTS (
  SELECT 1 FROM crm_opportunities WHERE customer_id = crm_customers.id
);

-- 3. Marcar vendor_conversations como internas
UPDATE vendor_conversations
SET 
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{is_internal_contact}',
    'true'::jsonb
  ),
  has_opportunity = false
WHERE customer_phone IN (
  SELECT phone_number FROM excluded_contacts WHERE is_active = true
);

-- 4. Log da limpeza retroativa
INSERT INTO system_logs (level, source, message, data)
VALUES (
  'info',
  'retroactive_cleanup',
  'Limpeza retroativa de contatos excluídos executada',
  jsonb_build_object(
    'executed_at', now(),
    'description', 'Removidos oportunidades e clientes com telefones na lista de exclusão'
  )
);
