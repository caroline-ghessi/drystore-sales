-- Primeiro, vamos ver as políticas atuais
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('proposals', 'proposal_items');

-- Remover todas as políticas existentes de proposals
DROP POLICY IF EXISTS "Admins and supervisors can manage all proposals" ON proposals;
DROP POLICY IF EXISTS "Vendors can manage their own proposals" ON proposals;
DROP POLICY IF EXISTS "Public read access for accepted proposals via link" ON proposals;
DROP POLICY IF EXISTS "Enable all for authenticated users on proposals" ON proposals;

-- Remover políticas de proposal_items
DROP POLICY IF EXISTS "Admins and supervisors can manage all proposal items" ON proposal_items;
DROP POLICY IF EXISTS "Public read access for proposal items via accepted proposals" ON proposal_items;
DROP POLICY IF EXISTS "Enable all for authenticated users on proposal_items" ON proposal_items;
DROP POLICY IF EXISTS "Public access to proposal_items via proposal" ON proposal_items;

-- Agora criar as novas políticas para proposals
CREATE POLICY "Admins and supervisors full access to proposals"
ON proposals FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

-- Vendedores podem gerenciar apenas suas próprias propostas
CREATE POLICY "Vendors access own proposals only"
ON proposals FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Acesso público para propostas aceitas via link
CREATE POLICY "Public access to accepted proposals"
ON proposals FOR SELECT
TO anon
USING (status IN ('accepted', 'viewed'));

-- Políticas para proposal_items
CREATE POLICY "Authenticated users access proposal items based on proposal ownership"
ON proposal_items FOR ALL
TO authenticated
USING (
  -- Admins/supervisors podem tudo
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role) OR
  -- Vendedores podem apenas os itens de suas propostas
  proposal_id IN (SELECT id FROM proposals WHERE created_by = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role) OR
  proposal_id IN (SELECT id FROM proposals WHERE created_by = auth.uid())
);

-- Acesso público aos itens de propostas aceitas
CREATE POLICY "Public access to proposal items from accepted proposals"
ON proposal_items FOR SELECT
TO anon
USING (proposal_id IN (SELECT id FROM proposals WHERE status IN ('accepted', 'viewed')));