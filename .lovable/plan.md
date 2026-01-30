
# Plano: Atualizar mapToOpportunityFields para Deal Extractor v1.0

## Resumo

Atualizar a função `mapToOpportunityFields()` no `crm-agent-executor.ts` para processar a estrutura aninhada rica do novo prompt Deal Extractor v1.0, mantendo retrocompatibilidade com schemas anteriores.

---

## Estrutura do Novo Prompt vs Banco de Dados

O prompt Deal Extractor v1.0 organiza dados em blocos aninhados profundos, mas a tabela `crm_opportunities` tem campos em estrutura plana. O mapper precisa "achatar" os dados:

```text
PROMPT (aninhado)                              →  BANCO (plano)
─────────────────────────────────────────────────────────────────────
proposal.sent                                  →  proposal_sent
proposal.total_value                           →  proposal_value
proposal.status                                →  proposal_status (novo)
proposal (objeto completo)                     →  proposal_details (JSONB)
competitors.has_competitors                    →  has_competitors (novo)
competitors.competitors_list                   →  competitors (JSONB existente)
negotiation.discount_requested.value           →  discount_requested
negotiation.discount_given.value               →  discount_offered
negotiation.discount_given.percent             →  discount_percent (novo)
payment.preferred_method                       →  payment_preference
payment.entry_value                            →  entry_value (novo)
payment.financed_value                         →  financed_value (novo)
payment.installments                           →  installments (novo)
payment (objeto completo)                      →  payment_details (JSONB)
visits.technical_visit.scheduled               →  visit_offered / visits_scheduled
visits.technical_visit.status                  →  visit_status (novo)
deal_status.current_status                     →  deal_status (novo)
deal_status.temperature                        →  temperature (existente)
deal_status.win_probability                    →  probability (existente)
next_steps.commitment                          →  next_step_commitment (JSONB)
next_steps.pending_actions                     →  pending_actions (JSONB)
loss_info.lost                                 →  is_lost (novo)
loss_info.lost_reason                          →  lost_reason (novo)
loss_info.lost_to_competitor                   →  lost_to_competitor (novo)
deal_summary                                   →  deal_summary (JSONB)
```

---

## Mudanças no crm-agent-executor.ts

### Função Atualizada

Substituir a função `mapToOpportunityFields` (linhas 253-329) por uma versão expandida:

```typescript
/**
 * Mapeia dados extraídos para campos da tabela crm_opportunities
 * Suporta tanto estrutura flat (legado) quanto aninhada (Deal Extractor v1.0)
 * 
 * Estrutura aninhada esperada (Deal Extractor v1.0):
 * {
 *   proposal: { sent, total_value, items, status, ... },
 *   competitors: { has_competitors, competitors_list: [...] },
 *   negotiation: { discount_requested: {...}, discount_given: {...}, tradeoffs },
 *   payment: { preferred_method, entry_value, financing: {...} },
 *   visits: { technical_visit: {...}, commercial_visit: {...} },
 *   deal_status: { current_status, temperature, win_probability },
 *   next_steps: { commitment: {...}, pending_actions: [...] },
 *   loss_info: { lost, lost_reason, lost_to_competitor },
 *   deal_summary: { value_at_stake, key_factors, risks, opportunities }
 * }
 */
export function mapToOpportunityFields(
  extractions: Record<AgentType, Record<string, unknown>>
): Partial<Record<string, unknown>> {
  const fields: Record<string, unknown> = {};

  // Helper para acessar dados aninhados ou flat
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

  // ========================================
  // DEAL EXTRACTOR
  // ========================================
  const deal = extractions.deal_extractor;
  if (deal) {
    // === 1. PROPOSTA ===
    // Suporta: proposal.sent (novo) ou proposal_sent (legado)
    const proposalSent = get(deal, 'proposal.sent', 'proposal_sent');
    if (typeof proposalSent === 'boolean') fields.proposal_sent = proposalSent;

    // Suporta: proposal.total_value (novo) ou proposal_value (legado)
    const proposalValue = get(deal, 'proposal.total_value', 'proposal_value');
    if (typeof proposalValue === 'number') fields.proposal_value = proposalValue;

    // Legado: proposal_requested (não existe estrutura aninhada para isso)
    if (typeof deal.proposal_requested === 'boolean') {
      fields.proposal_requested = deal.proposal_requested;
    }

    // Novo: status da proposta
    const proposalStatus = get(deal, 'proposal.status');
    if (proposalStatus) fields.proposal_status = proposalStatus;

    // Novo: armazenar objeto proposal completo para detalhes
    const proposalObj = get(deal, 'proposal') as Record<string, unknown> | undefined;
    if (proposalObj && typeof proposalObj === 'object') {
      fields.proposal_details = proposalObj;
    }

    // === 2. VALOR MENCIONADO PELO CLIENTE ===
    // Suporta apenas legado (não tem estrutura aninhada específica)
    if (typeof deal.client_mentioned_value === 'number') {
      fields.client_mentioned_value = deal.client_mentioned_value;
    }

    // === 3. BUDGET RANGE ===
    const budgetRange = get(deal, 'budget_range');
    if (budgetRange) fields.budget_range = budgetRange;

    // === 4. CONCORRENTES ===
    // Suporta: competitors.competitors_list (novo) ou competitors (legado)
    const competitorsList = get(deal, 'competitors.competitors_list');
    if (Array.isArray(competitorsList) && competitorsList.length > 0) {
      fields.competitors = competitorsList;
    } else if (deal.competitors && Array.isArray(deal.competitors)) {
      // Legado: competitors já é array
      fields.competitors = deal.competitors;
    } else if (deal.competitors && typeof deal.competitors === 'object') {
      // Novo: competitors é objeto completo - armazenar
      fields.competitors = deal.competitors;
    }

    // === 5. NEGOCIAÇÃO - DESCONTO SOLICITADO ===
    // Suporta: negotiation.discount_requested.value (novo) ou discount_requested (legado)
    const discountRequested = get(deal, 'negotiation.discount_requested.value', 'discount_requested');
    if (typeof discountRequested === 'number') fields.discount_requested = discountRequested;

    // Novo: percentual solicitado
    const discountRequestedPercent = get(deal, 'negotiation.discount_requested.percent');
    if (typeof discountRequestedPercent === 'number') {
      fields.discount_requested_percent = discountRequestedPercent;
    }

    // === 6. NEGOCIAÇÃO - DESCONTO CONCEDIDO ===
    // Suporta: negotiation.discount_given.value (novo) ou discount_offered (legado)
    const discountGiven = get(deal, 'negotiation.discount_given.value', 'discount_offered');
    if (typeof discountGiven === 'number') fields.discount_offered = discountGiven;

    // Novo: percentual concedido
    const discountGivenPercent = get(deal, 'negotiation.discount_given.percent');
    if (typeof discountGivenPercent === 'number') {
      fields.discount_percent = discountGivenPercent;
    }

    // Novo: valores original e final
    const originalValue = get(deal, 'negotiation.discount_given.original_value');
    if (typeof originalValue === 'number') fields.original_value = originalValue;

    const finalValue = get(deal, 'negotiation.discount_given.final_value');
    if (typeof finalValue === 'number') fields.final_value = finalValue;

    // === 7. PAGAMENTO ===
    // Suporta: payment.preferred_method (novo) ou payment_preference (legado)
    const paymentMethod = get(deal, 'payment.preferred_method', 'payment_preference');
    if (paymentMethod) fields.payment_preference = paymentMethod;

    // Novo: entrada e financiamento
    const entryValue = get(deal, 'payment.entry_value');
    if (typeof entryValue === 'number') fields.entry_value = entryValue;

    const financedValue = get(deal, 'payment.financed_value');
    if (typeof financedValue === 'number') fields.financed_value = financedValue;

    const installments = get(deal, 'payment.installments');
    if (typeof installments === 'number') fields.installments = installments;

    // Novo: armazenar objeto payment completo
    const paymentObj = get(deal, 'payment') as Record<string, unknown> | undefined;
    if (paymentObj && typeof paymentObj === 'object' && Object.keys(paymentObj).length > 0) {
      fields.payment_details = paymentObj;
    }

    // === 8. VISITAS ===
    // Suporta: visits.technical_visit.offered (novo) ou visit_offered (legado)
    const visitOffered = get(deal, 'visits.technical_visit.offered', 'visit_offered');
    if (typeof visitOffered === 'boolean') fields.visit_offered = visitOffered;

    // Suporta: visits.technical_visit.scheduled
    const visitScheduled = get(deal, 'visits.technical_visit.scheduled');
    if (typeof visitScheduled === 'boolean') fields.visit_scheduled = visitScheduled;

    // Novo: status da visita
    const visitStatus = get(deal, 'visits.technical_visit.status');
    if (visitStatus) fields.visit_status = visitStatus;

    // Contar visitas realizadas
    const visitStatusValue = get(deal, 'visits.technical_visit.status');
    if (visitStatusValue === 'completed') {
      fields.visits_done = 1;
    } else if (typeof deal.visits_done === 'number') {
      fields.visits_done = deal.visits_done;
    }

    // Novo: armazenar objeto visits completo
    const visitsObj = get(deal, 'visits') as Record<string, unknown> | undefined;
    if (visitsObj && typeof visitsObj === 'object') {
      fields.visits_details = visitsObj;
    }

    // === 9. STATUS DO DEAL ===
    // Suporta: deal_status.temperature (novo) ou temperature (via pipeline)
    const temperature = get(deal, 'deal_status.temperature');
    if (temperature) fields.temperature = temperature;

    // Suporta: deal_status.win_probability (novo) ou probability (via pipeline)
    const winProbability = get(deal, 'deal_status.win_probability');
    if (typeof winProbability === 'number') fields.probability = winProbability;

    // Novo: status atual da negociação (mais granular que stage)
    const dealStatus = get(deal, 'deal_status.current_status');
    if (dealStatus) fields.deal_status = dealStatus;

    // Novo: armazenar objeto deal_status completo
    const dealStatusObj = get(deal, 'deal_status') as Record<string, unknown> | undefined;
    if (dealStatusObj && typeof dealStatusObj === 'object') {
      fields.deal_status_details = dealStatusObj;
    }

    // === 10. PRÓXIMOS PASSOS ===
    // Novo: commitment
    const commitment = get(deal, 'next_steps.commitment');
    if (commitment && typeof commitment === 'object') {
      fields.next_step_commitment = commitment;
      // Extrair descrição para next_step (campo texto existente)
      const commitmentDesc = (commitment as Record<string, unknown>).description;
      if (commitmentDesc) fields.next_step = commitmentDesc;
    }

    // Novo: pending_actions
    const pendingActions = get(deal, 'next_steps.pending_actions');
    if (Array.isArray(pendingActions) && pendingActions.length > 0) {
      fields.pending_actions = pendingActions;
    }

    // Novo: armazenar objeto next_steps completo
    const nextStepsObj = get(deal, 'next_steps') as Record<string, unknown> | undefined;
    if (nextStepsObj && typeof nextStepsObj === 'object') {
      fields.next_steps_details = nextStepsObj;
    }

    // === 11. INFORMAÇÕES DE PERDA ===
    const lossInfo = get(deal, 'loss_info') as Record<string, unknown> | undefined;
    if (lossInfo && typeof lossInfo === 'object') {
      if (typeof lossInfo.lost === 'boolean' && lossInfo.lost) {
        fields.is_lost = true;
        fields.lost_reason = lossInfo.lost_reason || null;
        fields.lost_to_competitor = lossInfo.lost_to_competitor || null;
        fields.lost_details = lossInfo.lost_details || null;
        fields.recoverable = lossInfo.recoverable || null;
      }
      // Armazenar objeto completo
      fields.loss_info = lossInfo;
    }

    // === 12. RESUMO DO DEAL ===
    const dealSummary = get(deal, 'deal_summary') as Record<string, unknown> | undefined;
    if (dealSummary && typeof dealSummary === 'object') {
      fields.deal_summary = dealSummary;
      // Extrair value_at_stake se disponível
      if (typeof dealSummary.value_at_stake === 'number') {
        fields.value_at_stake = dealSummary.value_at_stake;
      }
    }

    // === 13. METADADOS LEGADOS ===
    if (deal.first_contact_at) fields.first_contact_at = deal.first_contact_at;
    if (typeof deal.total_interactions === 'number') {
      fields.total_interactions = deal.total_interactions;
    }
  }

  // ========================================
  // SPIN ANALYZER (sem mudanças)
  // ========================================
  const spin = extractions.spin_analyzer;
  if (spin) {
    if (spin.spin_stage) fields.spin_stage = spin.spin_stage;
    if (typeof spin.spin_score === 'number') fields.spin_score = spin.spin_score;
    if (spin.spin_progress) fields.spin_progress = spin.spin_progress;
  }

  // ========================================
  // BANT QUALIFIER (sem mudanças)
  // ========================================
  const bant = extractions.bant_qualifier;
  if (bant) {
    if (typeof bant.bant_score === 'number') fields.bant_score = bant.bant_score;
    if (typeof bant.bant_qualified === 'boolean') fields.bant_qualified = bant.bant_qualified;
    if (bant.bant_details) fields.bant_details = bant.bant_details;
  }

  // ========================================
  // OBJECTION ANALYZER (sem mudanças)
  // ========================================
  const objections = extractions.objection_analyzer;
  if (objections) {
    if (Array.isArray(objections.objections)) {
      fields.objections = objections.objections.map((o: { description?: string }) => 
        typeof o === 'string' ? o : o.description || ''
      );
    }
    if (objections.objections_analysis || objections) {
      fields.objections_analysis = objections;
    }
    if (typeof objections.objection_handling_score === 'number') {
      fields.objection_handling_score = objections.objection_handling_score;
    }
  }

  // ========================================
  // PIPELINE CLASSIFIER (sem mudanças)
  // ========================================
  const pipeline = extractions.pipeline_classifier;
  if (pipeline) {
    if (pipeline.stage) fields.stage = pipeline.stage;
    if (typeof pipeline.probability === 'number') fields.probability = pipeline.probability;
    if (pipeline.temperature) fields.temperature = pipeline.temperature;
  }

  // ========================================
  // COACHING GENERATOR (sem mudanças)
  // ========================================
  const coaching = extractions.coaching_generator;
  if (coaching) {
    if (coaching.recommended_actions) fields.recommended_actions = coaching.recommended_actions;
    if (coaching.coaching_priority) fields.coaching_priority = coaching.coaching_priority;
    if (coaching.next_follow_up_date) fields.next_follow_up_date = coaching.next_follow_up_date;
  }

  // ========================================
  // METADADOS
  // ========================================
  fields.last_ai_analysis_at = new Date().toISOString();
  fields.analysis_version = '1.0';

  return fields;
}
```

---

## Resumo das Mudanças

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Estrutura suportada | Plana | Aninhada + plana (fallback) |
| Proposta | `proposal_sent`, `proposal_value` | + `proposal_details` (JSONB), `proposal_status` |
| Concorrentes | Array simples | Array de objetos detalhados com evidências |
| Desconto | Valores absolutos | + percentuais, valores original/final |
| Pagamento | Só `payment_preference` | + `entry_value`, `financed_value`, `installments`, `payment_details` |
| Visitas | `visit_offered`, `visits_done` | + `visit_scheduled`, `visit_status`, `visits_details` |
| Status | Via Pipeline Classifier | + `deal_status`, `deal_status_details` do Deal Extractor |
| Próximos passos | Nenhum | `next_step_commitment`, `pending_actions`, `next_steps_details` |
| Perda | Nenhum | `is_lost`, `lost_reason`, `lost_to_competitor`, `loss_info` |
| Resumo | Nenhum | `deal_summary`, `value_at_stake` |

---

## Campos Novos Que Irão para JSONB

Os seguintes campos serão armazenados via JSONB genérico (não precisam de colunas dedicadas inicialmente):

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `proposal_details` | JSONB | Objeto completo da proposta (itens, validade, etc.) |
| `payment_details` | JSONB | Detalhes de financiamento, bancos, etc. |
| `visits_details` | JSONB | Visitas técnicas e comerciais |
| `deal_status_details` | JSONB | Status completo com dias no status |
| `next_steps_details` | JSONB | Compromisso e ações pendentes |
| `loss_info` | JSONB | Informações de perda |
| `deal_summary` | JSONB | Resumo com fatores, riscos, oportunidades |
| `pending_actions` | JSONB | Lista de ações pendentes |

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/_shared/crm-agent-executor.ts` | Substituir `mapToOpportunityFields()` (linhas 253-329) |

---

## Benefícios

1. **Dados de proposta ricos**: Itens detalhados, status, validade - não só valor total
2. **Concorrentes detalhados**: Forças, fraquezas, percepção do cliente, evidências
3. **Negociação completa**: Descontos solicitados vs concedidos, percentuais, contrapartidas
4. **Pagamento estruturado**: Entrada, financiamento, parcelas, bancos discutidos
5. **Visitas rastreáveis**: Status, propósito, resultado - não só "sim/não"
6. **Próximos passos claros**: Compromissos e ações pendentes com responsáveis
7. **Análise de perda**: Motivo, concorrente, recuperabilidade - aprendizado
8. **Retrocompatibilidade**: Agentes com formato antigo continuam funcionando
