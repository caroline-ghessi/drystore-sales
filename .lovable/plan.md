
# Plano: Compatibilizar opportunity-matcher.ts com Prompt v1.0

## Contexto do Problema

O prompt do Opportunity Matcher é excelente e já está no banco de dados, mas o código atual **não envia os dados necessários** e **não parseia corretamente a resposta**. A IA recebe informações insuficientes (sem mensagens) e o código espera um formato de resposta diferente.

---

## Alterações Necessárias

### 1. Atualizar Interface AIDecision

**Arquivo:** `supabase/functions/_shared/opportunity-matcher.ts`

Expandir a interface para aceitar o formato real do prompt:

```typescript
// ANTES (linhas 44-52):
interface AIDecision {
  decision: 'merge' | 'new' | 'review';
  existing_opportunity_id?: string;
  confidence: number;
  reasoning: string;
  is_same_subject: boolean;
  has_closure_signals: boolean;
  detected_subject?: string;
}

// DEPOIS:
interface AIDecisionReasoning {
  new_conversation_subject: string;
  existing_opportunity_subject: string;
  subject_match: boolean | null;
  was_closed: boolean;
  closure_signals_found: string[];
  conclusion: string;
}

interface AIDecision {
  decision: 'merge' | 'new' | 'review';
  target_opportunity_id?: string | null;  // Nome do prompt
  confidence: number;
  reasoning: AIDecisionReasoning;          // Objeto, não string
  signals?: {
    for_merge: string[];
    for_new: string[];
  };
  recommendation?: string;
}
```

---

### 2. Buscar Últimas Mensagens da Conversa

Adicionar função para buscar mensagens da oportunidade existente e da nova conversa:

```typescript
async function getConversationMessages(
  supabase: SupabaseClient,
  conversationId: string | undefined,
  limit: number = 10
): Promise<Array<{ role: string; content: string }>> {
  if (!conversationId) return [];
  
  const { data: messages } = await supabase
    .from('messages')
    .select('sender_type, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (messages || []).reverse().map(m => ({
    role: m.sender_type === 'customer' ? 'client' : 'vendor',
    content: m.content
  }));
}
```

---

### 3. Enriquecer Dados da Oportunidade Existente

Atualizar a query para incluir mais campos necessários:

```typescript
// Linha 67 - expandir select:
const { data: openOpportunities } = await supabase
  .from('crm_opportunities')
  .select(`
    id, title, product_category, stage, value, 
    created_at, updated_at, description,
    proposal_value, probability,
    conversation_id,
    customer:crm_customers!inner(phone, name)
  `)
  // ... resto igual
```

---

### 4. Atualizar Formato do userMessage

Modificar a construção do prompt para enviar os dados que a IA espera:

```typescript
// Substituir linhas 191-214:

// Buscar mensagens da oportunidade existente (via conversation_id)
const existingMessages = await getConversationMessages(
  supabase, 
  context.existing_opportunity.conversation_id,
  5  // últimas 5 mensagens
);

// Buscar mensagens da nova conversa (se tivermos conversation_id)
const newMessages = context.new_conversation_id 
  ? await getConversationMessages(supabase, context.new_conversation_id, 3)
  : [];

const existingOppData = {
  id: context.existing_opportunity.id,
  title: context.existing_opportunity.title,
  status: context.existing_opportunity.stage,
  pipeline_stage: context.existing_opportunity.stage,
  product_category: context.existing_opportunity.product_category,
  created_at: context.existing_opportunity.created_at,
  updated_at: context.existing_opportunity.updated_at,
  proposal_value: context.existing_opportunity.proposal_value,
  client_name: context.existing_opportunity.customer?.name || 'Desconhecido',
  last_messages: existingMessages
};

const userMessage = `
### 1. Oportunidades Existentes (do mesmo telefone)
\`\`\`json
{
  "opportunities": [${JSON.stringify(existingOppData, null, 2)}]
}
\`\`\`

### 2. Nova Conversa
\`\`\`json
{
  "product_category": ${context.new_product_category ? `"${context.new_product_category}"` : 'null'},
  "new_messages": ${JSON.stringify(newMessages)},
  "source": "${context.source}"
}
\`\`\`

Analise e retorne sua decisão em JSON.
`;
```

---

### 5. Atualizar Parsing da Resposta

Ajustar para extrair os campos corretos do novo formato:

```typescript
// Linhas 245-252 - atualizar parsing:
return {
  action: parsed.decision === 'merge' ? 'merge' : 
          parsed.decision === 'new' ? 'create_new' : 'needs_review',
  existing_opportunity_id: parsed.target_opportunity_id || context.existing_opportunity.id,
  confidence: parsed.confidence || 0.8,
  reasoning: typeof parsed.reasoning === 'object' 
    ? parsed.reasoning.conclusion 
    : parsed.reasoning,
  decided_by: `ai:${agentConfig.id}`
};
```

---

### 6. Atualizar Contexto Passado para a Função

Expandir o contexto para incluir conversation_id:

```typescript
// Linha 123 - passar conversation_id:
const aiResult = await callOpportunityMatcherAgent(supabase, {
  existing_opportunity: existingOpp,
  new_product_category: input.product_category,
  new_conversation_id: input.conversation_id,  // ADICIONAR
  source: input.source
});

// Atualizar interface do contexto (linha 161):
context: {
  existing_opportunity: OpportunityCandidate;
  new_product_category?: string;
  new_conversation_id?: string;  // ADICIONAR
  source: string;
}
```

---

### 7. Expandir OpportunityCandidate

```typescript
// Linhas 33-42 - adicionar campos:
interface OpportunityCandidate {
  id: string;
  title: string;
  product_category: string | null;
  stage: string;
  value: number;
  created_at: string;
  updated_at: string;
  proposal_value?: number;        // ADICIONAR
  conversation_id?: string;       // ADICIONAR
  customer?: { 
    phone: string;
    name?: string;                // ADICIONAR
  } | null;
}
```

---

## Arquivos a Modificar

| Arquivo | Alterações |
|---------|-----------|
| `supabase/functions/_shared/opportunity-matcher.ts` | Atualizar interfaces, queries, formato de input/output |

---

## Fluxo Corrigido

```text
┌─────────────────────────────────────────────────────────────┐
│                ANTES (incompleto)                            │
├─────────────────────────────────────────────────────────────┤
│ Input para IA:                                               │
│   - product_category: "solar"                               │
│   - source: "whatsapp"                                      │
│   - Dados básicos da oportunidade                           │
│                                                              │
│ ❌ Sem mensagens = IA não pode analisar sinais de fechamento │
└─────────────────────────────────────────────────────────────┘

                           ↓

┌─────────────────────────────────────────────────────────────┐
│                DEPOIS (completo)                             │
├─────────────────────────────────────────────────────────────┤
│ Input para IA:                                               │
│   - opportunities[]: com last_messages, proposal_value...   │
│   - new_messages[]: mensagens da nova conversa              │
│   - source, product_category                                │
│                                                              │
│ ✅ IA pode analisar:                                         │
│    - Sinais de fechamento ("PIX", "fechado")                │
│    - Continuidade do assunto                                 │
│    - Referências explícitas                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Benefícios

1. **Decisões mais precisas**: IA terá acesso às mensagens para detectar sinais de fechamento
2. **Cross-sell melhor identificado**: Com contexto completo, reconhece produtos diferentes
3. **Recompra detectada**: Identifica quando negociação anterior já foi fechada
4. **Formato padronizado**: Output estruturado com `reasoning` detalhado facilita debug
