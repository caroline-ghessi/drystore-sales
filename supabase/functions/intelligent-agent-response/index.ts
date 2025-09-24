import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let message = '';
  let conversationId = '';
  let productCategory = '';

  try {
    const requestData = await req.json();
    message = requestData.message || '';
    conversationId = requestData.conversationId || '';
    productCategory = requestData.productCategory || 'indefinido';
    
    console.log(`🤖 Generating intelligent response for category: ${productCategory}`);

    // Buscar dados da conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    // Determinar qual agente usar baseado na categoria da conversa (prioritário) ou parâmetro
    let agentType = 'general';
    let agentCategory = null;
    
    // Usar product_group da conversa como prioritário
    const conversationCategory = conversation.product_group || productCategory;
    
    // Validar se agente atual está correto para a categoria
    const shouldUseSpecialist = conversationCategory && !['indefinido', 'saudacao', 'institucional'].includes(conversationCategory);
    
    if (shouldUseSpecialist) {
      agentType = 'specialist';
      agentCategory = conversationCategory;
      console.log(`🎯 Using specialist agent for category: ${conversationCategory}`);
    } else {
      console.log(`📞 Using general agent for category: ${conversationCategory}`);
    }

    // Buscar configuração do agente
    let agentQuery = supabase
      .from('agent_configs')
      .select('*')
      .eq('agent_type', agentType)
      .eq('is_active', true);
      
    if (agentCategory) {
      agentQuery = agentQuery.eq('product_category', agentCategory);
    } else {
      agentQuery = agentQuery.is('product_category', null);
    }
    
    const { data: agent, error: agentError } = await agentQuery.single();

    let finalAgent = agent;
    if (agentError || !agent) {
      // Fallback para agente geral se especialista não encontrado
      const { data: generalAgent } = await supabase
        .from('agent_configs')
        .select('*')
        .eq('agent_type', 'general')
        .eq('is_active', true)
        .single();
      
      if (!generalAgent) {
        throw new Error('No agent configuration found');
      }
      
      console.log(`⚠️ Using fallback general agent for category: ${conversationCategory}`);
      finalAgent = generalAgent;
    }

    // Buscar histórico da conversa incluindo transcrições
    const { data: messages } = await supabase
      .from('messages')
      .select('content, sender_type, created_at, transcription, media_type')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    const conversationHistory = messages
      ?.map(msg => {
        // Usar transcrição para mensagens de áudio, ou conteúdo original
        const messageContent = (msg.media_type === 'audio/ogg' || msg.media_type === 'audio/mpeg') && msg.transcription
          ? `${msg.transcription} [áudio transcrito]`
          : msg.content;
        return `${msg.sender_type === 'customer' ? 'Cliente' : 'Atendente'}: ${messageContent}`;
      })
      .join('\n') || '';

    // Buscar contextos extraídos
    const { data: extractedContexts } = await supabase
      .from('extracted_contexts')
      .select('context_type, context_data')
      .eq('conversation_id', conversationId)
      .eq('is_active', true);

    const contextInfo = extractedContexts?.map(ctx => 
      `${ctx.context_type}: ${JSON.stringify(ctx.context_data)}`
    ).join('\n') || '';

    // Construir prompt final estruturado
    let finalPrompt = `Você é um assistente especializado da Drystore. ${finalAgent.system_prompt}

INSTRUÇÕES CRÍTICAS:
- NUNCA use mensagens pré-definidas ou templates
- Seja natural, conversacional e útil
- Adapte-se ao contexto da conversa
- Mantenha o tom profissional mas acessível
- Se não souber algo específico, seja honesto e ofereça ajuda alternativa

INFORMAÇÕES DA EMPRESA:
- Drystore: empresa especializada em construção civil
- Atendemos em todo o Sul do Brasil
- Temos expertise em energia solar, telhas, steel frame, drywall, ferramentas, pisos e acabamentos`;

    if (contextInfo) {
      finalPrompt += `\n\nINFORMAÇÕES DO CLIENTE:\n${contextInfo}`;
    }
    
    if (conversationHistory) {
      finalPrompt += `\n\nHISTÓRICO DA CONVERSA:\n${conversationHistory}`;
    }
    
    finalPrompt += `\n\nMENSAGEM DO CLIENTE: "${message}"

RESPOSTA: Responda de forma natural e personalizada, considerando todo o contexto acima.`;

    // Gerar resposta usando a API do LLM configurado
    const response = await callLLMAPI(
      finalAgent.llm_model || 'claude-3-5-sonnet-20241022',
      finalPrompt,
      finalAgent.temperature || 0.7,
      finalAgent.max_tokens || 500
    );

    // Salvar a resposta no banco
    const { data: messageData } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: response,
        sender_type: 'bot',
        agent_id: finalAgent.id,
        agent_type: finalAgent.agent_type,
        status: 'sent'
      })
      .select()
      .single();

    // Atualizar conversa
    await supabase
      .from('conversations')
      .update({
        current_agent_id: finalAgent.id,
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    console.log(`✅ Response generated by ${finalAgent.agent_name}: "${response.substring(0, 100)}..."`);

    return new Response(JSON.stringify({
      response,
      agentName: finalAgent.agent_name,
      agentType: finalAgent.agent_type,
      messageId: messageData.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating intelligent response:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'intelligent-agent-response',
      message: 'Failed to generate response',
      data: { error: error.message, conversationId, message: message.substring(0, 100) }
    });

    // Generate fallback response
    try {
      const fallbackResponse = await generateFallbackResponse(message || 'mensagem não disponível');
      
      return new Response(JSON.stringify({ 
        response: fallbackResponse,
        agentName: 'Agente de Emergência',
        agentType: 'fallback',
        error: error.message
      }), {
        status: 200, // Não retornar 500 para manter o fluxo funcionando
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (fallbackError) {
      console.error('Even fallback failed:', fallbackError);
      
      return new Response(JSON.stringify({ 
        response: 'Desculpe, estamos enfrentando dificuldades técnicas. Um de nossos atendentes entrará em contato em breve.',
        agentName: 'Sistema de Emergência',
        agentType: 'emergency',
        error: error.message
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
});

// Função para chamar APIs de LLM
async function callLLMAPI(
  model: string,
  prompt: string,
  temperature: number = 0.7,
  maxTokens: number = 500
): Promise<string> {
  let apiKey = '';
  let apiUrl = '';
  let headers = {};
  let requestBody = {};

  if (model.startsWith('claude')) {
    apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('Anthropic API key not configured');
    
    apiUrl = 'https://api.anthropic.com/v1/messages';
    headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    };
    requestBody = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }]
    };
  } else if (model.startsWith('gpt')) {
    apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) throw new Error('OpenAI API key not configured');
    
    apiUrl = 'https://api.openai.com/v1/chat/completions';
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    // Use max_completion_tokens for newer models
    if (model.includes('gpt-5') || model.includes('gpt-4.1') || model.includes('o3') || model.includes('o4')) {
      requestBody = {
        model,
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: maxTokens
      };
    } else {
      requestBody = {
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature
      };
    }
  } else if (model.startsWith('grok')) {
    apiKey = Deno.env.get('XAI_API_KEY');
    if (!apiKey) throw new Error('xAI API key not configured');
    
    apiUrl = 'https://api.x.ai/v1/chat/completions';
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    requestBody = {
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature
    };
  } else {
    throw new Error(`Unsupported LLM model: ${model}`);
  }

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
  
  // Extract response based on LLM type
  if (model.startsWith('claude')) {
    return data.content[0].text;
  } else if (model.startsWith('gpt') || model.startsWith('grok')) {
    return data.choices[0].message.content;
  }
  
  throw new Error('Unable to extract response from LLM');
}

// Função de fallback simples para situações de emergência
async function generateFallbackResponse(message: string): Promise<string> {
  const fallbackResponses = [
    'Obrigado pela sua mensagem! Estamos processando sua solicitação e retornaremos em breve.',
    'Recebemos sua mensagem. Em breve um de nossos especialistas entrará em contato.',
    'Agradecemos o contato! Estamos analisando sua solicitação.',
    'Sua mensagem foi recebida. Nosso time técnico irá revisar e responder em breve.'
  ];
  
  // Usar resposta baseada no comprimento da mensagem para variar
  const index = message.length % fallbackResponses.length;
  return fallbackResponses[index];
}