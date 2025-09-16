-- Corrigir propostas existentes sem created_by
-- Definir um admin padrão para propostas órfãs
UPDATE public.proposals 
SET created_by = (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'admin'::app_role 
  LIMIT 1
)
WHERE created_by IS NULL;