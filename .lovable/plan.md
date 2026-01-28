

# Plano: Implementar Fluxo de Leads para CRM

## Resumo do Problema

Atualmente, o sistema **não cria automaticamente leads no CRM**. Os dados existentes em `crm_opportunities` e `crm_customers` são dados de seed. O fluxo desejado precisa ser implementado:

---

## Estado Atual

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SITUACAO ATUAL                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  BOT OFICIAL (conversations)          WHATSAPP VENDEDORES                   │
│  ┌────────────────────────┐           ┌────────────────────────┐            │
│  │ 961 leads enviados     │           │ 2.574 conversas        │            │
│  │ via lead_distributions │           │ 32 contatos internos   │            │
│  │                        │           │ 0 com has_opportunity  │            │
│  └──────────┬─────────────┘           └──────────┬─────────────┘            │
│             │                                    │                          │
│             ▼                                    ▼                          │
│      ┌──────────────┐                     ┌──────────────┐                  │
│      │ NAO CRIA     │                     │ NAO CRIA     │                  │
│      │ crm_customers│                     │ crm_customers│                  │
│      │ crm_opportun.│                     │ crm_opportun.│                  │
│      └──────────────┘                     └──────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Fluxo Desejado

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                               FLUXO DESEJADO                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FLUXO 1: CLIENTE VIA BOT                                                   │
│  ──────────────────────────                                                 │
│                                                                             │
│  Cliente envia mensagem                                                     │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────┐                                                        │
│  │  Bot qualifica  │                                                        │
│  │  e classifica   │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐    NAO      ┌──────────────────┐                       │
│  │ Resumo enviado? ├────────────►│ NAO vira lead    │                       │
│  │ para vendedor?  │             │ no CRM           │                       │
│  └────────┬────────┘             └──────────────────┘                       │
│           │ SIM                                                             │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Criar/atualizar │                                                        │
│  │ crm_customers   │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Criar           │                                                        │
│  │ crm_opportunities│                                                       │
│  │ (source=bot)    │                                                        │
│  └─────────────────┘                                                        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FLUXO 2: CONVERSA WHATSAPP VENDEDOR                                        │
│  ───────────────────────────────────                                        │
│                                                                             │
│  Nova conversa no WhatsApp vendedor                                         │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────┐                                                        │
│  │ Telefone esta   │    SIM     ┌──────────────────┐                        │
│  │ na lista de     ├───────────►│ NAO vira lead    │                        │
│  │ exclusao?       │            │ (contato interno)│                        │
│  └────────┬────────┘            └──────────────────┘                        │
│           │ NAO                                                             │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Pipeline diario │                                                        │
│  │ (21:00)         │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ Criar/atualizar │                                                        │
│  │ crm_customers   │                                                        │
│  │ crm_opportunities│                                                       │
│  │ (source=vendor) │                                                        │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementacao Necessaria

### Parte 1: Criar Lead quando Resumo e Enviado (Bot)

**Arquivo a modificar:** `supabase/functions/send-lead-to-vendor/index.ts`

Adicionar logica apos enviar o resumo para o vendedor:

```typescript
// Apos registrar em lead_distributions:

// 1. Criar/atualizar crm_customers
const { data: customer } = await supabase
  .from('crm_customers')
  .upsert({
    phone: normalizePhone(conversation.whatsapp_number),
    name: conversation.customer_name,
    city: conversation.customer_city,
    state: conversation.customer_state,
    email: conversation.customer_email,
    source: 'whatsapp',
    conversation_id: conversationId,
    last_interaction_at: new Date().toISOString(),
  }, { onConflict: 'phone' })
  .select('id')
  .single();

// 2. Criar crm_opportunities
await supabase
  .from('crm_opportunities')
  .insert({
    customer_id: customer.id,
    conversation_id: conversationId,
    title: `Oportunidade - ${conversation.product_group || 'Nova'}`,
    source: 'whatsapp',
    product_category: conversation.product_group,
    stage: 'prospecting',
    probability: 20,
    value: 0, // Sera atualizado depois
    validation_status: 'ai_generated',
    temperature: conversation.lead_temperature,
  });

// 3. Atualizar conversations.last_lead_sent_at
await supabase
  .from('conversations')
  .update({ last_lead_sent_at: new Date().toISOString() })
  .eq('id', conversationId);
```

---

### Parte 2: Pipeline Diario para Conversas de Vendedores

**Novo arquivo:** `supabase/functions/process-vendor-opportunities/index.ts`

Este pipeline roda diariamente as 21:00 e:

1. Busca `vendor_conversations` onde `has_opportunity = false` e `is_internal_contact != true`
2. Para cada conversa:
   - Cria/atualiza `crm_customers` baseado no telefone
   - Cria `crm_opportunities` com `vendor_conversation_id`
   - Atualiza `vendor_conversations.has_opportunity = true`

```typescript
// Buscar conversas nao processadas (excluindo internas)
const { data: conversations } = await supabase
  .from('vendor_conversations')
  .select('*')
  .eq('has_opportunity', false)
  .not('metadata->is_internal_contact', 'eq', true);

for (const conv of conversations) {
  // Criar cliente
  const { data: customer } = await supabase
    .from('crm_customers')
    .upsert({
      phone: normalizePhone(conv.customer_phone),
      name: conv.customer_name,
      source: 'vendor_whatsapp',
    }, { onConflict: 'phone' })
    .select('id')
    .single();
  
  // Criar oportunidade
  await supabase
    .from('crm_opportunities')
    .insert({
      customer_id: customer.id,
      vendor_conversation_id: conv.id,
      vendor_id: conv.vendor_id,
      title: `Oportunidade - ${conv.product_category || 'Nova'}`,
      source: 'vendor_whatsapp',
      product_category: conv.product_category,
      stage: 'prospecting',
      validation_status: 'ai_generated',
    });
  
  // Marcar como processado
  await supabase
    .from('vendor_conversations')
    .update({ has_opportunity: true })
    .eq('id', conv.id);
}
```

---

### Parte 3: Agendar Pipeline Diario

**Arquivo a modificar:** `supabase/config.toml`

Adicionar schedule para o novo pipeline:

```toml
[functions.process-vendor-opportunities]
verify_jwt = false
schedule = "0 0 21 * * *"  # Diariamente as 21:00 UTC
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/process-vendor-opportunities/index.ts` | Pipeline diario para processar conversas de vendedores |

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/send-lead-to-vendor/index.ts` | Criar crm_customers e crm_opportunities quando lead e enviado |
| `supabase/config.toml` | Adicionar schedule para process-vendor-opportunities |

---

## Resumo das Regras de Negocio

| Origem | Quando vira Lead no CRM |
|--------|-------------------------|
| Bot Oficial | Apenas quando resumo e enviado para vendedor |
| WhatsApp Vendedor | Todas as conversas, EXCETO contatos na lista de exclusao |

---

## Dados da Lista de Exclusao

A tabela `excluded_contacts` ja esta funcionando:
- 32 contatos marcados como internos em `vendor_conversations`
- Tipos: `employee`, `vendor`, `test`, `supplier`, `partner`, `spam`

---

## Consideracoes Tecnicas

1. **Normalizacao de Telefone**: Usar funcao `normalizePhone` do `_shared/phone-utils.ts` para garantir formato 55XXXXXXXXXXX

2. **Upsert por Telefone**: Usar `onConflict: 'phone'` para evitar duplicatas em `crm_customers`

3. **Idempotencia**: Verificar `has_opportunity` antes de criar para evitar duplicatas

4. **Retroativo**: Apos implementar, rodar uma vez manualmente para processar os 2.542 conversas existentes (excluindo as 32 internas)

