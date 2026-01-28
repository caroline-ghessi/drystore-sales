

# Plano: Reformular Pagina Agenda com Novo Componente EventManager

## Resumo

Substituir todos os componentes atuais da pagina `/crm/agenda` pelo novo componente `EventManager` fornecido, que oferece uma experiencia de calendario mais rica com:
- 4 visualizacoes (Mes, Semana, Dia, Lista)
- Drag-and-drop de eventos
- Sistema de filtros por cor, tags e categorias
- Dialog completo para criar/editar eventos
- Busca de eventos
- Visual moderno com hover effects

---

## Estrutura Atual vs Nova

```text
ATUAL                                    NOVO (EventManager)
+----------------------------------+     +----------------------------------+
| AgendaHeader (toggle Dia/Sem/Mes)|     | Header integrado com navegacao  |
| AgendaDateNavigation             |     | + botoes de visualizacao        |
+----------------------------------+     | + botao "New Event"             |
| Sidebar    | DayTimeline/        |     +----------------------------------+
| - Filters  | WeekTimeline/       |     | Barra de busca + Filtros        |
| - Upcoming | MonthCalendar       |     | (cores, tags, categorias)       |
+----------------------------------+     +----------------------------------+
                                         | MonthView/WeekView/DayView/List |
                                         | com drag-and-drop e hover cards |
                                         +----------------------------------+
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/ui/event-manager.tsx` | Componente principal EventManager com todas as views |

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/modules/crm/pages/Agenda.tsx` | Substituir conteudo por EventManager integrado com dados do Supabase |
| `src/modules/crm/hooks/useAgendaEvents.ts` | Adaptar para retornar dados no formato do EventManager |

---

## Arquivos a Remover (opcionalmente manter para referencia)

Os seguintes componentes nao serao mais usados pela Agenda, mas podem ser mantidos caso sejam usados em outro lugar:

- `AgendaHeader.tsx`
- `AgendaDateNavigation.tsx`
- `CalendarFilters.tsx`
- `UpcomingEvents.tsx`
- `DayTimeline.tsx`
- `WeekTimeline.tsx`
- `MonthCalendar.tsx`
- `EventItem.tsx`
- `TimelineEvent.tsx`
- `MonthDayCell.tsx`

---

## Implementacao

### 1. Criar src/components/ui/event-manager.tsx

Copiar o codigo do arquivo `calendário.txt` fornecido, com adaptacoes:

- Remover `"use client"` (nao necessario no Vite)
- Ajustar imports para caminhos do projeto
- Traduzir textos para portugues (opcional)
- Manter todas as funcionalidades:
  - EventManager (componente principal)
  - EventCard (card com hover effect)
  - MonthView
  - WeekView  
  - DayView
  - ListView

### 2. Adaptar useAgendaEvents.ts

Modificar o hook para retornar eventos no formato esperado pelo EventManager:

```typescript
// Formato atual (CalendarEvent)
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'call' | 'meeting' | 'followup' | 'proposal' | 'ai_task';
  status: 'pending' | 'overdue' | 'completed';
  isAIGenerated?: boolean;
  relatedOpportunity?: { id: string; name: string; };
}

// Formato novo (Event do EventManager)
interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  color: string;           // novo: blue, green, purple, etc
  category?: string;       // novo: Reuniao, Tarefa, etc
  attendees?: string[];    // novo: opcional
  tags?: string[];         // novo: Importante, Urgente, etc
}
```

Mapeamento de cores por tipo:
- `call` -> blue
- `meeting` -> green
- `followup` -> orange
- `proposal` -> purple
- `ai_task` -> pink

Mapeamento de categorias:
- `meeting` -> "Reuniao"
- `call` -> "Ligacao"
- `followup` -> "Follow-up"
- `proposal` -> "Proposta"
- `ai_task` -> "Tarefa IA"

### 3. Atualizar Agenda.tsx

Nova estrutura simplificada:

```tsx
import { EventManager, Event } from '@/components/ui/event-manager';
import { useAgendaEvents } from '../hooks/useAgendaEvents';
import { toast } from 'sonner';

export default function Agenda() {
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useAgendaEvents();

  const handleEventCreate = (event: Omit<Event, 'id'>) => {
    createEvent(event);
    toast.success('Evento criado com sucesso');
  };

  const handleEventUpdate = (id: string, event: Partial<Event>) => {
    updateEvent(id, event);
    toast.success('Evento atualizado');
  };

  const handleEventDelete = (id: string) => {
    deleteEvent(id);
    toast.success('Evento removido');
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="h-full p-6 bg-muted/20">
      <EventManager
        events={events}
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        categories={['Reuniao', 'Ligacao', 'Follow-up', 'Proposta', 'Tarefa IA']}
        availableTags={['Importante', 'Urgente', 'Cliente', 'Equipe']}
        defaultView="month"
        className="h-full"
      />
    </div>
  );
}
```

### 4. Adicionar Mutations ao useAgendaEvents

Expandir o hook para suportar CRUD de eventos:

```typescript
export function useAgendaEvents() {
  // Query existente para buscar eventos
  const { data: events, isLoading, refetch } = useQuery({...});
  
  // Mutation para criar evento
  const createEventMutation = useMutation({
    mutationFn: async (event: Omit<Event, 'id'>) => {
      // Por enquanto, eventos sao derivados de oportunidades
      // Futuramente: criar tabela crm_events
      toast.info('Funcionalidade de criar evento sera integrada em breve');
    },
    onSuccess: () => refetch()
  });
  
  // Mutation para atualizar evento (arrasto de drag-drop)
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, event }: { id: string; event: Partial<Event> }) => {
      // Atualiza a oportunidade relacionada se necessario
    },
    onSuccess: () => refetch()
  });
  
  // Mutation para deletar evento
  const deleteEventMutation = useMutation({...});
  
  return {
    events,
    isLoading,
    createEvent: createEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate
  };
}
```

---

## Funcionalidades do Novo Componente

| Funcionalidade | Descricao |
|----------------|-----------|
| 4 Visualizacoes | Mes, Semana, Dia e Lista |
| Navegacao | Botoes prev/next + botao "Today" |
| Drag-and-Drop | Arrastar eventos entre dias/horarios |
| Criar Evento | Dialog completo com titulo, descricao, horarios, cor, categoria, tags |
| Editar Evento | Click abre dialog de edicao |
| Deletar Evento | Botao no dialog de edicao |
| Busca | Input para filtrar eventos por texto |
| Filtros | Dropdowns para cor, tags e categorias |
| Hover Effects | Cards expandem com detalhes ao passar mouse |

---

## Traducao de Textos

| Original (EN) | Traduzido (PT-BR) |
|---------------|-------------------|
| "New Event" | "Novo Evento" |
| "Today" | "Hoje" |
| "Month" | "Mes" |
| "Week" | "Semana" |
| "Day" | "Dia" |
| "List" | "Lista" |
| "Search events..." | "Buscar eventos..." |
| "Create Event" | "Criar Evento" |
| "Event Details" | "Detalhes do Evento" |
| "Title" | "Titulo" |
| "Description" | "Descricao" |
| "Start Time" | "Inicio" |
| "End Time" | "Fim" |
| "Category" | "Categoria" |
| "Color" | "Cor" |
| "Tags" | "Tags" |
| "Delete" | "Excluir" |
| "Cancel" | "Cancelar" |
| "Save" | "Salvar" |
| "Create" | "Criar" |

---

## Ordem de Implementacao

| Passo | Acao |
|-------|------|
| 1 | Criar `src/components/ui/event-manager.tsx` com codigo do arquivo fornecido |
| 2 | Traduzir textos para portugues |
| 3 | Atualizar `useAgendaEvents.ts` para retornar formato compativel |
| 4 | Adicionar mutations para CRUD |
| 5 | Substituir conteudo de `Agenda.tsx` |
| 6 | Testar todas as visualizacoes |
| 7 | Testar drag-and-drop |
| 8 | Testar criacao/edicao de eventos |

---

## Consideracoes Tecnicas

1. **Dados**: Os eventos continuam sendo derivados de `crm_opportunities.next_step`. Futuramente pode-se criar uma tabela dedicada `crm_events`.

2. **CRUD Parcial**: Inicialmente, criar/deletar eventos pode mostrar toast informativo. A integracao completa com o banco pode ser feita depois.

3. **Drag-and-Drop**: Usa HTML5 drag API nativa (onDragStart, onDragEnd, onDrop). Nao usa @dnd-kit.

4. **Responsividade**: O componente ja inclui versoes mobile com selects e botoes adaptados.

5. **Performance**: Lista de eventos filtrada com useMemo para evitar re-renders.

