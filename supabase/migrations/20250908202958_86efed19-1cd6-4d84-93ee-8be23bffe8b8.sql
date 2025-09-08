-- FASE 1: NOVOS ENUMS PARA CRM E PROPOSTAS
CREATE TYPE customer_status AS ENUM ('lead', 'prospect', 'customer', 'inactive');
CREATE TYPE customer_priority AS ENUM ('low', 'normal', 'high', 'critical');
CREATE TYPE opportunity_stage AS ENUM ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE task_type AS ENUM ('call', 'email', 'meeting', 'follow_up', 'proposal', 'visit');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'viewed', 'under_review', 'accepted', 'rejected', 'expired');
CREATE TYPE product_unit AS ENUM ('m2', 'ml', 'peca', 'kg', 'litro', 'unidade', 'conjunto', 'pacote');

-- FASE 2: TABELAS PARA MÓDULO CRM
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id),
  name varchar NOT NULL,
  email varchar,
  phone varchar NOT NULL,
  city varchar,
  state varchar,
  company varchar,
  segment varchar,
  source varchar DEFAULT 'whatsapp',
  status customer_status DEFAULT 'lead',
  priority customer_priority DEFAULT 'normal',
  assigned_to uuid REFERENCES public.profiles(user_id),
  total_value numeric DEFAULT 0,
  last_interaction_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id),
  conversation_id uuid REFERENCES public.conversations(id),
  title varchar NOT NULL,
  description text,
  value numeric NOT NULL DEFAULT 0,
  stage opportunity_stage DEFAULT 'prospecting',
  probability integer DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date date,
  actual_close_date date,
  assigned_to uuid REFERENCES public.profiles(user_id),
  source varchar DEFAULT 'whatsapp',
  product_category product_category,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id),
  opportunity_id uuid REFERENCES public.opportunities(id),
  conversation_id uuid REFERENCES public.conversations(id),
  title varchar NOT NULL,
  description text,
  type task_type DEFAULT 'follow_up',
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'normal',
  due_date timestamptz,
  assigned_to uuid REFERENCES public.profiles(user_id),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FASE 3: TABELAS PARA MÓDULO PROPOSTAS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar UNIQUE NOT NULL,
  name varchar NOT NULL,
  description text,
  category product_category,
  subcategory varchar,
  unit product_unit NOT NULL,
  base_price numeric DEFAULT 0,
  cost numeric DEFAULT 0,
  supplier varchar,
  specifications jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_number varchar UNIQUE NOT NULL,
  customer_id uuid REFERENCES public.customers(id),
  conversation_id uuid REFERENCES public.conversations(id),
  opportunity_id uuid REFERENCES public.opportunities(id),
  title varchar NOT NULL,
  description text,
  project_type product_category,
  status proposal_status DEFAULT 'draft',
  total_value numeric DEFAULT 0,
  discount_percentage numeric DEFAULT 0,
  discount_value numeric DEFAULT 0,
  final_value numeric DEFAULT 0,
  valid_until date,
  acceptance_link varchar UNIQUE,
  accepted_at timestamptz,
  created_by uuid REFERENCES public.profiles(user_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.proposal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  custom_name varchar,
  description text,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  specifications jsonb DEFAULT '{}',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.calculation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  category product_category,
  calculation_type varchar NOT NULL,
  input_parameters jsonb NOT NULL DEFAULT '{}',
  output_template jsonb NOT NULL DEFAULT '{}',
  formula_version varchar DEFAULT '1.0',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.profiles(user_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FASE 4: ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_customers_conversation_id ON public.customers(conversation_id);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_status ON public.customers(status);
CREATE INDEX idx_opportunities_customer_id ON public.opportunities(customer_id);
CREATE INDEX idx_opportunities_stage ON public.opportunities(stage);
CREATE INDEX idx_opportunities_conversation_id ON public.opportunities(conversation_id);
CREATE INDEX idx_tasks_customer_id ON public.tasks(customer_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_proposals_customer_id ON public.proposals(customer_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE INDEX idx_proposals_conversation_id ON public.proposals(conversation_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_proposal_items_proposal_id ON public.proposal_items(proposal_id);

-- FASE 5: TRIGGERS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calculation_templates_updated_at
  BEFORE UPDATE ON public.calculation_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- FASE 6: POLÍTICAS RLS
-- Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users on customers" ON public.customers
  FOR ALL USING (true) WITH CHECK (true);

-- Opportunities
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users on opportunities" ON public.opportunities
  FOR ALL USING (true) WITH CHECK (true);

-- Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users on tasks" ON public.tasks
  FOR ALL USING (true) WITH CHECK (true);

-- Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users on products" ON public.products
  FOR ALL USING (true) WITH CHECK (true);

-- Proposals
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users on proposals" ON public.proposals
  FOR ALL USING (true) WITH CHECK (true);

-- Proposal Items
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users on proposal_items" ON public.proposal_items
  FOR ALL USING (true) WITH CHECK (true);

-- Calculation Templates
ALTER TABLE public.calculation_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users on calculation_templates" ON public.calculation_templates
  FOR ALL USING (true) WITH CHECK (true);