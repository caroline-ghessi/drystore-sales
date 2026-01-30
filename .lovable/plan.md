
# Plano: Sistema de Detecção de Duplicados - Opportunity Matcher Agent

## Resumo

Implementar sistema de prevenção de duplicação de oportunidades no CRM usando verificação programática + agente de IA configurável.

---

## Descobertas da Análise

| Item | Status | Valor Atual |
|------|--------|-------------|
| `validation_status` | ✅ Existe | TEXT, default `'ai_generated'` |
| `opportunity_stage` enum | ✅ Correto | `closed_won`, `closed_lost` (não `won`/`lost`) |
| `crm_validator` no enum | ❌ Não existe | Precisa adicionar |
| Tabela de log | ❌ Não existe | Criar `crm_opportunity_match_log` |
| Interface de gestão | ✅ Existe | `/crm/agentes` com CRMAgentEditor |

---

## Componentes a Implementar

### 1. Migração de Banco de Dados

```sql
-- 1. Adicionar novo tipo de agente ao enum
ALTER TYPE agent_type ADD VALUE IF NOT EXISTS 'crm_validator';

-- 2. Adicionar novos valores de validation_status (via CHECK constraint)
-- Nota: validation_status é TEXT sem constraint, então só adicionar valores

-- 3. Criar tabela de log de decisões
CREATE TABLE IF NOT EXISTS crm_opportunity_match_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL,
  vendor_id UUID NOT NULL,
  source TEXT NOT NULL, -- 'whatsapp' | 'vendor_whatsapp'
  decision TEXT NOT NULL, -- 'create_new' | 'merge' | 'needs_review'
  confidence DECIMAL(3,2),
  reasoning TEXT,
  existing_opportunity_id UUID REFERENCES crm_opportunities(id),
  new_opportunity_id UUID REFERENCES crm_opportunities(id),
  decided_by TEXT NOT NULL, -- 'rule' | 'ai:agent_id' | 'user:user_id'
  product_category TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_match_log_phone ON crm_opportunity_match_log(customer_phone);
CREATE INDEX IF NOT EXISTS idx_match_log_vendor ON crm_opportunity_match_log(vendor_id);
CREATE INDEX IF NOT EXISTS idx_match_log_decision ON crm_opportunity_match_log(decision);

-- 5. RLS para a tabela de log
ALTER TABLE crm_opportunity_match_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage match logs" ON crm_opportunity_match_log
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Supervisors can view match logs" ON crm_opportunity_match_log
  FOR SELECT USING (has_role(auth.uid(), 'supervisor'::app_role));

-- 6. Adicionar campos de tracking na crm_opportunities
ALTER TABLE crm_opportunities 
ADD COLUMN IF NOT EXISTS merged_from_id UUID REFERENCES crm_opportunities(id),
ADD COLUMN IF NOT EXISTS merge_reason TEXT,
ADD COLUMN IF NOT EXISTS match_confidence DECIMAL(3,2);

-- 7. Índice para busca rápida de oportunidades abertas por telefone
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_open_lookup 
ON crm_opportunities (customer_id, vendor_id)
WHERE stage NOT IN ('closed_won', 'closed_lost');
```

### 2. Inserir Agente Opportunity Matcher

Inserir na tabela `agent_configs` para controle total via interface:

| Campo | Valor |
|-------|-------|
| agent_name | Opportunity Matcher |
| agent_type | crm_validator |
| description | Analisa se nova conversa é continuação ou nova oportunidade (cross-sell, recompra) |
| llm_model | claude-3-5-sonnet-20241022 |
| max_tokens | 500 |
| temperature | 0.1 |
| is_active | true |
| system_prompt | (prompt completo abaixo) |
| output_schema | (schema de resposta) |

**System Prompt:**

```
IDENTIDADE

Você analisa se uma nova conversa de vendas é continuação de uma negociação existente
ou uma nova oportunidade (cross-sell, recompra, ou novo interesse).

DADOS QUE VOCÊ RECEBE

1. OPORTUNIDADE EXISTENTE (aberta)
{
  "id": "uuid",
  "title": "Oportunidade - Solar",
  "product_category": "solar",
  "stage": "negotiation",
  "created_at": "2026-01-15",
  "value": 45000,
  "last_messages": ["últimas 5 mensagens..."]
}

2. NOVA CONVERSA
{
  "product_category": "solar" | null,
  "new_messages": ["mensagens recentes..."],
  "source": "whatsapp" | "vendor_whatsapp"
}

REGRAS DE DECISÃO

1. MERGE (mesma negociação):
   - Mesmo produto/assunto
   - Conversa é continuação natural
   - Não há sinais de fechamento anterior

2. NEW (nova oportunidade):
   - Produto/assunto diferente (cross-sell)
   - Sinais de fechamento anterior (recompra)
   - Cliente explicitamente menciona "novo projeto", "outro pedido"

3. REVIEW (incerto):
   - Confiança < 70%
   - Informações insuficientes

SINAIS DE FECHAMENTO ANTERIOR

Do cliente:
- "Fechado", "Vamos fechar", "Fecha"
- "Vou fazer o PIX", "Mandei o PIX", "Paguei"
- "Combinado", "Pode fazer", "Pode mandar"

Do vendedor:
- "PIX recebido", "Pagamento confirmado"
- "Pedido registrado", "Separando"
- "Nota fiscal enviada"

FORMATO DE RESPOSTA (JSON)

{
  "decision": "merge" | "new" | "review",
  "existing_opportunity_id": "uuid ou null",
  "confidence": 0.85,
  "reasoning": "Explicação em 1-2 frases",
  "is_same_subject": true,
  "has_closure_signals": false,
  "detected_subject": "solar"
}
```

**Output Schema:**

```json
{
  "decision": "merge | new | review",
  "existing_opportunity_id": "string | null",
  "confidence": "0.0-1.0",
  "reasoning": "string",
  "is_same_subject": "boolean",
  "has_closure_signals": "boolean",
  "detected_subject": "string | null"
}
```

### 3. Atualizar Interface de Gestão de Agentes CRM

**Arquivo:** `src/modules/crm/hooks/useCRMAgentConfigs.ts`

Adicionar o novo agente às definições:

```typescript
// Linha 23 - Adicionar crm_validator ao type
agent_type: 'crm_analyzer' | 'crm_extractor' | 'crm_classifier' | 'crm_coach' | 'crm_validator';

// Após linha 176 - Adicionar nova definição
{
  key: 'opportunity_matcher',
  name: 'Opportunity Matcher',
  category: 'validation',
  categoryLabel: 'Validação de Dados',
  type: 'crm_validator' as const,
  description: 'Detecta oportunidades duplicadas e decide se é continuação, cross-sell ou recompra',
  icon: '🔍',
  outputSchema: {
    decision: 'merge | new | review',
    existing_opportunity_id: 'string | null',
    confidence: '0.0-1.0',
    reasoning: 'string',
    is_same_subject: 'boolean',
    has_closure_signals: 'boolean',
    detected_subject: 'string | null'
  }
}

// Linha 186 - Atualizar query para incluir crm_validator
.in('agent_type', ['crm_analyzer', 'crm_extractor', 'crm_classifier', 'crm_coach', 'crm_validator'])
```

### 4. Criar Utilitário: opportunity-matcher.ts

**Arquivo:** `supabase/functions/_shared/opportunity-matcher.ts`

```typescript
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { callLLM } from './llm-client.ts';

interface MatcherInput {
  customer_phone: string;
  vendor_id: string;
  product_category?: string;
  conversation_id?: string;
  vendor_conversation_id?: number;
  source: 'whatsapp' | 'vendor_whatsapp';
}

interface MatcherResult {
  action: 'create_new' | 'merge' | 'needs_review';
  existing_opportunity_id?: string;
  confidence: number;
  reasoning: string;
  decided_by: 'rule' | string; // 'rule' ou 'ai:agent_id'
}

export async function checkOpportunityDuplicate(
  supabase: SupabaseClient,
  input: MatcherInput
): Promise<MatcherResult> {
  // 1. Buscar oportunidades abertas para esse telefone + vendedor
  const { data: openOpportunities } = await supabase
    .from('crm_opportunities')
    .select(`
      id, title, product_category, stage, value, created_at, updated_at,
      customer:crm_customers!inner(phone)
    `)
    .eq('vendor_id', input.vendor_id)
    .not('stage', 'in', '("closed_won","closed_lost")')
    .eq('customer.phone', input.customer_phone)
    .order('updated_at', { ascending: false })
    .limit(5);

  // 2. Se não encontrou nenhuma aberta → criar nova (sem IA)
  if (!openOpportunities || openOpportunities.length === 0) {
    return {
      action: 'create_new',
      confidence: 1.0,
      reasoning: 'Nenhuma oportunidade aberta encontrada para este cliente/vendedor',
      decided_by: 'rule'
    };
  }

  // 3. Se encontrou 1 do mesmo vendedor → chamar IA para decidir
  if (openOpportunities.length === 1) {
    const existingOpp = openOpportunities[0];
    
    // 3.1 Verificação rápida por categoria (se conhecida)
    if (input.product_category && existingOpp.product_category) {
      if (input.product_category !== existingOpp.product_category) {
        return {
          action: 'create_new',
          existing_opportunity_id: existingOpp.id,
          confidence: 0.95,
          reasoning: `Produto diferente: nova conversa é ${input.product_category}, existente é ${existingOpp.product_category} (cross-sell)`,
          decided_by: 'rule'
        };
      }
    }
    
    // 3.2 Mesmo produto ou categoria desconhecida → chamar IA
    const aiResult = await callOpportunityMatcherAgent(supabase, {
      existing_opportunity: existingOpp,
      new_product_category: input.product_category,
      source: input.source
    });
    
    return aiResult;
  }

  // 4. Múltiplas oportunidades abertas → needs_review
  return {
    action: 'needs_review',
    existing_opportunity_id: openOpportunities[0].id,
    confidence: 0.5,
    reasoning: `${openOpportunities.length} oportunidades abertas encontradas para este cliente`,
    decided_by: 'rule'
  };
}

async function callOpportunityMatcherAgent(
  supabase: SupabaseClient,
  context: {
    existing_opportunity: any;
    new_product_category?: string;
    source: string;
  }
): Promise<MatcherResult> {
  // Buscar configuração do agente
  const { data: agentConfig } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('agent_type', 'crm_validator')
    .eq('agent_name', 'Opportunity Matcher')
    .eq('is_active', true)
    .single();

  if (!agentConfig) {
    // Fallback se agente não configurado: merge por padrão
    return {
      action: 'merge',
      existing_opportunity_id: context.existing_opportunity.id,
      confidence: 0.7,
      reasoning: 'Agente não configurado - assumindo continuação da negociação existente',
      decided_by: 'rule'
    };
  }

  // Preparar prompt
  const userMessage = `
OPORTUNIDADE EXISTENTE:
${JSON.stringify(context.existing_opportunity, null, 2)}

NOVA CONVERSA:
{
  "product_category": ${context.new_product_category ? `"${context.new_product_category}"` : 'null'},
  "source": "${context.source}"
}

Analise e retorne sua decisão em JSON.
`;

  try {
    const response = await callLLM(
      agentConfig.llm_model || 'claude-3-5-sonnet-20241022',
      [
        { role: 'system', content: agentConfig.system_prompt },
        { role: 'user', content: userMessage }
      ],
      {
        maxTokens: agentConfig.max_tokens || 500,
        temperature: agentConfig.temperature || 0.1
      }
    );

    // Parse resposta
    const parsed = JSON.parse(response.content);
    
    return {
      action: parsed.decision === 'merge' ? 'merge' : 
              parsed.decision === 'new' ? 'create_new' : 'needs_review',
      existing_opportunity_id: context.existing_opportunity.id,
      confidence: parsed.confidence || 0.8,
      reasoning: parsed.reasoning || 'Decisão do agente de IA',
      decided_by: `ai:${agentConfig.id}`
    };
  } catch (error) {
    console.error('[OpportunityMatcher] Erro ao chamar IA:', error);
    // Fallback em caso de erro: merge
    return {
      action: 'merge',
      existing_opportunity_id: context.existing_opportunity.id,
      confidence: 0.6,
      reasoning: 'Erro ao processar IA - assumindo continuação',
      decided_by: 'rule'
    };
  }
}

// Função para registrar decisão no log
export async function logMatchDecision(
  supabase: SupabaseClient,
  input: MatcherInput,
  result: MatcherResult,
  newOpportunityId?: string
): Promise<void> {
  try {
    await supabase.from('crm_opportunity_match_log').insert({
      customer_phone: input.customer_phone,
      vendor_id: input.vendor_id,
      source: input.source,
      decision: result.action,
      confidence: result.confidence,
      reasoning: result.reasoning,
      existing_opportunity_id: result.existing_opportunity_id,
      new_opportunity_id: newOpportunityId,
      decided_by: result.decided_by,
      product_category: input.product_category,
      metadata: {
        conversation_id: input.conversation_id,
        vendor_conversation_id: input.vendor_conversation_id
      }
    });
  } catch (error) {
    console.error('[OpportunityMatcher] Erro ao registrar log:', error);
  }
}
```

### 5. Modificar send-lead-to-vendor/index.ts

**Linhas 141-166 (criação de oportunidade):**

```typescript
// Antes da linha 141, adicionar import e verificação:

import { checkOpportunityDuplicate, logMatchDecision } from '../_shared/opportunity-matcher.ts';

// Substituir linhas 141-166 por:

// 7.2 NOVO: Verificar duplicação antes de criar oportunidade
const matchResult = await checkOpportunityDuplicate(supabase, {
  customer_phone: normalizedPhone,
  vendor_id: vendorId,
  product_category: conversation?.product_group,
  conversation_id: conversationId,
  source: 'whatsapp'
});

if (matchResult.action === 'merge' && matchResult.existing_opportunity_id) {
  // Atualizar oportunidade existente
  const { error: updateError } = await supabase
    .from('crm_opportunities')
    .update({
      conversation_id: conversationId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', matchResult.existing_opportunity_id);
    
  opportunityId = matchResult.existing_opportunity_id;
  console.log(`[CRM] Oportunidade existente atualizada: ${opportunityId} (${matchResult.reasoning})`);
  
  // Registrar decisão no log
  await logMatchDecision(supabase, {
    customer_phone: normalizedPhone,
    vendor_id: vendorId,
    product_category: conversation?.product_group,
    conversation_id: conversationId,
    source: 'whatsapp'
  }, matchResult);
  
} else {
  // Criar nova oportunidade (código atual)
  const validationStatus = matchResult.action === 'needs_review' ? 'needs_review' : 'ai_generated';
  
  const { data: opportunity, error: oppError } = await supabase
    .from('crm_opportunities')
    .insert({
      customer_id: customerId,
      conversation_id: conversationId,
      vendor_id: vendorId,
      title: `Oportunidade - ${conversation?.product_group || 'Nova'}`,
      source: 'whatsapp',
      product_category: conversation?.product_group,
      stage: 'prospecting',
      probability: 20,
      value: 0,
      validation_status: validationStatus,
      temperature: conversation?.lead_temperature || 'cold',
      match_confidence: matchResult.confidence,
    })
    .select('id')
    .single();

  if (oppError) {
    console.error('Erro ao criar oportunidade CRM:', oppError);
  } else {
    opportunityId = opportunity?.id;
    console.log(`[CRM] Nova oportunidade criada: ${opportunityId}`);
    
    // Registrar decisão no log
    await logMatchDecision(supabase, {
      customer_phone: normalizedPhone,
      vendor_id: vendorId,
      product_category: conversation?.product_group,
      conversation_id: conversationId,
      source: 'whatsapp'
    }, matchResult, opportunityId);
  }
}
```

### 6. Modificar process-vendor-opportunities/index.ts

**Linhas 146-168 (criação de oportunidade):**

```typescript
// No início, adicionar import:
import { checkOpportunityDuplicate, logMatchDecision } from '../_shared/opportunity-matcher.ts';

// Substituir linhas 146-168 por:

// 3.2.5 NOVO: Verificar duplicação antes de criar
const matchResult = await checkOpportunityDuplicate(supabase, {
  customer_phone: normalizedPhone,
  vendor_id: conv.vendor_id,
  product_category: conv.product_category,
  vendor_conversation_id: conv.id,
  source: 'vendor_whatsapp'
});

if (matchResult.action === 'merge' && matchResult.existing_opportunity_id) {
  // Atualizar oportunidade existente com vendor_conversation_id
  await supabase
    .from('crm_opportunities')
    .update({
      vendor_conversation_id: conv.id,
      conversation_id: botConversationId || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', matchResult.existing_opportunity_id);
  
  console.log(`[VendorOpportunities] Oportunidade ${matchResult.existing_opportunity_id} atualizada com vendor_conversation ${conv.id}`);
  
  // Registrar decisão
  await logMatchDecision(supabase, {
    customer_phone: normalizedPhone,
    vendor_id: conv.vendor_id,
    product_category: conv.product_category,
    vendor_conversation_id: conv.id,
    source: 'vendor_whatsapp'
  }, matchResult);
  
  // Marcar conversa como processada
  await supabase
    .from('vendor_conversations')
    .update({ has_opportunity: true })
    .eq('id', conv.id);
    
  processed++;
  continue;
  
} else {
  // 3.3 Criar nova oportunidade
  const validationStatus = matchResult.action === 'needs_review' ? 'needs_review' : 'ai_generated';
  
  const { data: newOpp, error: oppError } = await supabase
    .from('crm_opportunities')
    .insert({
      customer_id: customer.id,
      vendor_conversation_id: conv.id,
      vendor_id: conv.vendor_id,
      conversation_id: botConversationId,
      title: `Oportunidade - ${conv.product_category || 'Nova'}`,
      source: opportunitySource,
      product_category: conv.product_category,
      stage: 'prospecting',
      probability: isFromBot ? 20 : 10,
      value: 0,
      validation_status: validationStatus,
      match_confidence: matchResult.confidence,
    })
    .select('id')
    .single();

  if (oppError) {
    console.error(`[VendorOpportunities] Erro ao criar oportunidade:`, oppError);
    failed++;
    errors.push(`Conv ${conv.id} opp: ${oppError.message}`);
    continue;
  }
  
  // Registrar decisão
  await logMatchDecision(supabase, {
    customer_phone: normalizedPhone,
    vendor_id: conv.vendor_id,
    product_category: conv.product_category,
    vendor_conversation_id: conv.id,
    source: 'vendor_whatsapp'
  }, matchResult, newOpp?.id);
}
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| Migração SQL | Criar - Adicionar enum, tabela de log, índices |
| `supabase/functions/_shared/opportunity-matcher.ts` | Criar - Utilitário de verificação |
| `supabase/functions/send-lead-to-vendor/index.ts` | Modificar - Adicionar verificação (linhas 141-166) |
| `supabase/functions/process-vendor-opportunities/index.ts` | Modificar - Adicionar verificação (linhas 146-168) |
| `src/modules/crm/hooks/useCRMAgentConfigs.ts` | Modificar - Adicionar definição do agente |

---

## Fluxo de Decisão Final

```
┌────────────────────────────────────────────────────────────────────┐
│                    checkOpportunityDuplicate()                      │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  PASSO 1: Buscar oportunidades abertas                             │
│                                                                     │
│  SELECT * FROM crm_opportunities o                                  │
│  JOIN crm_customers c ON c.id = o.customer_id                       │
│  WHERE c.phone = :phone                                             │
│    AND o.vendor_id = :vendor_id                                     │
│    AND o.stage NOT IN ('closed_won', 'closed_lost')                │
└────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        Nenhuma          1 encontrada     Múltiplas
       encontrada                        encontradas
              │               │               │
              ▼               ▼               ▼
┌──────────────────┐ ┌────────────────┐ ┌────────────────┐
│ create_new       │ │ Verificar      │ │ needs_review   │
│ (sem IA)         │ │ categoria      │ │ confidence: 0.5│
│ confidence: 1.0  │ └────────────────┘ └────────────────┘
└──────────────────┘         │
                   ┌─────────┴─────────┐
                   │                   │
             Mesma/null           Diferente
                   │                   │
                   ▼                   ▼
         ┌────────────────┐   ┌────────────────┐
         │ CHAMAR AGENTE  │   │ create_new     │
         │ (se ativo)     │   │ (cross-sell)   │
         └────────────────┘   └────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────────┐
│  PASSO 2: Agente analisa contexto                                  │
│  - Busca sinais de fechamento                                       │
│  - Decide: merge | new | review                                     │
│  - Registra decisão no log                                          │
└────────────────────────────────────────────────────────────────────┘
```

---

## Benefícios

1. **Prevenção automática**: Novas duplicações são evitadas na origem
2. **Controle total**: Agente configurável via `/crm/agentes` (prompt, temperatura, LLM)
3. **Auditoria**: Todas as decisões registradas em `crm_opportunity_match_log`
4. **Performance**: Verificação programática evita chamadas IA desnecessárias
5. **Cross-sell**: Detecta oportunidades de venda de produtos diferentes
6. **Recompra**: Reconhece clientes retornando após fechamento
7. **Fallback humano**: Casos ambíguos marcados como `needs_review`
