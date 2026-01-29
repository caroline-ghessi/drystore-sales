-- Remover índice parcial existente (não funciona com ON CONFLICT)
DROP INDEX IF EXISTS idx_crm_customers_phone_unique;

-- Criar constraint UNIQUE direta (necessário para UPSERT funcionar)
ALTER TABLE crm_customers 
ADD CONSTRAINT crm_customers_phone_unique UNIQUE (phone);