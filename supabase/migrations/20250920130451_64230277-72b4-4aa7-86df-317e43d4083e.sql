-- FASE 1: Remover política atual permissiva
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.conversations;

-- FASE 2: Criar tabela de auditoria para monitorar acessos
CREATE TABLE IF NOT EXISTS public.conversation_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  conversation_id uuid REFERENCES public.conversations(id),
  access_type text NOT NULL,
  accessed_data jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.conversation_access_log ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela de auditoria
CREATE POLICY "Only admins can view conversation access logs"
ON public.conversation_access_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert conversation access logs"
ON public.conversation_access_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- FASE 3: Implementar políticas RLS granulares para conversations

-- Política para Admins e Supervisores (acesso total)
CREATE POLICY "Admins and supervisors can manage all conversations"
ON public.conversations
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
);

-- Política para Atendentes (conversas atribuídas + disponíveis)
CREATE POLICY "Atendentes can access assigned and available conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'atendente'::app_role) AND (
    assigned_agent_id = auth.uid() OR 
    current_agent_id = auth.uid() OR
    (assigned_agent_id IS NULL AND status IN ('waiting', 'in_bot'))
  )
);

-- Política para Atendentes atualizarem conversas atribuídas
CREATE POLICY "Atendentes can update assigned conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'atendente'::app_role) AND (
    assigned_agent_id = auth.uid() OR 
    current_agent_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'atendente'::app_role) AND (
    assigned_agent_id = auth.uid() OR 
    current_agent_id = auth.uid()
  )
);

-- FASE 4: Criar view mascarada para vendedores (apenas conversas com propostas)
CREATE OR REPLACE VIEW public.vendor_conversation_overview AS
SELECT 
  c.id,
  c.status,
  c.product_group,
  c.lead_temperature,
  c.lead_score,
  c.first_message_at,
  c.last_message_at,
  c.created_at,
  c.updated_at,
  -- Dados sensíveis mascarados para vendedores
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role) THEN c.customer_name
    ELSE 'Cliente ***'
  END as customer_name,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role) THEN c.whatsapp_number
    ELSE '***' || RIGHT(c.whatsapp_number, 4)
  END as whatsapp_number,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role) THEN c.customer_email
    ELSE NULL
  END as customer_email,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role) THEN c.customer_city
    ELSE NULL
  END as customer_city,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role) THEN c.customer_state
    ELSE NULL
  END as customer_state,
  -- Indicar se o vendedor tem propostas para esta conversa
  EXISTS(
    SELECT 1 FROM public.proposals p 
    WHERE p.conversation_id = c.id 
    AND p.created_by = auth.uid()
  ) as has_user_proposals
FROM public.conversations c
WHERE 
  -- Admins e supervisores veem tudo
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role) OR
  -- Vendedores veem apenas conversas onde têm propostas
  EXISTS(
    SELECT 1 FROM public.proposals p 
    WHERE p.conversation_id = c.id 
    AND p.created_by = auth.uid()
  );

-- Habilitar RLS na view (herda das tabelas base)
ALTER VIEW public.vendor_conversation_overview SET (security_barrier = true);

-- FASE 5: Criar função para log de acesso
CREATE OR REPLACE FUNCTION public.log_conversation_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log apenas para não-admins acessando dados sensíveis
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    INSERT INTO public.conversation_access_log (
      user_id, conversation_id, access_type, accessed_data
    ) VALUES (
      auth.uid(), 
      CASE WHEN TG_OP = 'SELECT' THEN OLD.id ELSE NEW.id END,
      TG_OP, 
      jsonb_build_object(
        'table', 'conversations',
        'sensitive_data_accessed', true
      )
    );
  END IF;
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;