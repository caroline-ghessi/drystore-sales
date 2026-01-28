

# Plano: Melhorar Kanban com @dnd-kit

## Resumo

Implementar drag-and-drop no Kanban de Pipeline usando a biblioteca @dnd-kit, seguindo o modelo do 21st.dev. Isso permitira arrastar oportunidades entre os estagios do pipeline de forma intuitiva.

---

## Estrutura Visual com Drag-and-Drop

```text
+-----------------------------------------------------------------------+
|  Pipeline de Vendas                     [Kanban] [Lista] [Filtros]    |
+-----------------------------------------------------------------------+
|                                                                       |
|  [Prospecção]      [Qualificação]     [Proposta]       [Negociação]   |
|  +-------------+   +-------------+   +-------------+   +-------------+ |
|  | Card 1    ←|   | Card A      |   | Card X      |   | Card Y      | |
|  |   (drag)   |   |             |   |             |   |             | |
|  +-------------+   +-------------+   +-------------+   +-------------+ |
|  | Card 2      |   |             |   |             |   |             | |
|  +-------------+   |  ↓ drop     |   |             |   |             | |
|                    |   here      |   |             |   |             | |
|                    +-------------+   +-------------+   +-------------+ |
|  Total: R$ 50k     Total: R$ 30k     Total: R$ 80k     Total: R$ 120k |
+-----------------------------------------------------------------------+
```

---

## Dependencia a Instalar

| Pacote | Descricao |
|--------|-----------|
| `@dnd-kit/core` | Nucleo da biblioteca de drag-and-drop |

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/ui/kanban.tsx` | Componentes base do Kanban (KanbanProvider, KanbanBoard, KanbanCard, KanbanCards, KanbanHeader) |

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/modules/crm/components/pipeline/PipelineKanban.tsx` | Integrar KanbanProvider e DndContext com handler onDragEnd |
| `src/modules/crm/components/pipeline/KanbanColumn.tsx` | Usar KanbanBoard para area droppable |
| `src/modules/crm/components/pipeline/OpportunityCard.tsx` | Usar KanbanCard para tornar draggable |

---

## Implementacao

### 1. Componente kanban.tsx (UI Component)

Criar componentes reutilizaveis baseados no modelo 21st.dev:

```tsx
// KanbanProvider - Wrapper com DndContext
// KanbanBoard - Area droppable (coluna)
// KanbanCard - Card draggable
// KanbanCards - Container de cards
// KanbanHeader - Cabecalho da coluna
```

Caracteristicas:
- `KanbanProvider`: Envolve todo o Kanban com DndContext
- `KanbanBoard`: Usa useDroppable para detectar drops, destaca quando `isOver`
- `KanbanCard`: Usa useDraggable, aplica transform durante arrasto
- Visual feedback: Opacidade reduzida durante drag, fundo destacado durante hover

### 2. PipelineKanban.tsx - Integracao DnD

```tsx
import { KanbanProvider } from '@/components/ui/kanban';
import { useUpdateOpportunityStage } from '../../hooks/useOpportunities';

export function PipelineKanban() {
  const updateStage = useUpdateOpportunityStage();
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const opportunityId = active.id as string;
    const newStage = over.id as OpportunityStage;
    const currentStage = active.data.current?.parent;
    
    if (currentStage !== newStage) {
      updateStage.mutate({ opportunityId, newStage });
    }
  };
  
  return (
    <KanbanProvider onDragEnd={handleDragEnd}>
      {/* columns */}
    </KanbanProvider>
  );
}
```

### 3. KanbanColumn.tsx - Droppable Area

```tsx
import { KanbanBoard, KanbanCards, KanbanHeader } from '@/components/ui/kanban';

export function KanbanColumn({ stage, opportunities, ... }) {
  return (
    <KanbanBoard id={stage}>
      <KanbanHeader name={config.label} color={config.color} />
      <KanbanCards>
        {opportunities.map((opp, index) => (
          <DraggableOpportunityCard 
            key={opp.id}
            opportunity={opp}
            index={index}
            parent={stage}
          />
        ))}
      </KanbanCards>
      <KanbanFooter total={totalValue} />
    </KanbanBoard>
  );
}
```

### 4. OpportunityCard.tsx - Draggable Card

Criar wrapper que combina KanbanCard com conteudo existente:

```tsx
import { KanbanCard } from '@/components/ui/kanban';

export function DraggableOpportunityCard({ opportunity, index, parent }) {
  return (
    <KanbanCard 
      id={opportunity.id} 
      name={opportunity.title}
      index={index}
      parent={parent}
    >
      <OpportunityCardContent {...props} />
    </KanbanCard>
  );
}
```

---

## Estilos Visuais

| Estado | Estilo |
|--------|--------|
| Normal | Card com borda padrao |
| Arrastando | `opacity-50`, `ring-2 ring-primary` |
| Sobre coluna | Coluna com `bg-muted/50` |
| Posicionamento | `transform` aplicado durante drag |

---

## Fluxo de Dados

```text
1. Usuario arrasta card
2. DndContext detecta movimento
3. onDragEnd recebe { active, over }
4. Se over.id !== active.data.parent:
   - Chamar updateStage.mutate()
   - Supabase atualiza crm_opportunities.stage
   - React Query invalida cache
   - UI atualiza automaticamente
```

---

## Ordem de Implementacao

| Passo | Acao |
|-------|------|
| 1 | Instalar @dnd-kit/core |
| 2 | Criar src/components/ui/kanban.tsx |
| 3 | Atualizar PipelineKanban.tsx com KanbanProvider |
| 4 | Atualizar KanbanColumn.tsx com KanbanBoard |
| 5 | Criar DraggableOpportunityCard integrando KanbanCard |
| 6 | Testar drag-and-drop entre colunas |

---

## Comportamentos

| Acao | Resultado |
|------|-----------|
| Arrastar card | Card segue cursor com transform |
| Soltar em coluna diferente | Atualiza stage no banco |
| Soltar na mesma coluna | Nenhuma acao (mesma posicao) |
| Soltar fora de coluna | Card volta a posicao original |
| Click no card (sem arrastar) | Navega para detalhes |

---

## Acessibilidade

- KanbanCard com aria-pressed para estado arrastando
- Cores de contraste mantidas durante drag
- Focus visible em cards e colunas

