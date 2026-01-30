

# Plano: Atualização dos Agentes de IA do CRM com Suporte Multi-Provedor

## Problema Identificado

Após análise do código, identifiquei os seguintes problemas:

### 1. Incompatibilidade de Modelos
Os modelos configurados no frontend (`CRMAgentEditor.tsx`) usam formato Lovable Gateway:
- `google/gemini-3-flash-preview`
- `google/gemini-2.5-flash`
- `openai/gpt-5-mini`

Mas as Edge Functions usam **APIs diretas** (Anthropic, OpenAI, xAI), que requerem nomes diferentes:
- `claude-3-5-sonnet-20241022` (Anthropic)
- `gpt-4o-mini` (OpenAI)
- `grok-beta` (xAI)

### 2. Modelos Inválidos no Banco de Dados
Encontrei modelos que podem causar erros:
- `claude-3` (modelo incompleto/inválido)
- `claude-sonnet-4-20250514` (formato incorreto para API direta)

### 3. Falta de Suporte no Editor CRM
O `CRMAgentEditor.tsx` não inclui opções para Claude e Grok que são usados no sistema.

---

## Solução Proposta

### Fase 1: Atualizar Lista de Modelos no Frontend

**Arquivo: `src/modules/crm/components/agents/CRMAgentEditor.tsx`**

Expandir `LLM_MODELS` para incluir todos os provedores disponíveis com nomes corretos para API direta:

```typescript
const LLM_MODELS = [
  // === ANTHROPIC (Claude) ===
  { 
    value: 'claude-3-5-sonnet-20241022', 
    label: 'Claude 3.5 Sonnet (Recomendado)', 
    provider: 'anthropic' 
  },
  { 
    value: 'claude-3-haiku-20240307', 
    label: 'Claude 3 Haiku (Rápido)', 
    provider: 'anthropic' 
  },
  { 
    value: 'claude-3-opus-20240229', 
    label: 'Claude 3 Opus (Avançado)', 
    provider: 'anthropic' 
  },
  
  // === OPENAI (ChatGPT) ===
  { 
    value: 'gpt-4o', 
    label: 'GPT-4o (Recomendado)', 
    provider: 'openai' 
  },
  { 
    value: 'gpt-4o-mini', 
    label: 'GPT-4o Mini (Econômico)', 
    provider: 'openai' 
  },
  { 
    value: 'gpt-4-turbo', 
    label: 'GPT-4 Turbo', 
    provider: 'openai' 
  },
  
  // === XAI (Grok) ===
  { 
    value: 'grok-beta', 
    label: 'Grok Beta', 
    provider: 'xai' 
  },
  { 
    value: 'grok-2', 
    label: 'Grok 2', 
    provider: 'xai' 
  },
];
```

### Fase 2: Atualizar Editor WhatsApp para Consistência

**Arquivo: `src/modules/whatsapp/components/bot/AgentEditor.tsx`**

Atualizar o select de modelos (linha 170-180) para usar os mesmos modelos corretos.

### Fase 3: Criar Utilitário Compartilhado de Provedores LLM

**Novo arquivo: `supabase/functions/_shared/llm-client.ts`**

Criar cliente unificado para chamadas LLM:

```typescript
interface LLMProvider {
  name: string;
  apiKey: string | undefined;
  baseUrl: string;
  models: string[];
  makeRequest: (model: string, prompt: string, options: LLMOptions) => Promise<string>;
}

export const LLM_PROVIDERS = {
  anthropic: {
    name: 'Anthropic',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-haiku-20240307',
      'claude-3-opus-20240229'
    ],
    baseUrl: 'https://api.anthropic.com/v1/messages',
    getApiKey: () => Deno.env.get('ANTHROPIC_API_KEY'),
    headers: (key: string) => ({
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    }),
    // ... implementação
  },
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    getApiKey: () => Deno.env.get('OPENAI_API_KEY'),
    // ... implementação
  },
  xai: {
    name: 'xAI',
    models: ['grok-beta', 'grok-2'],
    baseUrl: 'https://api.x.ai/v1/chat/completions',
    getApiKey: () => Deno.env.get('XAI_API_KEY'),
    // ... implementação
  }
};

// Detecta provedor pelo nome do modelo
export function getProviderForModel(modelName: string): string {
  if (modelName.startsWith('claude')) return 'anthropic';
  if (modelName.startsWith('gpt')) return 'openai';
  if (modelName.startsWith('grok')) return 'xai';
  // Fallback para OpenAI
  return 'openai';
}

// Chamada unificada com fallback automático
export async function callLLM(
  model: string,
  prompt: string,
  options: LLMOptions
): Promise<LLMResponse> {
  const provider = getProviderForModel(model);
  // ... implementação com fallback
}
```

### Fase 4: Atualizar Edge Functions Existentes

Refatorar as seguintes funções para usar o cliente unificado:
- `quality-analysis/index.ts`
- `generate-lead-summary/index.ts`
- `intelligent-agent-response/index.ts`
- `extract-customer-data/index.ts`
- `classify-intent-llm/index.ts`

### Fase 5: Adicionar Indicador Visual de Provedor

No `CRMAgentEditor.tsx`, adicionar badges coloridos mostrando o provedor:

```text
┌─────────────────────────────────────────────────────┐
│ Modelo LLM                                          │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Claude 3.5 Sonnet (Recomendado)      [Anthropic]│ │
│ │ GPT-4o (Recomendado)                   [OpenAI] │ │
│ │ Grok Beta                                 [xAI] │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/modules/crm/components/agents/CRMAgentEditor.tsx` | Atualizar LLM_MODELS com modelos corretos |
| `src/modules/whatsapp/components/bot/AgentEditor.tsx` | Sincronizar modelos |
| `supabase/functions/_shared/llm-client.ts` | **Criar** - Cliente LLM unificado |
| `supabase/functions/quality-analysis/index.ts` | Refatorar para usar cliente unificado |
| `supabase/functions/generate-lead-summary/index.ts` | Refatorar para usar cliente unificado |
| `src/modules/crm/hooks/useCRMAgentConfigs.ts` | Atualizar modelo padrão |

---

## Mapeamento de Modelos

### Modelos Corretos para API Direta

| Provedor | Modelo Válido | Uso Recomendado |
|----------|--------------|-----------------|
| **Anthropic** | `claude-3-5-sonnet-20241022` | Análise complexa, extração |
| **Anthropic** | `claude-3-haiku-20240307` | Tasks rápidos, classificação |
| **Anthropic** | `claude-3-opus-20240229` | Raciocínio avançado |
| **OpenAI** | `gpt-4o` | Uso geral, alta qualidade |
| **OpenAI** | `gpt-4o-mini` | Econômico, alto volume |
| **xAI** | `grok-beta` | Alternativa, fallback |

### Modelos a Corrigir no Banco

```sql
-- Corrigir modelos inválidos
UPDATE agent_configs 
SET llm_model = 'claude-3-5-sonnet-20241022' 
WHERE llm_model = 'claude-3';

UPDATE agent_configs 
SET llm_model = 'claude-3-5-sonnet-20241022' 
WHERE llm_model = 'claude-sonnet-4-20250514';

-- Atualizar agentes CRM para usar modelo válido
UPDATE agent_configs 
SET llm_model = 'claude-3-5-sonnet-20241022' 
WHERE agent_type IN ('crm_analyzer', 'crm_extractor', 'crm_classifier', 'crm_coach')
AND llm_model LIKE 'google/%';
```

---

## Benefícios

1. **Consistência** - Mesmos modelos em todo o sistema
2. **Flexibilidade** - Escolha entre 3 provedores (Claude, GPT, Grok)
3. **Fallback automático** - Se um provedor falhar, tenta outro
4. **Manutenção simples** - Cliente LLM centralizado
5. **Sem erros de modelo inexistente** - Apenas modelos válidos e testados

---

## Ordem de Implementação

1. Criar utilitário `llm-client.ts` compartilhado
2. Atualizar `CRMAgentEditor.tsx` com modelos corretos
3. Atualizar `AgentEditor.tsx` (WhatsApp) para consistência
4. Executar migração SQL para corrigir modelos no banco
5. Refatorar Edge Functions para usar cliente unificado
6. Testar cada provedor (Claude, OpenAI, xAI)

