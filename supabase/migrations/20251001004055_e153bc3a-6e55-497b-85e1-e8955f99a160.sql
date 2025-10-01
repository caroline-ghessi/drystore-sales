-- Criar bucket público para documentos de propostas (PDFs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proposals-documents',
  'proposals-documents',
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket proposals-documents

-- Permitir leitura pública para todos (necessário para visualização de propostas)
CREATE POLICY "Public read access for proposal documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'proposals-documents');

-- Permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload proposal documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'proposals-documents' 
  AND auth.uid() IS NOT NULL
);

-- Permitir update apenas para o usuário que fez upload ou admins/supervisores
CREATE POLICY "Users can update their own proposal documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'proposals-documents' 
  AND (
    auth.uid() = owner
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'supervisor'::app_role)
  )
);

-- Permitir delete apenas para o usuário que fez upload ou admins/supervisores
CREATE POLICY "Users can delete their own proposal documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'proposals-documents' 
  AND (
    auth.uid() = owner
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'supervisor'::app_role)
  )
);