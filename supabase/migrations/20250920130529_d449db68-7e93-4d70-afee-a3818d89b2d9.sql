-- Corrigir security issues da view vendor_conversation_overview
-- Remover security_barrier para evitar Security Definer View warning

DROP VIEW IF EXISTS public.vendor_conversation_overview;

CREATE VIEW public.vendor_conversation_overview AS
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