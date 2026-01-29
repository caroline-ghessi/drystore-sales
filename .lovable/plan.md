

# Diagnóstico: Oportunidades sem Histórico WhatsApp e sem Vendedor Visível

## Problema Identificado

As oportunidades do CRM estão sendo criadas corretamente, mas a interface não está mostrando:
1. **Histórico de conversas do WhatsApp** - mostra "Nenhuma conversa vinculada"
2. **Identificação do vendedor** - não aparece em lugar nenhum na tela

---

## Causa Raiz

### 1. Histórico WhatsApp Não Aparece

O componente `WhatsAppHistory` busca mensagens da tabela `messages` usando `conversation_id`:

```typescript
// WhatsAppHistory.tsx - linha 12
const { data: messages } = useConversationMessages(conversationId);

// useOpportunityDetail.ts - linhas 128-134
const { data, error } = await supabase
  .from('messages')  // ← Tabela do WhatsApp OFICIAL
  .select('id, content, sender_type, created_at, sender_name')
  .eq('conversation_id', conversationId)
```

**Porém**, as oportunidades criadas via `process-vendor-opportunities` vêm de **WhatsApp individual dos vendedores**, onde:
- `conversation_id = NULL` (não vinculado ao bot oficial)
- `vendor_conversation_id = 534` (vinculado à tabela `vendor_conversations`)

Os dados reais estão em:
- `vendor_conversations` (ID INTEGER)
- `vendor_messages` (com colunas `content`, `from_me`, `from_name`)

### 2. Vendedor Não Aparece na UI

O hook `useOpportunityDetail` já busca o vendedor:

```typescript
vendor:vendors(id, name)  // ← Relacionamento existe
```

Mas **nenhum componente usa** essa informação:
- `NegotiationHeader` não mostra o vendedor
- `CustomerInfo` não mostra o vendedor
- Não existe um componente `VendorInfo`

---

## Dados Atuais (Evidência)

Consulta no banco:
```text
crm_opportunities (exemplo: id=16aaccd7...):
├── vendor_id: bba46988... (Sérgio Nogueira) ✅
├── vendor_conversation_id: 534 ✅
├── conversation_id: NULL ❌ (esperado para vendor_whatsapp)
└── source: 'vendor_whatsapp'
```

Mensagens em `vendor_messages` (conversation_id=534):
```text
├── "Oi, bjs." - from_me: true (Sérgio Nogueira)
├── "Lindão ❤️" - from_me: false (Paula - cliente)
└── ... (mais mensagens existem)
```

---

## Solução Proposta

### Etapa 1: Exibir Nome do Vendedor na UI

**Arquivo:** `src/modules/crm/components/negotiation/NegotiationHeader.tsx`

Adicionar badge com nome do vendedor no cabeçalho:

```typescript
// Adicionar ao retorno do componente
{opportunity?.vendor?.name && (
  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
    <User className="h-3 w-3 mr-1" />
    {opportunity.vendor.name}
  </Badge>
)}
```

### Etapa 2: Criar Hook para Mensagens do Vendedor

**Arquivo:** `src/modules/crm/hooks/useOpportunityDetail.ts`

Adicionar novo hook:

```typescript
export function useVendorConversationMessages(vendorConversationId: number | null | undefined) {
  return useQuery({
    queryKey: ['vendor-conversation-messages', vendorConversationId],
    queryFn: async () => {
      if (!vendorConversationId) return [];

      const { data, error } = await supabase
        .from('vendor_messages')
        .select('id, content, from_me, from_name, created_at')
        .eq('conversation_id', vendorConversationId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!vendorConversationId,
  });
}
```

### Etapa 3: Atualizar WhatsAppHistory para Suportar Ambas as Fontes

**Arquivo:** `src/modules/crm/components/negotiation/WhatsAppHistory.tsx`

```typescript
interface WhatsAppHistoryProps {
  conversationId: string | null | undefined;
  vendorConversationId: number | null | undefined;  // Novo
}

export function WhatsAppHistory({ conversationId, vendorConversationId }: WhatsAppHistoryProps) {
  // Mensagens do bot oficial
  const { data: botMessages, isLoading: loadingBot } = useConversationMessages(conversationId);
  
  // Mensagens do WhatsApp do vendedor
  const { data: vendorMessages, isLoading: loadingVendor } = useVendorConversationMessages(vendorConversationId);
  
  // Combinar e ordenar
  const allMessages = [...(botMessages || []), ...(vendorMessages || [])];
  // ... resto da lógica
}
```

### Etapa 4: Atualizar Tipo OpportunityDetail

**Arquivo:** `src/modules/crm/hooks/useOpportunityDetail.ts`

Adicionar campo:

```typescript
export interface OpportunityDetail {
  // ... campos existentes
  vendor_conversation_id: number | null;  // Novo
}
```

E na query:

```typescript
.select(`
  ...
  vendor_conversation_id,  // Adicionar
  ...
`)
```

### Etapa 5: Passar Dados na Página

**Arquivo:** `src/modules/crm/pages/NegotiationDetail.tsx`

```typescript
<WhatsAppHistory 
  conversationId={opportunity.conversation_id} 
  vendorConversationId={opportunity.vendor_conversation_id}  // Novo
/>
```

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/modules/crm/hooks/useOpportunityDetail.ts` | Adicionar `vendor_conversation_id` e hook `useVendorConversationMessages` |
| `src/modules/crm/components/negotiation/WhatsAppHistory.tsx` | Suportar mensagens de `vendor_messages` |
| `src/modules/crm/components/negotiation/NegotiationHeader.tsx` | Mostrar nome do vendedor |
| `src/modules/crm/pages/NegotiationDetail.tsx` | Passar `vendorConversationId` para o componente |

---

## Resultado Esperado

Após implementação:

1. **Vendedor visível**: Badge "Sérgio Nogueira" no cabeçalho
2. **Histórico WhatsApp**: Mensagens da conversa do vendedor aparecerão
3. **Compatibilidade**: Oportunidades do bot oficial (com `conversation_id`) continuam funcionando

---

## Diagrama do Fluxo de Dados

```text
┌─────────────────────────────────────────────────────────────────┐
│                     crm_opportunities                           │
├─────────────────────────────────────────────────────────────────┤
│ Origem: Bot Oficial          │ Origem: WhatsApp Vendedor       │
├──────────────────────────────┼──────────────────────────────────┤
│ conversation_id: UUID ✓      │ conversation_id: NULL           │
│ vendor_conversation_id: NULL │ vendor_conversation_id: INT ✓   │
│ source: 'whatsapp'           │ source: 'vendor_whatsapp'       │
├──────────────────────────────┼──────────────────────────────────┤
│        ↓                     │        ↓                        │
│  Buscar em: messages         │  Buscar em: vendor_messages     │
│  (tabela do bot oficial)     │  (tabela dos vendedores)        │
└──────────────────────────────┴──────────────────────────────────┘
```

