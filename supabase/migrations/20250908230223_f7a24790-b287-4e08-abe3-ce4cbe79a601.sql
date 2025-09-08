-- FASE 1: Criação de Novas Tabelas Organizadas

-- CRM Pipeline Stages
CREATE TABLE public.crm_pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  stage_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  color_code VARCHAR(7) DEFAULT '#3b82f6',
  conversion_probability INTEGER DEFAULT 0 CHECK (conversion_probability >= 0 AND conversion_probability <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CRM Customer Segments
CREATE TABLE public.crm_customer_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  color_code VARCHAR(7) DEFAULT '#10b981',
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Proposal Templates
CREATE TABLE public.proposal_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  product_category product_category,
  template_content JSONB NOT NULL DEFAULT '{}',
  styling JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Proposal Workflows
CREATE TABLE public.proposal_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  workflow_steps JSONB NOT NULL DEFAULT '[]',
  approval_rules JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product Categories (organizacional)
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_category_id UUID REFERENCES public.product_categories(id),
  category_code VARCHAR(20) UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product Suppliers
CREATE TABLE public.product_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contact_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  tax_id VARCHAR(50),
  payment_terms VARCHAR(100),
  lead_time_days INTEGER DEFAULT 0,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- FASE 2: Renomeação de Tabelas Existentes

-- Renomear customers para crm_customers
ALTER TABLE public.customers RENAME TO crm_customers;

-- Renomear opportunities para crm_opportunities  
ALTER TABLE public.opportunities RENAME TO crm_opportunities;

-- Renomear tasks para crm_tasks
ALTER TABLE public.tasks RENAME TO crm_tasks;

-- FASE 3: Adição de RLS Policies para Novas Tabelas

-- RLS para crm_pipeline_stages
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users on crm_pipeline_stages" 
ON public.crm_pipeline_stages FOR ALL 
USING (true) WITH CHECK (true);

-- RLS para crm_customer_segments
ALTER TABLE public.crm_customer_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users on crm_customer_segments" 
ON public.crm_customer_segments FOR ALL 
USING (true) WITH CHECK (true);

-- RLS para proposal_templates
ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users on proposal_templates" 
ON public.proposal_templates FOR ALL 
USING (true) WITH CHECK (true);

-- RLS para proposal_workflows
ALTER TABLE public.proposal_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users on proposal_workflows" 
ON public.proposal_workflows FOR ALL 
USING (true) WITH CHECK (true);

-- RLS para product_categories
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users on product_categories" 
ON public.product_categories FOR ALL 
USING (true) WITH CHECK (true);

-- RLS para product_suppliers
ALTER TABLE public.product_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users on product_suppliers" 
ON public.product_suppliers FOR ALL 
USING (true) WITH CHECK (true);

-- FASE 4: Triggers para Updated_at nas novas tabelas

-- Trigger para crm_pipeline_stages
CREATE TRIGGER update_crm_pipeline_stages_updated_at
BEFORE UPDATE ON public.crm_pipeline_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para crm_customer_segments
CREATE TRIGGER update_crm_customer_segments_updated_at
BEFORE UPDATE ON public.crm_customer_segments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para proposal_templates
CREATE TRIGGER update_proposal_templates_updated_at
BEFORE UPDATE ON public.proposal_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para proposal_workflows
CREATE TRIGGER update_proposal_workflows_updated_at
BEFORE UPDATE ON public.proposal_workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para product_categories
CREATE TRIGGER update_product_categories_updated_at
BEFORE UPDATE ON public.product_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para product_suppliers
CREATE TRIGGER update_product_suppliers_updated_at
BEFORE UPDATE ON public.product_suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- FASE 5: Índices para Performance

-- Índices para crm_pipeline_stages
CREATE INDEX idx_crm_pipeline_stages_active ON public.crm_pipeline_stages(is_active);
CREATE INDEX idx_crm_pipeline_stages_order ON public.crm_pipeline_stages(stage_order);

-- Índices para crm_customer_segments
CREATE INDEX idx_crm_customer_segments_active ON public.crm_customer_segments(is_active);

-- Índices para proposal_templates
CREATE INDEX idx_proposal_templates_category ON public.proposal_templates(product_category);
CREATE INDEX idx_proposal_templates_active ON public.proposal_templates(is_active);

-- Índices para product_categories
CREATE INDEX idx_product_categories_parent ON public.product_categories(parent_category_id);
CREATE INDEX idx_product_categories_active ON public.product_categories(is_active);

-- Índices para product_suppliers
CREATE INDEX idx_product_suppliers_active ON public.product_suppliers(is_active);