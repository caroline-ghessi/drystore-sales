
# Plano: Remover Dados Hardcoded do Modulo WhatsApp

## Resumo do Problema

O modulo WhatsApp contem dados hardcoded em dois locais principais:
1. **Pagina Analytics** - KPIs no topo com valores estaticos
2. **Hooks de dados** - Valores simulados que distorcem metricas reais

---

## Dados Hardcoded Identificados

| Arquivo | Linha(s) | Problema |
|---------|----------|----------|
| `Analytics.tsx` | 85-139 | KPIs totalmente hardcoded: "1,247", "89", "2.3m", "7.2%" |
| `useConversationAnalytics.ts` | 66 | `averageResponseTime = 2.5` fixo |
| `useConversationAnalytics.ts` | 86 | `avgMessagesPerConversation = 12` simulado |
| `useConversationAnalytics.ts` | 89-94 | `responseTimeData` com porcentagens inventadas (40%, 30%, 20%, 10%) |
| `useLeadAnalytics.ts` | 113, 119, 125 | `conversionRate: 85/45/15` simulados por temperatura |
| `useLeadAnalytics.ts` | 206 | `Math.floor(convertedLeads * 0.3)` - conversoes falsas |
| `AnalyticsOverview.tsx` | 105 | Tempo resposta bot hardcoded "<1s" |
| `BotMetrics.tsx` | 284 | Tempo resposta bot hardcoded "<1s" |

---

## Dashboard Principal (`Dashboard.tsx`)

**STATUS:** JA USA DADOS REAIS

O Dashboard esta correto - usa hooks `useConversations`, `useAgentConfigs`, `useVendors` para buscar dados reais do Supabase.

---

## Plano de Correcao

### Parte 1: Analytics.tsx - KPIs Dinamicos

**Arquivo:** `src/modules/whatsapp/pages/Analytics.tsx`

**Mudanca:** Substituir KPIs estaticos por dados dos hooks existentes

```typescript
// ADICIONAR imports e hooks
import { useConversationAnalytics } from '@/hooks/useConversationAnalytics';
import { useLeadAnalytics } from '@/hooks/useLeadAnalytics';
import { useVendorPerformance } from '@/modules/whatsapp/hooks/useVendorPerformance';

// DENTRO DO COMPONENTE
const { data: conversationData } = useConversationAnalytics(selectedPeriod);
const { data: leadData } = useLeadAnalytics(selectedPeriod);
const { data: vendorData } = useVendorPerformance(selectedPeriod);

// SUBSTITUIR KPIs hardcoded por:
// Total Conversas: conversationData?.totalConversations || 0
// Leads Quentes: leadData?.hotLeads || 0
// Tempo Resposta: vendorData?.avgResponseTime || 0 (em minutos)
// Taxa Conversao: leadData?.overallConversionRate || 0

// REMOVER trends comparativos ("+12%", "+8%", etc) ou calcular com periodo anterior
```

---

### Parte 2: useConversationAnalytics.ts - Calcular Metricas Reais

**Arquivo:** `src/modules/whatsapp/hooks/useConversationAnalytics.ts`

**Mudanca 1 - Linha 66:** Calcular tempo medio de resposta real

```typescript
// ANTES:
const averageResponseTime = 2.5;

// DEPOIS: Buscar das mensagens ou quality_metrics
// Opcao A: Usar dados de quality_metrics
const { data: qualityData } = await supabase
  .from('quality_metrics')
  .select('response_time_avg_minutes')
  .gte('metric_date', startDate.toISOString().split('T')[0]);

const avgResponseMinutes = qualityData?.length > 0
  ? qualityData.reduce((sum, q) => sum + (q.response_time_avg_minutes || 0), 0) / qualityData.length
  : 0;

const averageResponseTime = Math.round(avgResponseMinutes * 10) / 10;
```

**Mudanca 2 - Linha 86:** Calcular media de mensagens real

```typescript
// ANTES:
const avgMessagesPerConversation = 12; // Simulado

// DEPOIS: Buscar contagem real de mensagens
const { count: messageCount } = await supabase
  .from('messages')
  .select('*', { count: 'exact', head: true })
  .in('conversation_id', conversations.map(c => c.id));

const avgMessagesPerConversation = totalConversations > 0 
  ? Math.round((messageCount || 0) / totalConversations) 
  : 0;
```

**Mudanca 3 - Linhas 89-94:** Calcular distribuicao de tempo de resposta real

```typescript
// ANTES: Porcentagens inventadas (40%, 30%, 20%, 10%)
const responseTimeData = [
  { hour: '0-2h', count: Math.floor(totalConversations * 0.4), avgMinutes: 45 },
  ...
];

// DEPOIS: Buscar de quality_metrics agrupado por faixa
const { data: responseData } = await supabase
  .from('quality_metrics')
  .select('first_response_time_minutes')
  .gte('metric_date', startDate.toISOString().split('T')[0]);

// Agrupar por faixa de tempo
const responseBuckets = { '0-2h': [], '2-4h': [], '4-8h': [], '8h+': [] };
responseData?.forEach(r => {
  const mins = r.first_response_time_minutes || 0;
  if (mins <= 120) responseBuckets['0-2h'].push(mins);
  else if (mins <= 240) responseBuckets['2-4h'].push(mins);
  else if (mins <= 480) responseBuckets['4-8h'].push(mins);
  else responseBuckets['8h+'].push(mins);
});

const responseTimeData = Object.entries(responseBuckets).map(([hour, values]) => ({
  hour,
  count: values.length,
  avgMinutes: values.length > 0 
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : 0
}));
```

---

### Parte 3: useLeadAnalytics.ts - Conversoes Reais

**Arquivo:** `src/hooks/useLeadAnalytics.ts`

**Mudanca 1 - Linhas 113, 119, 125:** Calcular taxas de conversao por temperatura

```typescript
// ANTES: Taxas fixas 85/45/15
conversionRate: hotLeads > 0 ? 85 : 0 // Simulado

// DEPOIS: Buscar conversoes reais (oportunidades closed_won)
const { data: closedWonOpportunities } = await supabase
  .from('crm_opportunities')
  .select('conversation_id')
  .eq('stage', 'closed_won')
  .gte('created_at', startDate.toISOString());

// Mapear conversoes por temperatura
const hotConversions = closedWonOpportunities?.filter(o => {
  const conv = conversations?.find(c => c.id === o.conversation_id);
  return conv?.lead_temperature === 'hot';
}).length || 0;

const warmConversions = closedWonOpportunities?.filter(o => {
  const conv = conversations?.find(c => c.id === o.conversation_id);
  return conv?.lead_temperature === 'warm';
}).length || 0;

const coldConversions = closedWonOpportunities?.filter(o => {
  const conv = conversations?.find(c => c.id === o.conversation_id);
  return conv?.lead_temperature === 'cold';
}).length || 0;

// Usar taxas calculadas
const temperatureDistribution = [
  {
    temperature: 'hot',
    count: hotLeads,
    percentage: totalLeads > 0 ? Math.round((hotLeads / totalLeads) * 100) : 0,
    conversionRate: hotLeads > 0 ? Math.round((hotConversions / hotLeads) * 100) : 0
  },
  // ... similar para warm e cold
];
```

**Mudanca 2 - Linha 206:** Funil com conversoes reais

```typescript
// ANTES:
count: Math.floor(convertedLeads * 0.3), // 30% fake

// DEPOIS: Usar contagem real de closed_won
const realConversions = closedWonOpportunities?.length || 0;

const conversionFunnel = [
  { stage: 'Leads Captados', count: totalLeads, conversionRate: 100 },
  { stage: 'Leads Qualificados', count: hotLeads + warmLeads, 
    conversionRate: totalLeads > 0 ? Math.round(((hotLeads + warmLeads) / totalLeads) * 100) : 0 },
  { stage: 'Leads Enviados', count: convertedLeads, 
    conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0 },
  { stage: 'Leads Convertidos', count: realConversions, 
    conversionRate: totalLeads > 0 ? Math.round((realConversions / totalLeads) * 100) : 0 }
];
```

---

### Parte 4: Tempo de Resposta do Bot

**Arquivos:**
- `src/modules/whatsapp/components/analytics/AnalyticsOverview.tsx` (linha 105)
- `src/modules/whatsapp/components/analytics/BotMetrics.tsx` (linha 284)

**Mudanca:** Calcular tempo real do bot ou usar valor do hook

```typescript
// ANTES:
<p className="text-2xl font-bold text-primary">&lt;1s</p>

// DEPOIS: Usar dado do hook
// No useBotAnalytics, avgBotResponseTime ja retorna 1
// Exibir dinamicamente:
<p className="text-2xl font-bold text-primary">
  {botData?.avgBotResponseTime || 0}s
</p>
```

**Nota:** O bot responde instantaneamente, entao o valor "1s" ou "<1s" e tecnicamente correto. A mudanca e para usar o valor do hook em vez de hardcoded, permitindo futuras mudancas.

---

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `Analytics.tsx` | Usar dados reais dos hooks nos KPIs do topo |
| `useConversationAnalytics.ts` | Calcular averageResponseTime, avgMessagesPerConversation e responseTimeData |
| `useLeadAnalytics.ts` | Calcular taxas de conversao e funil reais |
| `AnalyticsOverview.tsx` | Usar tempo de resposta do hook |
| `BotMetrics.tsx` | Usar tempo de resposta do hook |

---

## Dependencias de Dados

Para que as metricas funcionem corretamente, os seguintes dados precisam existir:

1. **quality_metrics** - Para tempos de resposta (tabela ja existe)
2. **crm_opportunities** - Para conversoes (tabela ja existe, mas esta vazia apos limpeza)
3. **messages** - Para contagem de mensagens (tabela ja existe com dados reais)

---

## Estado Esperado Apos Mudancas

Todos os componentes de analytics exibirao:
- Dados reais calculados a partir das tabelas do Supabase
- Zeros quando nao houver dados (em vez de valores inventados)
- Estados de loading apropriados durante o carregamento

Os usuarios verao metricas que refletem a realidade do sistema, mesmo que alguns valores sejam zero inicialmente.
