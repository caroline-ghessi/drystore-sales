import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

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

// Função para extrair dados com rotação automática de provedores
async function extractWithProviderRotation(
  prompt: string,
  maxTokens: number = 2000
): Promise<any> {
  const providers = [
    {
      name: 'Claude',
      model: 'claude-3-5-sonnet-20241022',
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
      url: 'https://api.anthropic.com/v1/messages',
      headers: (key: string) => ({
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      }),
      body: (model: string, prompt: string, tokens: number) => ({
        model,
        max_tokens: tokens,
        messages: [{ role: 'user', content: prompt }]
      }),
      extractResponse: (data: any) => data.content[0].text
    },
    {
      name: 'OpenAI',
      model: 'gpt-4o-mini',
      apiKey: Deno.env.get('OPENAI_API_KEY'),
      url: 'https://api.openai.com/v1/chat/completions',
      headers: (key: string) => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      }),
      body: (model: string, prompt: string, tokens: number) => ({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: tokens
      }),
      extractResponse: (data: any) => data.choices[0].message.content
    },
    {
      name: 'xAI',
      model: 'grok-beta',
      apiKey: Deno.env.get('XAI_API_KEY'),
      url: 'https://api.x.ai/v1/chat/completions',
      headers: (key: string) => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      }),
      body: (model: string, prompt: string, tokens: number) => ({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: tokens
      }),
      extractResponse: (data: any) => data.choices[0].message.content
    }
  ];

  for (const provider of providers) {
    if (!provider.apiKey) {
      console.log(`⚠️ ${provider.name} API key not configured, skipping...`);
      continue;
    }

    try {
      console.log(`🔄 Trying ${provider.name} for data extraction...`);
      
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: provider.headers(provider.apiKey),
        body: JSON.stringify(provider.body(provider.model, prompt, maxTokens))
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ${provider.name} failed:`, response.status, errorText);
        continue; // Try next provider
      }

      const data = await response.json();
      const result = provider.extractResponse(data);
      
      console.log(`✅ ${provider.name} data extraction successful`);
      return result;
      
    } catch (error: any) {
      console.error(`❌ ${provider.name} error:`, error.message);
      continue; // Try next provider
    }
  }

  throw new Error('All data extraction providers failed');
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

    // Call LLM with provider rotation (fixes 404 error)
    console.log('🔄 Calling LLM with provider rotation for data extraction...');
    const extractedDataText = await extractWithProviderRotation(fullPrompt, 2000);

    console.log('Raw extraction result:', extractedDataText);

    // Try to parse as JSON
    let extractedData: Record<string, any> = {};
    try {
      extractedData = JSON.parse(extractedDataText);
    } catch (parseError) {
      console.warn('Failed to parse extracted data as JSON:', parseError);
      // Try to extract basic information even if not JSON
      extractedData = {
        raw_response: extractedDataText
      };
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

    // CORREÇÃO: Salvar também em extracted_contexts para uso do RAG e agentes
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
      providersUsed: 'rotation'
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
