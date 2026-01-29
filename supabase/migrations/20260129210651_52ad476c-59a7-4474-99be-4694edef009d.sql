-- =====================================================
-- FASE 1: Sistema de Agentes de IA para CRM
-- =====================================================

-- 1.1 Extender enum agent_type com novos tipos CRM
ALTER TYPE agent_type ADD VALUE IF NOT EXISTS 'crm_analyzer';
ALTER TYPE agent_type ADD VALUE IF NOT EXISTS 'crm_extractor';
ALTER TYPE agent_type ADD VALUE IF NOT EXISTS 'crm_classifier';
ALTER TYPE agent_type ADD VALUE IF NOT EXISTS 'crm_coach';

-- 1.2 Criar tabela crm_agent_extractions
CREATE TABLE public.crm_agent_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  extraction_data JSONB NOT NULL DEFAULT '{}',
  confidence DECIMAL(3,2) DEFAULT 0,
  model_used TEXT,
  tokens_used INTEGER DEFAULT 0,
  processing_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  
  CONSTRAINT valid_agent_type CHECK (agent_type IN (
    'spin_analyzer', 'bant_qualifier', 'objection_analyzer',
    'client_profiler', 'project_extractor', 'deal_extractor',
    'pipeline_classifier', 'coaching_generator'
  )),
  CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

-- Índices para performance
CREATE INDEX idx_crm_agent_extractions_opportunity ON public.crm_agent_extractions(opportunity_id);
CREATE INDEX idx_crm_agent_extractions_agent_type ON public.crm_agent_extractions(agent_type);
CREATE INDEX idx_crm_agent_extractions_created ON public.crm_agent_extractions(created_at DESC);

-- 1.3 Extender crm_customers com dados de perfil
ALTER TABLE public.crm_customers
  ADD COLUMN IF NOT EXISTS profile_type TEXT,
  ADD COLUMN IF NOT EXISTS profession TEXT,
  ADD COLUMN IF NOT EXISTS is_technical BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS origin_channel TEXT,
  ADD COLUMN IF NOT EXISTS referred_by TEXT,
  ADD COLUMN IF NOT EXISTS main_motivation TEXT,
  ADD COLUMN IF NOT EXISTS pain_points JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS decision_makers JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS profile_extracted_at TIMESTAMPTZ;

-- 1.4 Extender crm_opportunities com dados de negociação
ALTER TABLE public.crm_opportunities
  ADD COLUMN IF NOT EXISTS proposal_requested BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS proposal_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS proposal_value NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS client_mentioned_value NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS budget_range TEXT,
  ADD COLUMN IF NOT EXISTS competitors JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS discount_requested NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS discount_offered NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS payment_preference TEXT,
  ADD COLUMN IF NOT EXISTS visit_offered BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS visits_done INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_contact_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS days_in_negotiation INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_interactions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spin_stage TEXT,
  ADD COLUMN IF NOT EXISTS spin_score INTEGER,
  ADD COLUMN IF NOT EXISTS bant_score INTEGER,
  ADD COLUMN IF NOT EXISTS bant_qualified BOOLEAN,
  ADD COLUMN IF NOT EXISTS recommended_actions JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS last_ai_analysis_at TIMESTAMPTZ;

-- 1.5 Extender project_contexts com dados do projeto
ALTER TABLE public.project_contexts
  ADD COLUMN IF NOT EXISTS project_type_detailed TEXT,
  ADD COLUMN IF NOT EXISTS project_phase TEXT,
  ADD COLUMN IF NOT EXISTS has_professional BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS professional_name TEXT,
  ADD COLUMN IF NOT EXISTS location_neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS technical_specs JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS products_needed JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS estimated_quantities JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deadline_urgency TEXT,
  ADD COLUMN IF NOT EXISTS start_date DATE;

-- =====================================================
-- RLS POLICIES para crm_agent_extractions
-- =====================================================

ALTER TABLE public.crm_agent_extractions ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todas as extrações
CREATE POLICY "Admins can view all extractions"
ON public.crm_agent_extractions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Supervisores podem ver todas as extrações
CREATE POLICY "Supervisors can view all extractions"
ON public.crm_agent_extractions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'supervisor'));

-- Vendedores podem ver extrações das suas próprias oportunidades
CREATE POLICY "Vendors can view own extractions"
ON public.crm_agent_extractions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.crm_opportunities o
    WHERE o.id = crm_agent_extractions.opportunity_id
    AND o.vendor_id = public.get_user_vendor_id(auth.uid())
  )
);

-- Apenas sistema (service role) pode inserir/atualizar extrações
CREATE POLICY "System can insert extractions"
ON public.crm_agent_extractions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can update extractions"
ON public.crm_agent_extractions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- Trigger para atualizar updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_crm_agent_extractions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_crm_agent_extractions_version
  BEFORE UPDATE ON public.crm_agent_extractions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_crm_agent_extractions_updated_at();