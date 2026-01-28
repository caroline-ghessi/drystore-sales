
# Plano: Marcar Atendimento como Finalizado ao Enviar Lead para Vendedor

## Resumo

Quando um atendente envia o resumo de uma conversa para um vendedor, o atendimento deve ser automaticamente marcado como "finalizado" (status: `closed`).

---

## Análise do Fluxo Atual

```text
+-----------------------+     +---------------------------+     +----------------------------+
| WhatsAppChatArea.tsx  | --> | useSendLeadToVendor hook  | --> | send-lead-to-vendor (Edge) |
| handleSendToVendor()  |     | invokes edge function     |     | Cria CRM records           |
+-----------------------+     +---------------------------+     | Envia via WhatsApp         |
                                                                | NÃO fecha conversa ❌       |
                                                                +----------------------------+
```

Após o envio:
- Lead é registrado na tabela `lead_distributions`
- Cliente é criado/atualizado em `crm_customers`
- Oportunidade é criada em `crm_opportunities`
- Campo `last_lead_sent_at` é atualizado na conversa
- **Conversa permanece com status anterior** (não é fechada)

---

## Solução Proposta

Modificar a edge function `send-lead-to-vendor` para também atualizar o status da conversa para `closed` após o envio bem-sucedido.

### Por que no Backend?

1. **Consistência**: Garante que a regra de negócio seja aplicada independente do cliente
2. **Atomicidade**: Todas as operações ocorrem no mesmo contexto
3. **Menos código duplicado**: Evita ter que modificar múltiplos lugares que usem o hook

---

## Arquivo a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/send-lead-to-vendor/index.ts` | Adicionar update do status para `closed` após envio |

---

## Mudança Técnica

**Arquivo:** `supabase/functions/send-lead-to-vendor/index.ts`

**Local:** Após o bloco 7.3 (atualização de `last_lead_sent_at`), adicionar um novo passo para fechar a conversa.

```typescript
// 7.4 NOVO: Marcar conversa como finalizada
const { error: closeError } = await supabase
  .from('conversations')
  .update({ 
    status: 'closed',
    updated_at: new Date().toISOString(),
    metadata: {
      closed_at: new Date().toISOString(),
      closed_by: sentByAgentId || 'system',
      close_reason: 'lead_sent_to_vendor',
      vendor_id: vendorId,
      vendor_name: vendor.name
    }
  })
  .eq('id', conversationId);

if (closeError) {
  console.error('Erro ao fechar conversa:', closeError);
} else {
  console.log(`Conversa ${conversationId} fechada após envio de lead`);
}
```

---

## Comportamento Esperado

1. Agente clica em "Gerar Resumo"
2. Modal abre com resumo e lista de vendedores
3. Agente seleciona vendedor e clica em "Enviar"
4. Edge function:
   - Envia mensagem via WhatsApp ao vendedor
   - Registra distribuição em `lead_distributions`
   - Cria/atualiza registros no CRM
   - **NOVO**: Marca conversa como `closed`
5. Conversa sai da lista de atendimentos ativos
6. Se cliente enviar nova mensagem, conversa é reativada (já existe edge function `reactivate-conversation`)

---

## Metadata da Conversa Fechada

A conversa fechada terá os seguintes metadados:

| Campo | Valor |
|-------|-------|
| `closed_at` | Timestamp do fechamento |
| `closed_by` | ID do agente ou 'system' |
| `close_reason` | `lead_sent_to_vendor` |
| `vendor_id` | ID do vendedor que recebeu |
| `vendor_name` | Nome do vendedor |

Isso permite rastrear por que a conversa foi fechada e para qual vendedor o lead foi enviado.

---

## Impacto em Outras Funcionalidades

- **Dashboard WhatsApp**: Conversas fechadas não aparecerão na lista ativa
- **Métricas**: Conversões serão contabilizadas corretamente
- **Reativação**: Se o cliente enviar nova mensagem, a conversa será reaberta automaticamente (funcionalidade já existente)
- **Histórico**: A conversa permanece no banco para consulta futura

