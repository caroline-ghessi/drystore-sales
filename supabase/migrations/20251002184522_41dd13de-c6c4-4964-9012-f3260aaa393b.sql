-- Atualizar RLS policies para proposals - clientes só veem propostas não-draft

-- Primeiro, remover políticas existentes de acesso público se houver
DROP POLICY IF EXISTS "Public access to proposal items from accepted proposals" ON proposal_items;
DROP POLICY IF EXISTS "Clients can view sent proposals" ON proposals;

-- Criar política para clientes verem apenas propostas não-draft vinculadas a eles
CREATE POLICY "Clients can view non-draft proposals"
ON proposals
FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM crm_customers 
    WHERE phone = (SELECT phone FROM crm_customers WHERE id = customer_id)
  )
  AND status != 'draft'
);

-- Permitir que clientes atualizem status de suas propostas (aceitar/rejeitar)
CREATE POLICY "Clients can update their proposal status"
ON proposals
FOR UPDATE
USING (
  customer_id IN (
    SELECT id FROM crm_customers 
    WHERE phone = (SELECT phone FROM crm_customers WHERE id = customer_id)
  )
  AND status IN ('sent', 'viewed', 'under_review')
)
WITH CHECK (
  status IN ('accepted', 'rejected', 'under_review', 'viewed')
);

-- Permitir acesso público aos itens de propostas aceitas ou visualizadas (para clientes)
CREATE POLICY "Public access to items from client proposals"
ON proposal_items
FOR SELECT
USING (
  proposal_id IN (
    SELECT id FROM proposals 
    WHERE status != 'draft'
  )
);

-- Adicionar status 'under_review' ao enum se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'under_review' 
    AND enumtypid = 'proposal_status'::regtype
  ) THEN
    ALTER TYPE proposal_status ADD VALUE 'under_review';
  END IF;
END $$;