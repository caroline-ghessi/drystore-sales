import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { callLLM, normalizeModel, type LLMMessage } from '../_shared/llm-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, currentProductGroup, conversationId } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    console.log('Classifying message:', message);

    // DEFINIR CATEGORIAS ESPECÍFICAS E GENÉRICAS
    const GENERIC_CATEGORIES = ['saudacao', 'institucional', 'indefinido', 'geral'];
    const SPECIFIC_CATEGORIES = ['ferramentas', 'telha_shingle', 'energia_solar', 'steel_frame', 'drywall_divisorias', 'pisos', 'acabamentos', 'forros'];

    // VERIFICAR SE CATEGORIA ATUAL É ESPECÍFICA (LOCK DE CATEGORIA)
    if (currentProductGroup && SPECIFIC_CATEGORIES.includes(currentProductGroup)) {
      console.log(`🔒 Category lock active: ${currentProductGroup} cannot be changed`);
      
      return new Response(JSON.stringify({
        productGroup: currentProductGroup,
        confidence: 0.9,
        rawClassification: currentProductGroup,
        categoryLocked: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get classifier agent configuration from new table
    const { data: classifierAgent, error: agentError } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('agent_type', 'classifier')
      .eq('is_active', true)
      .single();

    if (agentError || !classifierAgent) {
      console.error('Failed to load classifier agent:', agentError);
      throw new Error('Classifier agent not configured');
    }

    // Use the system prompt directly
    const fullPrompt = `${classifierAgent.system_prompt}

Mensagem do cliente: "${message}"
Categoria atual: ${currentProductGroup || 'indefinido'}`;

    // Usar cliente LLM unificado com fallback automático
    const configuredModel = classifierAgent.llm_model || 'claude-3-haiku-20240307';
    const { model: normalizedModel, provider } = normalizeModel(configuredModel);
    
    console.log(`🔄 Trying ${provider} (${normalizedModel}) for classification...`);
    
    const llmMessages: LLMMessage[] = [
      { role: 'user', content: fullPrompt }
    ];

    const llmResponse = await callLLM(normalizedModel, llmMessages, {
      maxTokens: classifierAgent.max_tokens || 1000,
      temperature: classifierAgent.temperature || 0.3,
    });

    const classification = llmResponse.content.trim().toLowerCase();
    console.log(`✅ ${llmResponse.provider} classification successful: ${classification}`);

    console.log(`Classification result: ${classification}`);
    console.log(`Current product group: ${currentProductGroup}`);

    // Mapear nomes para valores do banco - incluindo todas as variações possíveis
    const productGroupMapping: Record<string, string> = {
      // Saudação e institucional
      'saudacao': 'saudacao',
      'saudação': 'saudacao',
      'institucional': 'institucional',
      
      // Drywall e divisórias - todas as variações
      'drywall': 'drywall_divisorias',
      'drywall_divisorias': 'drywall_divisorias',
      'drywall e divisorias': 'drywall_divisorias',
      'drywall e divisórias': 'drywall_divisorias',
      'divisorias': 'drywall_divisorias',
      'divisórias': 'drywall_divisorias',
      
      // Energia solar - todas as variações
      'energia_solar': 'energia_solar',
      'energia solar': 'energia_solar',
      'energia solar e baterias': 'energia_solar',
      'energia solar e backup': 'energia_solar',
      'solar': 'energia_solar',
      'fotovoltaico': 'energia_solar',
      'painel solar': 'energia_solar',
      'paineis solares': 'energia_solar',
      'sistema solar': 'energia_solar',
      'baterias': 'energia_solar',
      'backup de energia': 'energia_solar',
      
      // Telha shingle - todas as variações
      'telha_shingle': 'telha_shingle',
      'telha shingle': 'telha_shingle',
      'telha': 'telha_shingle',
      'telhas': 'telha_shingle',
      'shingle': 'telha_shingle',
      'cobertura': 'telha_shingle',
      'telhado': 'telha_shingle',
      
      // Steel frame - todas as variações
      'steel_frame': 'steel_frame',
      'steel frame': 'steel_frame',
      'steel-frame': 'steel_frame',
      'estrutura metalica': 'steel_frame',
      'estrutura metálica': 'steel_frame',
      'light steel frame': 'steel_frame',
      'lsf': 'steel_frame',
      
      // Outras categorias
      'acabamentos': 'acabamentos',
      'acabamento': 'acabamentos',
      'revestimento': 'acabamentos',
      'revestimentos': 'acabamentos',
      
      'ferramentas': 'ferramentas',
      'ferramenta': 'ferramentas',
      'equipamentos': 'ferramentas',
      'equipamento': 'ferramentas',
      
      'forros': 'forros',
      'forro': 'forros',
      'teto': 'forros',
      'gesso': 'forros',
      
      'pisos': 'pisos',
      'piso': 'pisos',
      'piso vinilico': 'pisos',
      'piso vinílico': 'pisos',
      'revestimento de piso': 'pisos',
      
      // Fallback
      'indefinido': 'indefinido',
      'geral': 'indefinido'
    };

    const finalProductGroup = productGroupMapping[classification] || 'indefinido';
    
    console.log(`Mapped result: ${classification} -> ${finalProductGroup}`);
    if (!productGroupMapping[classification]) {
      console.warn(`Classification "${classification}" not found in mapping, using indefinido`);
    }

    // Calcular confidence score baseado na clareza da classificação
    let confidenceScore = 0.8;
    if (classification === '' || classification === 'indefinido') {
      confidenceScore = 0.1;
    } else if (classification === currentProductGroup) {
      confidenceScore = 0.9; // Alta confiança quando mantém categoria
    }

    // Salvar log de classificação
    if (conversationId) {
      await supabase
        .from('classification_logs')
        .insert({
          conversation_id: conversationId,
          message_text: message,
          classified_category: finalProductGroup,
          confidence_score: confidenceScore,
          status: 'success',
          metadata: {
            current_product_group: currentProductGroup,
            llm_response: classification,
            mapped_category: finalProductGroup,
            model_used: llmResponse.model,
            provider_used: llmResponse.provider
          }
        });
    }

    return new Response(JSON.stringify({
      productGroup: finalProductGroup,
      confidence: confidenceScore,
      rawClassification: classification,
      modelUsed: llmResponse.model,
      providerUsed: llmResponse.provider
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error classifying intent:', error);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { message: messageFromRequest, currentProductGroup } = await req.json().catch(() => ({ message: '', currentProductGroup: 'indefinido' }));
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'classify-intent-llm',
      message: 'Failed to classify intent',
      data: { error: error.message, message: messageFromRequest?.substring(0, 100) || 'undefined' }
    });

    // Se todos os provedores falharam, usar fallback
    const fallbackCategory = currentProductGroup || 'indefinido';
    
    console.log(`Using fallback classification: ${fallbackCategory} due to error: ${error.message}`);

    return new Response(JSON.stringify({
      productGroup: fallbackCategory,
      confidence: 0.1,
      error: error.message,
      fallback: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
