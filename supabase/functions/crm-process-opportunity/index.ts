/**
 * CRM Process Opportunity - Orquestra todos os agentes de IA do CRM
 * 
 * Executa agentes em ordem otimizada:
 * - Paralelo 1 (Extração): client_profiler, project_extractor, deal_extractor
 * - Paralelo 2 (Análise): spin_analyzer, bant_qualifier, objection_analyzer
 * - Sequencial (Decisão): pipeline_classifier → coaching_generator
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  executeAgent,
  executeAgentsInParallel,
  mapToOpportunityFields,
  mapToCustomerFields,
  mapToProjectContextFields,
  type AgentConfig,
  type ConversationMessage,
  type AgentExecutionResult,
} from "../_shared/crm-agent-executor.ts";
import {
  AGENT_NAME_TO_TYPE,
  getAgentExecutionOrder,
  type AgentType,
} from "../_shared/crm-prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessRequest {
  opportunityId: string;
  agentTypes?: AgentType[]; // Opcional: executar apenas agentes específicos
  forceReprocess?: boolean; // Reprocessar mesmo se já analisado
}

interface ProcessResponse {
  success: boolean;
  opportunityId: string;
  results: AgentExecutionResult[];
  totalProcessingTimeMs: number;
  updatedFields: {
    opportunity: number;
    customer: number;
    projectContext: number;
  };
  errors?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: ProcessRequest = await req.json();
    const { opportunityId, agentTypes, forceReprocess } = body;

    if (!opportunityId) {
      throw new Error("opportunityId é obrigatório");
    }

    console.log(`[crm-process-opportunity] Iniciando processamento: ${opportunityId}`);

    // 1. Buscar oportunidade com relacionamentos
    const { data: opportunity, error: oppError } = await supabase
      .from("crm_opportunities")
      .select(`
        *,
        vendor_conversations!crm_opportunities_vendor_conversation_id_fkey (
          id,
          customer_phone,
          customer_name,
          product_category
        )
      `)
      .eq("id", opportunityId)
      .single();

    if (oppError || !opportunity) {
      throw new Error(`Oportunidade não encontrada: ${oppError?.message || "ID inválido"}`);
    }

    // Verificar se já foi analisada recentemente (menos de 1 hora)
    if (!forceReprocess && opportunity.last_ai_analysis_at) {
      const lastAnalysis = new Date(opportunity.last_ai_analysis_at);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (lastAnalysis > hourAgo) {
        console.log(`[crm-process-opportunity] Análise recente encontrada, pulando...`);
        return new Response(
          JSON.stringify({
            success: true,
            opportunityId,
            results: [],
            totalProcessingTimeMs: Date.now() - startTime,
            updatedFields: { opportunity: 0, customer: 0, projectContext: 0 },
            message: "Análise recente já existe. Use forceReprocess=true para reprocessar.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 2. Buscar mensagens da conversa do vendedor
    const vendorConversationId = opportunity.vendor_conversation_id;
    if (!vendorConversationId) {
      throw new Error("Oportunidade não tem conversa de vendedor vinculada");
    }

    // Buscar mensagens incluindo conteúdo processado de mídia
    const { data: messages, error: msgError } = await supabase
      .from("vendor_messages")
      .select("id, content, from_me, timestamp_whatsapp, from_name, message_type, processed_content")
      .eq("conversation_id", vendorConversationId)
      .order("timestamp_whatsapp", { ascending: true })
      .limit(200);

    if (msgError) {
      throw new Error(`Erro ao buscar mensagens: ${msgError.message}`);
    }

    if (!messages || messages.length === 0) {
      throw new Error("Nenhuma mensagem encontrada para análise");
    }

    console.log(`[crm-process-opportunity] ${messages.length} mensagens carregadas`);

    const conversationMessages: ConversationMessage[] = messages.map((m) => ({
      id: m.id,
      content: m.content || "",
      from_me: m.from_me,
      timestamp: m.timestamp_whatsapp,
      sender_name: m.from_name,
      message_type: m.message_type,
      processed_content: m.processed_content,
    }));

    // 3. Buscar configurações dos agentes ativos
    const { data: agentConfigs, error: agentError } = await supabase
      .from("agent_configs")
      .select("*")
      .in("agent_type", ["crm_extractor", "crm_analyzer", "crm_classifier", "crm_coach"])
      .eq("is_active", true);

    if (agentError || !agentConfigs || agentConfigs.length === 0) {
      throw new Error(`Nenhum agente CRM ativo encontrado: ${agentError?.message}`);
    }

    // Mapear agentes por tipo
    const agentsByType = new Map<AgentType, AgentConfig>();
    for (const config of agentConfigs) {
      const agentType = AGENT_NAME_TO_TYPE[config.agent_name];
      if (agentType) {
        agentsByType.set(agentType, config as AgentConfig);
      }
    }

    console.log(`[crm-process-opportunity] ${agentsByType.size} agentes ativos encontrados`);

    // 4. Definir quais agentes executar
    const executionOrder = getAgentExecutionOrder();
    let agentsToRun: AgentType[];

    if (agentTypes && agentTypes.length > 0) {
      // Executar apenas agentes específicos
      agentsToRun = agentTypes.filter((t) => agentsByType.has(t));
    } else {
      // Executar todos os agentes disponíveis
      agentsToRun = [
        ...executionOrder.parallel1,
        ...executionOrder.parallel2,
        ...executionOrder.sequential,
      ].filter((t) => agentsByType.has(t));
    }

    if (agentsToRun.length === 0) {
      throw new Error("Nenhum agente disponível para execução");
    }

    // 5. Executar agentes
    const allResults: AgentExecutionResult[] = [];
    const extractionsByType: Record<AgentType, Record<string, unknown>> = {} as any;
    const errors: string[] = [];

    // Paralelo 1: Extração
    const parallel1Agents = executionOrder.parallel1
      .filter((t) => agentsToRun.includes(t) && agentsByType.has(t))
      .map((type) => ({ config: agentsByType.get(type)!, type }));

    if (parallel1Agents.length > 0) {
      console.log(`[crm-process-opportunity] Executando Paralelo 1: ${parallel1Agents.map((a) => a.type).join(", ")}`);
      const results1 = await executeAgentsInParallel(parallel1Agents, conversationMessages, {
        opportunityId,
        customerId: opportunity.customer_id,
        conversationId: opportunity.conversation_id,
      });

      for (const result of results1) {
        allResults.push(result);
        if (result.success) {
          extractionsByType[result.agentType] = result.extractionData;
        } else if (result.error) {
          errors.push(`${result.agentType}: ${result.error}`);
        }
      }
    }

    // Paralelo 2: Análise
    const parallel2Agents = executionOrder.parallel2
      .filter((t) => agentsToRun.includes(t) && agentsByType.has(t))
      .map((type) => ({ config: agentsByType.get(type)!, type }));

    if (parallel2Agents.length > 0) {
      console.log(`[crm-process-opportunity] Executando Paralelo 2: ${parallel2Agents.map((a) => a.type).join(", ")}`);
      const results2 = await executeAgentsInParallel(
        parallel2Agents,
        conversationMessages,
        { opportunityId },
        extractionsByType
      );

      for (const result of results2) {
        allResults.push(result);
        if (result.success) {
          extractionsByType[result.agentType] = result.extractionData;
        } else if (result.error) {
          errors.push(`${result.agentType}: ${result.error}`);
        }
      }
    }

    // Sequencial: Decisão (pipeline_classifier → coaching_generator)
    for (const agentType of executionOrder.sequential) {
      if (!agentsToRun.includes(agentType) || !agentsByType.has(agentType)) continue;

      console.log(`[crm-process-opportunity] Executando Sequencial: ${agentType}`);
      const config = agentsByType.get(agentType)!;
      const result = await executeAgent(
        config,
        agentType,
        conversationMessages,
        { opportunityId },
        extractionsByType
      );

      allResults.push(result);
      if (result.success) {
        extractionsByType[result.agentType] = result.extractionData;
      } else if (result.error) {
        errors.push(`${result.agentType}: ${result.error}`);
      }
    }

    // 6. Salvar extrações em crm_agent_extractions
    const successfulResults = allResults.filter((r) => r.success);
    if (successfulResults.length > 0) {
      const extractionsToInsert = successfulResults.map((r) => ({
        opportunity_id: opportunityId,
        agent_type: r.agentType,
        extraction_data: r.extractionData,
        confidence: r.confidence,
        model_used: r.modelUsed,
        tokens_used: r.tokensUsed,
        processing_time_ms: r.processingTimeMs,
      }));

      const { error: insertError } = await supabase
        .from("crm_agent_extractions")
        .insert(extractionsToInsert);

      if (insertError) {
        console.error(`[crm-process-opportunity] Erro ao salvar extrações:`, insertError);
        errors.push(`Salvar extrações: ${insertError.message}`);
      }
    }

    // 7. Atualizar tabelas com dados extraídos
    const updatedFields = { opportunity: 0, customer: 0, projectContext: 0 };

    // Atualizar crm_opportunities
    const opportunityFields = mapToOpportunityFields(extractionsByType);
    if (Object.keys(opportunityFields).length > 0) {
      const { error: updateOppError } = await supabase
        .from("crm_opportunities")
        .update(opportunityFields)
        .eq("id", opportunityId);

      if (updateOppError) {
        console.error(`[crm-process-opportunity] Erro ao atualizar oportunidade:`, updateOppError);
        errors.push(`Atualizar oportunidade: ${updateOppError.message}`);
      } else {
        updatedFields.opportunity = Object.keys(opportunityFields).length;
      }
    }

    // Atualizar crm_customers (se existir customer_id)
    if (opportunity.customer_id && extractionsByType.client_profiler) {
      const customerFields = mapToCustomerFields(extractionsByType);
      if (Object.keys(customerFields).length > 0) {
        const { error: updateCustError } = await supabase
          .from("crm_customers")
          .update(customerFields)
          .eq("id", opportunity.customer_id);

        if (updateCustError) {
          console.error(`[crm-process-opportunity] Erro ao atualizar cliente:`, updateCustError);
        } else {
          updatedFields.customer = Object.keys(customerFields).length;
        }
      }
    }

    // Atualizar project_contexts (se existir conversation_id)
    if (opportunity.conversation_id && extractionsByType.project_extractor) {
      const projectFields = mapToProjectContextFields(extractionsByType);
      if (Object.keys(projectFields).length > 0) {
        const { error: updateProjError } = await supabase
          .from("project_contexts")
          .upsert(
            {
              conversation_id: opportunity.conversation_id,
              ...projectFields,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "conversation_id" }
          );

        if (updateProjError) {
          console.error(`[crm-process-opportunity] Erro ao atualizar projeto:`, updateProjError);
        } else {
          updatedFields.projectContext = Object.keys(projectFields).length;
        }
      }
    }

    const totalProcessingTimeMs = Date.now() - startTime;

    console.log(`[crm-process-opportunity] Concluído em ${totalProcessingTimeMs}ms`);
    console.log(`[crm-process-opportunity] Resultados: ${successfulResults.length}/${allResults.length} sucesso`);

    const response: ProcessResponse = {
      success: errors.length === 0,
      opportunityId,
      results: allResults.map((r) => ({
        ...r,
        extractionData: r.success ? r.extractionData : {},
      })),
      totalProcessingTimeMs,
      updatedFields,
      errors: errors.length > 0 ? errors : undefined,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[crm-process-opportunity] Erro:`, errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        totalProcessingTimeMs: Date.now() - startTime,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
