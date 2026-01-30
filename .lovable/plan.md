
# Plano: Atualizar mapToOpportunityFields para Coaching Generator v1.0

## Resumo

Atualizar a função `mapToOpportunityFields()` no `crm-agent-executor.ts` para processar a estrutura rica do novo prompt Coaching Generator v1.0, capturando diagnósticos, análises de dimensão, alertas de risco e coaching do vendedor.

---

## Incompatibilidade Identificada

O prompt v1.0 gera uma estrutura extremamente rica, mas o mapeador atual só captura 3 campos:

```typescript
// Código atual (linhas 728-736) - MUITO LIMITADO
const coaching = extractions.coaching_generator;
if (coaching) {
  if (coaching.recommended_actions) fields.recommended_actions = coaching.recommended_actions;
  if (coaching.coaching_priority) fields.coaching_priority = coaching.coaching_priority;
  if (coaching.next_follow_up_date) fields.next_follow_up_date = coaching.next_follow_up_date;
}
```

**~80% dos dados gerados pelo prompt v1.0 são perdidos!**

---

## Estrutura do Novo Prompt vs Banco

```text
PROMPT (aninhado)                              →  BANCO (plano/JSONB)
─────────────────────────────────────────────────────────────────────────
opportunity_diagnosis (objeto)                 →  opportunity_diagnosis (JSONB novo)
opportunity_diagnosis.overall_score            →  opportunity_score (novo)
opportunity_diagnosis.overall_status           →  opportunity_status (novo)
opportunity_diagnosis.win_probability          →  probability (existente - override)
dimension_analysis (objeto)                    →  dimension_analysis (JSONB novo)
priority_actions[] (com scripts)               →  recommended_actions (existente - enriquecido)
approach_adjustments[]                         →  approach_adjustments (JSONB novo)
risk_alerts[]                                  →  risk_alerts (JSONB novo)
seller_coaching (objeto)                       →  seller_coaching (JSONB novo)
seller_coaching.overall_performance            →  seller_performance_score (novo)
next_steps_summary (objeto)                    →  next_steps_summary (JSONB novo)
win_probability_analysis (objeto)              →  win_probability_analysis (JSONB novo)
coaching_summary                               →  coaching_summary (novo)
coaching_priority (legado)                     →  coaching_priority (existente)
next_follow_up_date (legado)                   →  next_follow_up_date (existente)
```

---

## Mudanças no crm-agent-executor.ts

### Substituir Seção do Coaching Generator (linhas 728-736)

```typescript
// ========================================
// COACHING GENERATOR (v1.0)
// ========================================
const coaching = extractions.coaching_generator;
if (coaching) {
  // Helper para acessar dados aninhados
  const get = (obj: unknown, ...paths: string[]): unknown => {
    for (const path of paths) {
      const keys = path.split('.');
      let value: unknown = obj;
      for (const key of keys) {
        if (value && typeof value === 'object' && key in (value as Record<string, unknown>)) {
          value = (value as Record<string, unknown>)[key];
        } else {
          value = undefined;
          break;
        }
      }
      if (value !== undefined) return value;
    }
    return undefined;
  };

  // === 1. DIAGNÓSTICO DA OPORTUNIDADE ===
  const diagnosis = get(coaching, 'opportunity_diagnosis') as Record<string, unknown> | undefined;
  if (diagnosis && typeof diagnosis === 'object') {
    // Armazenar objeto completo
    fields.opportunity_diagnosis = diagnosis;
    
    // Extrair campos específicos para colunas dedicadas
    if (typeof diagnosis.overall_score === 'number') {
      fields.opportunity_score = diagnosis.overall_score;
    }
    if (diagnosis.overall_status) {
      fields.opportunity_status = diagnosis.overall_status;
    }
    // Win probability do coaching pode sobrescrever o do pipeline se mais recente
    if (typeof diagnosis.win_probability === 'number') {
      fields.probability = diagnosis.win_probability;
    }
    // Armazenar strengths e weaknesses
    if (Array.isArray(diagnosis.strengths)) {
      fields.opportunity_strengths = diagnosis.strengths;
    }
    if (Array.isArray(diagnosis.weaknesses)) {
      fields.opportunity_weaknesses = diagnosis.weaknesses;
    }
    if (Array.isArray(diagnosis.critical_issues)) {
      fields.critical_issues = diagnosis.critical_issues;
    }
  }

  // === 2. ANÁLISE DE DIMENSÕES ===
  const dimensionAnalysis = get(coaching, 'dimension_analysis');
  if (dimensionAnalysis && typeof dimensionAnalysis === 'object') {
    fields.dimension_analysis = dimensionAnalysis;
  }

  // === 3. AÇÕES PRIORITÁRIAS (enriquecido) ===
  // Suporta: priority_actions[] (novo) ou recommended_actions (legado)
  const priorityActions = get(coaching, 'priority_actions');
  if (Array.isArray(priorityActions) && priorityActions.length > 0) {
    // Novo formato com scripts completos
    fields.recommended_actions = priorityActions;
    
    // Derivar coaching_priority da primeira ação se não definido
    const firstAction = priorityActions[0] as Record<string, unknown>;
    if (firstAction?.priority_level && !fields.coaching_priority) {
      fields.coaching_priority = firstAction.priority_level;
    }
  } else if (coaching.recommended_actions) {
    // Fallback legado
    fields.recommended_actions = coaching.recommended_actions;
  }

  // === 4. AJUSTES DE ABORDAGEM ===
  const approachAdjustments = get(coaching, 'approach_adjustments');
  if (Array.isArray(approachAdjustments) && approachAdjustments.length > 0) {
    fields.approach_adjustments = approachAdjustments;
  }

  // === 5. ALERTAS DE RISCO ===
  const riskAlerts = get(coaching, 'risk_alerts');
  if (Array.isArray(riskAlerts) && riskAlerts.length > 0) {
    fields.risk_alerts = riskAlerts;
    
    // Calcular nível de risco geral baseado nos alertas
    const hasHighRisk = riskAlerts.some((r: Record<string, unknown>) => r.probability === 'high');
    const hasMediumRisk = riskAlerts.some((r: Record<string, unknown>) => r.probability === 'medium');
    if (hasHighRisk) {
      fields.overall_risk_level = 'high';
    } else if (hasMediumRisk) {
      fields.overall_risk_level = 'medium';
    } else {
      fields.overall_risk_level = 'low';
    }
  }

  // === 6. COACHING DO VENDEDOR ===
  const sellerCoaching = get(coaching, 'seller_coaching') as Record<string, unknown> | undefined;
  if (sellerCoaching && typeof sellerCoaching === 'object') {
    fields.seller_coaching = sellerCoaching;
    
    // Extrair campos específicos
    if (typeof sellerCoaching.overall_performance === 'number') {
      fields.seller_performance_score = sellerCoaching.overall_performance;
    }
    if (sellerCoaching.performance_level) {
      fields.seller_performance_level = sellerCoaching.performance_level;
    }
    if (Array.isArray(sellerCoaching.quick_wins)) {
      fields.seller_quick_wins = sellerCoaching.quick_wins;
    }
    if (sellerCoaching.recognition) {
      fields.seller_recognition = sellerCoaching.recognition;
    }
  }

  // === 7. RESUMO DE PRÓXIMOS PASSOS ===
  const nextStepsSummary = get(coaching, 'next_steps_summary');
  if (nextStepsSummary && typeof nextStepsSummary === 'object') {
    fields.next_steps_summary = nextStepsSummary;
  }

  // === 8. ANÁLISE DE PROBABILIDADE ===
  const winProbAnalysis = get(coaching, 'win_probability_analysis') as Record<string, unknown> | undefined;
  if (winProbAnalysis && typeof winProbAnalysis === 'object') {
    fields.win_probability_analysis = winProbAnalysis;
    
    // Extrair delta se disponível
    if (typeof winProbAnalysis.probability_delta === 'number') {
      fields.probability_delta = winProbAnalysis.probability_delta;
    }
    if (typeof winProbAnalysis.if_actions_executed === 'number') {
      fields.probability_if_actions_executed = winProbAnalysis.if_actions_executed;
    }
  }

  // === 9. RESUMO DO COACHING ===
  const coachingSummary = get(coaching, 'coaching_summary');
  if (coachingSummary) {
    fields.coaching_summary = coachingSummary;
  }

  // === 10. CAMPOS LEGADOS (manter compatibilidade) ===
  // coaching_priority
  const coachingPriority = get(coaching, 'coaching_priority');
  if (coachingPriority && !fields.coaching_priority) {
    fields.coaching_priority = coachingPriority;
  }

  // next_follow_up_date
  const nextFollowUp = get(coaching, 'next_follow_up_date');
  if (nextFollowUp) {
    fields.next_follow_up_date = nextFollowUp;
  }

  // follow_up_message (legado)
  const followUpMessage = get(coaching, 'follow_up_message');
  if (followUpMessage) {
    fields.follow_up_message = followUpMessage;
  }

  // risk_alerts do formato legado
  const legacyRiskAlerts = get(coaching, 'risk_alerts');
  if (Array.isArray(legacyRiskAlerts) && !fields.risk_alerts) {
    fields.risk_alerts = legacyRiskAlerts;
  }

  // strengths/improvements do formato legado
  const legacyStrengths = get(coaching, 'strengths');
  if (Array.isArray(legacyStrengths) && !fields.opportunity_strengths) {
    fields.opportunity_strengths = legacyStrengths;
  }
  const legacyImprovements = get(coaching, 'improvements');
  if (Array.isArray(legacyImprovements)) {
    fields.improvements = legacyImprovements;
  }

  // win_probability_factors do formato legado
  const legacyProbFactors = get(coaching, 'win_probability_factors');
  if (legacyProbFactors && typeof legacyProbFactors === 'object' && !fields.win_probability_analysis) {
    fields.probability_factors = legacyProbFactors;
  }
}
```

---

## Resumo das Mudanças

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Campos mapeados | 3 | 20+ |
| Diagnóstico | Não capturado | Score, status, strengths, weaknesses, critical issues |
| Dimensões | Não capturado | Análise completa por área (qualificação, metodologia, etc.) |
| Ações | Array simples | Objetos ricos com scripts, timing, expected outcome |
| Ajustes de abordagem | Não capturado | Array de mudanças recomendadas |
| Riscos | Não capturado | Alertas com probabilidade, triggers, mitigação |
| Coaching vendedor | Não capturado | Performance score, quick wins, áreas de desenvolvimento |
| Próximos passos | Não capturado | Estruturado por timing (imediato, antes/durante/após visita) |
| Análise de probabilidade | Não capturado | Delta, fatores de aumento/diminuição |

---

## Campos Novos (JSONB)

Os seguintes campos serão armazenados via JSONB:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `opportunity_diagnosis` | JSONB | Diagnóstico completo da oportunidade |
| `dimension_analysis` | JSONB | Análise por dimensão (qualificação, metodologia, etc.) |
| `approach_adjustments` | JSONB | Ajustes de abordagem recomendados |
| `risk_alerts` | JSONB | Alertas de risco com mitigações |
| `seller_coaching` | JSONB | Coaching completo do vendedor |
| `next_steps_summary` | JSONB | Próximos passos estruturados |
| `win_probability_analysis` | JSONB | Análise de probabilidade de ganho |

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/_shared/crm-agent-executor.ts` | Substituir seção Coaching Generator (linhas 728-736) |

---

## Benefícios

1. **Diagnóstico completo**: Score geral, status, forças/fraquezas capturados
2. **Análise dimensional**: Scores por área permitem identificar gaps específicos
3. **Ações com scripts**: Vendedor recebe textos prontos para usar
4. **Gestão de risco**: Alertas com probabilidade e plano de mitigação
5. **Coaching do vendedor**: Performance tracking, quick wins, reconhecimento
6. **Probabilidade projetada**: Delta mostra impacto potencial das ações
7. **Próximos passos estruturados**: Por timing (imediato, antes/durante/após)
8. **Retrocompatibilidade**: Formato legado continua funcionando
