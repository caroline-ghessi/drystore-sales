import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId } = await req.json();

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Buscar dados da conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return new Response(
        JSON.stringify({ error: 'Conversa não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Buscar contexto do projeto
    const { data: projectContext } = await supabase
      .from('project_contexts')
      .select('*')
      .eq('conversation_id', conversationId)
      .single();

    // 3. Buscar contextos extraídos
    const { data: extractedContexts } = await supabase
      .from('extracted_contexts')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('is_active', true);

    // 4. Buscar mensagens com mídia
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // 5. Identificar arquivos de mídia
    const mediaFiles = messages?.filter(msg => msg.media_url && msg.media_type) || [];
    const mediaLinks = mediaFiles.map(file => ({
      type: file.media_type,
      url: file.media_url,
      timestamp: file.created_at
    }));

    // 6. Buscar agente de resumos
    const { data: summarizerAgent } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('agent_type', 'summarizer')
      .eq('is_active', true)
      .single();

    if (!summarizerAgent) {
      return new Response(
        JSON.stringify({ error: 'Agente de resumos não encontrado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Preparar dados para o prompt
    const conversationHistory = messages?.filter(msg => msg.sender_type === 'customer')
      .map(msg => `${msg.sender_name || 'Cliente'}: ${msg.content}`)
      .join('\n') || 'Nenhuma mensagem do cliente';

    const contextData = {
      // Dados básicos
      nome: conversation.customer_name || 'Não informado',
      whatsapp: conversation.whatsapp_number || 'Não informado',
      email: conversation.customer_email || 'Não informado',
      cidade: conversation.customer_city || 'Não informado',
      estado: conversation.customer_state || 'Não informado',
      
      // Classificação
      produto_grupo: conversation.product_group || 'Não classificado',
      temperatura: conversation.lead_temperature || 'Não avaliado',
      score: conversation.lead_score || 0,
      
      // Contexto do projeto
      urgencia: projectContext?.urgency || 'Não informado',
      orcamento: projectContext?.budget_range || 'Não informado',
      timeline: projectContext?.timeline || 'Não informado',
      necessidades: projectContext?.desired_product || 'Não informado',
      
      // Histórico e arquivos
      principais_pontos_discutidos: conversationHistory,
      links_para_arquivos: mediaLinks.length > 0 
        ? mediaLinks.map(link => `${link.type}: ${link.url}`).join('\n')
        : 'Nenhum arquivo enviado'
    };

    // 8. Gerar resumo usando LLM
    const promptWithData = summarizerAgent.system_prompt.replace(
      /\{(\w+)\}/g,
      (match, key) => contextData[key as keyof typeof contextData]?.toString() || match
    );

    // Preparar dados contextuais adicionais
    const additionalContext = [
      `Dados extraídos: ${JSON.stringify(extractedContexts || [])}`,
      `Total de mensagens: ${messages?.length || 0}`,
      `Arquivos enviados: ${mediaFiles.length}`,
      `Contexto do projeto: ${JSON.stringify(projectContext || {})}`
    ].join('\n');

    const llmPrompt = `${promptWithData}\n\nCONTEXTO ADICIONAL:\n${additionalContext}\n\nGere um resumo completo e estruturado baseado nos dados acima.`;

    // 9. Gerar resumo usando LLM com sistema robusto de fallback
    const modelName = summarizerAgent.llm_model || 'gpt-4o-mini';
    
    console.log('🤖 INICIANDO GERAÇÃO DE RESUMO:', {
      conversationId,
      modelName,
      maxTokens: summarizerAgent.max_tokens,
      temperature: summarizerAgent.temperature,
      promptLength: llmPrompt.length
    });
    
    let llmResponse;
    let llmData;
    let summary = 'Erro ao gerar resumo';
    let attemptedApis = [];
    
    // Função para tentar Claude API
    const tryClaudeApi = async () => {
      const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!anthropicApiKey) {
        throw new Error('Anthropic API key não configurada');
      }
      
      console.log('🔮 Tentando Claude API com modelo:', modelName);
      attemptedApis.push('claude');
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: summarizerAgent.max_tokens || 2000,
          temperature: summarizerAgent.temperature || 0.3,
          messages: [{ role: 'user', content: llmPrompt }],
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Claude API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Claude API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Claude API Response:', {
        hasContent: !!data.content,
        contentLength: data.content?.[0]?.text?.length || 0,
        usage: data.usage
      });
      
      return data.content?.[0]?.text || null;
    };
    
    // Função para tentar OpenAI API
    const tryOpenAiApi = async () => {
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        throw new Error('OpenAI API key não configurada');
      }
      
      console.log('🧠 Tentando OpenAI API como fallback');
      attemptedApis.push('openai');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: llmPrompt },
            { role: 'user', content: 'Gere o resumo baseado nos dados fornecidos.' }
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenAI API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ OpenAI API Response:', {
        hasChoices: !!data.choices,
        contentLength: data.choices?.[0]?.message?.content?.length || 0,
        usage: data.usage
      });
      
      return data.choices?.[0]?.message?.content || null;
    };
    
    // Função para tentar xAI API
    const tryXaiApi = async () => {
      const xaiApiKey = Deno.env.get('XAI_API_KEY');
      if (!xaiApiKey) {
        throw new Error('xAI API key não configurada');
      }
      
      console.log('🚀 Tentando xAI API como último recurso');
      attemptedApis.push('xai');
      
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${xaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            { role: 'system', content: llmPrompt },
            { role: 'user', content: 'Gere o resumo baseado nos dados fornecidos.' }
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ xAI API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`xAI API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ xAI API Response:', {
        hasChoices: !!data.choices,
        contentLength: data.choices?.[0]?.message?.content?.length || 0,
        usage: data.usage
      });
      
      return data.choices?.[0]?.message?.content || null;
    };
    
    // Sistema robusto de fallback
    try {
      // 1. Tentar a API configurada primeiro
      if (modelName.startsWith('claude')) {
        try {
          summary = await tryClaudeApi();
        } catch (error) {
          console.warn('⚠️ Claude falhou, tentando OpenAI:', error.message);
          summary = await tryOpenAiApi();
        }
      } else if (modelName.startsWith('grok')) {
        try {
          summary = await tryXaiApi();
        } catch (error) {
          console.warn('⚠️ xAI falhou, tentando OpenAI:', error.message);
          summary = await tryOpenAiApi();
        }
      } else {
        // OpenAI como primeiro
        try {
          summary = await tryOpenAiApi();
        } catch (error) {
          console.warn('⚠️ OpenAI falhou, tentando Claude:', error.message);
          summary = await tryClaudeApi();
        }
      }
      
      // Validação final da resposta
      if (!summary || summary.trim().length < 50) {
        throw new Error('Resposta muito curta ou vazia');
      }
      
      console.log('🎉 RESUMO GERADO COM SUCESSO:', {
        length: summary.length,
        apiUsadas: attemptedApis,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('💥 FALHA TOTAL EM TODAS AS APIs:', {
        error: error.message,
        attemptedApis,
        conversationId
      });
      
      // Fallback final - usar um template estruturado
      summary = `❌ Erro na geração automática do resumo

**DADOS BÁSICOS:**
• Nome: ${contextData.nome}
• WhatsApp: ${contextData.whatsapp}
• Produto: ${contextData.produto_grupo}
• Temperatura: ${contextData.temperatura}

**CONVERSAÇÃO:**
${contextData.principais_pontos_discutidos.substring(0, 500)}...

**AÇÃO NECESSÁRIA:**
Este resumo foi gerado automaticamente devido a falha na IA. 
Revise a conversa completa antes de enviar ao vendedor.

APIs testadas: ${attemptedApis.join(', ')}
Erro: ${error.message}`;
      
      // Log detalhado do erro
      await supabase.from('system_logs').insert({
        level: 'error',
        source: 'generate-lead-summary-api-failure',
        message: 'Falha em todas as APIs de IA',
        data: {
          conversationId,
          attemptedApis,
          error: error.message,
          modelName,
          promptLength: llmPrompt.length
        }
      });
    }

    // 10. Log detalhado da geração
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'generate-lead-summary',
      message: 'Resumo gerado com sucesso',
      data: {
        conversation_id: conversationId,
        summary_length: summary.length,
        media_files_count: mediaFiles.length,
        model_used: modelName,
        apis_attempted: attemptedApis,
        prompt_length: llmPrompt.length,
        generation_success: true
      }
    });

    console.log('📊 RESUMO COMPLETO GERADO:', {
      conversationId,
      summaryLength: summary.length,
      mediaFilesCount: mediaFiles.length,
      contextDataKeys: Object.keys(contextData),
      success: true
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        summary,
        conversation,
        mediaFiles: mediaLinks,
        contextData,
        metadata: {
          modelUsed: modelName,
          apisAttempted: attemptedApis,
          generatedAt: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 ERRO CRÍTICO NA GERAÇÃO DE RESUMO:', {
      conversationId: conversationId || 'não fornecido',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'generate-lead-summary',
      message: 'Erro crítico na geração de resumo',
      data: { 
        conversation_id: conversationId || null,
        error: error.message,
        stack: error.stack
      }
    });

    return new Response(
      JSON.stringify({ 
        error: `Falha na geração do resumo: ${error.message}`,
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});