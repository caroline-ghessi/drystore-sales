
# Plano: Garantir Visibilidade do Botão Delete em Todas as Etapas

## Problema Real Identificado

Analisando a imagem, percebi que na coluna **Prospecção**, os cards não mostram nem a lixeira NEM o `timeAgo`, enquanto na coluna **Qualificação** ambos aparecem. Isso indica que o problema não é específico do botão de delete, mas sim que **todos os elementos à direita estão sendo cortados**.

### Comparação Visual
| Coluna | Resultado |
|--------|-----------|
| Prospecção | `[Novo] Kevin LMN` - SEM lixeira, SEM tempo |
| Qualificação | `[Novo] Arthur Madruga [🗑️] menos de um minu...` |

## Causa Raiz

O layout flexbox com `flex-1 truncate` no nome do cliente está comprimindo excessivamente o container dos elementos à direita (delete + timeAgo), apesar do `shrink-0`.

A diferença entre as colunas pode estar relacionada à largura do card ou ao número de caracteres do nome.

## Solução Proposta

Refatorar o layout do header do card para usar uma estrutura mais robusta que garante espaço mínimo para os elementos de ação.

---

## Arquivo a Modificar

**`src/modules/crm/components/pipeline/OpportunityCard.tsx`**

### Mudança: Usar Grid ou Estrutura Mais Robusta

Trocar o layout flexbox por grid, ou usar `max-width` no nome do cliente para garantir espaço.

**De (linhas 76-129):**
```tsx
<div className="flex items-center gap-2">
  {isNew && (...)}
  <span className="... flex-1 truncate min-w-0">
    {customerName}
  </span>
  <div className="flex items-center gap-1 shrink-0">
    {onDelete && (...)}
    <span>...</span>
  </div>
</div>
```

**Para:**
```tsx
<div className="flex items-center gap-2">
  {isNew && (
    <Badge className="... shrink-0">Novo</Badge>
  )}
  
  {/* Customer name com max-width calculado */}
  <span className="font-semibold text-sm text-foreground truncate" 
        style={{ maxWidth: 'calc(100% - 80px)' }}>
    {customerName}
  </span>
  
  {/* Actions container - SEMPRE visível */}
  <div className="ml-auto flex items-center gap-1 shrink-0">
    {onDelete && (
      <AlertDialog>...</AlertDialog>
    )}
    <span className="text-xs text-muted-foreground whitespace-nowrap">
      {timeAgo}
    </span>
  </div>
</div>
```

### Alternativa: Usar Overflow Hidden no Container + Width Fixo

```tsx
<div className="flex items-center gap-2 overflow-hidden">
  {isNew && (<Badge className="shrink-0">Novo</Badge>)}
  
  <div className="flex-1 min-w-0 overflow-hidden">
    <span className="font-semibold text-sm text-foreground block truncate">
      {customerName}
    </span>
  </div>
  
  {/* Ações com width mínimo garantido */}
  <div className="flex items-center gap-1 shrink-0 min-w-[60px]">
    {onDelete && (<AlertDialog>...</AlertDialog>)}
    <span className="text-xs text-muted-foreground whitespace-nowrap">
      {timeAgo}
    </span>
  </div>
</div>
```

---

## Código Completo da Primeira Linha Refatorada

```tsx
{/* Line 1: Badge novo (optional) + Customer name + Delete + Time */}
<div className="flex items-center gap-2 overflow-hidden">
  {isNew && (
    <Badge className="bg-primary text-primary-foreground text-xs font-medium px-1.5 py-0 h-5 shrink-0">
      Novo
    </Badge>
  )}
  
  {/* Container para o nome - permite truncar */}
  <div className="flex-1 min-w-0 overflow-hidden">
    <span className="font-semibold text-sm text-foreground block truncate">
      {customerName}
    </span>
  </div>
  
  {/* Actions container - SEMPRE visível com min-width */}
  <div className="flex items-center gap-1 shrink-0">
    {/* Delete button */}
    {onDelete && (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-destructive"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir negociação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A negociação de "{customerName}" será 
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

## Mudanças Chave

1. **Envolver `customerName` em um `<div>` separado** com `flex-1 min-w-0 overflow-hidden`
2. **Mudar o `<span>` do nome para `block truncate`** ao invés de inline
3. **Container de ações com `shrink-0`** sem `flex-1` para garantir que nunca encolha

---

## Resultado Esperado

- Botão de delete visível em TODAS as etapas
- `timeAgo` visível em todos os cards
- Nome do cliente trunca quando necessário
- Layout consistente independente do comprimento do nome
