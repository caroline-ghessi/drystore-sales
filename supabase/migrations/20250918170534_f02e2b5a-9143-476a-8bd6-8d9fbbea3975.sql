-- Criar bucket público para assets de propostas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proposal-assets',
  'proposal-assets',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
);

-- Políticas RLS para o bucket proposal-assets

-- Permitir leitura pública para todos (necessário para templates públicos)
CREATE POLICY "Public read access for proposal assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'proposal-assets');

-- Permitir upload apenas para usuários autenticados com role admin/supervisor
CREATE POLICY "Admin upload access for proposal assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'proposal-assets' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'supervisor'::app_role)
  )
);

-- Permitir update apenas para usuários autenticados com role admin/supervisor
CREATE POLICY "Admin update access for proposal assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'proposal-assets' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'supervisor'::app_role)
  )
);

-- Permitir delete apenas para usuários autenticados com role admin/supervisor
CREATE POLICY "Admin delete access for proposal assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'proposal-assets' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'supervisor'::app_role)
  )
);

-- Criar tabela para organizar metadata das imagens de templates
CREATE TABLE public.proposal_template_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  template_category product_category NOT NULL,
  asset_type VARCHAR(50) NOT NULL, -- 'hero', 'product', 'logo', 'diagram', 'certification'
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proposal_template_assets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para proposal_template_assets
CREATE POLICY "Public read access for template assets"
ON public.proposal_template_assets FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin full access for template assets"
ON public.proposal_template_assets FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'supervisor'::app_role)
);

-- Trigger para updated_at
CREATE TRIGGER update_proposal_template_assets_updated_at
BEFORE UPDATE ON public.proposal_template_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_template_assets_category ON public.proposal_template_assets(template_category);
CREATE INDEX idx_template_assets_type ON public.proposal_template_assets(asset_type);
CREATE INDEX idx_template_assets_active ON public.proposal_template_assets(is_active);