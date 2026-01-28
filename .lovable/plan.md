
# Plano: Redesenhar Dashboard do CRM (Sem Kanban)

## 1. Resumo das Mudancas

O Dashboard atual exibe o Kanban do Pipeline. O novo design deve remover o Kanban e substituir por:

| Secao | Descricao |
|-------|-----------|
| Header | Titulo "Dashboard" + timestamp ultima atualizacao + botoes de acao |
| Cards de Metricas | 4 cards: Receita do Mes, Deals Ativos, Leads (IA), Taxa de Conversao |
| Principais Negociacoes | Lista das top oportunidades com detalhes |
| Tarefas Pendentes | Lista de tarefas + Mini calendario |

---

## 2. Estrutura Visual do Novo Dashboard

```text
+-----------------------------------------------------------------------+
|  Dashboard                          Ultima atualizacao: 15:30         |
|                                     [Filtros] [+ Novo Deal]           |
+-----------------------------------------------------------------------+
|                                                                       |
|  +---------------+  +---------------+  +---------------+  +---------+ |
|  | +12%          |  | +8            |  | +15           |  | +3%     | |
|  | R$ 842k       |  | 23            |  | 47            |  | 68%     | |
|  | Receita Mes   |  | Deals Ativos  |  | Leads (IA)   |  | Conversao| |
|  +---------------+  +---------------+  +---------------+  +---------+ |
|                                                                       |
+-----------------------------------------------------------------------+
|                                                                       |
|  +--------------------------------------+  +------------------------+ |
|  | Principais Negociacoes   [Ver todas] |  | Tarefas Pendentes  (5) | |
|  +--------------------------------------+  +------------------------+ |
|  | [icon] Banco Futuro - Seguranca      |  | [ ] Ligar Banco Futuro | |
|  |        Proposta • 3 dias • 80%       |  |     Atrasado 2h        | |
|  |        R$ 150k           Carlos      |  | [ ] Enviar proposta    | |
|  +--------------------------------------+  |     Hoje 16:00         | |
|  | [icon] Industria XYZ - ERP           |  +------------------------+ |
|  |        Negociacao • 2 dias           |  |                        | |
|  |        R$ 200k           Carlos      |  |   [CALENDARIO MINI]    | |
|  +--------------------------------------+  |   Janeiro 2024         | |
|  | [icon] Logistica BR - Frota          |  |   D S T Q Q S S        | |
|  |        Primeiro Contato • 1 dia      |  |   ...                  | |
|  |        R$ 80k            Ana         |  |                        | |
|  +--------------------------------------+  +------------------------+ |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 3. Componentes a Criar

### 3.1 Novos Componentes

| Arquivo | Descricao |
|---------|-----------|
| `src/modules/crm/components/dashboard/DashboardMetrics.tsx` | 4 cards de metricas |
| `src/modules/crm/components/dashboard/TopNegotiations.tsx` | Lista de principais negociacoes |
| `src/modules/crm/components/dashboard/PendingTasks.tsx` | Lista de tarefas pendentes |
| `src/modules/crm/components/dashboard/MiniCalendar.tsx` | Widget de calendario |
| `src/modules/crm/components/dashboard/index.ts` | Barrel export |

### 3.2 Arquivo a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/modules/crm/pages/Dashboard.tsx` | Substituir layout atual pelos novos componentes |

---

## 4. Detalhes de Implementacao

### 4.1 DashboardMetrics

Exibe 4 cards horizontais com:
- Icone + Badge de variacao (ex: "+12%")
- Valor principal grande
- Label descritivo

Dados vem de `usePipelineStats()` existente:
- Receita do Mes: `totalPipelineValue`
- Deals Ativos: `activeLeads`
- Leads (IA): contagem de `validation_status = 'ai_generated'`
- Taxa de Conversao: `conversionRate`

### 4.2 TopNegotiations

Lista das top 4-5 oportunidades ordenadas por valor:
- Avatar/inicial do cliente
- Nome + titulo do projeto
- Badge de stage (Proposta, Negociacao, etc.)
- Tempo ("3 dias")
- Status texto ("80% concluido", "Aguardando contrato")
- Valor (R$ 150k)
- Nome do vendedor

Dados de `useOpportunities()` existente.

### 4.3 PendingTasks

Lista de tarefas com checkbox:
- Checkbox interativo
- Descricao da tarefa
- Horario/status (Atrasado 2h, Hoje 16:00, Amanha 09:00)
- Indicador visual de urgencia

**Nota**: Nao existe tabela de tasks no banco. Inicialmente usar dados simulados (placeholder) ou derivar de oportunidades com `next_step` preenchido.

### 4.4 MiniCalendar

Widget de calendario mensal:
- Navegacao mes anterior/proximo
- Grade de dias com indicadores visuais
- Legenda (Urgente, Reuniao, Follow-up)

Usar componente `Calendar` do shadcn como base.

---

## 5. Hook Adicional

### useDashboardData

```typescript
// Combina dados de diferentes fontes
function useDashboardData() {
  const stats = usePipelineStats();
  const opportunities = useOpportunities();
  const aiLeadsCount = useOpportunitiesCount(); // validation_status = 'ai_generated'
  
  return {
    metrics: {
      monthlyRevenue: stats.totalPipelineValue,
      activeDeals: stats.activeLeads,
      aiLeads: aiLeadsCount,
      conversionRate: stats.conversionRate,
    },
    topNegotiations: opportunities.all?.slice(0, 5),
    // tasks: derivados ou placeholder
  };
}
```

---

## 6. Cores e Estilos (Drystore)

| Elemento | Cor |
|----------|-----|
| Primary | #ef7d04 (Laranja) |
| Card Background | Branco com sombra sutil |
| Badge Positivo | Verde claro (#dcfce7) |
| Badge Negativo | Vermelho claro |
| Texto Secundario | #868787 |

---

## 7. Responsividade

| Viewport | Layout |
|----------|--------|
| Desktop (lg+) | 2 colunas: Negociacoes (60%) + Tasks/Calendario (40%) |
| Tablet (md) | 2 colunas menores |
| Mobile (sm) | 1 coluna empilhada |

---

## 8. Ordem de Implementacao

| Passo | Acao | Tempo |
|-------|------|-------|
| 1 | Criar `DashboardMetrics.tsx` com 4 cards | 30 min |
| 2 | Criar `TopNegotiations.tsx` com lista | 45 min |
| 3 | Criar `PendingTasks.tsx` com tarefas | 30 min |
| 4 | Criar `MiniCalendar.tsx` com calendario | 45 min |
| 5 | Criar barrel export `index.ts` | 5 min |
| 6 | Reescrever `Dashboard.tsx` com novo layout | 30 min |

**Total estimado**: ~3 horas

---

## 9. Dados - Importante

### Dados Reais (do banco):
- Metricas: vem de `crm_opportunities`
- Top Negociacoes: vem de `crm_opportunities` com join em `crm_customers`

### Dados Placeholder (sem tabela):
- Tarefas Pendentes: dados simulados ate criar sistema de tasks
- Calendario: eventos simulados

**Nota do usuario**: "Nao podemos ter dados de produto hardcoded" - isso se aplica a produtos, nao a tarefas placeholder do dashboard.

---

## 10. Remocao do Kanban

Remover do Dashboard:
- Import de `PipelineKanban`
- Import de `KanbanStats`
- Secao "Pipeline de Vendas" com o Kanban

Manter apenas:
- `usePipelineStats()` para os cards de metricas
- `useOpportunities()` para a lista de negociacoes
