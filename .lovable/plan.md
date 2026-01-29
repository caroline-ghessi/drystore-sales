

# Plano: Corrigir Visibilidade do Botao Delete em Prospecção

## Problema Identificado

O botao de delete (lixeira) e o timestamp nao aparecem nos cards da etapa "Prospecção", mas aparecem corretamente nas demais etapas (Qualificação, Proposta, etc.).

Analisando a imagem fornecida:
- **Prospecção (999 cards)**: Nenhum card mostra lixeira ou tempo
- **Qualificação (1 card)**: Card mostra lixeira e "22 minutos"

## Causa Raiz

O problema e de layout CSS. O `ScrollArea` do Radix UI, quando tem muitos itens, pode estar afetando a largura disponivel para os cards internos. O viewport interno (`ScrollAreaPrimitive.Viewport`) tem `w-full` que pode nao estar respeitando a largura minima necessaria quando ha scroll vertical.

O layout atual do header do card usa:
```
flex container
  -> Badge "Novo" (shrink-0)
  -> Div nome (flex-1 min-w-0 overflow-hidden)
  -> Div acoes (shrink-0 com delete + time)
```

Quando o container do card tem largura restrita (devido ao ScrollArea viewport), os elementos com `shrink-0` podem ser empurrados para fora se o `flex-1` tiver prioridade errada.

## Solucao

Modificar o layout do header do card para garantir que os elementos de acao SEMPRE tenham prioridade de exibicao, usando uma abordagem de CSS Grid ou forçando a largura maxima do nome.

---

## Arquivo a Modificar

**`src/modules/crm/components/pipeline/OpportunityCard.tsx`**

### Mudanca: Usar max-width calculado no nome

Em vez de confiar apenas em `flex-1 min-w-0`, forcar uma largura maxima calculada no nome do cliente para garantir que sempre sobre espaco para a lixeira e o tempo.

**De:**
```tsx
<div className="flex items-center gap-2 overflow-hidden">
  {isNew && (
    <Badge className="... shrink-0">Novo</Badge>
  )}
  
  <div className="flex-1 min-w-0 overflow-hidden">
    <span className="... block truncate">{customerName}</span>
  </div>
  
  <div className="flex items-center gap-1 shrink-0">
    {onDelete && (...)}
    <span>{timeAgo}</span>
  </div>
</div>
```

**Para:**
```tsx
<div className="flex items-center gap-2 w-full">
  {isNew && (
    <Badge className="... shrink-0">Novo</Badge>
  )}
  
  {/* Nome com largura maxima para garantir espaco para acoes */}
  <span 
    className="font-semibold text-sm text-foreground truncate"
    style={{ flex: '1 1 0', minWidth: 0, maxWidth: isNew ? 'calc(100% - 120px)' : 'calc(100% - 80px)' }}
  >
    {customerName}
  </span>
  
  {/* Acoes com ml-auto para alinhar a direita */}
  <div className="flex items-center gap-1 ml-auto shrink-0">
    {onDelete && (...)}
    <span>{timeAgo}</span>
  </div>
</div>
```

---

## Codigo Completo da Primeira Linha Refatorada

```tsx
{/* Line 1: Badge novo (optional) + Customer name + Delete + Time */}
<div className="flex items-center gap-2 w-full">
  {isNew && (
    <Badge className="bg-primary text-primary-foreground text-xs font-medium px-1.5 py-0 h-5 shrink-0">
      Novo
    </Badge>
  )}
  
  {/* Nome do cliente com largura maxima calculada */}
  <span 
    className="font-semibold text-sm text-foreground truncate"
    style={{ 
      flex: '1 1 0', 
      minWidth: 0, 
      maxWidth: isNew ? 'calc(100% - 130px)' : 'calc(100% - 90px)' 
    }}
  >
    {customerName}
  </span>
  
  {/* Actions container - SEMPRE visível com ml-auto */}
  <div className="flex items-center gap-1 ml-auto shrink-0">
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

## Por que Esta Solução Funciona

1. **`w-full` no container**: Garante que o container ocupe toda a largura disponível
2. **`ml-auto` nas ações**: Empurra o container de ações para a extrema direita, garantindo que sempre fique visível
3. **`maxWidth` calculado dinamicamente**: Limita o nome do cliente a uma largura máxima que deixa espaço suficiente para a lixeira e o tempo
   - Com badge "Novo": `calc(100% - 130px)` (40px badge + 20px gap + 20px lixeira + 50px tempo)
   - Sem badge "Novo": `calc(100% - 90px)` (20px lixeira + 50px tempo + margem)
4. **`shrink-0` nas ações**: Impede que o container de ações encolha

---

## Resultado Esperado

Apos a implementacao:
- Botao de delete (lixeira) visivel em TODAS as etapas, incluindo Prospecção
- Timestamp visível em todos os cards
- Nome do cliente trunca corretamente quando muito longo
- Layout consistente independente da quantidade de cards na coluna

