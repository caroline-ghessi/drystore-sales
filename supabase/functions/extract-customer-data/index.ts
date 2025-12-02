import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get appropriate API key based on configured LLM
    let apiKey = '';
    let apiUrl = '';
    let headers = {};
    let requestBody = {};

    const llmModel = extractorAgent.llm_model || 'claude-3-5-sonnet-20241022';
    
    if (llmModel.startsWith('claude')) {
      const claudeApiKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!claudeApiKey) throw new Error('Anthropic API key not configured');
      
      apiUrl = 'https://api.anthropic.com/v1/messages';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      };
      requestBody = {
        model: llmModel,
        max_tokens: 2000,
        messages: [{ role: 'user', content: fullPrompt }]
      };
    } else if (llmModel.startsWith('gpt')) {
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) throw new Error('OpenAI API key not configured');
      
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      };
      requestBody = {
        model: llmModel,
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 2000
      };
    } else if (llmModel.startsWith('grok')) {
      const xaiApiKey = Deno.env.get('XAI_API_KEY');
      if (!xaiApiKey) throw new Error('xAI API key not configured');
      
      apiUrl = 'https://api.x.ai/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${xaiApiKey}`
      };
      requestBody = {
        model: llmModel,
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 2000
      };
    } else {
      throw new Error(`Unsupported LLM model: ${llmModel}`);
    }

    // Call the configured LLM API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API error:', errorText);
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract data based on LLM type
    let extractedDataText = '';
    if (llmModel.startsWith('claude')) {
      extractedDataText = data.content[0].text.trim();
    } else if (llmModel.startsWith('gpt') || llmModel.startsWith('grok')) {
      extractedDataText = data.choices[0].message.content.trim();
    }

    console.log('Raw extraction result:', extractedDataText);

    // Try to parse as JSON
    let extractedData = {};
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
      whatsapp_confirmed: (extractedData as any).whatsapp || (extractedData as any).telefone || null,
      energy_consumption: (extractedData as any)['Consumo de energia'] || (extractedData as any).energy_consumption || null,
      roof_status: (extractedData as any)['Estado do telhado'] || (extractedData as any).roof_status || null,
      project_status: (extractedData as any)['Projeto arquitetônico'] || (extractedData as any).project_status || null,
      floor_rooms: (extractedData as any)['Quantidade de piso'] || (extractedData as any).floor_rooms || null,
      materials_list: (extractedData as any)['Lista de materiais'] ? [(extractedData as any)['Lista de materiais']] : null,
      desired_product: (extractedData as any)['Produto desejado'] || (extractedData as any).desired_product || null,
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
      console.log('Successfully saved to extracted_contexts for conversation:', conversationId);
    }

    // Update conversation data if available
    const conversationUpdates: any = {};
    if ((extractedData as any).nome || (extractedData as any).name) {
      conversationUpdates.customer_name = (extractedData as any).nome || (extractedData as any).name;
    }
    if ((extractedData as any).email) {
      conversationUpdates.customer_email = (extractedData as any).email;
    }
    if ((extractedData as any).cidade || (extractedData as any).city) {
      conversationUpdates.customer_city = (extractedData as any).cidade || (extractedData as any).city;
    }
    if ((extractedData as any).estado || (extractedData as any).state) {
      conversationUpdates.customer_state = (extractedData as any).estado || (extractedData as any).state;
    }

    if (Object.keys(conversationUpdates).length > 0) {
      await supabase
        .from('conversations')
        .update(conversationUpdates)
        .eq('id', conversationId);
    }

    return new Response(JSON.stringify({
      customerData: extractedData,
      contextUpdated: true,
      llmModel: llmModel
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