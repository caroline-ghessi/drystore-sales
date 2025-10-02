-- Criar tabela de regras de order bumps
CREATE TABLE public.order_bump_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  
  -- Condições de exibição
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  
  -- Conteúdo do order bump
  bump_title VARCHAR NOT NULL,
  bump_description TEXT NOT NULL,
  bump_image_url TEXT,
  bump_price NUMERIC,
  bump_discount_percentage NUMERIC,
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  max_displays INTEGER,
  current_displays INTEGER DEFAULT 0,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_order_bump_rules_active ON order_bump_rules(is_active, priority);

-- Criar tabela de order bumps por proposta
CREATE TABLE public.proposal_order_bumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.order_bump_rules(id),
  
  -- Status da interação
  status VARCHAR DEFAULT 'displayed',
  
  -- Dados snapshot
  bump_data JSONB NOT NULL,
  
  -- Timestamps
  displayed_at TIMESTAMPTZ DEFAULT now(),
  interacted_at TIMESTAMPTZ,
  
  UNIQUE(proposal_id, rule_id)
);

CREATE INDEX idx_proposal_order_bumps_proposal ON proposal_order_bumps(proposal_id);
CREATE INDEX idx_proposal_order_bumps_status ON proposal_order_bumps(status);

-- RLS para order_bump_rules
ALTER TABLE public.order_bump_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage order bump rules"
ON public.order_bump_rules FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active rules"
ON public.order_bump_rules FOR SELECT
USING (is_active = true);

-- RLS para proposal_order_bumps
ALTER TABLE public.proposal_order_bumps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert order bumps"
ON public.proposal_order_bumps FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can view order bumps"
ON public.proposal_order_bumps FOR SELECT
USING (true);

CREATE POLICY "Clients can update their bumps"
ON public.proposal_order_bumps FOR UPDATE
USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_order_bump_rules_updated_at
BEFORE UPDATE ON public.order_bump_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();