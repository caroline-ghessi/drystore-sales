-- Conceder permissão de admin para caroline@drystore.com.br
-- Primeiro, buscar o user_id baseado no email
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT 
  p.user_id,
  'admin'::app_role,
  p.user_id  -- Auto-atribuído
FROM public.profiles p
WHERE p.email = 'caroline@drystore.com.br'
ON CONFLICT (user_id, role) DO NOTHING;

-- Log da operação para auditoria
INSERT INTO public.system_logs (level, source, message, data)
VALUES (
  'info',
  'admin_setup', 
  'Admin role granted to caroline@drystore.com.br',
  jsonb_build_object(
    'email', 'caroline@drystore.com.br',
    'role', 'admin',
    'granted_at', now()
  )
);