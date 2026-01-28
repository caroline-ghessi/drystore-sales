
# Plano: Remover Dados Hardcoded do Módulo CRM

## Resumo do Problema

O módulo CRM contém diversos componentes que exibem dados fictícios (mock/hardcoded) em vez de dados reais do banco de dados. Isso compromete a integridade das informações mostradas aos usuários.

---

## Dados Hardcoded Identificados

| Arquivo | Linha(s) | Problema |
|---------|----------|----------|
| `DashboardMetrics.tsx` | 68, 92 | "+12%" e "+3%" hardcoded |
| `PendingTasks.tsx` | 59-81 | Tarefas placeholder quando nao ha tarefas reais |
| `MiniCalendar.tsx` | 15-18 | `sampleEvents` com eventos fictícios |
| `KanbanStats.tsx` | 15, 24, 33 | Trends hardcoded "+12%", "+2.1%", "-3 dias" |
| `NegotiationTimeline.tsx` | 11-40 | `PLACEHOLDER_EVENTS` com atividades fictícias |
| `AIInsights.tsx` | 63-69 | "Melhor horário: 14h-16h" inventado |
| `Customers.tsx` | 40-86 | Stats totalmente hardcoded (1,247 clientes, etc) |
| `useLeadAnalytics.ts` | 113-126, 206 | Taxas de conversao simuladas |

---

## Plano de Correção

### Parte 1: DashboardMetrics - Remover Trends Fake

**Arquivo:** `src/modules/crm/components/dashboard/DashboardMetrics.tsx`

**Mudanca:** Calcular ou remover as porcentagens de crescimento

```text
ANTES:
  change="+12%"   ← hardcoded
  change="+3%"    ← hardcoded

DEPOIS:
  - Remover change prop OU
  - Calcular comparando com mes anterior (requer query adicional)
```

**Decisao:** Remover os campos `change` para receita e taxa de conversao, mantendo apenas para dados que temos como calcular (ex: novos deals hoje).

---

### Parte 2: PendingTasks - Remover Placeholders

**Arquivo:** `src/modules/crm/components/dashboard/PendingTasks.tsx`

**Mudanca:** Mostrar estado vazio em vez de tarefas fictícias

```typescript
// REMOVER linhas 59-81 (tarefas placeholder)
// Substituir por estado vazio quando derivedTasks.length === 0
const tasks: Task[] = derivedTasks; // Sem fallback para placeholders

// E no render, mostrar mensagem adequada:
{tasks.length === 0 ? (
  <div className="text-center py-8 text-muted-foreground">
    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
    <p className="text-sm">Nenhuma tarefa pendente</p>
    <p className="text-xs mt-1">Novas tarefas aparecerao conforme leads forem processados</p>
  </div>
) : (
  // ... render tasks
)}
```

---

### Parte 3: MiniCalendar - Usar Dados Reais

**Arquivo:** `src/modules/crm/components/dashboard/MiniCalendar.tsx`

**Mudanca:** Integrar com hook `useAgendaEvents` em vez de `sampleEvents`

```typescript
// REMOVER: const sampleEvents: CalendarEvent[] = [...]

// ADICIONAR:
import { useAgendaEvents } from '../../hooks/useAgendaEvents';

export function MiniCalendar() {
  const { events, isLoading } = useAgendaEvents();
  
  // Converter events para CalendarEvent format
  const calendarEvents = events.map(e => ({
    date: e.startTime,
    type: e.category === 'Ligacao' ? 'urgent' 
        : e.category === 'Reuniao' ? 'meeting' 
        : 'followup'
  }));
  
  // Usar calendarEvents em vez de sampleEvents
}
```

---

### Parte 4: KanbanStats - Remover Trends Fake

**Arquivo:** `src/modules/crm/components/pipeline/KanbanStats.tsx`

**Mudanca:** Remover trends estaticos ou calcular dinamicamente

```typescript
// ANTES (linhas 15, 24, 33):
trend: '+12%',
trend: '+2.1%',
trend: '-3 dias',

// DEPOIS:
trend: '', // Remover enquanto nao calculamos o real
// OU calcular comparando periodos:
// trend: calculateTrend(currentValue, previousValue)
```

---

### Parte 5: NegotiationTimeline - Estado Vazio

**Arquivo:** `src/modules/crm/components/negotiation/NegotiationTimeline.tsx`

**Mudanca:** Remover `PLACEHOLDER_EVENTS` e mostrar estado vazio

```typescript
// REMOVER: const PLACEHOLDER_EVENTS = [...]

export function NegotiationTimeline({ opportunityId }: NegotiationTimelineProps) {
  // TODO: No futuro, buscar de crm_activities
  // Por ora, mostrar mensagem que timeline sera preenchida
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline da Negociacao</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Historico de atividades</p>
          <p className="text-xs mt-1">
            Atividades serao registradas automaticamente 
            conforme a negociacao progride.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Parte 6: AIInsights - Remover Timing Inventado

**Arquivo:** `src/modules/crm/components/negotiation/AIInsights.tsx`

**Mudanca:** Remover insight de timing hardcoded

```typescript
// REMOVER linhas 63-69 (timing insight inventado):
// insights.push({
//   type: 'timing',
//   title: 'Timing',
//   description: 'Melhor horário para contato: 14h-16h (baseado no histórico).',
//   ...
// });

// Manter apenas insights baseados em dados reais da oportunidade
```

---

### Parte 7: Customers Page - Usar Dados Reais

**Arquivo:** `src/modules/crm/pages/Customers.tsx`

**Mudanca:** Criar hook `useCustomerStats` e integrar com a pagina

**Novo hook:** `src/modules/crm/hooks/useCustomerStats.ts`

```typescript
export function useCustomerStats() {
  return useQuery({
    queryKey: ['customer-stats'],
    queryFn: async () => {
      const { count: total } = await supabase
        .from('crm_customers')
        .select('*', { count: 'exact', head: true });
      
      const { count: leads } = await supabase
        .from('crm_customers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'lead');
      
      const { data: thisMonth } = await supabase
        .from('crm_customers')
        .select('id')
        .gte('created_at', startOfMonth(new Date()).toISOString());
      
      const { data: avgValueData } = await supabase
        .from('crm_opportunities')
        .select('value');
      
      const avgValue = avgValueData?.length > 0
        ? avgValueData.reduce((sum, o) => sum + o.value, 0) / avgValueData.length
        : 0;
      
      return {
        total: total || 0,
        leads: leads || 0,
        newThisMonth: thisMonth?.length || 0,
        avgValue
      };
    }
  });
}
```

**Modificar Customers.tsx:** Usar o hook em vez de valores hardcoded

---

### Parte 8: useLeadAnalytics - Calcular Taxas Reais

**Arquivo:** `src/modules/crm/hooks/useLeadAnalytics.ts`

**Mudanca:** Remover taxas de conversao simuladas

```typescript
// ANTES (linhas 113, 119, 125):
conversionRate: hotLeads > 0 ? 85 : 0 // Simulado
conversionRate: warmLeads > 0 ? 45 : 0 // Simulado  
conversionRate: coldLeads > 0 ? 15 : 0 // Simulado

// DEPOIS: Calcular a partir dos dados reais
// Buscar oportunidades fechadas por temperatura
const { data: closedWonOpps } = await supabase
  .from('crm_opportunities')
  .select('temperature, conversation_id')
  .eq('stage', 'closed_won');

// Calcular taxa de conversao real por temperatura
const hotConversions = closedWonOpps?.filter(o => 
  conversations?.find(c => c.id === o.conversation_id)?.lead_temperature === 'hot'
).length || 0;
const hotConversionRate = hotLeads > 0 ? (hotConversions / hotLeads) * 100 : 0;
```

```typescript
// ANTES (linha 206):
count: Math.floor(convertedLeads * 0.3), // Simulado - 30% dos enviados

// DEPOIS: Buscar conversoes reais
const { count: realConversions } = await supabase
  .from('crm_opportunities')
  .select('*', { count: 'exact', head: true })
  .eq('stage', 'closed_won');
```

---

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `DashboardMetrics.tsx` | Remover trends "+12%", "+3%" |
| `PendingTasks.tsx` | Remover tarefas placeholder |
| `MiniCalendar.tsx` | Integrar com useAgendaEvents |
| `KanbanStats.tsx` | Remover trends estaticos |
| `NegotiationTimeline.tsx` | Mostrar estado vazio |
| `AIInsights.tsx` | Remover insight timing inventado |
| `Customers.tsx` | Usar dados reais do banco |
| `useLeadAnalytics.ts` | Calcular taxas reais |

## Novo Arquivo a Criar

| Arquivo | Descricao |
|---------|-----------|
| `useCustomerStats.ts` | Hook para buscar estatísticas de clientes |

---

## Estado Esperado Apos Mudancas

Todos os componentes do CRM exibirao:
- Dados reais do banco de dados
- Estados vazios apropriados quando nao houver dados
- Nenhum valor inventado ou simulado

Os usuarios verao exatamente o que existe no sistema, sem informacoes enganosas.
