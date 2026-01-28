import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Função de sanitização para prevenir prompt injection
function sanitize(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .normalize('NFKC')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/["\n\r\\<>]/g, ' ')
    .substring(0, 100)
    .trim();
}

// Função utilitária para obter data/hora de Brasília
function getBrasiliaDateTime() {
  const now = new Date();
  const brasiliaTime = new Date(now.toLocaleString('en-US', { 
    timeZone: 'America/Sao_Paulo' 
  }));
  
  const hours = brasiliaTime.getHours();
  const dayPeriod = hours >= 6 && hours < 12 ? 'manhã' 
                   : hours >= 12 && hours < 18 ? 'tarde' 
                   : 'noite';
  
  const formattedDate = brasiliaTime.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = brasiliaTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return {
    dateTime: `${formattedDate} às ${formattedTime}`,
    hours,
    dayPeriod,
    isoString: brasiliaTime.toISOString()
  };
}

// Função para consolidar dados já coletados do cliente
function buildCollectedDataSection(
  conversation: any,
  extractedContexts: any[] | null
): string {
  const collectedData: string[] = [];
  
  // 1. Dados da tabela conversations (fonte primária - já tem customer_name do WhatsApp)
  if (conversation.customer_name) {
    collectedData.push(`- Nome: ${sanitize(conversation.customer_name)} ✓`);
  }
  if (conversation.customer_email) {
    collectedData.push(`- Email: ${sanitize(conversation.customer_email)} ✓`);
  }
  if (conversation.customer_city) {
    const location = conversation.customer_state 
      ? `${sanitize(conversation.customer_city)}/${sanitize(conversation.customer_state)}`
      : sanitize(conversation.customer_city);
    collectedData.push(`- Localização: ${location} ✓`);
  }
  if (conversation.whatsapp_number) {
    // Formatar número para exibição
    const phoneDisplay = conversation.whatsapp_number.replace('@s.whatsapp.net', '');
    collectedData.push(`- WhatsApp: ${phoneDisplay} ✓`);
  }
  
  // 2. Dados da tabela extracted_contexts (dados extraídos pela IA)
  if (extractedContexts && extractedContexts.length > 0) {
    for (const ctx of extractedContexts) {
      if (ctx.context_type === 'customer_data' && ctx.context_data) {
        const data = ctx.context_data;
        
        // Evitar duplicação - só adicionar se não veio de conversations
        if (data.nome && !conversation.customer_name) {
          collectedData.push(`- Nome: ${sanitize(data.nome)} ✓`);
        }
        if (data.email && !conversation.customer_email) {
          collectedData.push(`- Email: ${sanitize(data.email)} ✓`);
        }
        if (data.cidade && !conversation.customer_city) {
          collectedData.push(`- Cidade: ${sanitize(data.cidade)} ✓`);
        }
        if (data.estado && !conversation.customer_state) {
          collectedData.push(`- Estado: ${sanitize(data.estado)} ✓`);
        }
        
        // Dados específicos do projeto
        if (data.consumo_energia || data['Consumo de energia']) {
          collectedData.push(`- Consumo de energia: ${sanitize(data.consumo_energia || data['Consumo de energia'])} ✓`);
        }
        if (data.tamanho_telhado || data.roof_size_m2) {
          collectedData.push(`- Tamanho do telhado: ${sanitize(String(data.tamanho_telhado || data.roof_size_m2))} m² ✓`);
        }
        if (data.produto_desejado || data['Produto desejado']) {
          collectedData.push(`- Produto desejado: ${sanitize(data.produto_desejado || data['Produto desejado'])} ✓`);
        }
      }
    }
  }
  
  // Se não há dados coletados, retornar string vazia
  if (collectedData.length === 0) {
    return '';
  }
  
  // Construir seção de memória com instruções claras
  return `
DADOS JÁ COLETADOS DO CLIENTE (NÃO PERGUNTE NOVAMENTE):
${collectedData.join('\n')}

INSTRUÇÃO CRÍTICA: 
- Use o nome do cliente naturalmente na conversa quando disponível
- NUNCA pergunte informações marcadas com ✓
- Se o cliente já informou email, cidade, etc., não solicite novamente
- Apenas pergunte dados que AINDA NÃO foram coletados
`;
}

// Função para detectar cliente retornando (re-engajamento)
function buildReengagementContext(conversation: any): string {
  // Verificar se é cliente retornando (campos serão adicionados na migração)
  const isReturning = conversation.is_returning_customer === true;
  const previousInterests = conversation.previous_product_groups || [];
  
  if (!isReturning || previousInterests.length === 0) {
    return '';
  }
  
  return `
CONTEXTO DE RETORNO:
- Este cliente JÁ FOI ATENDIDO antes
- Interesses anteriores: ${previousInterests.join(', ')}
- Trate com acolhimento especial: "Que bom ter você de volta!"
- Não repita a apresentação da empresa, vá direto ao ponto
`;
}

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

    // NOVO: Construir seção de dados já coletados (MEMÓRIA DO BOT)
    const collectedDataSection = buildCollectedDataSection(conversation, extractedContexts);
    
    // NOVO: Construir seção de re-engajamento se aplicável
    const reengagementSection = buildReengagementContext(conversation);
    
    // Log para debug
    if (collectedDataSection) {
      console.log(`📋 Bot memory active - collected data found for conversation ${conversationId}`);
    }

    // RAG: Buscar conhecimento relevante da base de dados
    // SKIP para agente de triagem (general) - usa apenas o prompt
    let knowledgeContext = '';
    
    if (finalAgent.agent_type !== 'general') {
      try {
        console.log('🔍 Searching knowledge base for relevant content...');
        
        // Gerar embedding da mensagem do usuário
        const embeddingResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({ 
            fileId: 'query',
            content: message,
            generateChunks: false 
          })
        });

        const embeddingResult = await embeddingResponse.json();
        
        if (embeddingResult.success && embeddingResult.embedding) {
          console.log('✅ Message embedding generated successfully');
          
          // Buscar chunks de conhecimento similares
          const { data: knowledgeChunks, error: searchError } = await supabase.rpc('search_knowledge_chunks', {
            query_embedding: embeddingResult.embedding,
            target_agent_category: conversationCategory,
            similarity_threshold: 0.75,
            max_results: 5
          });

          if (searchError) {
            console.error('❌ Knowledge search error:', searchError);
          } else if (knowledgeChunks && knowledgeChunks.length > 0) {
            console.log(`✅ Found ${knowledgeChunks.length} relevant knowledge chunks`);
            
            knowledgeContext = '\n\nBASE DE CONHECIMENTO:\n' + knowledgeChunks
              .map((chunk: any) => `[${chunk.file_name}] ${chunk.content}`)
              .join('\n\n');

            // Registrar uso do conhecimento (async, não bloqueia resposta)
            supabase.from('knowledge_usage_log').insert({
              knowledge_ids: knowledgeChunks.map((chunk: any) => chunk.id),
              query: message.substring(0, 500),
              agent_type: conversationCategory,
              conversation_id: conversationId,
              confidence_score: knowledgeChunks[0]?.similarity || 0
            }).then(({ error }) => {
              if (error) {
                console.warn('⚠️ Failed to log knowledge usage:', error.message);
              } else {
                console.log('📊 Knowledge usage logged successfully');
              }
            });
          } else {
            console.log('ℹ️ No relevant knowledge found in database');
          }
        } else {
          console.warn('⚠️ Failed to generate embedding for message');
        }
      } catch (error) {
        console.error('❌ RAG search failed:', error);
        // Continue without knowledge base if search fails
      }
    } else {
      console.log('📞 TRIAGE MODE: Skipping RAG for general agent - using prompt only');
    }

    // FALLBACK XML: Para agente de ferramentas, buscar catálogo de produtos
    // SKIP para agente de triagem (general) - não deve consultar catálogo
    let productCatalogContext = '';
    
    if (finalAgent.agent_type !== 'general' && conversationCategory === 'ferramentas' && isProductQuery(message)) {
      console.log('🔍 Detected product query for ferramentas agent - checking XML catalog');
      
      try {
        const catalogResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/fetch-product-catalog`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: message,
              forceRefresh: false
            })
          }
        );
        
        if (catalogResponse.ok) {
          const catalogData = await catalogResponse.json();
          
          if (catalogData.products && catalogData.products.length > 0) {
            productCatalogContext = `\n\nPRODUTOS DISPONÍVEIS NO CATÁLOGO (atualizado em ${new Date(catalogData.lastUpdate).toLocaleString('pt-BR')}):\n`;
            
            catalogData.products.slice(0, 5).forEach((product: any) => {
              productCatalogContext += `
- ${product.name}
  Preço: R$ ${product.price.toFixed(2)}
  SKU: ${product.sku}
  Marca: ${product.brand}
  Categoria: ${product.category}
  ${product.url ? `Link: ${product.url}` : ''}
`;
            });
            
            console.log(`✅ Found ${catalogData.products.length} products in XML catalog`);
          }
        }
      } catch (error) {
        console.error('⚠️ Product catalog fallback failed:', error);
        // Continue sem catálogo, usar apenas RAG
      }
    } else if (finalAgent.agent_type === 'general') {
      console.log('📞 TRIAGE MODE: Skipping XML catalog for general agent - using prompt only');
    }

    // Obter horário de Brasília
    const brasiliaInfo = getBrasiliaDateTime();
    console.log(`🕐 Brasília Time: ${brasiliaInfo.dateTime} (${brasiliaInfo.dayPeriod})`);
    console.log(`🤖 Generating response for ${finalAgent.agent_name} at ${brasiliaInfo.hours}h`);

    // Construir prompt final estruturado com data/hora de Brasília
    let finalPrompt = `Você é um assistente especializado da Drystore. ${finalAgent.system_prompt}

DATA E HORA ATUAL (Brasília): ${brasiliaInfo.dateTime}
PERÍODO DO DIA: ${brasiliaInfo.dayPeriod} (${brasiliaInfo.hours}h)

INSTRUÇÕES CRÍTICAS:
- Use a saudação apropriada ao horário de Brasília informado acima
- NUNCA use mensagens pré-definidas ou templates
- Seja natural, conversacional e útil
- Adapte-se ao contexto da conversa
- Mantenha o tom profissional mas acessível
- Se não souber algo específico, seja honesto e ofereça ajuda alternativa

INFORMAÇÕES DA EMPRESA:
- Drystore: empresa especializada em construção civil
- Atendemos em todo o Sul do Brasil
- Temos expertise em energia solar, telhas, steel frame, drywall, ferramentas, pisos e acabamentos`;

    // NOVO: Injetar seção de dados já coletados (MEMÓRIA)
    if (collectedDataSection) {
      finalPrompt += `\n\n${collectedDataSection}`;
    }
    
    // NOVO: Injetar seção de re-engajamento se aplicável
    if (reengagementSection) {
      finalPrompt += `\n\n${reengagementSection}`;
    }
    
    if (conversationHistory) {
      finalPrompt += `\n\nHISTÓRICO DA CONVERSA:\n${conversationHistory}`;
    }
    
    if (knowledgeContext) {
      finalPrompt += knowledgeContext;
    }
    
    if (productCatalogContext) {
      finalPrompt += productCatalogContext;
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

    // Atualizar conversa com timestamp de Brasília
    await supabase
      .from('conversations')
      .update({
        current_agent_id: finalAgent.id,
        last_message_at: brasiliaInfo.isoString
      })
      .eq('id', conversationId);

    console.log(`✅ Response generated by ${finalAgent.agent_name}: "${response.substring(0, 100)}..."`);

    return new Response(JSON.stringify({
      response,
      agentName: finalAgent.agent_name,
      agentType: finalAgent.agent_type,
      messageId: messageData.id,
      memoryActive: !!collectedDataSection
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error generating intelligent response:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'intelligent-agent-response',
      message: 'Failed to generate response',
      data: { error: errorMessage, conversationId, message: message.substring(0, 100) }
    });

    // Se todos os provedores falharam, usar resposta de emergência
    return new Response(JSON.stringify({ 
      response: 'Desculpe, estamos enfrentando dificuldades técnicas momentâneas. Um de nossos atendentes entrará em contato em breve.',
      agentName: 'Sistema de Emergência',
      agentType: 'emergency',
      error: errorMessage
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

// Função auxiliar para detectar queries sobre produtos
function isProductQuery(message: string): boolean {
  const productKeywords = [
    'preço', 'valor', 'quanto custa', 'disponível', 'estoque',
    'comprar', 'parafusadeira', 'furadeira', 'serra', 'martelo',
    'chave', 'alicate', 'trena', 'nivel', 'produto', 'ferramenta',
    'dewalt', 'bosch', 'makita', 'stanley', 'vonder'
  ];
  
  const lowerMessage = message.toLowerCase();
  return productKeywords.some(keyword => lowerMessage.includes(keyword));
}
