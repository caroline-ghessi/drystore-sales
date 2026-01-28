
# Plano: Corrigir Dados de Performance dos Vendedores

## Problemas Identificados

### 1. Qualidade Sempre Zero (0/10)
**Causa**: O campo `automated_quality_score` na tabela `quality_metrics` está `NULL` em **TODOS os 8.492 registros**.

**Por que acontece**: 
- O webhook (`vendor-whatsapp-webhook`) registra métricas de tempo de resposta mas **não executa análise de qualidade**
- A função `quality-analysis` que **geraria o score** não está sendo executada para as conversas
- Zero análises de qualidade foram feitas nos últimos 7 dias (`vendor_quality_analysis` = 0 registros)

### 2. Tempos de Resposta Irreais (2000+ minutos)
**Causa**: O tempo de resposta está sendo calculado incorretamente - tempos de 2000+ minutos (~33+ horas) indicam:
- Mensagens de dias diferentes sendo contabilizadas como uma única resposta
- Não há distinção entre horário comercial e fora de expediente
- Conversas antigas acumulando tempo de resposta

**Exemplos dos dados**:
- Sérgio Nogueira: 7104 min médio (~5 dias!)
- Ricardo Henriques: 3944 min (~2.7 dias)
- Cristiano Ghessi: 2692 min (~1.9 dias)

### 3. Performance "Baixa" para Todos
**Causa**: A função `getPerformanceLevel` usa critérios impossíveis de atender:
```typescript
// Critérios atuais (impossíveis)
responseTime < 3 min → 3 pontos  // Meta impossível com tempos de 2000+ min
qualityScore > 8 → 3 pontos     // Impossível com score sempre 0
conversionRate > 10% → 3 pontos // Baixa com conversas "active", não "completed"
```

### 4. Contagem de Conversas Errada
**Dados Reais** (últimos 7 dias):
| Vendedor | Conversas Reais | Exibido |
|----------|-----------------|---------|
| Antônio César | 34 | 221 |
| Gabriel Rodrigues | 33 | 215 |
| Sérgio Nogueira | 19 | 145 |
| Cristiano Ghessi | 16 | 31 |
| Márcia Rodrigues | 15 | 142 |

**Causa**: A interface mostra dados de **período diferente** do que está selecionado (7 dias), pegando dados históricos maiores.

---

## Soluções Propostas

### Fase 1: Corrigir Métricas de Qualidade

**Opção A - Calcular Qualidade Simplificada (Recomendado)**

Sem depender da análise de IA, calcular um score baseado em métricas objetivas:
- Tempo de resposta (peso 40%): < 30min = 10pts, < 60min = 8pts, < 120min = 6pts, > 120min = 4pts
- Volume de atividade (peso 30%): Mensagens enviadas vs recebidas
- Conversas finalizadas (peso 30%): Taxa de conversas completed vs active

**Modificar**: `src/modules/whatsapp/hooks/useVendorPerformance.ts`

```typescript
// Calcular qualidade baseada em métricas objetivas
const calculateQualityScore = (avgResponseTime: number, vendorMessages: number, customerMessages: number) => {
  // Score de tempo de resposta (0-10)
  let timeScore = 10;
  if (avgResponseTime > 120) timeScore = 4;
  else if (avgResponseTime > 60) timeScore = 6;
  else if (avgResponseTime > 30) timeScore = 8;
  
  // Score de engajamento (proporção de respostas)
  const engagementRatio = customerMessages > 0 ? vendorMessages / customerMessages : 0;
  const engagementScore = Math.min(10, engagementRatio * 5); // 2 msgs por cliente = 10
  
  // Média ponderada
  return (timeScore * 0.6 + engagementScore * 0.4);
};
```

### Fase 2: Corrigir Tempo de Resposta

**Problema**: Tempo médio inclui intervalos noturnos e fins de semana

**Solução**: Usar `first_response_time_minutes` da primeira resposta de cada dia, ignorando conversas com gap > 8h

**Modificar**: `src/modules/whatsapp/hooks/useVendorPerformance.ts`

```typescript
// Filtrar tempos de resposta irreais (> 480min = 8h)
const validResponseTimes = vendorQuality
  .filter(q => q.response_time_avg_minutes && q.response_time_avg_minutes <= 480);

const avgResponseTime = validResponseTimes.length > 0
  ? validResponseTimes.reduce((sum, q) => sum + q.response_time_avg_minutes, 0) / validResponseTimes.length
  : 0;
```

### Fase 3: Ajustar Critérios de Performance

**Modificar**: `src/modules/whatsapp/hooks/useVendorPerformance.ts`

```typescript
// Critérios realistas baseados nos dados reais
const getPerformanceLevel = (metrics) => {
  const score = (
    (metrics.responseTime < 60 ? 3 : metrics.responseTime < 120 ? 2 : 1) +  // 1h = bom
    (metrics.qualityScore > 6 ? 3 : metrics.qualityScore > 4 ? 2 : 1) +     // 6/10 = bom
    (metrics.conversionRate > 5 ? 3 : metrics.conversionRate > 2 ? 2 : 1)   // 5% = bom
  ) / 3;
  
  if (score >= 2.5) return 'excellent';
  if (score >= 2) return 'good';
  if (score >= 1.5) return 'average';
  return 'poor';
};
```

### Fase 4: Verificar Contagem de Conversas

**Problema**: O hook pode não estar respeitando o filtro de período corretamente

**Verificar e corrigir**: Garantir que o filtro `created_at >= startDate` está funcionando

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/modules/whatsapp/hooks/useVendorPerformance.ts` | Calcular qualidade sem depender de análise IA, filtrar tempos irreais, ajustar critérios de performance |
| `src/modules/whatsapp/components/analytics/VendorPerformance.tsx` | Exibir label de qualidade como "Score Calculado" (não "Análise IA") |

---

## Resultado Esperado

Após as correções:
- **Qualidade**: Score de 0-10 calculado objetivamente
- **Tempo de Resposta**: Apenas respostas dentro de horário comercial (< 8h de gap)
- **Performance**: Classificações realistas baseadas em métricas alcançáveis
- **Contagens**: Números corretos para o período selecionado

---

## Nota sobre Análise de Qualidade por IA

O sistema tem uma função (`quality-analysis`) que deveria analisar conversas com IA, mas:
1. Não está sendo executada automaticamente
2. Requer o agente `quality_monitor` ativo no `agent_configs`
3. Depende de chamada manual ou cron job

**Recomendação futura**: Configurar job diário para executar `daily-quality-analysis` e popular os scores de IA.
