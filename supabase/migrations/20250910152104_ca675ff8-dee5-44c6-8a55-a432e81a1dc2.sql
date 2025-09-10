-- Configurar acesso admin para caroline@drystore.com.br
-- Primeiro, vamos tentar encontrar o user_id baseado no email dos metadados

DO $$
DECLARE
    target_user_id uuid;
    current_admin_id uuid;
BEGIN
    -- Buscar o user_id do caroline@drystore.com.br
    -- Como não podemos acessar auth.users diretamente via RLS, vamos usar uma abordagem diferente
    
    -- Primeiro, vamos obter o user_id do usuário atual (que está fazendo esta operação)
    SELECT auth.uid() INTO current_admin_id;
    
    -- Vamos tentar encontrar se já existe um perfil para caroline@drystore.com.br
    SELECT user_id INTO target_user_id 
    FROM profiles 
    WHERE email = 'caroline@drystore.com.br';
    
    -- Se não encontrou o perfil, vamos assumir que precisa ser criado
    -- Para isso, vamos usar uma abordagem: criar um UUID específico baseado no email
    -- Na prática, o user_id correto deve vir da tabela auth.users
    
    IF target_user_id IS NULL THEN
        -- Buscar todos os profiles existentes para debug
        RAISE NOTICE 'Usuário caroline@drystore.com.br não encontrado nos profiles existentes';
        
        -- Como não conseguimos acessar auth.users diretamente, vamos criar uma função
        -- que pode ser executada depois quando soubermos o user_id correto
        RAISE NOTICE 'Será necessário obter o user_id do auth.users para completar a operação';
    ELSE
        -- Se o perfil existe, vamos garantir que tenha a role admin
        INSERT INTO user_roles (user_id, role, assigned_by)
        VALUES (target_user_id, 'admin', current_admin_id)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Role admin atribuída para caroline@drystore.com.br';
    END IF;
END $$;