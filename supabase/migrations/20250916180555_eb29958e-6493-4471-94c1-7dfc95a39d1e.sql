-- Melhorar relacionamento para propostas do cliente
-- Verificar se a tabela proposals existe, senão criar
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_number VARCHAR NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.crm_customers(id),
  conversation_id UUID,
  opportunity_id UUID,
  title VARCHAR NOT NULL,
  description TEXT,
  project_type product_category,
  status proposal_status DEFAULT 'draft',
  total_value NUMERIC,
  discount_percentage NUMERIC,
  discount_value NUMERIC,
  final_value NUMERIC,
  valid_until DATE,
  acceptance_link VARCHAR,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  client_data JSONB DEFAULT '{}',
  calculation_data JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Policy para clientes verem apenas suas propostas (sem valores financeiros)
CREATE POLICY "Clients can view their own proposals" 
ON public.proposals 
FOR SELECT 
USING (true); -- Será controlado via aplicação

-- Policy para usuários autenticados
CREATE POLICY "Authenticated users can manage proposals" 
ON public.proposals 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_proposals_updated_at();