-- Corrigir links incorretos nas propostas existentes

-- 1. Corrigir links do Supabase (que estão incorretos)
UPDATE proposals 
SET acceptance_link = REPLACE(
  acceptance_link,
  'https://groqsnnytvjabgeaekkw.supabase.co/proposal/',
  'https://arquivos.drystore.com.br/proposta/'
)
WHERE acceptance_link LIKE 'https://groqsnnytvjabgeaekkw.supabase.co/proposal/%';

-- 2. Corrigir links do Lovable (ambiente de desenvolvimento)
UPDATE proposals 
SET acceptance_link = REPLACE(
  acceptance_link,
  'https://groqsnnytvjabgeaekkw.lovableproject.com/proposal/',
  'https://arquivos.drystore.com.br/proposta/'
)
WHERE acceptance_link LIKE 'https://groqsnnytvjabgeaekkw.lovableproject.com/proposal/%';

-- 3. Corrigir rotas para propostas premium (telha_shingle)
UPDATE proposals 
SET acceptance_link = REPLACE(
  acceptance_link,
  '/proposta/',
  '/proposta-premium/'
)
WHERE project_type = 'telha_shingle'
AND acceptance_link LIKE '%/proposta/%'
AND acceptance_link NOT LIKE '%/proposta-premium/%';