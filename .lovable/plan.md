

# Plano: Atualizar mapToOpportunityFields para Pipeline Classifier v1.0

## Resumo

Atualizar a função `mapToOpportunityFields()` no `crm-agent-executor.ts` para processar a estrutura rica do novo prompt Pipeline Classifier v1.0, incluindo mapeamento de estágios e armazenamento de dados analíticos.

---

## Incompatibilidade Crítica: Estágios

O prompt usa nomenclatura diferente do banco de dados. Precisamos criar um mapeamento:

```text
PROMPT (pipeline_stage)       →  BANCO (stage enum)
─────────────────────────────────────────────────────
new_lead                      →  prospecting
qualifying                    →  qualification
need_identified               →  qualification (merge)
proposal_sent                 →  proposal
negotiating                   →  negotiation
verbal_commitment             →  negotiation (merge)
won                           →  closed_won
lost                          →  closed_lost
```

**Nota:** `need_identified` e `verbal_commitment` não existem no enum do banco, então são mapeados para o estágio mais próximo. O detalhe granular fica no `sub_status`.

---

## Estrutura do Novo Prompt vs Banco

```text
PROMPT (aninhado)                        →  BANCO (plano)
─────────────────────────────────────────────────────────────────
pipeline_stage                           →  stage (normalizado)
pipeline_stage_label                     →  stage_label (novo)
previous_stage                           →  previous_stage (novo)
stage_confidence                         →  stage_confidence (novo)
sub_status                               →  sub_status (novo)
win_probability                          →  probability (existente)
probability_factors                      →  probability_factors (JSONB novo)
stage_evidence                           →  stage_evidence (JSONB novo)
time_in_stage.estimated_days             →  days_in_negotiation (existente)
time_in_stage.is_stuck                   →  is_stuck (novo)
next_stage                               →  next_stage_analysis (JSONB novo)
regression_risk                          →  regression_risk (JSONB novo)
stage_history                            →  stage_history (JSONB novo)
loss_analysis                            →  loss_analysis (JSONB novo)
classification_summary                   →  classification_summary (novo)
recommended_actions (do next_stage)      →  recommended_actions (JSONB existente - merge)
```

---

## Mudanças no crm-agent-executor.ts

### 1. Adicionar Mapeamento de Estágios

```typescript
/**
 * Mapeamento de estágios do prompt para o enum do banco
 * Pipeline Classifier v1.0 → opportunity_stage enum
 */
const PIPELINE_STAGE_MAP: Record<string, string> = {
  // Estágios principais
  'new_lead': 'prospecting',
  'qualifying': 'qualification',
  'need_identified': 'qualification',  // Merge - detalhe vai para sub_status
  'proposal_sent': 'proposal',
  'negotiating': 'negotiation',
  'verbal_commitment': 'negotiation',   // Merge - detalhe vai para sub_status
  'won': 'closed_won',
  'lost': 'closed_lost',
  
  // Fallbacks para compatibilidade com formato antigo
  'prospecting': 'prospecting',
  'qualification': 'qualification',
  'proposal': 'proposal',
  'negotiation': 'negotiation',
  'closing': 'negotiation',  // closing → negotiation
  'closed_won': 'closed_won',
  'closed_lost': 'closed_lost',
};

/**
 * Normaliza estágio do prompt para o enum do banco
 */
function normalizeStage(promptStage: string): string {
  return PIPELINE_STAGE_MAP[promptStage] || promptStage;
}
```

### 2. Atualizar Seção do Pipeline Classifier

Substituir linhas 528-536 por:

```typescript
// ========================================
// PIPELINE CLASSIFIER (v1.0)
// ========================================
const pipeline = extractions.pipeline_classifier;
if (pipeline) {
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

  // === 1. ESTÁGIO NORMALIZADO ===
  // Suporta: pipeline_stage (novo) ou stage (legado)
  const promptStage = get(pipeline, 'pipeline_stage', 'stage') as string | undefined;
  if (promptStage) {
    fields.stage = normalizeStage(promptStage);
    
    // Armazenar o estágio original do prompt para granularidade
    // Se need_identified ou verbal_commitment, colocar em sub_status
    if (promptStage === 'need_identified') {
      fields.sub_status = 'need_identified';
    } else if (promptStage === 'verbal_commitment') {
      fields.sub_status = 'verbal_commitment';
    }
  }

  // === 2. SUB-STATUS ===
  // Suporta: sub_status (novo)
  const subStatus = get(pipeline, 'sub_status') as string | undefined;
  if (subStatus && subStatus !== null) {
    fields.sub_status = subStatus;
  }

  // === 3. ESTÁGIO ANTERIOR ===
  const previousStage = get(pipeline, 'previous_stage') as string | undefined;
  if (previousStage) {
    fields.previous_stage = normalizeStage(previousStage);
  }

  // === 4. PROBABILIDADE ===
  // Suporta: win_probability (novo) ou probability (legado)
  const winProbability = get(pipeline, 'win_probability', 'probability');
  if (typeof winProbability === 'number') {
    fields.probability = winProbability;
  }

  // === 5. CONFIANÇA DO ESTÁGIO ===
  const stageConfidence = get(pipeline, 'stage_confidence');
  if (typeof stageConfidence === 'number') {
    fields.stage_confidence = stageConfidence;
  }

  // === 6. TEMPERATURA (sobrescreve Deal Extractor se presente) ===
  const temperature = get(pipeline, 'temperature');
  if (temperature) {
    fields.temperature = temperature;
  }

  // === 7. FATORES DE PROBABILIDADE ===
  const probabilityFactors = get(pipeline, 'probability_factors');
  if (probabilityFactors && typeof probabilityFactors === 'object') {
    fields.probability_factors = probabilityFactors;
  }

  // === 8. EVIDÊNCIAS DO ESTÁGIO ===
  const stageEvidence = get(pipeline, 'stage_evidence');
  if (stageEvidence && typeof stageEvidence === 'object') {
    fields.stage_evidence = stageEvidence;
  }

  // === 9. TEMPO NO ESTÁGIO ===
  const timeInStage = get(pipeline, 'time_in_stage') as Record<string, unknown> | undefined;
  if (timeInStage && typeof timeInStage === 'object') {
    // Mapear para campo existente
    if (typeof timeInStage.estimated_days === 'number') {
      fields.days_in_negotiation = timeInStage.estimated_days;
    }
    // Novos campos
    if (typeof timeInStage.is_stuck === 'boolean') {
      fields.is_stuck = timeInStage.is_stuck;
    }
    if (timeInStage.stuck_reason) {
      fields.stuck_reason = timeInStage.stuck_reason;
    }
  }
  // Fallback legado
  const daysInCurrentStage = get(pipeline, 'days_in_current_stage');
  if (typeof daysInCurrentStage === 'number' && !fields.days_in_negotiation) {
    fields.days_in_negotiation = daysInCurrentStage;
  }

  // === 10. ANÁLISE DO PRÓXIMO ESTÁGIO ===
  const nextStage = get(pipeline, 'next_stage') as Record<string, unknown> | undefined;
  if (nextStage && typeof nextStage === 'object') {
    fields.next_stage_analysis = nextStage;
    
    // Extrair recommended_actions para o campo existente (merge)
    const recommendedActions = nextStage.recommended_actions;
    if (Array.isArray(recommendedActions)) {
      // Merge com coaching actions se existir, ou usar direto
      if (fields.recommended_actions) {
        // Pipeline actions têm prioridade mais alta, colocar primeiro
        fields.recommended_actions = [
          ...recommendedActions,
          ...(fields.recommended_actions as unknown[])
        ];
      } else {
        fields.recommended_actions = recommendedActions;
      }
    }
    
    // Extrair blockers para campo dedicado
    if (Array.isArray(nextStage.blockers)) {
      fields.stage_blockers = nextStage.blockers;
    }
  }

  // === 11. RISCO DE REGRESSÃO ===
  const regressionRisk = get(pipeline, 'regression_risk') as Record<string, unknown> | undefined;
  if (regressionRisk && typeof regressionRisk === 'object') {
    fields.regression_risk = regressionRisk;
    
    // Extrair risk_level para campo separado
    if (regressionRisk.risk_level) {
      fields.risk_level = regressionRisk.risk_level;
    }
  }

  // === 12. HISTÓRICO DE ESTÁGIOS ===
  const stageHistory = get(pipeline, 'stage_history');
  if (stageHistory && typeof stageHistory === 'object') {
    fields.stage_history = stageHistory;
  }

  // === 13. ANÁLISE DE PERDA (só se lost) ===
  const lossAnalysis = get(pipeline, 'loss_analysis') as Record<string, unknown> | undefined;
  if (lossAnalysis && typeof lossAnalysis === 'object') {
    fields.loss_analysis = lossAnalysis;
    
    // Mapear campos específicos de perda
    if (lossAnalysis.reason) {
      fields.lost_reason = lossAnalysis.reason;
    }
    if (lossAnalysis.competitor) {
      fields.lost_to_competitor = lossAnalysis.competitor;
    }
  }

  // === 14. RESUMO DA CLASSIFICAÇÃO ===
  const classificationSummary = get(pipeline, 'classification_summary');
  if (classificationSummary) {
    fields.classification_summary = classificationSummary;
  }

  // === 15. METADADOS LEGADOS ===
  // stage_reasoning (legado) → manter compatibilidade
  const stageReasoning = get(pipeline, 'stage_reasoning');
  if (stageReasoning) {
    fields.stage_reasoning = stageReasoning;
  }

  // blockers (legado - array simples)
  const blockers = get(pipeline, 'blockers');
  if (Array.isArray(blockers) && !fields.stage_blockers) {
    fields.stage_blockers = blockers;
  }

  // risk_factors (legado)
  const riskFactors = get(pipeline, 'risk_factors');
  if (Array.isArray(riskFactors)) {
    fields.risk_factors = riskFactors;
  }
}
```

---

## Resumo das Mudanças

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Estágios | Passados direto | Normalizados via mapeamento |
| Estágios granulares | Perdidos | Preservados em `sub_status` |
| Estágio anterior | Não rastreado | `previous_stage` |
| Confiança | Não capturada | `stage_confidence` |
| Tempo no estágio | Só dias | + `is_stuck`, `stuck_reason` |
| Próximo estágio | Não capturado | `next_stage_analysis` (JSONB) |
| Risco de regressão | Não capturado | `regression_risk` (JSONB) |
| Histórico | Não capturado | `stage_history` (JSONB) |
| Análise de perda | Não capturada | `loss_analysis` (JSONB) |
| Ações recomendadas | Só coaching | Merge pipeline + coaching |

---

## Campos Novos (JSONB)

Estes campos serão armazenados em colunas JSONB genéricas (não precisam de colunas dedicadas):

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `probability_factors` | JSONB | Fatores positivos e negativos |
| `stage_evidence` | JSONB | Sinais e mensagens-chave |
| `next_stage_analysis` | JSONB | Target, requirements, blockers, actions |
| `regression_risk` | JSONB | Nível de risco e fatores |
| `stage_history` | JSONB | Progressão inferida de estágios |
| `loss_analysis` | JSONB | Análise detalhada de perda |

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/_shared/crm-agent-executor.ts` | 1. Adicionar `PIPELINE_STAGE_MAP` e `normalizeStage()` <br> 2. Substituir seção Pipeline Classifier (linhas 528-536) |

---

## Benefícios

1. **Compatibilidade de estágios**: Prompt pode usar nomenclatura rica, banco recebe valores válidos
2. **Granularidade preservada**: Estados como `need_identified` e `verbal_commitment` vão para `sub_status`
3. **Análise de progressão**: Histórico de estágios e evidências armazenados
4. **Gestão de risco**: Regressão e blockers rastreados
5. **Ações priorizadas**: Merge de ações do pipeline + coaching
6. **Análise de perda**: Motivos e lições aprendidas documentados
7. **Retrocompatibilidade**: Formato legado continua funcionando

