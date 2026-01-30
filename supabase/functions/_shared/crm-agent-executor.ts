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
 */
export function mapToOpportunityFields(
  extractions: Record<AgentType, Record<string, unknown>>
): Partial<Record<string, unknown>> {
  const fields: Record<string, unknown> = {};

  // Deal Extractor
  const deal = extractions.deal_extractor;
  if (deal) {
    if (typeof deal.proposal_requested === 'boolean') fields.proposal_requested = deal.proposal_requested;
    if (typeof deal.proposal_sent === 'boolean') fields.proposal_sent = deal.proposal_sent;
    if (typeof deal.proposal_value === 'number') fields.proposal_value = deal.proposal_value;
    if (typeof deal.client_mentioned_value === 'number') fields.client_mentioned_value = deal.client_mentioned_value;
    if (deal.budget_range) fields.budget_range = deal.budget_range;
    if (deal.competitors) fields.competitors = deal.competitors;
    if (typeof deal.discount_requested === 'number') fields.discount_requested = deal.discount_requested;
    if (typeof deal.discount_offered === 'number') fields.discount_offered = deal.discount_offered;
    if (deal.payment_preference) fields.payment_preference = deal.payment_preference;
    if (typeof deal.visit_offered === 'boolean') fields.visit_offered = deal.visit_offered;
    if (typeof deal.visits_done === 'number') fields.visits_done = deal.visits_done;
    if (deal.first_contact_at) fields.first_contact_at = deal.first_contact_at;
    if (typeof deal.total_interactions === 'number') fields.total_interactions = deal.total_interactions;
  }

  // SPIN Analyzer
  const spin = extractions.spin_analyzer;
  if (spin) {
    if (spin.spin_stage) fields.spin_stage = spin.spin_stage;
    if (typeof spin.spin_score === 'number') fields.spin_score = spin.spin_score;
    if (spin.spin_progress) fields.spin_progress = spin.spin_progress;
  }

  // BANT Qualifier
  const bant = extractions.bant_qualifier;
  if (bant) {
    if (typeof bant.bant_score === 'number') fields.bant_score = bant.bant_score;
    if (typeof bant.bant_qualified === 'boolean') fields.bant_qualified = bant.bant_qualified;
    if (bant.bant_details) fields.bant_details = bant.bant_details;
  }

  // Objection Analyzer
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

  // Pipeline Classifier
  const pipeline = extractions.pipeline_classifier;
  if (pipeline) {
    if (pipeline.stage) fields.stage = pipeline.stage;
    if (typeof pipeline.probability === 'number') fields.probability = pipeline.probability;
    if (pipeline.temperature) fields.temperature = pipeline.temperature;
  }

  // Coaching Generator
  const coaching = extractions.coaching_generator;
  if (coaching) {
    if (coaching.recommended_actions) fields.recommended_actions = coaching.recommended_actions;
    if (coaching.coaching_priority) fields.coaching_priority = coaching.coaching_priority;
    if (coaching.next_follow_up_date) fields.next_follow_up_date = coaching.next_follow_up_date;
  }

  // Metadados
  fields.last_ai_analysis_at = new Date().toISOString();
  fields.analysis_version = '1.0';

  return fields;
}

/**
 * Mapeia dados extraídos para campos da tabela crm_customers
 */
export function mapToCustomerFields(
  extractions: Record<AgentType, Record<string, unknown>>
): Partial<Record<string, unknown>> {
  const fields: Record<string, unknown> = {};

  const profile = extractions.client_profiler;
  if (profile) {
    if (profile.profile_type) fields.profile_type = profile.profile_type;
    if (profile.profession) fields.profession = profile.profession;
    if (typeof profile.is_technical === 'boolean') fields.is_technical = profile.is_technical;
    if (profile.knowledge_level) fields.knowledge_level = profile.knowledge_level;
    if (profile.origin_channel) fields.origin_channel = profile.origin_channel;
    if (profile.origin_source) fields.origin_source = profile.origin_source;
    if (profile.referred_by) fields.referred_by = profile.referred_by;
    if (profile.trigger_event) fields.trigger_event = profile.trigger_event;
    if (profile.main_motivation) fields.main_motivation = profile.main_motivation;
    if (profile.pain_points) fields.pain_points = profile.pain_points;
    if (typeof profile.is_decision_maker === 'boolean') fields.is_decision_maker = profile.is_decision_maker;
    if (profile.decision_makers) fields.decision_makers = profile.decision_makers;
    if (profile.decision_process) fields.decision_process = profile.decision_process;
    
    fields.profile_extracted_at = new Date().toISOString();
  }

  return fields;
}

/**
 * Mapeia dados extraídos para campos da tabela project_contexts
 */
export function mapToProjectContextFields(
  extractions: Record<AgentType, Record<string, unknown>>
): Partial<Record<string, unknown>> {
  const fields: Record<string, unknown> = {};

  const project = extractions.project_extractor;
  if (project) {
    if (project.location) {
      const loc = project.location as Record<string, string>;
      if (loc.neighborhood) fields.location_neighborhood = loc.neighborhood;
      // city e state já existem na conversation
    }
    if (project.project_type_detailed) fields.project_type_detailed = project.project_type_detailed;
    if (project.project_phase) fields.project_phase = project.project_phase;
    if (typeof project.has_professional === 'boolean') fields.has_professional = project.has_professional;
    if (project.professional_name) fields.professional_name = project.professional_name;
    if (project.technical_specs) fields.technical_specs = project.technical_specs;
    if (project.products_needed) fields.products_needed = project.products_needed;
    if (project.estimated_quantities) fields.estimated_quantities = project.estimated_quantities;
    if (project.deadline_urgency) fields.deadline_urgency = project.deadline_urgency;
    if (project.start_date) fields.start_date = project.start_date;
  }

  return fields;
}
