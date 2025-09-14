-- Criar perfil e permissões administrativas para caroline@drystore.com.br

-- Função para buscar e criar perfil de usuário admin
CREATE OR REPLACE FUNCTION setup_admin_user(admin_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar user_id da tabela auth.users
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = admin_email;
  
  -- Se usuário não existir, sair da função
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'Usuário com email % não encontrado na tabela auth.users', admin_email;
    RETURN;
  END IF;
  
  -- Inserir perfil se não existir
  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    email, 
    department,
    is_active
  ) VALUES (
    admin_user_id,
    'Caroline',
    admin_email,
    'Administração',
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    department = EXCLUDED.department,
    is_active = true,
    updated_at = now();
  
  -- Conceder role de admin
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (admin_user_id, 'admin'::app_role, admin_user_id)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log da operação
  INSERT INTO public.system_logs (level, source, message, data)
  VALUES (
    'info',
    'admin_setup', 
    'Admin profile and role created for ' || admin_email,
    jsonb_build_object(
      'email', admin_email,
      'user_id', admin_user_id,
      'action', 'profile_and_role_created',
      'created_at', now()
    )
  );
END;
$$;

-- Executar a função para Caroline
SELECT setup_admin_user('caroline@drystore.com.br');

-- Remover a função temporária (limpeza)
DROP FUNCTION setup_admin_user(TEXT);