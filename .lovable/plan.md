

# Plano: Corrigir Atribuicao de Origem de Leads no CRM

## Contexto e Problema

Atualmente, 168 das 992 oportunidades (17%) marcadas como `vendor_whatsapp` na verdade tiveram primeiro contato pelo bot oficial da empresa. Isso distorce as metricas de origem dos leads.

### Evidencia dos Dados

```
Oportunidades marcadas vendor_whatsapp: 992
Dessas, vieram do bot primeiro:        168 (17%)
Oportunidades com conversation_id:       0 (nenhuma!)
```

### Causa Raiz

A edge function `process-vendor-opportunities` cria oportunidades para TODAS as conversas dos vendedores sem verificar se o cliente ja foi atendido pelo bot oficial.

---

## Logica de Verificacao

Para determinar a origem correta de um lead:

```text
+-------------------------------------------+
|   Cliente aparece em vendor_conversations |
+-------------------------------------------+
                    |
                    v
+-------------------------------------------+
| O telefone existe na tabela conversations?|
+-------------------------------------------+
         |                        |
        SIM                      NAO
         |                        |
         v                        v
+-------------------+   +--------------------+
| Origem: whatsapp  |   | Origem:            |
| (bot oficial)     |   | vendor_whatsapp    |
+-------------------+   +--------------------+
```

**Regra adicional**: Se houver registro em `lead_distributions` para o mesmo cliente, significa que o resumo foi enviado ao vendedor - confirmacao extra de que veio do bot.

---

## Valores de Source a Usar

| Cenario | Valor de Source | Descricao |
|---------|-----------------|-----------|
| Cliente veio do bot oficial | `whatsapp` | Primeiro contato pelo WhatsApp da empresa |
| Cliente veio direto do vendedor | `vendor_whatsapp` | Contato iniciado no WhatsApp individual do vendedor |

Estes valores ja existem no sistema (send-lead-to-vendor usa `whatsapp`).

---

## Modificacoes Necessarias

### 1. Edge Function: `process-vendor-opportunities`

**Arquivo:** `supabase/functions/process-vendor-opportunities/index.ts`

Adicionar verificacao antes de criar a oportunidade:

**Linha 73-78** - Apos validar o telefone, verificar origem:

```typescript
// 3.2 NOVO: Verificar se cliente veio do bot oficial
const { data: botConversation } = await supabase
  .from('conversations')
  .select('id, whatsapp_number')
  .eq('whatsapp_number', normalizedPhone)
  .limit(1)
  .single();

const isFromBot = !!botConversation;
const opportunitySource = isFromBot ? 'whatsapp' : 'vendor_whatsapp';
const botConversationId = isFromBot ? botConversation.id : null;

if (isFromBot) {
  console.log(`[VendorOpportunities] Cliente ${normalizedPhone} veio do bot oficial`);
}
```

**Linha 87-99** - Atualizar criacao do cliente:

```typescript
const { data: customer, error: customerError } = await supabase
  .from('crm_customers')
  .upsert({
    phone: normalizedPhone,
    name: conv.customer_name || 'Cliente sem nome',
    source: opportunitySource,  // Usar source dinamico
    conversation_id: botConversationId,  // Vincular ao bot se existir
    last_interaction_at: new Date().toISOString(),
    status: 'lead',
  }, { 
    onConflict: 'phone',
    ignoreDuplicates: false 
  })
  .select('id')
  .single();
```

**Linha 110-124** - Atualizar criacao da oportunidade:

```typescript
const { error: oppError } = await supabase
  .from('crm_opportunities')
  .insert({
    customer_id: customer.id,
    vendor_conversation_id: conv.id,
    vendor_id: conv.vendor_id,
    conversation_id: botConversationId,  // NOVO: vincular ao bot
    title: `Oportunidade - ${conv.product_category || 'Nova'}`,
    source: opportunitySource,  // MODIFICADO: usar source dinamico
    product_category: conv.product_category,
    stage: 'prospecting',
    probability: isFromBot ? 20 : 10,  // Leads do bot tem maior probabilidade
    value: 0,
    validation_status: 'ai_generated',
  });
```

---

### 2. Script SQL: Corrigir Dados Existentes

Executar uma vez para corrigir as 168 oportunidades que vieram do bot:

```sql
-- Atualizar oportunidades que vieram do bot para source correto
WITH bot_originated_opps AS (
  SELECT 
    o.id as opp_id,
    conv.id as bot_conversation_id
  FROM crm_opportunities o
  JOIN crm_customers c ON c.id = o.customer_id
  JOIN conversations conv ON conv.whatsapp_number = c.phone
  WHERE o.source = 'vendor_whatsapp'
)
UPDATE crm_opportunities o
SET 
  source = 'whatsapp',
  conversation_id = boo.bot_conversation_id,
  probability = GREATEST(probability, 20)
FROM bot_originated_opps boo
WHERE o.id = boo.opp_id;

-- Atualizar crm_customers correspondentes
UPDATE crm_customers c
SET 
  source = 'whatsapp',
  conversation_id = conv.id
FROM conversations conv
WHERE conv.whatsapp_number = c.phone
AND c.source = 'vendor_whatsapp';
```

---

## Resumo das Mudancas

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `supabase/functions/process-vendor-opportunities/index.ts` | Modificar | Adicionar verificacao de origem do cliente |
| SQL de correcao | Executar | Corrigir 168 oportunidades existentes |

---

## Resultado Esperado

Apos implementacao:

1. **Novas oportunidades**: Origem corretamente identificada
2. **Dados existentes**: 168 registros atualizados para `source: 'whatsapp'`
3. **Metricas**: Atribuicao precisa entre canal bot e canal vendedor
4. **Historico**: `conversation_id` preenchido permite visualizar conversa do bot no CRM

---

## Metricas de Validacao

```sql
-- Query para validar apos implementacao
SELECT 
  source,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentual
FROM crm_opportunities
GROUP BY source
ORDER BY total DESC;
```

Resultado esperado:
- `vendor_whatsapp`: ~824 (83%)
- `whatsapp`: ~168 (17%)

