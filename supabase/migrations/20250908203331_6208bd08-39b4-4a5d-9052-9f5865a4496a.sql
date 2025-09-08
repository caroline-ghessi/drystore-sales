-- CORREÇÃO FINAL DOS PROBLEMAS DE SEGURANÇA

-- Recriar view sem SECURITY DEFINER (causava erro crítico)
DROP VIEW IF EXISTS public.customer_overview;
CREATE VIEW public.customer_overview AS 
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

-- Recriar view de propostas sem SECURITY DEFINER
DROP VIEW IF EXISTS public.proposal_with_context;
CREATE VIEW public.proposal_with_context AS
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

-- Criar alguns produtos básicos para teste
INSERT INTO public.products (code, name, description, category, unit, base_price) VALUES
('DRY001', 'Placa Drywall Standard 1200x2600x12.5mm', 'Placa de gesso para drywall uso geral', 'drywall_divisorias', 'peca', 28.50),
('DRY002', 'Perfil Guia 48mm', 'Perfil guia para estrutura drywall', 'drywall_divisorias', 'ml', 4.20),
('DRY003', 'Perfil Montante 48mm', 'Perfil montante para estrutura drywall', 'drywall_divisorias', 'ml', 4.80),
('DRY004', 'Parafuso Drywall 3.5x25mm', 'Parafuso para fixação de placas drywall', 'drywall_divisorias', 'peca', 0.12),
('SOL001', 'Painel Solar 550W Monocristalino', 'Painel solar alta eficiência', 'energia_solar', 'peca', 850.00),
('SOL002', 'Inversor String 5kW', 'Inversor para sistema solar residencial', 'energia_solar', 'peca', 2400.00),
('SHI001', 'Telha Shingle Standard', 'Telha asfáltica premium', 'telha_shingle', 'm2', 45.00),
('SHI002', 'Manta Asfáltica', 'Manta impermeabilizante para telhado', 'telha_shingle', 'm2', 28.00)
ON CONFLICT (code) DO NOTHING;