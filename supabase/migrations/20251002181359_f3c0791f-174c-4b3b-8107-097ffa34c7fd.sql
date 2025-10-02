-- Migração para corrigir propostas existentes e garantir integridade com crm_customers
-- Versão 2: Lida com duplicados

-- Passo 1: Limpar duplicados existentes em crm_customers mantendo o mais recente
WITH ranked_customers AS (
  SELECT 
    id,
    phone,
    ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at DESC) as rn
  FROM public.crm_customers
  WHERE phone IS NOT NULL
)
DELETE FROM public.crm_customers
WHERE id IN (
  SELECT id FROM ranked_customers WHERE rn > 1
);

-- Passo 2: Criar customers em crm_customers a partir de client_data das propostas
-- usando ON CONFLICT para evitar duplicados
INSERT INTO public.crm_customers (
  name,
  phone,
  email,
  city,
  state,
  company,
  source,
  status,
  last_interaction_at,
  created_at
)
SELECT DISTINCT ON ((p.client_data->>'phone'))
  COALESCE(
    (p.client_data->>'name'),
    (p.client_data->>'company'),
    'Cliente ' || substring((p.client_data->>'phone'), -4)
  ) as name,
  (p.client_data->>'phone') as phone,
  (p.client_data->>'email') as email,
  (p.client_data->>'city') as city,
  (p.client_data->>'state') as state,
  (p.client_data->>'company') as company,
  'proposal' as source,
  'lead'::customer_status as status,
  p.created_at as last_interaction_at,
  p.created_at as created_at
FROM public.proposals p
WHERE 
  p.customer_id IS NULL 
  AND p.client_data->>'phone' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.crm_customers c 
    WHERE c.phone = (p.client_data->>'phone')
  )
ORDER BY (p.client_data->>'phone'), p.created_at DESC;

-- Passo 3: Atualizar propostas existentes com customer_id correspondente
UPDATE public.proposals p
SET customer_id = c.id,
    updated_at = now()
FROM public.crm_customers c
WHERE 
  p.customer_id IS NULL
  AND p.client_data->>'phone' IS NOT NULL
  AND c.phone = (p.client_data->>'phone');

-- Passo 4: Criar índice para melhorar performance de busca por telefone
CREATE INDEX IF NOT EXISTS idx_crm_customers_phone ON public.crm_customers(phone);

-- Passo 5: Adicionar constraint para garantir que phone seja único quando não nulo
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_customers_phone_unique 
ON public.crm_customers(phone) 
WHERE phone IS NOT NULL;

-- Log de correção
INSERT INTO public.system_logs (level, source, message, data)
VALUES (
  'info',
  'migration_fix_customer_proposals_v2',
  'Correção aplicada: propostas vinculadas a crm_customers',
  jsonb_build_object(
    'migration_date', now(),
    'proposals_fixed', (SELECT COUNT(*) FROM public.proposals WHERE customer_id IS NOT NULL),
    'customers_created', (SELECT COUNT(*) FROM public.crm_customers)
  )
);