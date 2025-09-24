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

    // Gerar resposta usando rotação automática de provedores
    const response = await generateResponseWithProviderRotation(
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

    // Se todos os provedores falharam, usar resposta de emergência
    return new Response(JSON.stringify({ 
      response: 'Desculpe, estamos enfrentando dificuldades técnicas momentâneas. Um de nossos atendentes entrará em contato em breve.',
      agentName: 'Sistema de Emergência',
      agentType: 'emergency',
      error: error.message
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Função para gerar resposta com rotação automática de provedores
async function generateResponseWithProviderRotation(
  prompt: string,
  temperature: number = 0.7,
  maxTokens: number = 500
): Promise<string> {
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
      body: (model: string, prompt: string, temp: number, tokens: number) => ({
        model,
        max_tokens: tokens,
        temperature: temp,
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
      body: (model: string, prompt: string, temp: number, tokens: number) => ({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: tokens,
        temperature: temp
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
      body: (model: string, prompt: string, temp: number, tokens: number) => ({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: tokens,
        temperature: temp
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
      console.log(`🔄 Trying ${provider.name} for response generation...`);
      
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: provider.headers(provider.apiKey),
        body: JSON.stringify(provider.body(provider.model, prompt, temperature, maxTokens))
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ ${provider.name} failed:`, response.status, errorText);
        continue; // Try next provider
      }

      const data = await response.json();
      const result = provider.extractResponse(data);
      
      console.log(`✅ ${provider.name} response generation successful`);
      return result;
      
    } catch (error: any) {
      console.error(`❌ ${provider.name} error:`, error.message);
      continue; // Try next provider
    }
  }

  throw new Error('All response generation providers failed');
}