
# Plano: Vincular Oportunidades ao Vendedor Correto + RLS por Vendedor

## Resumo

Garantir que cada oportunidade seja vinculada ao vendedor que recebeu o resumo do lead, e implementar RLS para que vendedores vejam apenas suas negociações enquanto admins vejam todas.

---

## Problemas Identificados

### 1. Oportunidade sem vendor_id (send-lead-to-vendor)

No fluxo do bot, quando o resumo é enviado para um vendedor, a oportunidade é criada **sem o `vendor_id`**:

```typescript
// Linha 142-157 de send-lead-to-vendor/index.ts (ATUAL)
.insert({
  customer_id: customerId,
  conversation_id: conversationId,
  title: `Oportunidade - ${conversation?.product_group || 'Nova'}`,
  // vendor_id NÃO ESTÁ SENDO PREENCHIDO!
  ...
})
```

**Correção:** Adicionar `vendor_id: vendorId` ao insert.

### 2. RLS Permissiva Demais

Políticas atuais em `crm_opportunities` e `crm_customers`:

```sql
-- Atual: QUALQUER usuário autenticado pode ver TUDO
Policy: "Enable all for authenticated users on opportunities"
Command: ALL, qual: true
```

**Correção:** Criar políticas específicas por role.

---

## Arquitetura de Acesso Proposta

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MODELO DE ACESSO CRM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ADMIN/SUPERVISOR                        VENDEDOR                           │
│  ┌─────────────────────────────┐         ┌─────────────────────────────┐   │
│  │ Vê TODAS as negociações     │         │ Vê apenas SUAS negociações  │   │
│  │ Vê TODOS os clientes        │         │ Vê apenas SEUS clientes     │   │
│  │ Pode editar/deletar tudo    │         │ Pode editar suas negocia-   │   │
│  │                             │         │ ções (mudar stage, valor)   │   │
│  └─────────────────────────────┘         └─────────────────────────────┘   │
│                                                                             │
│  Como vincular usuário a vendor?                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ vendor_user_mapping                                                  │   │
│  │ ┌────────────┬────────────┬───────────┐                              │   │
│  │ │ vendor_id  │ user_id    │ is_active │                              │   │
│  │ ├────────────┼────────────┼───────────┤                              │   │
│  │ │ uuid-antonio│ auth.uid()│ true      │                              │   │
│  │ └────────────┴────────────┴───────────┘                              │   │
│  │                                                                      │   │
│  │ Quando vendedor loga, buscamos seu vendor_id via mapping             │   │
│  │ e filtramos oportunidades onde vendor_id = seu_vendor_id             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementação

### Parte 1: Corrigir send-lead-to-vendor para incluir vendor_id

**Arquivo:** `supabase/functions/send-lead-to-vendor/index.ts`

Adicionar `vendor_id` ao criar a oportunidade:

```typescript
// Modificar o insert (linha 142-157)
const { data: opportunity, error: oppError } = await supabase
  .from('crm_opportunities')
  .insert({
    customer_id: customerId,
    conversation_id: conversationId,
    vendor_id: vendorId,           // NOVO: Associar ao vendedor que recebeu
    title: `Oportunidade - ${conversation?.product_group || 'Nova'}`,
    source: 'whatsapp',
    product_category: conversation?.product_group,
    stage: 'prospecting',
    probability: 20,
    value: 0,
    validation_status: 'ai_generated',
    temperature: conversation?.lead_temperature || 'cold',
  })
  .select('id')
  .single();
```

---

### Parte 2: Criar Função Helper para Buscar vendor_id do Usuário

**Migração SQL:**

```sql
-- Função para buscar vendor_id associado ao user_id atual
CREATE OR REPLACE FUNCTION public.get_user_vendor_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT vendor_id 
  FROM vendor_user_mapping 
  WHERE user_id = _user_id 
    AND is_active = true 
  LIMIT 1
$$;
```

---

### Parte 3: Atualizar RLS de crm_opportunities

**Migração SQL:**

```sql
-- Remover política permissiva atual
DROP POLICY IF EXISTS "Enable all for authenticated users on opportunities" 
  ON crm_opportunities;

-- Admins e supervisores podem gerenciar todas as oportunidades
CREATE POLICY "Admins and supervisors can manage all opportunities"
  ON crm_opportunities FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'supervisor')
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'supervisor')
  );

-- Vendedores podem ver apenas suas próprias oportunidades
CREATE POLICY "Vendors can view own opportunities"
  ON crm_opportunities FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'vendedor') AND
    vendor_id = get_user_vendor_id(auth.uid())
  );

-- Vendedores podem atualizar apenas suas próprias oportunidades
CREATE POLICY "Vendors can update own opportunities"
  ON crm_opportunities FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'vendedor') AND
    vendor_id = get_user_vendor_id(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'vendedor') AND
    vendor_id = get_user_vendor_id(auth.uid())
  );
```

---

### Parte 4: Atualizar RLS de crm_customers

**Migração SQL:**

```sql
-- Remover política permissiva atual
DROP POLICY IF EXISTS "Enable all for authenticated users on customers" 
  ON crm_customers;

-- Admins e supervisores podem gerenciar todos os clientes
CREATE POLICY "Admins and supervisors can manage all customers"
  ON crm_customers FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'supervisor')
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'supervisor')
  );

-- Vendedores podem ver clientes de suas oportunidades
CREATE POLICY "Vendors can view customers from own opportunities"
  ON crm_customers FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'vendedor') AND
    id IN (
      SELECT customer_id FROM crm_opportunities 
      WHERE vendor_id = get_user_vendor_id(auth.uid())
    )
  );
```

---

### Parte 5: Atualizar Frontend para Considerar vendor_id

**Arquivo:** `src/modules/crm/hooks/useOpportunities.ts` (ou similar)

Não precisa de mudanças! As queries já buscam do Supabase e as RLS policies farão o filtro automaticamente. O vendedor verá apenas seus dados.

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/send-lead-to-vendor/index.ts` | Adicionar `vendor_id: vendorId` ao criar oportunidade |

---

## Migração de Banco de Dados

Uma migração SQL para:

1. Criar função `get_user_vendor_id(uuid)`
2. Substituir RLS de `crm_opportunities` 
3. Substituir RLS de `crm_customers`

---

## Requisito: Vincular Vendedores a Contas

Para o RLS funcionar, cada vendedor precisa ter uma conta de usuário vinculada via `vendor_user_mapping`:

| vendor_id | user_id | is_active |
|-----------|---------|-----------|
| uuid-antonio | auth.uid() do Antonio | true |

**Sugestão:** Usar o fluxo existente em `useCreateVendorAccount` para criar contas para os vendedores.

---

## Fluxo Completo

```text
1. Lead recebe resumo → send-lead-to-vendor
2. Cria crm_opportunity com vendor_id = vendorId do vendedor que recebeu
3. Vendedor faz login (tem mapping em vendor_user_mapping)
4. Ao acessar /crm/pipeline, RLS filtra:
   - get_user_vendor_id(auth.uid()) retorna seu vendor_id
   - Só retorna oportunidades onde vendor_id = seu_vendor_id
5. Admin acessa /crm/pipeline
   - has_role retorna true para 'admin'
   - Retorna TODAS as oportunidades
```

---

## Resumo das Mudanças

| Componente | Estado Atual | Estado Final |
|------------|--------------|--------------|
| send-lead-to-vendor | Não preenche vendor_id | Preenche vendor_id |
| crm_opportunities RLS | Todos veem tudo | Admin: tudo, Vendedor: só suas |
| crm_customers RLS | Todos veem tudo | Admin: tudo, Vendedor: só de suas opp |
| get_user_vendor_id() | Não existe | Criada como helper para RLS |
