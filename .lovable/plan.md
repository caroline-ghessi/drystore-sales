
# Plano: Implementar Visualizações de Semana e Mês na Agenda

## 1. Resumo

Adicionar duas novas visualizações à página de Agenda:
- **Visualização de Semana**: Mostra 7 dias lado a lado com timeline vertical
- **Visualização de Mês**: Grid de calendário mensal com indicadores de eventos

---

## 2. Estrutura Visual

### 2.1 Visualização de Semana

```text
+-----------------------------------------------------------------------+
|  Segunda-feira 15     Terça-feira 16     Quarta-feira 17    ...       |
|  Janeiro              Janeiro            Janeiro                      |
+-----------------------------------------------------------------------+
| 06:00  |             |                 |                   |          |
| 07:00  |             |                 |                   |          |
| 08:00  |             |                 |                   |          |
| 09:00  | [Evento 1]  |                 | [Evento 3]        |          |
| 10:00  |             |                 |                   |          |
| 11:00  |             | [Evento 2]      |                   |          |
| ...    |             |                 |                   |          |
+-----------------------------------------------------------------------+
```

### 2.2 Visualização de Mês

```text
+-----------------------------------------------------------------------+
|                       Janeiro 2024                                     |
+-----------------------------------------------------------------------+
|   Dom    |   Seg    |   Ter    |   Qua    |   Qui    |   Sex    | Sab |
+-----------------------------------------------------------------------+
|          |    1     |    2     |    3     |    4     |    5     |  6  |
|          |          |    •     |          |    ••    |          |     |
+-----------------------------------------------------------------------+
|    7     |    8     |    9     |   10     |   11     |   12     | 13  |
|          |          |          |          |          |          |     |
+-----------------------------------------------------------------------+
|   14     |   15     |   16     |   17     |   18     |   19     | 20  |
|    •     |  [HOJE]  |    •     |          |    •••   |          |     |
|          | Evento 1 |          |          |          |          |     |
|          | Evento 2 |          |          |          |          |     |
+-----------------------------------------------------------------------+
```

---

## 3. Componentes a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/modules/crm/components/agenda/WeekTimeline.tsx` | Visualizacao de semana com 7 colunas |
| `src/modules/crm/components/agenda/MonthCalendar.tsx` | Grid de calendario mensal |
| `src/modules/crm/components/agenda/MonthDayCell.tsx` | Celula individual do mes com eventos |

---

## 4. Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/modules/crm/pages/Agenda.tsx` | Renderizar componente correto baseado em viewMode |
| `src/modules/crm/components/agenda/AgendaDateNavigation.tsx` | Ajustar navegacao para semana/mes |
| `src/modules/crm/components/agenda/index.ts` | Exportar novos componentes |

---

## 5. Detalhes de Implementacao

### 5.1 WeekTimeline.tsx

Timeline de 7 dias lado a lado:
- Header com nome do dia e data
- Coluna de horas a esquerda (06:00 - 20:00)
- 7 colunas de eventos
- Indicador de hora atual na coluna do dia atual
- Eventos posicionados por horario em cada coluna
- Scroll horizontal em telas menores

```tsx
interface WeekTimelineProps {
  startDate: Date; // Primeiro dia da semana
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: Date) => void;
}
```

### 5.2 MonthCalendar.tsx

Grid mensal completo:
- Header com nome do mes e ano
- Linha de dias da semana (D S T Q Q S S)
- 5-6 linhas de dias
- Cada celula mostra o numero do dia
- Indicadores de eventos (pontos ou lista curta)
- Dia atual destacado
- Click no dia muda para visualizacao diaria

```tsx
interface MonthCalendarProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}
```

### 5.3 MonthDayCell.tsx

Celula individual do calendario:
- Numero do dia
- Indicador de "hoje"
- Lista de ate 2-3 eventos com truncate
- Badge "+X mais" se houver mais eventos
- Cores baseadas no tipo de evento

### 5.4 Agenda.tsx - Alteracoes

Renderizacao condicional baseada no viewMode:

```tsx
{viewMode === 'day' && (
  <DayTimeline 
    date={currentDate}
    events={events}
    onEventClick={handleEventClick}
  />
)}

{viewMode === 'week' && (
  <WeekTimeline 
    startDate={startOfWeek(currentDate, { locale: ptBR })}
    events={events}
    onEventClick={handleEventClick}
    onDayClick={(date) => {
      setCurrentDate(date);
      setViewMode('day');
    }}
  />
)}

{viewMode === 'month' && (
  <MonthCalendar 
    currentDate={currentDate}
    events={events}
    onDayClick={(date) => {
      setCurrentDate(date);
      setViewMode('day');
    }}
    onEventClick={handleEventClick}
  />
)}
```

### 5.5 AgendaDateNavigation.tsx - Alteracoes

Navegacao dinamica baseada no viewMode:
- Dia: avanca/retrocede 1 dia
- Semana: avanca/retrocede 7 dias
- Mes: avanca/retrocede 1 mes

Formatacao da data dinamica:
- Dia: "15 Janeiro 2024"
- Semana: "13 - 19 Janeiro 2024"
- Mes: "Janeiro 2024"

---

## 6. Cores e Estilos

| Elemento | Estilo |
|----------|--------|
| Dia atual (semana) | Coluna com bg-primary/5, header destacado |
| Dia atual (mes) | bg-primary text-white para numero |
| Evento no mes | Ponto colorido ou texto truncado |
| Dias fora do mes | text-muted-foreground/50 |
| Hover em celula | bg-muted/50 |

---

## 7. Funcoes Utilitarias Necessarias

```typescript
// Obter inicio da semana
import { startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

// Obter dias do mes
import { startOfMonth, endOfMonth, getWeeksInMonth } from 'date-fns';

// Verificar se data esta no mes atual
import { isSameMonth, isSameDay } from 'date-fns';
```

---

## 8. Ordem de Implementacao

| Passo | Acao |
|-------|------|
| 1 | Atualizar AgendaDateNavigation com navegacao dinamica |
| 2 | Criar WeekTimeline.tsx com grid de 7 dias |
| 3 | Criar MonthDayCell.tsx para celula do mes |
| 4 | Criar MonthCalendar.tsx com grid mensal |
| 5 | Atualizar Agenda.tsx com renderizacao condicional |
| 6 | Atualizar index.ts com novos exports |
| 7 | Testar navegacao entre visualizacoes |

---

## 9. Interacoes do Usuario

| Acao | Resultado |
|------|-----------|
| Click em dia (semana/mes) | Muda para visualizacao diaria daquele dia |
| Click em evento | Abre detalhes do evento (toast atual) |
| Navegacao setas | Avanca/retrocede no periodo correto |
| Click "Hoje" | Volta para data atual mantendo viewMode |
| Toggle visualizacao | Muda viewMode mantendo data aproximada |

---

## 10. Responsividade

### Semana
- Desktop: 7 colunas iguais
- Tablet: Scroll horizontal se necessario
- Mobile: Mostrar apenas 3-5 dias com scroll

### Mes
- Desktop: Grid completo
- Tablet/Mobile: Grid adaptativo, celulas menores
