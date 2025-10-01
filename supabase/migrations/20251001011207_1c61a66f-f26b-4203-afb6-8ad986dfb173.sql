-- Adicionar colunas de auditoria na tabela proposals
ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Criar tabela de histórico de edições
CREATE TABLE IF NOT EXISTS public.proposal_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  edited_by UUID NOT NULL REFERENCES auth.users(id),
  edited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_proposal_edit_history_proposal_id ON public.proposal_edit_history(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_edit_history_edited_at ON public.proposal_edit_history(edited_at DESC);

-- Habilitar RLS na tabela de histórico
ALTER TABLE public.proposal_edit_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para proposal_edit_history (usar DROP IF EXISTS antes)
DROP POLICY IF EXISTS "Authenticated users can view edit history based on proposal ownership" ON public.proposal_edit_history;
CREATE POLICY "Authenticated users can view edit history based on proposal ownership"
ON public.proposal_edit_history
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'supervisor'::app_role)
  OR proposal_id IN (
    SELECT id FROM public.proposals WHERE created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can insert edit history" ON public.proposal_edit_history;
CREATE POLICY "System can insert edit history"
ON public.proposal_edit_history
FOR INSERT
WITH CHECK (true);

-- Função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION public.update_proposal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
DROP TRIGGER IF EXISTS update_proposals_updated_at ON public.proposals;
CREATE TRIGGER update_proposals_updated_at
BEFORE UPDATE ON public.proposals
FOR EACH ROW
EXECUTE FUNCTION public.update_proposal_timestamp();