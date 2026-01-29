-- Função que limpa dados existentes quando um contato é adicionado à exclusão
CREATE OR REPLACE FUNCTION cleanup_excluded_contact_data()
RETURNS TRIGGER AS $$
DECLARE
  affected_customer_ids UUID[];
  deleted_opps INTEGER;
  deleted_customers INTEGER;
  updated_convs INTEGER;
BEGIN
  -- Só executar em INSERT
  IF TG_OP = 'INSERT' THEN
    
    -- 1. Buscar customer_ids afetados (antes de deletar oportunidades)
    SELECT ARRAY_AGG(DISTINCT c.id)
    INTO affected_customer_ids
    FROM crm_customers c
    WHERE c.phone = NEW.phone_number;
    
    -- 2. Deletar oportunidades do CRM para esse telefone
    IF affected_customer_ids IS NOT NULL THEN
      DELETE FROM crm_opportunities
      WHERE customer_id = ANY(affected_customer_ids);
      
      GET DIAGNOSTICS deleted_opps = ROW_COUNT;
      
      -- 3. Deletar clientes que não têm mais oportunidades
      DELETE FROM crm_customers
      WHERE id = ANY(affected_customer_ids)
      AND NOT EXISTS (
        SELECT 1 FROM crm_opportunities WHERE customer_id = crm_customers.id
      );
      
      GET DIAGNOSTICS deleted_customers = ROW_COUNT;
    ELSE
      deleted_opps := 0;
      deleted_customers := 0;
    END IF;
    
    -- 4. Marcar vendor_conversations como internas
    UPDATE vendor_conversations
    SET 
      metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{is_internal_contact}',
        'true'::jsonb
      ),
      has_opportunity = false
    WHERE customer_phone = NEW.phone_number;
    
    GET DIAGNOSTICS updated_convs = ROW_COUNT;
    
    -- 5. Log da operação
    IF deleted_opps > 0 OR deleted_customers > 0 OR updated_convs > 0 THEN
      INSERT INTO system_logs (level, source, message, data)
      VALUES (
        'info',
        'excluded_contacts_trigger',
        'Dados limpos para contato excluído: ' || NEW.phone_number,
        jsonb_build_object(
          'phone_number', NEW.phone_number,
          'deleted_opportunities', deleted_opps,
          'deleted_customers', deleted_customers,
          'updated_conversations', updated_convs
        )
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_cleanup_excluded_contact ON excluded_contacts;
CREATE TRIGGER trigger_cleanup_excluded_contact
  AFTER INSERT ON excluded_contacts
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_excluded_contact_data();