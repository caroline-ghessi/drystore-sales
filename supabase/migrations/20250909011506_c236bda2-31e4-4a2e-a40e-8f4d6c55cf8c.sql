-- Remover o default temporariamente
ALTER TABLE public.saved_calculations 
  ALTER COLUMN status DROP DEFAULT;

-- Criar o novo tipo ENUM
CREATE TYPE saved_calculation_status AS ENUM (
  'draft',
  'ready_to_propose', 
  'aguardando_revisao',
  'aprovado',
  'rejeitado',
  'alteracoes_solicitadas'
);

-- Alterar a coluna para usar o novo tipo
ALTER TABLE public.saved_calculations 
  ALTER COLUMN status TYPE saved_calculation_status 
  USING status::saved_calculation_status;

-- Recolocar o default
ALTER TABLE public.saved_calculations 
  ALTER COLUMN status SET DEFAULT 'draft'::saved_calculation_status;