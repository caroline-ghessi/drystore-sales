

# Plano: Implementar "Ver Conversa Completa" no CRM

## Problema Atual

O botao "Ver Conversa Completa" no componente `WhatsAppHistory.tsx` (linha 71-74) nao tem nenhuma acao vinculada - e apenas visual:

```typescript
<Button variant="link" size="sm" className="gap-1 text-primary">
  Ver Conversa Completa
  <ExternalLink className="h-3 w-3" />
</Button>
```

## Solucao Proposta

Criar um **Dialog/Modal** que exibe todas as mensagens da conversa, reutilizando componentes existentes do modulo WhatsApp. Isso mantem o usuario no contexto do CRM.

---

## Arquivos a Criar

### 1. `src/modules/crm/components/negotiation/FullConversationDialog.tsx`

Dialog que exibe a conversa completa usando:
- `useVendorMessages` hook existente (busca ate 200 mensagens)
- `VendorMessageBubble` componente existente para renderizar mensagens
- Suporte para mensagens do bot oficial (conversation_id) e vendor (vendor_conversation_id)

Estrutura do componente:

```text
+------------------------------------------+
|  Conversa com [Nome do Cliente]     [X] |
|  Vendedor: [Nome do Vendedor]           |
+------------------------------------------+
|                                          |
|  [Lista de mensagens em scroll]          |
|  - Mensagens do cliente (esquerda)       |
|  - Mensagens do vendedor (direita)       |
|  - Suporte a imagens, audio, video, docs |
|                                          |
+------------------------------------------+
|  Total: X mensagens                      |
+------------------------------------------+
```

### 2. Hook de mensagens completas (opcional)

Reutilizar `useVendorMessages` existente que ja busca 200 mensagens.

---

## Arquivos a Modificar

### 1. `src/modules/crm/components/negotiation/WhatsAppHistory.tsx`

| Linha | Mudanca |
|-------|---------|
| 1-6 | Adicionar imports (useState, Dialog) |
| 13 | Adicionar props `customerName` e `vendorName` |
| 71-74 | Adicionar onClick para abrir dialog e passar dados |
| 103 | Adicionar componente FullConversationDialog |

Mudancas especificas:

```typescript
// Novos imports
import { useState } from 'react';
import { FullConversationDialog } from './FullConversationDialog';

// Novas props
interface WhatsAppHistoryProps {
  conversationId: string | null | undefined;
  vendorConversationId: number | null | undefined;
  customerName?: string;  // Novo
  vendorName?: string;    // Novo
}

// Estado para dialog
const [isDialogOpen, setIsDialogOpen] = useState(false);

// Botao com onClick
<Button 
  variant="link" 
  size="sm" 
  className="gap-1 text-primary"
  onClick={() => setIsDialogOpen(true)}
>
  Ver Conversa Completa
  <ExternalLink className="h-3 w-3" />
</Button>

// Dialog no final
<FullConversationDialog
  open={isDialogOpen}
  onOpenChange={setIsDialogOpen}
  vendorConversationId={vendorConversationId}
  conversationId={conversationId}
  customerName={customerName}
  vendorName={vendorName}
/>
```

### 2. `src/modules/crm/pages/NegotiationDetail.tsx`

| Linha | Mudanca |
|-------|---------|
| 156-159 | Adicionar props customerName e vendorName ao WhatsAppHistory |

```typescript
<WhatsAppHistory 
  conversationId={opportunity.conversation_id} 
  vendorConversationId={opportunity.vendor_conversation_id}
  customerName={opportunity.customer?.name}  // Novo
  vendorName={opportunity.vendor?.name}      // Novo
/>
```

---

## Reutilizacao de Componentes Existentes

| Componente | Localizacao | Uso |
|------------|-------------|-----|
| `VendorMessageBubble` | `src/modules/whatsapp/components/vendor/` | Renderizar cada mensagem |
| `useVendorMessages` | `src/modules/whatsapp/hooks/` | Buscar mensagens do vendedor |
| `useConversationMessages` | `src/modules/crm/hooks/useOpportunityDetail.ts` | Buscar mensagens do bot |
| `Dialog` | `@/components/ui/dialog` | Container do modal |
| `ScrollArea` | `@/components/ui/scroll-area` | Area scrollavel |

---

## Fluxo de Dados

```text
NegotiationDetail
    |
    +-- opportunity.vendor_conversation_id (INTEGER)
    +-- opportunity.conversation_id (UUID ou NULL)
    +-- opportunity.customer?.name
    +-- opportunity.vendor?.name
    |
    v
WhatsAppHistory
    |
    +-- [Clique em "Ver Conversa Completa"]
    |
    v
FullConversationDialog
    |
    +-- useVendorMessages(vendor_conversation_id) -> vendor_messages (200 msgs)
    +-- useConversationMessages(conversation_id) -> messages (bot oficial)
    |
    v
VendorMessageBubble (para cada mensagem)
```

---

## Comportamento do Dialog

1. **Origem Vendedor** (vendor_conversation_id preenchido):
   - Busca mensagens de `vendor_messages`
   - Usa `VendorMessageBubble` para renderizar
   - Mostra ate 200 mensagens

2. **Origem Bot Oficial** (conversation_id preenchido):
   - Busca mensagens de `messages`
   - Adapta para formato do `VendorMessageBubble`
   - Limite similar

3. **Ambas as origens**:
   - Combina e ordena por timestamp
   - Indica visualmente a origem de cada mensagem

---

## Resultado Esperado

Ao clicar em "Ver Conversa Completa":

1. Abre um dialog modal centralizado
2. Mostra header com nome do cliente e vendedor
3. Lista todas as mensagens (ate 200) em ordem cronologica
4. Suporte a todos os tipos de midia (imagem, audio, video, documento)
5. Scroll automatico e area scrollavel
6. Botao de fechar no canto superior direito

