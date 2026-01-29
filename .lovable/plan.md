
# Plano: Corrigir Visibilidade do Botao Delete (Causa Raiz Identificada)

## Problema Real Identificado

Apos investigacao profunda, descobri que o problema esta no **ScrollArea do Radix UI**. Quando a coluna tem muitos cards (como Prospecção com 999), a scrollbar vertical e ativada e o viewport interno reduz a largura disponivel para os cards.

### Diferenca entre colunas:
| Coluna | Cards | Scrollbar | Largura disponivel |
|--------|-------|-----------|-------------------|
| Prospecção | 999 | Ativa (vertical) | Reduzida (~268px) |
| Qualificação | 1 | Inativa | Total (~280px) |

O problema nao e no CSS do header do card (que ja foi modificado corretamente), mas sim que os **cards na coluna com scrollbar tem menos largura** e o layout esta estourando.

## Solucao

Modificar o KanbanColumn para garantir que os cards tenham largura minima adequada, independente da scrollbar, e adicionar `overflow-hidden` no container dos cards.

---

## Arquivos a Modificar

### 1. `src/modules/crm/components/pipeline/KanbanColumn.tsx`

**Mudanca**: Adicionar classe de largura minima ao container interno do ScrollArea.

```tsx
// Antes (linha 77):
<div className="p-2 space-y-2">

// Depois:
<div className="p-2 space-y-2 min-w-0">
```

### 2. `src/modules/crm/components/pipeline/OpportunityCard.tsx`

**Mudanca**: Remover a logica de `maxWidth` calculado que nao funcionou e usar uma abordagem diferente - CSS Grid ou estrutura de duas linhas.

**Opção A - Separar linha do nome e linha das acoes:**

Em vez de forçar tudo na mesma linha, separar o layout:
- Linha 1: Badge Novo + Nome do cliente
- Linha 2: Lixeira + Tempo (alinhados a direita)

**Opção B - Usar CSS Grid com colunas fixas:**

```tsx
<div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
  {isNew && <Badge>Novo</Badge>}
  <span className="truncate">{customerName}</span>
  <div className="flex items-center gap-1">
    {onDelete && (/* lixeira */)}
    <span>{timeAgo}</span>
  </div>
</div>
```

---

## Solucao Recomendada (Opção B - CSS Grid)

O CSS Grid garante que as 3 colunas (badge, nome, acoes) respeitem seus tamanhos sem overflow.

### Codigo Completo da Mudanca no OpportunityCard.tsx

```tsx
{/* Line 1: Badge novo (optional) + Customer name + Delete + Time */}
<div className="grid items-center gap-2" style={{ gridTemplateColumns: isNew ? 'auto 1fr auto' : '1fr auto' }}>
  {isNew && (
    <Badge className="bg-primary text-primary-foreground text-xs font-medium px-1.5 py-0 h-5">
      Novo
    </Badge>
  )}
  
  <span className="font-semibold text-sm text-foreground truncate overflow-hidden">
    {customerName}
  </span>
  
  <div className="flex items-center gap-1">
    {onDelete && (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </AlertDialogTrigger>
        {/* ... resto do dialog ... */}
      </AlertDialog>
    )}
    
    <span className="text-xs text-muted-foreground whitespace-nowrap">
      {timeAgo}
    </span>
  </div>
</div>
```

---

## Por que CSS Grid Funciona

1. **`auto`**: O badge "Novo" ocupa apenas o espaco necessario
2. **`1fr`**: O nome ocupa o espaco restante E trunca quando necessario
3. **`auto`**: As acoes (delete + tempo) ocupam apenas o necessario e NUNCA sao cortadas

O Grid CSS garante que cada coluna respeite seu tamanho sem ser afetada por overflow de outras colunas.

---

## Mudancas Resumidas

| Arquivo | Linha(s) | Mudanca |
|---------|----------|---------|
| `OpportunityCard.tsx` | 77-138 | Trocar Flexbox por CSS Grid |
| `KanbanColumn.tsx` | 77 | Adicionar `min-w-0 overflow-hidden` |

---

## Resultado Esperado

- Botao de delete (lixeira) visivel em TODAS as etapas
- Timestamp visivel em todos os cards
- Layout funciona corretamente com ou sem scrollbar
- Nome do cliente trunca adequadamente
