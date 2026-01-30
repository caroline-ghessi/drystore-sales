/**
 * Opportunity Matcher - Sistema de Detecção de Duplicados
 * 
 * Verifica se uma nova conversa deve criar uma oportunidade nova
 * ou atualizar uma existente (merge).
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

interface OpportunityCandidate {
  id: string;
  title: string;
  product_category: string | null;
  stage: string;
  value: number;
  created_at: string;
  updated_at: string;
  customer?: { phone: string } | null;
}

interface AIDecision {
  decision: 'merge' | 'new' | 'review';
  existing_opportunity_id?: string;
  confidence: number;
  reasoning: string;
  is_same_subject: boolean;
  has_closure_signals: boolean;
  detected_subject?: string;
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
    // 1. Buscar oportunidades abertas para esse telefone + vendedor
    const { data: openOpportunities, error: searchError } = await supabase
      .from('crm_opportunities')
      .select(`
        id, title, product_category, stage, value, created_at, updated_at,
        customer:crm_customers!inner(phone)
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
 */
async function callOpportunityMatcherAgent(
  supabase: SupabaseClient,
  context: {
    existing_opportunity: OpportunityCandidate;
    new_product_category?: string;
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

    // Preparar dados da oportunidade existente (sem dados sensíveis)
    const existingOppData = {
      id: context.existing_opportunity.id,
      title: context.existing_opportunity.title,
      product_category: context.existing_opportunity.product_category,
      stage: context.existing_opportunity.stage,
      value: context.existing_opportunity.value,
      created_at: context.existing_opportunity.created_at,
      updated_at: context.existing_opportunity.updated_at,
    };

    // Preparar prompt
    const userMessage = `
OPORTUNIDADE EXISTENTE (aberta):
${JSON.stringify(existingOppData, null, 2)}

NOVA CONVERSA:
{
  "product_category": ${context.new_product_category ? `"${context.new_product_category}"` : 'null'},
  "source": "${context.source}"
}

Analise e retorne sua decisão em JSON.
`;

    const response = await callLLM(
      agentConfig.llm_model || 'claude-3-5-sonnet-20241022',
      [
        { role: 'system', content: agentConfig.system_prompt },
        { role: 'user', content: userMessage }
      ],
      {
        maxTokens: agentConfig.max_tokens || 500,
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

    console.log(`[OpportunityMatcher] Decisão da IA: ${parsed.decision} (confidence: ${parsed.confidence})`);
    
    return {
      action: parsed.decision === 'merge' ? 'merge' : 
              parsed.decision === 'new' ? 'create_new' : 'needs_review',
      existing_opportunity_id: context.existing_opportunity.id,
      confidence: parsed.confidence || 0.8,
      reasoning: parsed.reasoning || 'Decisão do agente de IA',
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
