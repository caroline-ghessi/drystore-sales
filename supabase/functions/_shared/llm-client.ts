/**
 * Cliente LLM Unificado - Suporte a múltiplos provedores
 * 
 * Suporta: Anthropic (Claude), OpenAI (GPT), xAI (Grok)
 * Com fallback automático entre provedores
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  tokensUsed?: number;
}

// Mapeamento de modelos válidos por provedor
export const VALID_MODELS = {
  anthropic: [
    'claude-3-5-sonnet-20241022',
    'claude-3-haiku-20240307',
    'claude-3-opus-20240229',
  ],
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
  ],
  xai: [
    'grok-beta',
    'grok-2',
  ],
} as const;

// Modelo padrão por provedor (quando o modelo especificado é inválido)
const DEFAULT_MODELS = {
  anthropic: 'claude-3-5-sonnet-20241022',
  openai: 'gpt-4o-mini',
  xai: 'grok-beta',
};

// Detecta o provedor baseado no nome do modelo
export function getProviderForModel(model: string): 'anthropic' | 'openai' | 'xai' {
  const normalizedModel = model.toLowerCase();
  
  if (normalizedModel.startsWith('claude')) return 'anthropic';
  if (normalizedModel.startsWith('gpt')) return 'openai';
  if (normalizedModel.startsWith('grok')) return 'xai';
  
  // Fallback para OpenAI
  return 'openai';
}

// Normaliza o modelo para garantir que seja válido
export function normalizeModel(model: string): { model: string; provider: 'anthropic' | 'openai' | 'xai' } {
  const provider = getProviderForModel(model);
  const validModels = VALID_MODELS[provider];
  
  // Se o modelo é válido, use-o
  if (validModels.includes(model as any)) {
    return { model, provider };
  }
  
  // Tenta encontrar o modelo mais próximo
  const normalizedModel = model.toLowerCase();
  for (const validModel of validModels) {
    if (normalizedModel.includes(validModel.split('-')[0])) {
      console.log(`[llm-client] Modelo "${model}" normalizado para "${validModel}"`);
      return { model: validModel, provider };
    }
  }
  
  // Fallback para modelo padrão do provedor
  console.log(`[llm-client] Modelo "${model}" inválido, usando padrão: ${DEFAULT_MODELS[provider]}`);
  return { model: DEFAULT_MODELS[provider], provider };
}

// Chama API da Anthropic (Claude)
async function callAnthropic(
  model: string,
  messages: LLMMessage[],
  options: LLMOptions
): Promise<LLMResponse> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY não configurada');
  }

  // Separar system prompt das mensagens
  const systemMessage = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature ?? 0.3,
      system: systemMessage?.content || options.systemPrompt || '',
      messages: chatMessages.length > 0 ? chatMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })) : [{ role: 'user', content: 'Processe a solicitação.' }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API Error [${response.status}]: ${errorText}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || '';

  return {
    content,
    model,
    provider: 'anthropic',
    tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
  };
}

// Chama API da OpenAI (GPT)
async function callOpenAI(
  model: string,
  messages: LLMMessage[],
  options: LLMOptions
): Promise<LLMResponse> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature ?? 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API Error [${response.status}]: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  return {
    content,
    model,
    provider: 'openai',
    tokensUsed: data.usage?.total_tokens,
  };
}

// Chama API da xAI (Grok)
async function callXAI(
  model: string,
  messages: LLMMessage[],
  options: LLMOptions
): Promise<LLMResponse> {
  const apiKey = Deno.env.get('XAI_API_KEY');
  if (!apiKey) {
    throw new Error('XAI_API_KEY não configurada');
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature ?? 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`xAI API Error [${response.status}]: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  return {
    content,
    model,
    provider: 'xai',
    tokensUsed: data.usage?.total_tokens,
  };
}

// Ordem de fallback para cada provedor primário
const FALLBACK_ORDER: Record<string, ('anthropic' | 'openai' | 'xai')[]> = {
  anthropic: ['anthropic', 'openai', 'xai'],
  openai: ['openai', 'anthropic', 'xai'],
  xai: ['xai', 'openai', 'anthropic'],
};

/**
 * Função principal para chamar LLM com fallback automático
 */
export async function callLLM(
  model: string,
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<LLMResponse> {
  const { model: normalizedModel, provider } = normalizeModel(model);
  const fallbackOrder = FALLBACK_ORDER[provider];
  const errors: string[] = [];

  for (const currentProvider of fallbackOrder) {
    try {
      const currentModel = currentProvider === provider 
        ? normalizedModel 
        : DEFAULT_MODELS[currentProvider];

      console.log(`[llm-client] Tentando ${currentProvider} com modelo ${currentModel}`);

      switch (currentProvider) {
        case 'anthropic':
          return await callAnthropic(currentModel, messages, options);
        case 'openai':
          return await callOpenAI(currentModel, messages, options);
        case 'xai':
          return await callXAI(currentModel, messages, options);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`${currentProvider}: ${errorMsg}`);
      console.warn(`[llm-client] Falha em ${currentProvider}: ${errorMsg}`);
    }
  }

  throw new Error(`Todas as APIs falharam: ${errors.join(' | ')}`);
}

/**
 * Função simplificada para prompt único
 */
export async function generateCompletion(
  model: string,
  prompt: string,
  options: LLMOptions = {}
): Promise<string> {
  const messages: LLMMessage[] = [];
  
  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await callLLM(model, messages, options);
  return response.content;
}

/**
 * Função para extrair JSON da resposta
 */
export function extractJSON<T = unknown>(text: string): T | null {
  try {
    // Tenta extrair JSON do texto
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    // Tenta array JSON
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Gera completion e extrai JSON
 */
export async function generateJSONCompletion<T = unknown>(
  model: string,
  prompt: string,
  options: LLMOptions = {}
): Promise<T | null> {
  const response = await generateCompletion(model, prompt, options);
  return extractJSON<T>(response);
}
