-- Criar enum para tipos de contato
CREATE TYPE contact_type AS ENUM (
  'employee',      -- Funcionário/Colega
  'vendor',        -- Próprio vendedor monitorado
  'test',          -- Número de teste
  'supplier',      -- Fornecedor
  'partner',       -- Parceiro de negócio
  'spam'           -- Spam/Bot
);

-- Criar tabela de contatos excluídos
CREATE TABLE excluded_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number varchar NOT NULL UNIQUE,
  name varchar NOT NULL,
  department varchar,
  contact_type contact_type DEFAULT 'employee',
  reason text,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_excluded_contacts_phone ON excluded_contacts(phone_number);
CREATE INDEX idx_excluded_contacts_active ON excluded_contacts(is_active) WHERE is_active = true;

-- Habilitar RLS
ALTER TABLE excluded_contacts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Admin/Supervisor podem gerenciar
CREATE POLICY "Admins and supervisors can manage excluded contacts"
ON excluded_contacts FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_excluded_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_excluded_contacts_updated_at
BEFORE UPDATE ON excluded_contacts
FOR EACH ROW EXECUTE FUNCTION update_excluded_contacts_updated_at();

-- Trigger: Atualizar conversas existentes quando número é adicionado/removido da lista
CREATE OR REPLACE FUNCTION update_existing_conversations_on_exclusion()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um número é adicionado à lista de exclusão
  IF NEW.is_active = true AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.is_active = false)) THEN
    -- Atualizar vendor_conversations
    UPDATE vendor_conversations
    SET metadata = jsonb_set(
      COALESCE(metadata, '{}'),
      '{is_internal_contact}',
      'true'
    )
    WHERE customer_phone = NEW.phone_number;
    
    -- Atualizar conversations (bot principal)
    UPDATE conversations
    SET metadata = jsonb_set(
      COALESCE(metadata, '{}'),
      '{is_internal_contact}',
      'true'
    )
    WHERE whatsapp_number = NEW.phone_number;
  END IF;
  
  -- Quando um número é removido da lista (desativado)
  IF TG_OP = 'UPDATE' AND NEW.is_active = false AND OLD.is_active = true THEN
    UPDATE vendor_conversations
    SET metadata = metadata - 'is_internal_contact'
    WHERE customer_phone = NEW.phone_number;
    
    UPDATE conversations
    SET metadata = metadata - 'is_internal_contact'
    WHERE whatsapp_number = NEW.phone_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_conversations_on_exclusion
AFTER INSERT OR UPDATE ON excluded_contacts
FOR EACH ROW EXECUTE FUNCTION update_existing_conversations_on_exclusion();

-- Trigger: Auto-excluir vendedores monitorados quando são adicionados
CREATE OR REPLACE FUNCTION auto_exclude_vendor_phone()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO excluded_contacts (phone_number, name, reason, contact_type)
  VALUES (
    regexp_replace(NEW.phone_number, '[^0-9]', '', 'g'),
    NEW.name,
    'Vendedor monitorado (auto)',
    'vendor'
  )
  ON CONFLICT (phone_number) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_exclude_vendor
AFTER INSERT ON vendors
FOR EACH ROW EXECUTE FUNCTION auto_exclude_vendor_phone();

-- Migrar vendedores existentes para a lista de exclusão
INSERT INTO excluded_contacts (phone_number, name, reason, contact_type)
SELECT 
  regexp_replace(phone_number, '[^0-9]', '', 'g'),
  name,
  'Vendedor monitorado (migração)',
  'vendor'::contact_type
FROM vendors
WHERE is_active = true
  AND phone_number IS NOT NULL
  AND phone_number != ''
ON CONFLICT (phone_number) DO NOTHING;