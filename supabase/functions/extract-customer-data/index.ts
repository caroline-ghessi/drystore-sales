import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { callLLM, normalizeModel, type LLMMessage } from '../_shared/llm-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para sanitizar dados antes de salvar (previne problemas de encoding)
function sanitize(input: string | null): string {
  if (!input) return '';
  return input
    .normalize('NFKC')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/["\n\r\\<>]/g, ' ')
    .substring(0, 200)
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { conversationId, message } = await req.json();

    if (!conversationId || !message) {
      throw new Error('ConversationId and message are required');
    }

    console.log('Extracting customer data for conversation:', conversationId);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get extractor agent configuration from new table
    const { data: extractorAgent, error: agentError } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('agent_type', 'extractor')
      .eq('is_active', true)
      .single();

    if (agentError || !extractorAgent) {
      console.error('Failed to load extractor agent:', agentError);
      throw new Error('Extractor agent not configured');
    }

    // Get conversation history
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw new Error(`Failed to get messages: ${messagesError.message}`);
    }

    // Build conversation history
    const conversationHistory = messages.map(msg => 
      `${msg.sender_type === 'customer' ? 'Cliente' : 'Atendente'}: ${msg.content}`
    ).join('\n');

    // Use the system prompt directly with conversation context
    const fullPrompt = `${extractorAgent.system_prompt}

Histórico da conversa:
${conversationHistory}

Última mensagem: "${message}"`;

    // Usar cliente LLM unificado com fallback automático
    const configuredModel = extractorAgent.llm_model || 'claude-3-5-sonnet-20241022';
    const { model: normalizedModel, provider } = normalizeModel(configuredModel);
    
    console.log(`🔄 Calling LLM (${provider}: ${normalizedModel}) for data extraction...`);
    
    const llmMessages: LLMMessage[] = [
      { role: 'user', content: fullPrompt }
    ];

    const llmResponse = await callLLM(normalizedModel, llmMessages, {
      maxTokens: extractorAgent.max_tokens || 2000,
      temperature: extractorAgent.temperature || 0.3,
    });

    const extractedDataText = llmResponse.content;
    console.log(`✅ ${llmResponse.provider} data extraction successful`);
    console.log('Raw extraction result:', extractedDataText);

    // Try to parse as JSON
    let extractedData: Record<string, any> = {};
    try {
      const jsonMatch = extractedDataText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData = { raw_response: extractedDataText };
      }
    } catch (parseError) {
      console.warn('Failed to parse extracted data as JSON:', parseError);
      extractedData = { raw_response: extractedDataText };
    }

    console.log('Parsed extracted data:', extractedData);

    // Update project context and conversation data
    const contextData = {
      conversation_id: conversationId,
      whatsapp_confirmed: extractedData.whatsapp || extractedData.telefone || null,
      energy_consumption: extractedData['Consumo de energia'] || extractedData.energy_consumption || null,
      roof_status: extractedData['Estado do telhado'] || extractedData.roof_status || null,
      project_status: extractedData['Projeto arquitetônico'] || extractedData.project_status || null,
      floor_rooms: extractedData['Quantidade de piso'] || extractedData.floor_rooms || null,
      materials_list: extractedData['Lista de materiais'] ? [extractedData['Lista de materiais']] : null,
      desired_product: extractedData['Produto desejado'] || extractedData.desired_product || null,
      notes: `Dados extraídos: ${JSON.stringify(extractedData)}`,
      updated_at: new Date().toISOString()
    };

    // Upsert project context
    await supabase
      .from('project_contexts')
      .upsert(contextData, {
        onConflict: 'conversation_id'
      });

    // Salvar também em extracted_contexts para uso do RAG e agentes
    const { error: extractedContextError } = await supabase
      .from('extracted_contexts')
      .insert({
        conversation_id: conversationId,
        context_type: 'customer_data',
        context_data: extractedData,
        source_message_id: null,
        extractor_agent_id: extractorAgent.id,
        confidence: 1.0,
        is_active: true
      });

    if (extractedContextError) {
      console.warn('Failed to save to extracted_contexts:', extractedContextError);
    } else {
      console.log('✅ Successfully saved to extracted_contexts for conversation:', conversationId);
    }

    // Update conversation data if available (with sanitization)
    const conversationUpdates: Record<string, any> = {};
    if (extractedData.nome || extractedData.name) {
      conversationUpdates.customer_name = sanitize(extractedData.nome || extractedData.name);
    }
    if (extractedData.email) {
      conversationUpdates.customer_email = sanitize(extractedData.email);
    }
    if (extractedData.cidade || extractedData.city) {
      conversationUpdates.customer_city = sanitize(extractedData.cidade || extractedData.city);
    }
    if (extractedData.estado || extractedData.state) {
      conversationUpdates.customer_state = sanitize(extractedData.estado || extractedData.state);
    }

    if (Object.keys(conversationUpdates).length > 0) {
      await supabase
        .from('conversations')
        .update(conversationUpdates)
        .eq('id', conversationId);
      
      console.log(`✅ Conversation ${conversationId} updated with:`, Object.keys(conversationUpdates));
    }

    return new Response(JSON.stringify({
      customerData: extractedData,
      contextUpdated: true,
      modelUsed: llmResponse.model,
      providerUsed: llmResponse.provider
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error extracting customer data:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'extract-customer-data',
      message: 'Failed to extract customer data',
      data: { error: errorMessage }
    });

    return new Response(JSON.stringify({
      customerData: {},
      contextUpdated: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
