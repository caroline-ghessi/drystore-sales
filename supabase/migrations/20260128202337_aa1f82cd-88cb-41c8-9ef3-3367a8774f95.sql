-- =====================================================
-- MIGRAÇÃO: RLS por Vendedor no CRM
-- Garante que vendedores vejam apenas suas negociações
-- =====================================================

-- 1. Criar função helper para buscar vendor_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_vendor_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT vendor_id 
  FROM vendor_user_mapping 
  WHERE user_id = _user_id 
    AND is_active = true 
  LIMIT 1
$$;

-- =====================================================
-- 2. Atualizar RLS de crm_opportunities
-- =====================================================

-- Remover política permissiva atual
DROP POLICY IF EXISTS "Enable all for authenticated users on opportunities" 
  ON crm_opportunities;

-- Admins e supervisores podem gerenciar todas as oportunidades
CREATE POLICY "Admins and supervisors can manage all opportunities"
  ON crm_opportunities FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  );

-- Vendedores podem ver apenas suas próprias oportunidades
CREATE POLICY "Vendors can view own opportunities"
  ON crm_opportunities FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'vendedor') AND
    vendor_id = public.get_user_vendor_id(auth.uid())
  );

-- Vendedores podem atualizar apenas suas próprias oportunidades
CREATE POLICY "Vendors can update own opportunities"
  ON crm_opportunities FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'vendedor') AND
    vendor_id = public.get_user_vendor_id(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'vendedor') AND
    vendor_id = public.get_user_vendor_id(auth.uid())
  );

-- =====================================================
-- 3. Atualizar RLS de crm_customers
-- =====================================================

-- Remover política permissiva atual
DROP POLICY IF EXISTS "Enable all for authenticated users on customers" 
  ON crm_customers;

-- Admins e supervisores podem gerenciar todos os clientes
CREATE POLICY "Admins and supervisors can manage all customers"
  ON crm_customers FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'supervisor')
  );

-- Vendedores podem ver clientes de suas oportunidades
CREATE POLICY "Vendors can view customers from own opportunities"
  ON crm_customers FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'vendedor') AND
    id IN (
      SELECT customer_id FROM crm_opportunities 
      WHERE vendor_id = public.get_user_vendor_id(auth.uid())
    )
  );

-- =====================================================
-- 4. Comentários explicativos
-- =====================================================
COMMENT ON FUNCTION public.get_user_vendor_id IS 'Retorna o vendor_id associado a um user_id via vendor_user_mapping. Usado nas RLS policies para filtrar dados por vendedor.';

COMMENT ON POLICY "Admins and supervisors can manage all opportunities" ON crm_opportunities IS 'Admins e supervisores têm acesso total a todas as oportunidades';

COMMENT ON POLICY "Vendors can view own opportunities" ON crm_opportunities IS 'Vendedores só podem ver oportunidades onde vendor_id = seu vendor_id';

COMMENT ON POLICY "Vendors can update own opportunities" ON crm_opportunities IS 'Vendedores só podem atualizar suas próprias oportunidades';

COMMENT ON POLICY "Admins and supervisors can manage all customers" ON crm_customers IS 'Admins e supervisores têm acesso total a todos os clientes';

COMMENT ON POLICY "Vendors can view customers from own opportunities" ON crm_customers IS 'Vendedores só podem ver clientes que têm oportunidades associadas a eles';