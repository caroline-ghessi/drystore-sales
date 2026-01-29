

# Plano: Corrigir Visibilidade do Botao Delete na Etapa Prospeccao

## Problema Identificado

O botao de delete (icone de lixeira) nao aparece nos cards da etapa "Prospeccao", mas funciona corretamente nas demais etapas.

## Causa Raiz

Analisando o codigo do `OpportunityCard.tsx`, a estrutura da primeira linha do card e:

```
[Badge Novo] + [Nome do Cliente (flex-1 truncate)] + [Botao Delete] + [Tempo]
```

Na etapa de prospeccao, os cards frequentemente tem:
1. Badge "Novo" visivel (quando `isNew = true`)
2. Badge do botao "Validar" no footer

O problema visual ocorre porque:
- O `customerName` tem `flex-1` que ocupa todo o espaco disponivel
- Quando o badge "Novo" esta presente, o espaco remanescente e reduzido
- O botao de delete (`h-5 w-5`) fica muito pequeno e pode ser cortado pelo overflow

## Solucao Proposta

Reorganizar a estrutura visual do header para garantir que o botao de delete sempre tenha espaco suficiente, independente dos outros elementos.

---

## Arquivo a Modificar

**`src/modules/crm/components/pipeline/OpportunityCard.tsx`**

### Mudanca: Reorganizar Layout do Header

**Antes (linhas 77-127):**
```tsx
<div className="flex items-center gap-2">
  {isNew && (<Badge>Novo</Badge>)}
  <span className="flex-1 truncate">{customerName}</span>
  {onDelete && (<AlertDialog>...</AlertDialog>)}
  <span>{timeAgo}</span>
</div>
```

**Depois:**
```tsx
<div className="flex items-center gap-2">
  {isNew && (<Badge>Novo</Badge>)}
  <span className="flex-1 truncate min-w-0">{customerName}</span>
  <div className="flex items-center gap-1 shrink-0">
    {onDelete && (<AlertDialog>...</AlertDialog>)}
    <span>{timeAgo}</span>
  </div>
</div>
```

### Detalhes das Mudancas

1. **Adicionar `min-w-0`** ao nome do cliente
   - Permite que o truncate funcione corretamente dentro de flex containers

2. **Agrupar delete + tempo em um `<div>` com `shrink-0`**
   - Garante que estes elementos nunca encolham
   - O botao de delete e o tempo sempre terao espaco

3. **Usar `gap-1`** entre delete e tempo
   - Reduz espaco entre eles para caber melhor

---

## Codigo Completo da Secao Modificada

```tsx
{/* Line 1: Badge novo (optional) + Customer name + Delete + Time */}
<div className="flex items-center gap-2">
  {isNew && (
    <Badge className="bg-primary text-primary-foreground text-xs font-medium px-1.5 py-0 h-5 shrink-0">
      Novo
    </Badge>
  )}
  <span className="font-semibold text-sm text-foreground flex-1 truncate min-w-0">
    {customerName}
  </span>
  
  <div className="flex items-center gap-1 shrink-0">
    {/* Delete button */}
    {onDelete && (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir negociacao?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. A negociacao de "{customerName}" sera 
              permanentemente removida do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )}
    
    <span className="text-xs text-muted-foreground whitespace-nowrap">
      {timeAgo}
    </span>
  </div>
</div>
```

---

## Resumo das Mudancas CSS

| Elemento | Antes | Depois |
|----------|-------|--------|
| Badge "Novo" | sem shrink-0 | `shrink-0` |
| Customer name | `flex-1 truncate` | `flex-1 truncate min-w-0` |
| Delete + Time | elementos separados | agrupados em div com `shrink-0` |

---

## Resultado Esperado

Apos a correcao:
- Botao de delete visivel em TODAS as etapas do pipeline
- Layout consistente independente do tamanho do nome do cliente
- Badge "Novo" nao interfere na visibilidade do botao delete
- Comportamento responsivo mantido para cards de diferentes larguras

