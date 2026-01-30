
# Plano Revisado: Implementar Agentes de IA do CRM

## Análise do Estado Atual

### O que JÁ EXISTE (confirmado por consultas)

#### Tabela `crm_opportunities` - Campos SPIN/BANT/Negociação
| Campo | Tipo | Status |
|-------|------|--------|
| `spin_stage` | text | Existe |
| `spin_score` | integer | Existe |
| `bant_score` | integer | Existe |
| `bant_qualified` | boolean | Existe |
| `proposal_requested` | boolean | Existe |
| `proposal_sent` | boolean | Existe |
| `proposal_value` | numeric | Existe |
| `client_mentioned_value` | numeric | Existe |
| `budget_range` | text | Existe |
| `competitors` | jsonb | Existe |
| `discount_requested` | numeric | Existe |
| `discount_offered` | numeric | Existe |
| `visit_offered` | boolean | Existe |
| `visits_done` | integer | Existe |
| `objections` | text[] | Existe |
| `recommended_actions` | jsonb | Existe |
| `last_ai_analysis_at` | timestamptz | Existe |

#### Tabela `crm_customers` - Campos de Perfil
| Campo | Tipo | Status |
|-------|------|--------|
| `profile_type` | text | Existe |
| `profession` | text | Existe |
| `is_technical` | boolean | Existe |
| `origin_channel` | text | Existe |
| `referred_by` | text | Existe |
| `main_motivation` | text | Existe |
| `pain_points` | jsonb | Existe |
| `decision_makers` | jsonb | Existe |
| `profile_extracted_at` | timestamptz | Existe |

#### Tabela `project_contexts` - Campos de Projeto
| Campo | Tipo | Status |
|-------|------|--------|
| `project_type_detailed` | text | Existe |
| `project_phase` | text | Existe |
| `has_professional` | boolean | Existe |
| `professional_name` | text | Existe |
| `location_neighborhood` | text | Existe |
| `technical_specs` | jsonb | Existe |
| `products_needed` | jsonb | Existe |
| `estimated_quantities` | jsonb | Existe |
| `deadline_urgency` | text | Existe |
| `start_date` | date | Existe |

#### Tabela `crm_agent_extractions` - Histórico
| Campo | Tipo | Status |
|-------|------|--------|
| `opportunity_id` | uuid | Existe |
| `agent_type` | text | Existe |
| `extraction_data` | jsonb | Existe |
| `confidence` | numeric | Existe |
| `model_used` | text | Existe |
| `tokens_used` | integer | Existe |
| `processing_time_ms` | integer | Existe |
| `version` | integer | Existe |

#### Cliente LLM Unificado
- `supabase/functions/_shared/llm-client.ts` - COMPLETO
- Suporta Claude, GPT, Grok com fallback automático
- Funções: `callLLM`, `generateCompletion`, `generateJSONCompletion`

#### Hooks Frontend
- `useCRMAgentConfigs` - Pronto
- `useCRMAgentExtractions` - Pronto
- `useProcessOpportunityWithAgents` - Pronto (chama `crm-process-opportunity`)
- `useLatestExtractionsMap` - Pronto

#### Agentes Configurados
- `SPIN Analyzer` (is_active: false, modelo: claude-3-5-sonnet-20241022)
- `BANT Qualifier` (is_active: false, modelo: claude-3-5-sonnet-20241022)
- **Faltam 6 agentes!**

---

## Decisão de Arquitetura: Abordagem Híbrida

Concordo com a sua proposta de abordagem híbrida:

```text
┌─────────────────────────────────────────────────────────────────┐
│  crm_opportunities (DADOS ATUAIS - leitura rápida na UI)        │
│                                                                  │
│  • spin_stage, spin_score                                        │
│  • bant_score, bant_qualified                                    │
│  • objections, recommended_actions                               │
│  • probability, temperature                                      │
│  • last_ai_analysis_at                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Atualizado após cada análise
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  crm_agent_extractions (HISTÓRICO - cada execução registrada)   │
│                                                                  │
│  • opportunity_id                                                │
│  • agent_type (spin_analyzer, bant_qualifier, etc.)              │
│  • extraction_data (JSON completo)                               │
│  • confidence, tokens_used                                       │
│  • created_at, version                                           │
└─────────────────────────────────────────────────────────────────┘
```

**Benefícios:**
- UI lê de `crm_opportunities` (rápido, sem JOINs)
- Histórico preservado em `crm_agent_extractions`
- Pode comparar análises ao longo do tempo
- Evolução da negociação rastreável

---

## Campos Faltantes (Migração Necessária)

A maioria dos campos já existe. Precisamos adicionar:

### Em `crm_opportunities`
```sql
-- Campos SPIN detalhados
spin_progress JSONB, -- Progresso em cada fase SPIN

-- Campos BANT detalhados
bant_details JSONB, -- Budget/Authority/Need/Timeline detalhados

-- Campos de Objeção
objections_analysis JSONB, -- Análise detalhada de cada objeção
objection_handling_score INTEGER, -- Score de tratamento (0-100)

-- Campos de Coaching
coaching_priority TEXT, -- high/medium/low
next_follow_up_date DATE,
analysis_version TEXT DEFAULT '1.0'
```

### Em `crm_customers`
```sql
-- Perfil expandido
knowledge_level TEXT, -- leigo/basico/intermediario/avancado
origin_source TEXT, -- Fonte específica dentro do canal
trigger_event TEXT, -- O que motivou o contato
is_decision_maker BOOLEAN DEFAULT true,
decision_process TEXT -- Descrição do processo de decisão
```

---

## Implementação

### Fase 1: Criar Edge Function Orquestradora

**Arquivo:** `supabase/functions/crm-process-opportunity/index.ts`

Responsabilidades:
1. Receber `opportunityId`
2. Buscar conversa completa (`vendor_conversations` + `vendor_conversation_messages`)
3. Buscar configurações dos agentes ativos em `agent_configs`
4. Executar agentes em ordem otimizada:
   - **Paralelo 1 (Extração):** client_profiler, project_extractor, deal_extractor
   - **Paralelo 2 (Análise):** spin_analyzer, bant_qualifier, objection_analyzer
   - **Sequencial (Decisão):** pipeline_classifier → coaching_generator
5. Salvar extrações em `crm_agent_extractions`
6. Atualizar campos em `crm_opportunities`, `crm_customers`, `project_contexts`

```text
┌─────────────────────────────────────────────────────────────────┐
│               crm-process-opportunity                            │
│                                                                  │
│   opportunityId ──► Buscar vendor_conversation_messages         │
│         │                                                        │
│         ▼                                                        │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  PARALELO 1: Extração de Dados                           │  │
│   │                                                          │  │
│   │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │  │
│   │  │Client Profiler│ │Project Extract│ │ Deal Extractor│  │  │
│   │  └───────────────┘ └───────────────┘ └───────────────┘  │  │
│   │         │                 │                 │            │  │
│   │         ▼                 ▼                 ▼            │  │
│   │   crm_customers    project_contexts  crm_opportunities   │  │
│   └──────────────────────────────────────────────────────────┘  │
│         │                                                        │
│         ▼                                                        │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  PARALELO 2: Análise de Vendas                           │  │
│   │                                                          │  │
│   │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │  │
│   │  │SPIN Analyzer  │ │BANT Qualifier │ │Objection Anlyz│  │  │
│   │  └───────────────┘ └───────────────┘ └───────────────┘  │  │
│   │         │                 │                 │            │  │
│   │         ▼                 ▼                 ▼            │  │
│   │   spin_stage/score   bant_score/qual    objections      │  │
│   └──────────────────────────────────────────────────────────┘  │
│         │                                                        │
│         ▼                                                        │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  SEQUENCIAL: Decisão (depende dos anteriores)            │  │
│   │                                                          │  │
│   │  Pipeline Classifier ──► Coaching Generator              │  │
│   │         │                       │                        │  │
│   │         ▼                       ▼                        │  │
│   │   stage/probability    recommended_actions               │  │
│   └──────────────────────────────────────────────────────────┘  │
│         │                                                        │
│         ▼                                                        │
│   Salvar histórico em crm_agent_extractions                      │
│   Retornar resultado consolidado                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Fase 2: Criar Utilitários Compartilhados

**Arquivo:** `supabase/functions/_shared/crm-agent-executor.ts`

```typescript
interface AgentExecutionResult {
  agentType: string;
  extractionData: Record<string, unknown>;
  confidence: number;
  tokensUsed: number;
  processingTimeMs: number;
}

async function executeAgent(
  agentConfig: AgentConfig,
  conversationMessages: Message[],
  contextData?: Record<string, unknown>
): Promise<AgentExecutionResult>
```

**Arquivo:** `supabase/functions/_shared/crm-prompts.ts`

Prompts otimizados para cada um dos 8 agentes, com:
- Output schemas JSON esperados
- Exemplos de entrada/saída
- Instruções de contexto

### Fase 3: Criar os 6 Agentes Faltantes

Migração SQL para inserir em `agent_configs`:

| Agent Key | Nome | Tipo | Descrição |
|-----------|------|------|-----------|
| `objection_analyzer` | Objection Analyzer | crm_analyzer | Identifica e analisa objeções |
| `client_profiler` | Client Profiler | crm_extractor | Extrai perfil da pessoa |
| `project_extractor` | Project Extractor | crm_extractor | Extrai dados da obra |
| `deal_extractor` | Deal Extractor | crm_extractor | Extrai dados da negociação |
| `pipeline_classifier` | Pipeline Classifier | crm_classifier | Classifica estágio do pipeline |
| `coaching_generator` | Coaching Generator | crm_coach | Gera recomendações |

### Fase 4: Criar Componente de Análise na UI

**Arquivo:** `src/modules/crm/components/negotiation/AgentAnalysisPanel.tsx`

Componente que:
- Mostra botão "Analisar com IA" 
- Exibe status de cada agente (não executado/executando/concluído)
- Mostra extrações por categoria (Pessoa/Obra/Negociação/Análise/Coaching)
- Indica confiança de cada extração
- Permite ver histórico de análises

**Integração em:** `NegotiationDetail.tsx`

Substituir o `AIInsights` estático por `AgentAnalysisPanel` dinâmico.

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/crm-process-opportunity/index.ts` | **Criar** | Orquestrador principal |
| `supabase/functions/_shared/crm-agent-executor.ts` | **Criar** | Executor de agentes |
| `supabase/functions/_shared/crm-prompts.ts` | **Criar** | Prompts dos 8 agentes |
| Migração SQL | **Criar** | Campos faltantes + 6 agentes |
| `src/modules/crm/components/negotiation/AgentAnalysisPanel.tsx` | **Criar** | Painel de análise IA |
| `src/modules/crm/pages/NegotiationDetail.tsx` | **Modificar** | Integrar AgentAnalysisPanel |
| `supabase/config.toml` | **Modificar** | Registrar nova função |

---

## Dados que Cada Agente Extrai e Armazena

### 1. Client Profiler → `crm_customers`
```json
{
  "profile_type": "cliente_final",
  "profession": "Empresário",
  "is_technical": false,
  "knowledge_level": "basico",
  "origin_channel": "instagram",
  "origin_source": "anuncio_solar",
  "referred_by": null,
  "trigger_event": "Conta de luz alta",
  "main_motivation": "Economia na conta de luz",
  "pain_points": [
    { "pain": "Conta de luz alta", "intensity": "high", "impact": "Margem do negócio" }
  ],
  "is_decision_maker": true,
  "decision_makers": ["Esposa"],
  "decision_process": "Precisa consultar a esposa"
}
```

### 2. Project Extractor → `project_contexts`
```json
{
  "location": { "city": "São Paulo", "neighborhood": "Morumbi" },
  "project_type_detailed": "Residencial alto padrão",
  "project_phase": "planejamento",
  "has_professional": true,
  "professional_name": "Arq. Maria Silva",
  "technical_specs": { "roof_m2": 150, "consumption_kwh": 800, "roof_type": "cerâmica" },
  "products_needed": ["Módulos solares", "Inversor", "Estrutura"],
  "estimated_quantities": { "modulos": 20, "potencia_kwp": 10 },
  "deadline_urgency": "medium",
  "start_date": "2025-03-01"
}
```

### 3. Deal Extractor → `crm_opportunities`
```json
{
  "proposal_requested": true,
  "proposal_sent": false,
  "proposal_value": null,
  "client_mentioned_value": 50000,
  "budget_range": "40k-60k",
  "competitors": [
    { "name": "Solar X", "value": 45000, "pros": ["Preço"], "cons": ["Garantia menor"] }
  ],
  "discount_requested": 10,
  "discount_offered": 5,
  "payment_preference": "parcelado",
  "visit_offered": true,
  "visits_done": 0,
  "first_contact_at": "2025-01-15",
  "total_interactions": 12
}
```

### 4. SPIN Analyzer → `crm_opportunities`
```json
{
  "spin_stage": "implication",
  "spin_score": 65,
  "spin_progress": {
    "situation": { "completed": true, "score": 90 },
    "problem": { "completed": true, "score": 85 },
    "implication": { "completed": false, "score": 40 },
    "need_payoff": { "completed": false, "score": 0 }
  },
  "indicators": [
    "Cliente identificou conta alta",
    "Mencionou impacto no negócio",
    "Ainda não visualizou solução"
  ]
}
```

### 5. BANT Qualifier → `crm_opportunities`
```json
{
  "bant_score": 70,
  "bant_qualified": true,
  "bant_details": {
    "budget": { "identified": true, "value": 50000, "confidence": 0.8 },
    "authority": { "identified": true, "decision_maker": "Sim, com esposa", "confidence": 0.7 },
    "need": { "identified": true, "urgency": "medium", "confidence": 0.9 },
    "timeline": { "identified": true, "expected_date": "2025-03", "confidence": 0.6 }
  }
}
```

### 6. Objection Analyzer → `crm_opportunities`
```json
{
  "objections": [
    {
      "type": "price",
      "description": "Cliente achou caro comparado a concorrente",
      "treatment_status": "partially_addressed",
      "vendor_response": "Explicou qualidade superior"
    }
  ],
  "objections_analysis": {...},
  "objection_handling_score": 60
}
```

### 7. Pipeline Classifier → `crm_opportunities`
```json
{
  "stage": "qualification",
  "probability": 45,
  "stage_reasoning": "Cliente qualificado mas ainda não recebeu proposta formal",
  "recommended_next_stage": "proposal",
  "blockers": ["Precisa agendar visita técnica"]
}
```

### 8. Coaching Generator → `crm_opportunities`
```json
{
  "recommended_actions": [
    {
      "priority": "high",
      "action": "Agendar visita técnica",
      "reasoning": "Cliente está pronto para próxima etapa",
      "script": "Olá João, que tal agendarmos uma visita..."
    }
  ],
  "coaching_priority": "high",
  "next_follow_up_date": "2025-02-01",
  "risk_alerts": [
    {
      "type": "competition",
      "severity": "medium",
      "mitigation": "Destacar diferenciais de garantia"
    }
  ]
}
```

---

## Ordem de Implementação

1. **Migração SQL** - Adicionar campos faltantes + inserir 6 agentes
2. **Criar `crm-agent-executor.ts`** - Utilitário de execução
3. **Criar `crm-prompts.ts`** - Prompts dos 8 agentes
4. **Criar `crm-process-opportunity/index.ts`** - Orquestrador
5. **Criar `AgentAnalysisPanel.tsx`** - Componente UI
6. **Atualizar `NegotiationDetail.tsx`** - Integrar painel
7. **Ativar agentes no banco** - is_active = true
8. **Testar com oportunidade real**
