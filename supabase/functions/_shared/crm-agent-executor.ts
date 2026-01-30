/**
 * CRM Agent Executor - Executa agentes de IA do CRM
 * 
 * Responsável por:
 * - Buscar configuração do agente
 * - Montar prompt com contexto da conversa
 * - Chamar LLM e parsear resposta
 * - Retornar dados estruturados
 */

import { callLLM, extractJSON, type LLMMessage, type LLMResponse } from './llm-client.ts';
import { CRM_AGENT_PROMPTS, type AgentType } from './crm-prompts.ts';

export interface AgentConfig {
  id: string;
  agent_name: string;
  agent_type: string;
  system_prompt: string;
  llm_model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  output_schema?: Record<string, unknown> | null;
}

export interface ConversationMessage {
  id: number;
  content: string;
  from_me: boolean;
  timestamp: string;
  sender_name?: string;
  message_type?: string;      // Tipo de mídia: text, audio, image, document
  processed_content?: string; // Conteúdo processado (transcrição/descrição)
}

export interface AgentExecutionResult {
  agentType: AgentType;
  agentName: string;
  extractionData: Record<string, unknown>;
  confidence: number;
  tokensUsed: number;
  processingTimeMs: number;
  modelUsed: string;
  success: boolean;
  error?: string;
}

export interface ExecutionContext {
  opportunityId: string;
  customerId?: string;
  conversationId?: string;
  previousExtractions?: Record<AgentType, Record<string, unknown>>;
}

/**
 * Formata mensagens da conversa para o prompt
 */
/**
 * Retorna label do tipo de mídia para exibição no prompt
 */
function getMediaTypeLabel(type?: string): string {
  switch (type) {
    case 'audio':
    case 'voice':
    case 'ptt':
      return '🎤 [Áudio Transcrito]';
    case 'image':
      return '📷 [Imagem Descrita]';
    case 'document':
      return '📄 [Documento Extraído]';
    case 'video':
      return '🎬 [Vídeo]';
    case 'sticker':
      return '😀 [Figurinha]';
    default:
      return '';
  }
}

/**
 * Formata mensagens da conversa para o prompt, incluindo conteúdo processado de mídia
 */
export function formatConversationForPrompt(messages: ConversationMessage[]): string {
  if (!messages || messages.length === 0) {
    return '[Nenhuma mensagem disponível]';
  }

  // Ordenar por timestamp
  const sorted = [...messages].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Limitar a últimas 100 mensagens para não estourar contexto
  const recent = sorted.slice(-100);

  return recent.map(msg => {
    const sender = msg.from_me ? '🧑‍💼 VENDEDOR' : '👤 CLIENTE';
    const time = new Date(msg.timestamp).toLocaleString('pt-BR');
    
    // Usar conteúdo processado quando disponível para mídia
    let messageContent = msg.content;
    if (msg.processed_content && msg.message_type && msg.message_type !== 'text') {
      const typeLabel = getMediaTypeLabel(msg.message_type);
      messageContent = `${typeLabel}: ${msg.processed_content}`;
    }
    
    return `[${time}] ${sender}: ${messageContent}`;
  }).join('\n\n');
}

/**
 * Monta o prompt completo para o agente
 */
function buildAgentPrompt(
  agentType: AgentType,
  conversationText: string,
  context?: ExecutionContext,
  previousExtractions?: Record<AgentType, Record<string, unknown>>,
  customOutputSchema?: Record<string, unknown> | null
): string {
  const promptConfig = CRM_AGENT_PROMPTS[agentType];
  if (!promptConfig) {
    throw new Error(`Configuração de prompt não encontrada para: ${agentType}`);
  }

  let prompt = `## CONVERSA VENDEDOR-CLIENTE\n\n${conversationText}\n\n`;

  // Adicionar contexto de extrações anteriores para agentes de decisão
  if (previousExtractions && Object.keys(previousExtractions).length > 0) {
    prompt += `## ANÁLISES ANTERIORES\n\n`;
    
    for (const [type, data] of Object.entries(previousExtractions)) {
      if (data && Object.keys(data).length > 0) {
        prompt += `### ${type}\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n\n`;
      }
    }
  }

  prompt += `## INSTRUÇÕES\n\n${promptConfig.instructions}\n\n`;
  
  // Use custom output schema from DB if provided and not empty, otherwise use default from prompts
  const effectiveSchema = (customOutputSchema && Object.keys(customOutputSchema).length > 0)
    ? customOutputSchema
    : promptConfig.outputSchema;
    
  prompt += `## FORMATO DE SAÍDA ESPERADO\n\nRetorne APENAS um JSON válido seguindo este schema:\n\`\`\`json\n${JSON.stringify(effectiveSchema, null, 2)}\n\`\`\``;

  return prompt;
}

/**
 * Executa um agente específico
 */
export async function executeAgent(
  agentConfig: AgentConfig,
  agentType: AgentType,
  conversationMessages: ConversationMessage[],
  context?: ExecutionContext,
  previousExtractions?: Record<AgentType, Record<string, unknown>>
): Promise<AgentExecutionResult> {
  const startTime = Date.now();

  try {
    // Formatar conversa
    const conversationText = formatConversationForPrompt(conversationMessages);
    
    // Montar prompt - use output_schema from agent config if available
    const userPrompt = buildAgentPrompt(
      agentType, 
      conversationText, 
      context,
      previousExtractions,
      agentConfig.output_schema // Pass custom schema from database
    );

    // Preparar mensagens para LLM
    const messages: LLMMessage[] = [
      { role: 'system', content: agentConfig.system_prompt },
      { role: 'user', content: userPrompt }
    ];

    // Chamar LLM
    const response: LLMResponse = await callLLM(
      agentConfig.llm_model,
      messages,
      {
        temperature: agentConfig.temperature,
        maxTokens: agentConfig.max_tokens,
      }
    );

    // Extrair JSON da resposta
    const extractedData = extractJSON<Record<string, unknown>>(response.content);
    
    if (!extractedData) {
      throw new Error('Não foi possível extrair JSON válido da resposta do LLM');
    }

    const processingTimeMs = Date.now() - startTime;
    const confidence = typeof extractedData.confidence === 'number' 
      ? extractedData.confidence 
      : 0.5;

    return {
      agentType,
      agentName: agentConfig.agent_name,
      extractionData: extractedData,
      confidence,
      tokensUsed: response.tokensUsed || 0,
      processingTimeMs,
      modelUsed: response.model,
      success: true,
    };
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`[crm-agent-executor] Erro ao executar ${agentType}:`, errorMessage);
    
    return {
      agentType,
      agentName: agentConfig.agent_name,
      extractionData: {},
      confidence: 0,
      tokensUsed: 0,
      processingTimeMs,
      modelUsed: agentConfig.llm_model,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Executa múltiplos agentes em paralelo
 */
export async function executeAgentsInParallel(
  agents: { config: AgentConfig; type: AgentType }[],
  conversationMessages: ConversationMessage[],
  context?: ExecutionContext,
  previousExtractions?: Record<AgentType, Record<string, unknown>>
): Promise<AgentExecutionResult[]> {
  const promises = agents.map(({ config, type }) =>
    executeAgent(config, type, conversationMessages, context, previousExtractions)
  );

  return Promise.all(promises);
}

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
  // PIPELINE CLASSIFIER (v1.0)
  // ========================================
  const pipeline = extractions.pipeline_classifier;
  if (pipeline) {
    /**
     * Mapeamento de estágios do prompt para o enum do banco
     * Pipeline Classifier v1.0 → opportunity_stage enum
     */
    const PIPELINE_STAGE_MAP: Record<string, string> = {
      // Estágios principais do novo prompt
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
    const normalizeStage = (promptStage: string): string => {
      return PIPELINE_STAGE_MAP[promptStage] || promptStage;
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
    // Suporta: sub_status (novo) - sobrescreve se definido
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

/**
 * Helper para extrair valor de estrutura aninhada ou flat
 * Suporta paths como "profile.profession" ou campos diretos como "profession"
 */
function getNestedValue(obj: Record<string, unknown>, ...paths: string[]): unknown {
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
}

/**
 * Mapeia dados extraídos para campos da tabela crm_customers
 * Suporta tanto estrutura flat (legado) quanto aninhada (novo prompt v1.0)
 * 
 * Estrutura aninhada esperada:
 * {
 *   identification: { name, email, city, state, neighborhood },
 *   profile: { profile_type, profession, is_technical, knowledge_level },
 *   origin: { channel, source, referred_by, campaign },
 *   motivation: { main_motivation, trigger_event, buying_stage, urgency_level },
 *   pain_points: [...],
 *   decision: { is_decision_maker, decision_type, other_stakeholders, decision_process }
 * }
 */
export function mapToCustomerFields(
  extractions: Record<AgentType, Record<string, unknown>>
): Partial<Record<string, unknown>> {
  const fields: Record<string, unknown> = {};

  const profile = extractions.client_profiler;
  if (!profile) return fields;

  // === IDENTIFICATION ===
  // Suporta: identification.name (novo) ou name (legado)
  const name = getNestedValue(profile, 'identification.name', 'name');
  if (name) fields.name = name;

  const email = getNestedValue(profile, 'identification.email', 'email');
  if (email) fields.email = email;

  const city = getNestedValue(profile, 'identification.city', 'city');
  if (city) fields.city = city;

  const state = getNestedValue(profile, 'identification.state', 'state');
  if (state) fields.state = state;

  // Novo campo - apenas estrutura aninhada
  const neighborhood = getNestedValue(profile, 'identification.neighborhood');
  if (neighborhood) fields.neighborhood = neighborhood;

  // === PROFILE ===
  // Suporta: profile.profile_type (novo) ou profile_type (legado)
  const profileType = getNestedValue(profile, 'profile.profile_type', 'profile_type');
  if (profileType) fields.profile_type = profileType;

  const profession = getNestedValue(profile, 'profile.profession', 'profession');
  if (profession) fields.profession = profession;

  const company = getNestedValue(profile, 'profile.company_name', 'company');
  if (company) fields.company = company;

  const isTechnical = getNestedValue(profile, 'profile.is_technical', 'is_technical');
  if (typeof isTechnical === 'boolean') fields.is_technical = isTechnical;

  const knowledgeLevel = getNestedValue(profile, 'profile.knowledge_level', 'knowledge_level');
  if (knowledgeLevel) fields.knowledge_level = knowledgeLevel;

  // === ORIGIN ===
  // Suporta: origin.channel (novo) ou origin_channel (legado)
  const originChannel = getNestedValue(profile, 'origin.channel', 'origin_channel');
  if (originChannel) fields.origin_channel = originChannel;

  const originSource = getNestedValue(profile, 'origin.source', 'origin_source');
  if (originSource) fields.origin_source = originSource;

  const referredBy = getNestedValue(profile, 'origin.referred_by', 'referred_by');
  if (referredBy) fields.referred_by = referredBy;

  // Novo campo - campanha
  const campaign = getNestedValue(profile, 'origin.campaign');
  if (campaign) fields.campaign = campaign;

  // === MOTIVATION ===
  // Suporta: motivation.main_motivation (novo) ou main_motivation (legado)
  const mainMotivation = getNestedValue(profile, 'motivation.main_motivation', 'main_motivation');
  if (mainMotivation) fields.main_motivation = mainMotivation;

  const triggerEvent = getNestedValue(profile, 'motivation.trigger_event', 'trigger_event');
  if (triggerEvent) fields.trigger_event = triggerEvent;

  // Novos campos de motivação
  const buyingStage = getNestedValue(profile, 'motivation.buying_stage');
  if (buyingStage) fields.buying_stage = buyingStage;

  const urgencyLevel = getNestedValue(profile, 'motivation.urgency_level');
  if (urgencyLevel) fields.urgency_level = urgencyLevel;

  // === PAIN POINTS ===
  // Suporta: pain_points (array) em ambos formatos
  const painPoints = getNestedValue(profile, 'pain_points');
  if (painPoints && Array.isArray(painPoints)) {
    fields.pain_points = painPoints;
  }

  // === DECISION ===
  // Suporta: decision.is_decision_maker (novo) ou is_decision_maker (legado)
  const isDecisionMaker = getNestedValue(profile, 'decision.is_decision_maker', 'is_decision_maker');
  if (typeof isDecisionMaker === 'boolean') fields.is_decision_maker = isDecisionMaker;

  // Suporta: decision.other_stakeholders (novo) ou decision_makers (legado)
  const decisionMakers = getNestedValue(profile, 'decision.other_stakeholders', 'decision_makers');
  if (decisionMakers && Array.isArray(decisionMakers)) {
    fields.decision_makers = decisionMakers;
  }

  const decisionProcess = getNestedValue(profile, 'decision.decision_process', 'decision_process');
  if (decisionProcess) fields.decision_process = decisionProcess;

  // Novo campo - decision_type (couple_consensus, individual, etc.)
  const decisionType = getNestedValue(profile, 'decision.decision_type');
  if (decisionType) fields.decision_type = decisionType;

  // Novos campos - blockers e timeline
  const decisionBlockers = getNestedValue(profile, 'decision.decision_blockers');
  if (decisionBlockers && Array.isArray(decisionBlockers)) {
    fields.decision_blockers = decisionBlockers;
  }

  const decisionTimeline = getNestedValue(profile, 'decision.decision_timeline');
  if (decisionTimeline) fields.decision_timeline = decisionTimeline;

  // === ADDITIONAL INSIGHTS ===
  // Novos campos do prompt enriquecido
  const insights = profile.additional_insights as Record<string, unknown> | undefined;
  if (insights) {
    if (insights.communication_style) fields.communication_style = insights.communication_style;
    if (insights.engagement_level) fields.engagement_level = insights.engagement_level;
    if (insights.price_sensitivity) fields.price_sensitivity = insights.price_sensitivity;
    if (insights.trust_signals) fields.trust_signals = insights.trust_signals;
    if (insights.concern_signals) fields.concern_signals = insights.concern_signals;
    if (insights.notes) fields.profile_notes = insights.notes;
  }

  // Metadados
  fields.profile_extracted_at = new Date().toISOString();

  return fields;
}

/**
 * Mapeia dados extraídos para campos da tabela project_contexts
 * Suporta tanto estrutura flat (legado) quanto aninhada (novo prompt v1.0)
 * 
 * Estrutura aninhada esperada (Project Extractor v1.0):
 * {
 *   location: { city, neighborhood, address, ... },
 *   property: { category, subtype, description },
 *   project: { nature, phase, has_architectural_project },
 *   professionals: { has_professionals, professionals_list: [...] },
 *   technical_data: { category, energy_solar/telhas_shingle/etc... },
 *   products_needed: [...],
 *   timeline: { deadline_urgency, desired_start_date, ... }
 * }
 */
export function mapToProjectContextFields(
  extractions: Record<AgentType, Record<string, unknown>>
): Partial<Record<string, unknown>> {
  const fields: Record<string, unknown> = {};
  const project = extractions.project_extractor;
  
  if (!project) return fields;

  // Reutilizar helper getNestedValue já existente
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

  // === 1. LOCALIZAÇÃO ===
  const neighborhood = get(project, 'location.neighborhood', 'neighborhood');
  if (neighborhood) fields.location_neighborhood = neighborhood;

  // === 2. TIPO DE PROJETO (combinar category + nature) ===
  const propCategory = get(project, 'property.category');
  const projNature = get(project, 'project.nature');
  const propSubtype = get(project, 'property.subtype');
  if (propCategory || projNature) {
    const parts = [propCategory, propSubtype, projNature].filter(Boolean);
    fields.project_type_detailed = parts.join(' - ');
  }
  // Fallback para formato antigo
  const oldType = get(project, 'project_type_detailed');
  if (oldType && !fields.project_type_detailed) {
    fields.project_type_detailed = oldType;
  }

  // === 3. FASE DO PROJETO ===
  const phase = get(project, 'project.phase', 'project_phase');
  if (phase) fields.project_phase = phase;

  // === 4. PROJETO ARQUITETÔNICO ===
  const hasArchProject = get(project, 'project.has_architectural_project', 'has_architectural_project');
  if (typeof hasArchProject === 'boolean') {
    fields.has_architectural_project = hasArchProject;
  }

  // === 5. PROFISSIONAIS ===
  const hasPro = get(project, 'professionals.has_professionals', 'has_professional');
  if (typeof hasPro === 'boolean') fields.has_professional = hasPro;

  const professionals = get(project, 'professionals.professionals_list');
  if (Array.isArray(professionals) && professionals.length > 0) {
    const first = professionals[0] as Record<string, unknown>;
    const name = first?.name || first?.company;
    const role = first?.role;
    if (name) {
      fields.professional_name = role ? `${name} (${role})` : String(name);
    }
  }
  // Fallback para formato antigo
  const oldProName = get(project, 'professional_name');
  if (oldProName && !fields.professional_name) {
    fields.professional_name = oldProName;
  }

  // === 6. DADOS TÉCNICOS (JSONB completo) ===
  const techData = get(project, 'technical_data') as Record<string, unknown> | undefined;
  if (techData && typeof techData === 'object') {
    fields.technical_specs = techData;

    // Extrair campos específicos para colunas dedicadas
    const category = techData.category as string | undefined;
    
    // Solar
    if (category === 'energia_solar' || techData.energy_solar) {
      const solar = (techData.energy_solar || techData) as Record<string, unknown>;
      const consumption = solar.energy_consumption as Record<string, unknown> | undefined;
      
      if (consumption?.monthly_kwh) {
        fields.energy_consumption = String(consumption.monthly_kwh);
      }
      if (consumption?.monthly_value_brl) {
        fields.energy_bill_value = consumption.monthly_value_brl;
      }
      const roof = solar.roof as Record<string, unknown> | undefined;
      if (roof?.area_m2) {
        fields.roof_size_m2 = roof.area_m2;
      }
      if (roof?.condition) {
        fields.roof_status = roof.condition;
      }
    }
    
    // Shingle
    if (category === 'telhas_shingle' || techData.telhas_shingle) {
      const shingle = (techData.telhas_shingle || techData) as Record<string, unknown>;
      const roof = shingle.roof as Record<string, unknown> | undefined;
      if (roof?.area_m2) {
        fields.roof_size_m2 = roof.area_m2;
      }
      if (roof?.current_condition) {
        fields.roof_status = roof.current_condition;
      }
    }
    
    // Light Steel Frame
    if (category === 'light_steel_frame' || techData.light_steel_frame) {
      const lsf = (techData.light_steel_frame || techData) as Record<string, unknown>;
      const construction = lsf.construction as Record<string, unknown> | undefined;
      if (construction?.total_area_m2) {
        fields.construction_size_m2 = construction.total_area_m2;
      }
    }
  }
  // Fallback para formato antigo
  const oldTechSpecs = get(project, 'technical_specs');
  if (oldTechSpecs && !fields.technical_specs) {
    fields.technical_specs = oldTechSpecs;
  }

  // === 7. PRODUTOS NECESSÁRIOS ===
  const products = get(project, 'products_needed') as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(products) && products.length > 0) {
    fields.products_needed = products;
    // Também popular materials_list (array de strings)
    fields.materials_list = products.map(p => 
      typeof p === 'string' ? p : (p.product || p.name || JSON.stringify(p)) as string
    );
  }

  // === 8. QUANTIDADES ESTIMADAS (derivar de products se não existir) ===
  const quantities = get(project, 'estimated_quantities');
  if (quantities) {
    fields.estimated_quantities = quantities;
  } else if (Array.isArray(products)) {
    const derived: Record<string, string> = {};
    products.forEach(p => {
      if (p.product && p.quantity) {
        derived[p.product as string] = `${p.quantity} ${p.unit || 'un'}`;
      }
    });
    if (Object.keys(derived).length > 0) {
      fields.estimated_quantities = derived;
    }
  }

  // === 9. TIMELINE ===
  const timeline = get(project, 'timeline') as Record<string, unknown> | undefined;
  if (timeline) {
    if (timeline.deadline_urgency) {
      fields.deadline_urgency = timeline.deadline_urgency;
      fields.urgency = timeline.deadline_urgency;
    }
    if (timeline.desired_start_date) {
      fields.start_date = timeline.desired_start_date;
    }
    if (timeline.desired_completion_date) {
      fields.timeline = timeline.desired_completion_date;
    }
  }
  // Fallbacks para formato antigo
  const oldUrgency = get(project, 'deadline_urgency');
  if (oldUrgency && !fields.deadline_urgency) {
    fields.deadline_urgency = oldUrgency;
    fields.urgency = oldUrgency;
  }
  const oldStartDate = get(project, 'start_date');
  if (oldStartDate && !fields.start_date) {
    fields.start_date = oldStartDate;
  }

  return fields;
}
