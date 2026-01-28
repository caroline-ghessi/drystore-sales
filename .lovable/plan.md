
# Plano: Implementar Página de Agenda do CRM

## 1. Resumo

Criar uma nova página de Agenda completa para o CRM, substituindo a página de Tasks atual. A página terá um layout dividido com calendários/eventos à esquerda e visualização de timeline à direita.

---

## 2. Estrutura Visual do Design

```text
+-----------------------------------------------------------------------+
|  Agenda                                        [Dia] [Semana] [Mês]   |
+-----------------------------------------------------------------------+
|  [<] [15 Janeiro 2024] [>]              [Hoje] [+ Novo Evento]        |
+-----------------------------------------------------------------------+
|                                                                       |
|  +--------------------+  +------------------------------------------+ |
|  | CALENDÁRIOS        |  | Segunda-feira, 15 de Janeiro    GMT-3   | |
|  | ☑ Minhas Atividades|  +------------------------------------------+ |
|  | ☑ Reuniões         |  |        |                                 | |
|  | ☑ Follow-ups       |  | 06:00  |                                 | |
|  | ☑ Equipe           |  | 07:00  |                                 | |
|  +--------------------+  | 08:00  |                                 | |
|  |                    |  | 09:00  | [Follow-up Health Corp]         | |
|  | PRÓXIMOS EVENTOS   |  | 10:00  |                                 | |
|  +--------------------+  | 11:00  | [Validar lead IA] 🤖            | |
|  | Hoje               |  | 12:00  |                                 | |
|  | ├ Ligar Banco Fut. |  | 13:00  |                                 | |
|  | │  14:00 • Atrasado|  | 14:00  | [Ligar Banco Futuro] ⚠️ Atrasado|
|  | ├ Enviar proposta  |  | 15:00  |                                 | |
|  | │  16:00           |  | 16:00  | [Enviar proposta]               | |
|  | └ Reunião XYZ      |  | 17:00  | [Reunião Indústria XYZ]         | |
|  |   17:00 - 18:00    |  | 18:00  |                                 | |
|  +--------------------+  | 19:00  |                                 | |
|  | Amanhã   16 Jan    |  | 20:00  |                                 | |
|  | ├ Follow-up Health |  +------------------------------------------+ |
|  | └ Validar lead IA  |  |              ▲ 14:30 (indicador hora)    | |
|  +--------------------+  +------------------------------------------+ |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 3. Componentes a Criar

### 3.1 Estrutura de Diretórios

```
src/modules/crm/
├── pages/
│   └── Agenda.tsx                    # Nova página principal
├── components/
│   └── agenda/
│       ├── index.ts                  # Barrel export
│       ├── AgendaHeader.tsx          # Cabeçalho com título e toggle view
│       ├── AgendaDateNavigation.tsx  # Navegação de data + botões ação
│       ├── CalendarFilters.tsx       # Filtros de calendários (checkbox)
│       ├── UpcomingEvents.tsx        # Lista de próximos eventos
│       ├── EventItem.tsx             # Item individual de evento
│       ├── DayTimeline.tsx           # Visualização timeline do dia
│       └── TimelineEvent.tsx         # Evento na timeline
```

### 3.2 Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/modules/crm/components/layout/CRMLayout.tsx` | Adicionar rota `/agenda` para a nova página |
| `src/modules/crm/components/layout/CRMSidebar.tsx` | Atualizar link "Agenda" para nova rota |

---

## 4. Detalhes de Implementação

### 4.1 Agenda.tsx - Página Principal

Layout responsivo com 3 seções:
- **Header**: Título + toggle de visualização (Dia/Semana/Mês)
- **Barra de Navegação**: Data atual + navegação + botões de ação
- **Conteúdo Principal**: 
  - Coluna esquerda (30%): Filtros + Próximos Eventos
  - Coluna direita (70%): Timeline do dia

```tsx
// Estado principal
const [currentDate, setCurrentDate] = useState(new Date());
const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
const [selectedCalendars, setSelectedCalendars] = useState({
  activities: true,
  meetings: true,
  followups: true,
  team: true
});
```

### 4.2 AgendaHeader.tsx

- Título "Agenda"
- Toggle buttons: Dia | Semana | Mês (estilo do HTML fornecido)

### 4.3 AgendaDateNavigation.tsx

- Setas de navegação < >
- Data formatada (ex: "15 Janeiro 2024")
- Botão "Hoje" para voltar à data atual
- Botão "+ Novo Evento" (primary color)

### 4.4 CalendarFilters.tsx

Lista de checkboxes para filtrar eventos:
- Minhas Atividades (ícone azul)
- Reuniões (ícone verde)
- Follow-ups (ícone amarelo)
- Equipe (ícone roxo)

### 4.5 UpcomingEvents.tsx

Agrupa eventos por dia:
- **Hoje**: Lista de eventos do dia atual
- **Amanhã**: Lista de eventos do dia seguinte
- Cada evento mostra:
  - Cor indicadora (borda esquerda)
  - Título
  - Horário
  - Status (Atrasado, badge "Gerado por IA")
  - Descrição curta

### 4.6 DayTimeline.tsx

Visualização de timeline vertical:
- Cabeçalho com dia da semana + data + timezone
- Horas de 06:00 a 20:00
- Eventos posicionados por horário
- Indicador de hora atual (linha vermelha)
- Scroll suave

### 4.7 EventItem e TimelineEvent

Componentes reutilizáveis para exibir eventos:
- Cor baseada no tipo (urgente, reunião, follow-up, IA)
- Badges para status especiais
- Hover effects

---

## 5. Tipos de Eventos (Interface)

```tsx
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'call' | 'meeting' | 'followup' | 'proposal' | 'ai_task';
  status: 'pending' | 'overdue' | 'completed';
  isAIGenerated?: boolean;
  relatedOpportunity?: {
    id: string;
    name: string;
  };
}
```

---

## 6. Cores e Estilos (Drystore)

| Elemento | Cor |
|----------|-----|
| Primary | #ef7d04 (Laranja) |
| Evento Atrasado | bg-red-50, border-red-400 |
| Evento Reunião | bg-green-50, border-green-400 |
| Evento Follow-up | bg-yellow-50, border-yellow-400 |
| Evento IA | bg-purple-50, border-purple-400, badge "Gerado por IA" |
| Linha hora atual | bg-red-500 |
| Background timeline | bg-gray-50 |

---

## 7. Dados dos Eventos

### Fase Inicial (Placeholder)
Como não existe tabela de eventos/tarefas no banco, usar dados simulados baseados em:
1. `next_step` das oportunidades (crm_opportunities)
2. Tarefas derivadas de leads AI que precisam validação

### Hook useAgendaEvents

```tsx
function useAgendaEvents(date: Date) {
  // Buscar de crm_opportunities onde next_step não é vazio
  // Transformar em eventos de calendário
  // Adicionar eventos de leads IA para validar
  return { events, isLoading };
}
```

---

## 8. Responsividade

| Viewport | Layout |
|----------|--------|
| Desktop (lg+) | 2 colunas: Sidebar (30%) + Timeline (70%) |
| Tablet (md) | 2 colunas menores |
| Mobile (sm) | 1 coluna empilhada, sidebar colapsada |

---

## 9. Ordem de Implementação

| Passo | Ação | Tempo Est. |
|-------|------|------------|
| 1 | Criar estrutura base `Agenda.tsx` com layout | 20 min |
| 2 | Implementar `AgendaHeader.tsx` | 10 min |
| 3 | Implementar `AgendaDateNavigation.tsx` | 15 min |
| 4 | Implementar `CalendarFilters.tsx` | 10 min |
| 5 | Implementar `UpcomingEvents.tsx` + `EventItem.tsx` | 30 min |
| 6 | Implementar `DayTimeline.tsx` + `TimelineEvent.tsx` | 40 min |
| 7 | Criar barrel export `index.ts` | 5 min |
| 8 | Atualizar `CRMLayout.tsx` com nova rota | 5 min |
| 9 | Atualizar `CRMSidebar.tsx` com link correto | 5 min |
| 10 | Implementar hook `useAgendaEvents` | 20 min |

**Total estimado**: ~2.5-3 horas

---

## 10. Features Implementadas

| Feature | Incluída? |
|---------|-----------|
| Toggle Dia/Semana/Mês | ✅ (UI pronta, lógica futura) |
| Navegação de data | ✅ |
| Filtros de calendário | ✅ |
| Lista próximos eventos | ✅ |
| Timeline visual do dia | ✅ |
| Indicador hora atual | ✅ |
| Badge "Gerado por IA" | ✅ |
| Indicador "Atrasado" | ✅ |
| Botão "Novo Evento" | ✅ (UI, funcionalidade futura) |

---

## 11. Notas Importantes

1. **Dados Placeholder**: A página usará dados simulados inicialmente, mas a estrutura estará pronta para integração com backend quando tabela de eventos for criada.

2. **Integração com Oportunidades**: Eventos serão derivados do campo `next_step` das oportunidades existentes.

3. **Leads IA**: Oportunidades com `validation_status = 'ai_generated'` aparecerão como tarefas pendentes com badge especial.

4. **Sem Hardcode de Produtos**: Conforme solicitado, não haverá dados de produtos hardcoded. Eventos são derivados de dados do CRM.
