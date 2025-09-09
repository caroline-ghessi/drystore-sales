-- Adicionar campo email na tabela vendors
ALTER TABLE public.vendors 
ADD COLUMN email character varying UNIQUE;

-- Adicionar role 'vendedor' ao enum app_role se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'atendente', 'vendedor');
    ELSE
        BEGIN
            ALTER TYPE public.app_role ADD VALUE 'vendedor';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;