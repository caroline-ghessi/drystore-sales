/**
 * Opportunity Matcher - Sistema de Detecção de Duplicados
 * 
 * Verifica se uma nova conversa deve criar uma oportunidade nova
 * ou atualizar uma existente (merge).
 * 
 * Compatível com Prompt v1.0:
 * - Envia mensagens da conversa para análise de sinais de fechamento
 * - Suporta formato estruturado de reasoning
 * 
 * Fluxo:
 * 1. Verificação programática: busca oportunidades abertas
 * 2. Se encontrar 1 candidata do mesmo vendedor → chamar IA
 * 3. IA decide: merge | create_new | needs_review
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { callLLM, extractJSON } from './llm-client.ts';

export interface MatcherInput {
  customer_phone: string;
  vendor_id: string;
  product_category?: string;
  conversation_id?: string;
  vendor_conversation_id?: number;
  source: 'whatsapp' | 'vendor_whatsapp';
}

export interface MatcherResult {
  action: 'create_new' | 'merge' | 'needs_review';
  existing_opportunity_id?: string;
  confidence: number;
  reasoning: string;
  decided_by: 'rule' | string; // 'rule' ou 'ai:agent_id'
}

// Interface expandida para suportar mais dados
interface OpportunityCandidate {
  id: string;
  title: string;
  product_category: string | null;
  stage: string;
  value: number;
  created_at: string;
  updated_at: string;
  description?: string;
  proposal_value?: number;
  probability?: number;
  conversation_id?: string;
  customer?: { 
    phone: string;
    name?: string;
  } | null;
}

// Formato de reasoning estruturado conforme Prompt v1.0
interface AIDecisionReasoning {
  new_conversation_subject: string;
  existing_opportunity_subject: string;
  subject_match: boolean | null;
  was_closed: boolean;
  closure_signals_found: string[];
  conclusion: string;
}

// Interface AIDecision compatível com Prompt v1.0
interface AIDecision {
  decision: 'merge' | 'new' | 'review';
  target_opportunity_id?: string | null;
  confidence: number;
  reasoning: AIDecisionReasoning | string; // Suporta ambos formatos
  signals?: {
    for_merge: string[];
    for_new: string[];
  };
  recommendation?: string;
}

// Formato de mensagem para a IA
interface ConversationMessage {
  role: 'client' | 'vendor';
  content: string;
}

/**
 * Busca últimas mensagens de uma conversa
 */
async function getConversationMessages(
  supabase: SupabaseClient,
  conversationId: string | undefined,
  limit: number = 10
): Promise<ConversationMessage[]> {
  if (!conversationId) return [];
  
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('sender_type, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[OpportunityMatcher] Erro ao buscar mensagens:', error.message);
      return [];
    }

    return (messages || []).reverse().map(m => ({
      role: m.sender_type === 'customer' ? 'client' as const : 'vendor' as const,
      content: m.content || ''
    }));
  } catch (error) {
    console.warn('[OpportunityMatcher] Exceção ao buscar mensagens:', error);
    return [];
  }
}

/**
 * Verifica se deve criar nova oportunidade ou fazer merge com existente
 */
export async function checkOpportunityDuplicate(
  supabase: SupabaseClient,
  input: MatcherInput
): Promise<MatcherResult> {
  console.log(`[OpportunityMatcher] Verificando duplicação para ${input.customer_phone} (vendor: ${input.vendor_id})`);

  try {
    // 1. Buscar oportunidades abertas para esse telefone + vendedor (com dados expandidos)
    const { data: openOpportunities, error: searchError } = await supabase
      .from('crm_opportunities')
      .select(`
        id, title, product_category, stage, value, 
        created_at, updated_at, description,
        proposal_value, probability,
        conversation_id,
        customer:crm_customers!inner(phone, name)
      `)
      .eq('vendor_id', input.vendor_id)
      .not('stage', 'in', '("closed_won","closed_lost")')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (searchError) {
      console.error('[OpportunityMatcher] Erro ao buscar oportunidades:', searchError);
      // Em caso de erro, criar nova por segurança
      return {
        action: 'create_new',
        confidence: 0.5,
        reasoning: `Erro ao verificar duplicação: ${searchError.message}`,
        decided_by: 'rule'
      };
    }

    // Filtrar oportunidades pelo telefone do cliente
    const matchingOpportunities = (openOpportunities || []).filter((opp: OpportunityCandidate) => {
      const customerPhone = (opp.customer as { phone?: string })?.phone;
      return customerPhone === input.customer_phone;
    });

    console.log(`[OpportunityMatcher] Encontradas ${matchingOpportunities.length} oportunidades abertas para este cliente/vendedor`);

    // 2. Se não encontrou nenhuma aberta → criar nova (sem IA)
    if (matchingOpportunities.length === 0) {
      return {
        action: 'create_new',
        confidence: 1.0,
        reasoning: 'Nenhuma oportunidade aberta encontrada para este cliente/vendedor',
        decided_by: 'rule'
      };
    }

    // 3. Se encontrou 1 do mesmo vendedor → verificar categoria e chamar IA se necessário
    if (matchingOpportunities.length === 1) {
      const existingOpp = matchingOpportunities[0] as OpportunityCandidate;
      
      // 3.1 Verificação rápida por categoria diferente (se ambas conhecidas)
      if (input.product_category && existingOpp.product_category) {
        if (input.product_category !== existingOpp.product_category) {
          return {
            action: 'create_new',
            existing_opportunity_id: existingOpp.id,
            confidence: 0.95,
            reasoning: `Cross-sell detectado: nova conversa é ${input.product_category}, existente é ${existingOpp.product_category}`,
            decided_by: 'rule'
          };
        }
      }
      
      // 3.2 Mesmo produto ou categoria desconhecida → chamar IA
      const aiResult = await callOpportunityMatcherAgent(supabase, {
        existing_opportunity: existingOpp,
        new_product_category: input.product_category,
        new_conversation_id: input.conversation_id,
        source: input.source
      });
      
      return aiResult;
    }

    // 4. Múltiplas oportunidades abertas → needs_review
    const mostRecent = matchingOpportunities[0] as OpportunityCandidate;
    return {
      action: 'needs_review',
      existing_opportunity_id: mostRecent.id,
      confidence: 0.5,
      reasoning: `${matchingOpportunities.length} oportunidades abertas encontradas para este cliente - requer revisão manual`,
      decided_by: 'rule'
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[OpportunityMatcher] Erro inesperado:', error);
    
    // Em caso de erro inesperado, criar nova por segurança
    return {
      action: 'create_new',
      confidence: 0.5,
      reasoning: `Erro inesperado na verificação: ${errorMsg}`,
      decided_by: 'rule'
    };
  }
}

/**
 * Chama o agente de IA para decidir entre merge/new/review
 * Compatível com Prompt v1.0
 */
async function callOpportunityMatcherAgent(
  supabase: SupabaseClient,
  context: {
    existing_opportunity: OpportunityCandidate;
    new_product_category?: string;
    new_conversation_id?: string;
    source: string;
  }
): Promise<MatcherResult> {
  console.log(`[OpportunityMatcher] Chamando agente de IA para oportunidade ${context.existing_opportunity.id}`);

  try {
    // Buscar configuração do agente
    const { data: agentConfig, error: agentError } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('agent_type', 'crm_validator')
      .eq('agent_name', 'Opportunity Matcher')
      .eq('is_active', true)
      .single();

    if (agentError || !agentConfig) {
      console.warn('[OpportunityMatcher] Agente não encontrado ou inativo, usando fallback');
      // Fallback se agente não configurado: merge por padrão (mais seguro que criar duplicação)
      return {
        action: 'merge',
        existing_opportunity_id: context.existing_opportunity.id,
        confidence: 0.7,
        reasoning: 'Agente não configurado - assumindo continuação da negociação existente',
        decided_by: 'rule'
      };
    }

    // Buscar mensagens da oportunidade existente (via conversation_id)
    const existingMessages = await getConversationMessages(
      supabase, 
      context.existing_opportunity.conversation_id,
      8  // últimas 8 mensagens para contexto suficiente
    );

    // Buscar mensagens da nova conversa (se tivermos conversation_id)
    const newMessages = context.new_conversation_id 
      ? await getConversationMessages(supabase, context.new_conversation_id, 5)
      : [];

    console.log(`[OpportunityMatcher] Mensagens carregadas - existente: ${existingMessages.length}, nova: ${newMessages.length}`);

    // Preparar dados da oportunidade existente no formato do Prompt v1.0
    const existingOppData = {
      id: context.existing_opportunity.id,
      title: context.existing_opportunity.title,
      status: context.existing_opportunity.stage,
      pipeline_stage: context.existing_opportunity.stage,
      product_category: context.existing_opportunity.product_category,
      created_at: context.existing_opportunity.created_at,
      updated_at: context.existing_opportunity.updated_at,
      proposal_value: context.existing_opportunity.proposal_value || null,
      client_name: context.existing_opportunity.customer?.name || 'Desconhecido',
      summary: context.existing_opportunity.description || null,
      last_messages: existingMessages
    };

    // Preparar prompt no formato esperado pelo Prompt v1.0
    const userMessage = `
### 1. Oportunidades Existentes (do mesmo telefone)
\`\`\`json
{
  "opportunities": [${JSON.stringify(existingOppData, null, 2)}]
}
\`\`\`

### 2. Nova Conversa
\`\`\`json
{
  "product_category": ${context.new_product_category ? `"${context.new_product_category}"` : 'null'},
  "new_messages": ${JSON.stringify(newMessages)},
  "source": "${context.source}",
  "timestamp": "${new Date().toISOString()}"
}
\`\`\`

Analise e retorne sua decisão em JSON.
`;

    const response = await callLLM(
      agentConfig.llm_model || 'claude-3-5-sonnet-20241022',
      [
        { role: 'system', content: agentConfig.system_prompt },
        { role: 'user', content: userMessage }
      ],
      {
        maxTokens: agentConfig.max_tokens || 800,
        temperature: agentConfig.temperature || 0.1
      }
    );

    // Parse resposta
    const parsed = extractJSON<AIDecision>(response.content);
    
    if (!parsed) {
      console.error('[OpportunityMatcher] Falha ao parsear resposta da IA:', response.content);
      // Fallback em caso de parse error: merge
      return {
        action: 'merge',
        existing_opportunity_id: context.existing_opportunity.id,
        confidence: 0.6,
        reasoning: 'Erro ao parsear resposta da IA - assumindo continuação',
        decided_by: 'rule'
      };
    }

    // Extrair reasoning (pode ser objeto ou string)
    let reasoningText: string;
    if (typeof parsed.reasoning === 'object' && parsed.reasoning !== null) {
      reasoningText = parsed.reasoning.conclusion || 'Decisão do agente de IA';
    } else if (typeof parsed.reasoning === 'string') {
      reasoningText = parsed.reasoning;
    } else {
      reasoningText = 'Decisão do agente de IA';
    }

    // Usar target_opportunity_id se fornecido, senão usar o ID da oportunidade existente
    const targetOpportunityId = parsed.target_opportunity_id || context.existing_opportunity.id;

    console.log(`[OpportunityMatcher] Decisão da IA: ${parsed.decision} (confidence: ${parsed.confidence})`);
    
    return {
      action: parsed.decision === 'merge' ? 'merge' : 
              parsed.decision === 'new' ? 'create_new' : 'needs_review',
      existing_opportunity_id: targetOpportunityId,
      confidence: parsed.confidence || 0.8,
      reasoning: reasoningText,
      decided_by: `ai:${agentConfig.id}`
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[OpportunityMatcher] Erro ao chamar IA:', error);
    
    // Fallback em caso de erro: merge (mais seguro que duplicar)
    return {
      action: 'merge',
      existing_opportunity_id: context.existing_opportunity.id,
      confidence: 0.6,
      reasoning: `Erro ao processar IA: ${errorMsg} - assumindo continuação`,
      decided_by: 'rule'
    };
  }
}

/**
 * Registra a decisão do matcher no log de auditoria
 */
export async function logMatchDecision(
  supabase: SupabaseClient,
  input: MatcherInput,
  result: MatcherResult,
  newOpportunityId?: string
): Promise<void> {
  try {
    const { error } = await supabase.from('crm_opportunity_match_log').insert({
      customer_phone: input.customer_phone,
      vendor_id: input.vendor_id,
      source: input.source,
      decision: result.action,
      confidence: result.confidence,
      reasoning: result.reasoning,
      existing_opportunity_id: result.existing_opportunity_id || null,
      new_opportunity_id: newOpportunityId || null,
      decided_by: result.decided_by,
      product_category: input.product_category || null,
      metadata: {
        conversation_id: input.conversation_id,
        vendor_conversation_id: input.vendor_conversation_id
      }
    });

    if (error) {
      console.error('[OpportunityMatcher] Erro ao registrar log:', error);
    } else {
      console.log(`[OpportunityMatcher] Decisão registrada: ${result.action} (${result.decided_by})`);
    }
  } catch (error) {
    console.error('[OpportunityMatcher] Erro ao registrar log:', error);
    // Não falha a operação principal se o log falhar
  }
}
