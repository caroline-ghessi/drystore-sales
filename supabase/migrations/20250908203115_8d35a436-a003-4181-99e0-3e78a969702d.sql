-- CORREÇÃO DOS PROBLEMAS DE SEGURANÇA IDENTIFICADOS

-- Corrigir a função update_updated_at_column para ter search_path seguro
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Função para migrar dados existentes de conversas para clientes e oportunidades
CREATE OR REPLACE FUNCTION public.migrate_conversations_to_crm()
RETURNS void AS $$
BEGIN
  -- Migrar conversas qualificadas para clientes
  INSERT INTO public.customers (conversation_id, name, email, phone, city, state, source, status, last_interaction_at)
  SELECT 
    id, 
    COALESCE(customer_name, whatsapp_name, 'Cliente ' || substring(whatsapp_number, -4)),
    customer_email,
    whatsapp_number,
    customer_city,
    customer_state,
    COALESCE(source, 'whatsapp'),
    CASE 
      WHEN lead_temperature = 'hot' THEN 'prospect'::customer_status
      WHEN lead_temperature = 'warm' THEN 'lead'::customer_status
      ELSE 'lead'::customer_status
    END,
    last_message_at
  FROM public.conversations
  WHERE status IN ('qualified', 'closed') 
    AND NOT EXISTS (SELECT 1 FROM public.customers WHERE conversation_id = conversations.id);

  -- Criar oportunidades automáticas para leads quentes/mornos
  INSERT INTO public.opportunities (customer_id, conversation_id, title, value, stage, product_category, probability, source)
  SELECT 
    c.id,
    c.conversation_id,
    'Oportunidade - ' || COALESCE(conv.product_group::text, 'Indefinido'),
    CASE 
      WHEN proj.budget_range = 'ate_50k' THEN 25000
      WHEN proj.budget_range = '50k_100k' THEN 75000
      WHEN proj.budget_range = '100k_200k' THEN 150000
      ELSE 50000
    END,
    CASE 
      WHEN conv.lead_temperature = 'hot' THEN 'qualification'::opportunity_stage
      ELSE 'prospecting'::opportunity_stage
    END,
    conv.product_category,
    CASE 
      WHEN conv.lead_temperature = 'hot' THEN 70
      WHEN conv.lead_temperature = 'warm' THEN 40
      ELSE 20
    END,
    'whatsapp'
  FROM public.customers c
  JOIN public.conversations conv ON c.conversation_id = conv.id
  LEFT JOIN public.project_contexts proj ON conv.id = proj.conversation_id
  WHERE conv.lead_temperature IN ('hot', 'warm')
    AND NOT EXISTS (SELECT 1 FROM public.opportunities WHERE conversation_id = conv.id);

  -- Criar tarefas de follow-up para leads sem atividade recente
  INSERT INTO public.tasks (customer_id, conversation_id, title, description, type, status, priority, due_date)
  SELECT 
    c.id,
    c.conversation_id,
    'Follow-up - ' || c.name,
    'Realizar contato de follow-up com cliente',
    'follow_up'::task_type,
    'pending'::task_status,
    CASE 
      WHEN conv.lead_temperature = 'hot' THEN 'high'::task_priority
      WHEN conv.lead_temperature = 'warm' THEN 'normal'::task_priority
      ELSE 'low'::task_priority
    END,
    now() + interval '7 days'
  FROM public.customers c
  JOIN public.conversations conv ON c.conversation_id = conv.id
  WHERE conv.last_message_at < now() - interval '7 days'
    AND NOT EXISTS (SELECT 1 FROM public.tasks WHERE customer_id = c.id);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Views para integração entre módulos
CREATE OR REPLACE VIEW public.customer_overview AS 
SELECT 
  c.*,
  conv.lead_temperature,
  conv.lead_score,
  conv.product_group,
  conv.last_message_at,
  COUNT(DISTINCT o.id) as total_opportunities,
  COALESCE(SUM(o.value), 0) as total_opportunity_value,
  COUNT(DISTINCT p.id) as total_proposals,
  COALESCE(SUM(p.final_value), 0) as total_proposal_value
FROM public.customers c
LEFT JOIN public.conversations conv ON c.conversation_id = conv.id
LEFT JOIN public.opportunities o ON c.id = o.customer_id
LEFT JOIN public.proposals p ON c.id = p.customer_id
GROUP BY c.id, conv.lead_temperature, conv.lead_score, conv.product_group, conv.last_message_at;

CREATE OR REPLACE VIEW public.proposal_with_context AS
SELECT 
  p.*,
  c.name as customer_name,
  c.phone as customer_phone,
  c.email as customer_email,
  c.city as customer_city,
  c.state as customer_state,
  conv.whatsapp_number,
  conv.lead_temperature,
  proj.budget_range,
  proj.desired_product,
  proj.urgency,
  prof.display_name as created_by_name
FROM public.proposals p
JOIN public.customers c ON p.customer_id = c.id
LEFT JOIN public.conversations conv ON p.conversation_id = conv.id
LEFT JOIN public.project_contexts proj ON conv.id = proj.conversation_id
LEFT JOIN public.profiles prof ON p.created_by = prof.user_id;

-- Executar migração inicial
SELECT public.migrate_conversations_to_crm();