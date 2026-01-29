

# Plano: Limpar Oportunidades Existentes ao Adicionar Contato Excluído

## Problema Identificado

Quando um contato é adicionado à lista de exclusão (`excluded_contacts`), o sistema:
- ✅ Bloqueia a criação de NOVAS oportunidades para esse telefone
- ❌ **NÃO remove ou marca** oportunidades/clientes que JÁ existiam antes da exclusão

### Evidência do problema:
```
Oportunidade criada:  2026-01-29 15:30:40 (Felipe, phone: 555191417549)
Contato excluído:     2026-01-29 18:04:48 (Felipe Peliculas, phone: 555191417549)
```

A oportunidade continuou aparecendo no pipeline porque foi criada ANTES da exclusão.

---

## Solução Proposta

Criar uma **trigger function** no banco de dados que, ao inserir um novo contato na `excluded_contacts`:

1. **Deleta oportunidades existentes** no CRM para esse telefone
2. **Deleta clientes** que ficaram sem oportunidades
3. **Atualiza vendor_conversations** marcando como `is_internal_contact: true`

---

## Implementação Técnica

### Arquivo: Migration SQL

```sql
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
    
    -- 4. Marcar vendor_conversations como internas
    UPDATE vendor_conversations
    SET 
      metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{is_internal_contact}',
        'true'::jsonb
      ),
      has_opportunity = true
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_cleanup_excluded_contact ON excluded_contacts;
CREATE TRIGGER trigger_cleanup_excluded_contact
  AFTER INSERT ON excluded_contacts
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_excluded_contact_data();
```

---

## Fluxo Após Implementação

```
Usuário adiciona contato à lista de exclusão
          ↓
     INSERT INTO excluded_contacts
          ↓
   TRIGGER dispara automaticamente
          ↓
    ┌─────────────────────────────────────┐
    │ 1. Busca customers pelo telefone     │
    │ 2. Deleta oportunidades desse cliente│
    │ 3. Deleta cliente se ficou órfão     │
    │ 4. Marca conversas como internas     │
    │ 5. Registra no system_logs           │
    └─────────────────────────────────────┘
          ↓
   Dados limpos automaticamente!
```

---

## Comportamento Esperado

Ao adicionar um contato à lista de exclusão:
- Todas as oportunidades no CRM para esse telefone são **deletadas**
- O cliente no CRM é **deletado** (se não tiver outras oportunidades)
- As conversas de vendedores são **marcadas como internas**
- Um log é registrado para auditoria

---

## Segurança

- A função usa `SECURITY DEFINER` para garantir permissões adequadas
- Só executa em `INSERT` (não em update/delete)
- Registra todas as operações no `system_logs` para auditoria

---

## Resumo das Mudanças

| Componente | Ação |
|------------|------|
| Banco de dados | Criar função `cleanup_excluded_contact_data()` |
| Banco de dados | Criar trigger `trigger_cleanup_excluded_contact` |
| Nenhum código frontend | O trigger funciona automaticamente |

