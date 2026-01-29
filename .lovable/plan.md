
# Plano: Adicionar Opcao de Deletar Negociacoes no Pipeline

## Resumo

Adicionar um botao de exclusao em cada card de oportunidade no Kanban, com confirmacao via dialog para evitar exclusoes acidentais.

---

## Abordagem

A opcao de deletar sera adicionada como um icone de lixeira no canto superior direito de cada card. Ao clicar, um dialog de confirmacao sera exibido antes de executar a exclusao.

---

## Arquivos a Modificar/Criar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/modules/crm/hooks/useOpportunities.ts` | Modificar | Adicionar hook `useDeleteOpportunity` |
| `src/modules/crm/hooks/index.ts` | Modificar | Exportar o novo hook |
| `src/modules/crm/components/pipeline/OpportunityCard.tsx` | Modificar | Adicionar botao de delete com dialog |

---

## Detalhes Tecnicos

### 1. Hook useDeleteOpportunity

Adicionar ao arquivo `useOpportunities.ts`:

```typescript
export function useDeleteOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opportunityId: string) => {
      const { error } = await supabase
        .from('crm_opportunities')
        .delete()
        .eq('id', opportunityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
    },
  });
}
```

### 2. Modificar OpportunityCard.tsx

Adicionar:
- Prop `onDelete?: () => void`
- Icone de lixeira (Trash2) no header do card
- AlertDialog para confirmacao

**Estrutura visual do card modificado:**

```text
+----------------------------------------+
| [Novo] Cliente Nome    [X]    2h       |
| Titulo do Projeto                      |
| Descricao...                           |
| [Proximo passo badge]                  |
|----------------------------------------|
| R$ 15k           [Validar] ou [Avatar] |
+----------------------------------------+

O [X] e o botao de delete com icone Trash2
```

**Codigo do botao de delete:**

```typescript
// No header, apos o timeAgo
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
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Excluir negociacao?</AlertDialogTitle>
        <AlertDialogDescription>
          Esta acao nao pode ser desfeita. A negociacao "{customerName}" sera 
          permanentemente removida do sistema.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
```

### 3. Propagar Delete pelos Componentes

**DraggableOpportunityCard.tsx:**
- Adicionar prop `onDelete: () => void`
- Passar para OpportunityCard

**KanbanColumn.tsx:**
- Adicionar prop `onDelete?: (opportunity: Opportunity) => void`
- Passar para DraggableOpportunityCard

**PipelineKanban.tsx:**
- Importar e usar `useDeleteOpportunity`
- Implementar handler que chama a mutacao
- Exibir toast de sucesso/erro

---

## Fluxo de Interacao

```text
Usuario clica no icone de lixeira
           |
           v
    Dialog de confirmacao aparece
    "Excluir negociacao?"
           |
    +------+------+
    |             |
 Cancelar      Excluir
    |             |
    v             v
 Fecha       Chama useDeleteOpportunity
 dialog            |
                   v
              DELETE no Supabase
                   |
                   v
              Invalida cache
              Toast "Negociacao excluida"
```

---

## Imports Necessarios

**OpportunityCard.tsx:**
```typescript
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
```

---

## Consideracoes de UX

1. **Icone discreto**: Trash2 pequeno (h-3 w-3) para nao poluir visualmente
2. **Hover vermelho**: Indica acao destrutiva ao passar o mouse
3. **Confirmacao obrigatoria**: Evita exclusoes acidentais
4. **stopPropagation**: Evita abrir detalhes da oportunidade ao clicar no delete
5. **Toast feedback**: Usuario sabe que a acao foi completada

---

## Resultado Esperado

Apos implementacao, cada card tera um icone de lixeira que permite exclusao com confirmacao, mantendo a interface limpa e segura.
