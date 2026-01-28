
# Plano: Remover Página /whatsapp/leads-quentes

## Resumo

Remover a página de "Leads Quentes" do módulo WhatsApp, incluindo o arquivo da página e todas as referências na navegação.

---

## Arquivos a Modificar/Remover

| Arquivo | Ação |
|---------|------|
| `src/modules/whatsapp/pages/LeadsQuentes.tsx` | **REMOVER** |
| `src/modules/whatsapp/components/layout/WhatsAppLayout.tsx` | Remover rota e import |
| `src/modules/whatsapp/components/layout/WhatsAppSidebar.tsx` | Remover item do menu |
| `src/components/layout/Sidebar.tsx` | Remover item do menu |

---

## Mudanças Detalhadas

### 1. Remover Arquivo
**Arquivo:** `src/modules/whatsapp/pages/LeadsQuentes.tsx`
- Deletar completamente (558 linhas)

### 2. WhatsAppLayout.tsx
**Remover import e rota:**
```typescript
// REMOVER import:
import LeadsQuentes from '@/modules/whatsapp/pages/LeadsQuentes';

// REMOVER rota (linha 33):
<Route path="leads-quentes" element={<LeadsQuentes />} />
```

### 3. WhatsAppSidebar.tsx
**Remover item do menu (linha 13):**
```typescript
// REMOVER:
{ title: 'Leads Quentes', url: '/whatsapp/leads-quentes', icon: Flame },
```

### 4. Sidebar.tsx (principal)
**Remover item do menu (linhas 79-82):**
```typescript
// REMOVER:
{
  title: 'Leads Quentes',
  url: '/whatsapp/leads-quentes',
  icon: Flame,
  badge: hotLeads,
},
```

---

## Verificação de Dependências

O hook `useHotLeads` usado apenas nesta página permanecerá no projeto pois pode ser usado futuramente por outras funcionalidades. Não há outras páginas ou componentes que dependam especificamente de `LeadsQuentes.tsx`.

---

## Nota Importante

A página `/crm/leads-quentes` (Insights IA) do módulo CRM **NÃO será afetada** - são páginas diferentes em módulos diferentes.
