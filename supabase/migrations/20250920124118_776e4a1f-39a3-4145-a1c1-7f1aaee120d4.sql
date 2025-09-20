-- Remover política atual permissiva para proposals
DROP POLICY IF EXISTS "Enable all for authenticated users on proposals" ON proposals;

-- Política para admins e supervisores - acesso completo
CREATE POLICY "Admins and supervisors can manage all proposals"
ON proposals FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

-- Política para vendedores - apenas suas próprias propostas
CREATE POLICY "Vendors can manage their own proposals"
ON proposals FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Política de leitura pública para propostas aceitas (via link de aceitação)
CREATE POLICY "Public read access for accepted proposals via link"
ON proposals FOR SELECT
TO anon
USING (status IN ('accepted', 'viewed'));

-- Garantir que proposal_items seguem a mesma lógica
DROP POLICY IF EXISTS "Enable all for authenticated users on proposal_items" ON proposal_items;
DROP POLICY IF EXISTS "Public access to proposal_items via proposal" ON proposal_items;

-- Política para admins e supervisores em proposal_items
CREATE POLICY "Admins and supervisors can manage all proposal items"
ON proposal_items FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role) OR
  proposal_id IN (SELECT id FROM proposals WHERE created_by = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role) OR
  proposal_id IN (SELECT id FROM proposals WHERE created_by = auth.uid())
);

-- Política pública para itens de propostas via link
CREATE POLICY "Public read access for proposal items via accepted proposals"
ON proposal_items FOR SELECT
TO anon
USING (proposal_id IN (SELECT id FROM proposals WHERE status IN ('accepted', 'viewed')));