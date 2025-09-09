-- Atualizar a tabela saved_calculations para incluir novos status de revisão
ALTER TYPE saved_calculation_status RENAME TO saved_calculation_status_old;

CREATE TYPE saved_calculation_status AS ENUM (
  'draft',
  'ready_to_propose', 
  'aguardando_revisao',
  'aprovado',
  'rejeitado',
  'alteracoes_solicitadas'
);

ALTER TABLE public.saved_calculations 
  ALTER COLUMN status TYPE saved_calculation_status 
  USING status::text::saved_calculation_status;

DROP TYPE saved_calculation_status_old;