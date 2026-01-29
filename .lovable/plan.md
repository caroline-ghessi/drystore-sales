
# Plano: Sistema de Agentes de IA para Extração de Dados de Negociações no CRM

## Visão Geral

Implementar um sistema completo de 8 agentes de IA especializados para análise e extração de dados das negociações dos vendedores, com interface administrativa exclusiva para usuários admin no módulo CRM.

---

## Arquitetura Proposta

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE PROCESSAMENTO                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                           vendor_conversations                           │
│                                  │                                       │
│          ┌───────────────────────┼───────────────────────┐               │
│          │                       │                       │               │
│          ▼                       ▼                       ▼               │
│   ┌─────────────┐        ┌─────────────┐        ┌─────────────┐         │
│   │   ANÁLISE   │        │  EXTRAÇÃO   │        │  EXTRAÇÃO   │         │
│   │  DE VENDAS  │        │  DE DADOS   │        │  DE MÍDIA   │         │
│   │             │        │             │        │  (futuro)   │         │
│   │ • SPIN      │        │ • Cliente   │        │             │         │
│   │ • BANT      │        │ • Projeto   │        │             │         │
│   │ • Objeções  │        │ • Negócio   │        │             │         │
│   └──────┬──────┘        └──────┬──────┘        └──────┬──────┘         │
│          │                       │                       │               │
│          └───────────────────────┼───────────────────────┘               │
│                                  │                                       │
│                                  ▼                                       │
│                         ┌───────────────┐                                │
│                         │   PIPELINE    │                                │
│                         │  CLASSIFIER   │                                │
│                         └───────┬───────┘                                │
│                                 │                                        │
│                                 ▼                                        │
│                         ┌───────────────┐                                │
│                         │   COACHING    │                                │
│                         │  GENERATOR    │                                │
│                         └───────────────┘                                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Fase 1: Banco de Dados

### 1.1 Novo Enum para Tipos de Agentes CRM
Extender o enum `agent_type` existente com novos tipos:

```sql
ALTER TYPE agent_type ADD VALUE IF NOT EXISTS 'crm_analyzer';
ALTER TYPE agent_type ADD VALUE IF NOT EXISTS 'crm_extractor';
ALTER TYPE agent_type ADD VALUE IF NOT EXISTS 'crm_classifier';
ALTER TYPE agent_type ADD VALUE IF NOT EXISTS 'crm_coach';
```

### 1.2 Nova Tabela: `crm_agent_extractions`
Armazena os outputs de cada agente por oportunidade:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| opportunity_id | uuid | FK para crm_opportunities |
| agent_type | text | Tipo do agente (spin, bant, client_profiler, etc) |
| extraction_data | jsonb | Dados extraídos estruturados |
| confidence | decimal | Score de confiança (0-1) |
| model_used | text | Modelo LLM utilizado |
| tokens_used | integer | Tokens consumidos |
| processing_time_ms | integer | Tempo de processamento |
| created_at | timestamptz | Data da extração |
| version | integer | Versão da extração (para histórico) |

### 1.3 Extender `crm_customers` para Dados de Perfil
Adicionar colunas para dados do Client Profiler:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| profile_type | text | cliente_final, tecnico, empresa |
| profession | text | Profissão/cargo |
| is_technical | boolean | Se é técnico da área |
| origin_channel | text | Canal de origem (whatsapp, indicacao, etc) |
| referred_by | text | Quem indicou |
| main_motivation | text | Motivação principal |
| pain_points | jsonb | Array de dores identificadas |
| decision_makers | jsonb | Envolvidos na decisão |
| profile_extracted_at | timestamptz | Última extração |

### 1.4 Extender `crm_opportunities` para Dados de Negociação
Adicionar colunas para Deal Extractor:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| proposal_requested | boolean | Se proposta foi solicitada |
| proposal_sent | boolean | Se proposta foi enviada |
| proposal_value | numeric | Valor proposto |
| client_mentioned_value | numeric | Valor mencionado pelo cliente |
| budget_range | text | Faixa de orçamento |
| competitors | jsonb | Concorrentes mencionados |
| discount_requested | numeric | Desconto solicitado (%) |
| discount_offered | numeric | Desconto oferecido (%) |
| payment_preference | text | Preferência de pagamento |
| visit_offered | boolean | Se visita foi oferecida |
| visits_done | integer | Visitas realizadas |
| first_contact_at | timestamptz | Primeiro contato |
| days_in_negotiation | integer | Dias em negociação |
| total_interactions | integer | Total de interações |
| spin_stage | text | Fase SPIN (situation, problem, implication, need_payoff) |
| spin_score | integer | Score SPIN (0-100) |
| bant_score | integer | Score BANT (0-100) |
| bant_qualified | boolean | Se qualificado por BANT |
| recommended_actions | jsonb | Ações recomendadas pelo Coaching |

### 1.5 Extender `project_contexts` ou Criar Nova Tabela
Para dados do Project Extractor, a tabela `project_contexts` já existe e pode ser extendida com:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| project_type | text | nova, reforma, ampliacao |
| project_phase | text | Fase do projeto |
| has_professional | boolean | Tem arquiteto/engenheiro |
| professional_name | text | Nome do profissional |
| location_city | text | Cidade da obra |
| location_neighborhood | text | Bairro |
| technical_specs | jsonb | Especificações técnicas |
| products_needed | jsonb | Produtos de interesse |
| estimated_quantities | jsonb | Quantidades estimadas |
| deadline_urgency | text | Urgência |
| start_date | date | Data estimada início |

---

## Fase 2: Edge Functions (8 Agentes)

### 2.1 Estrutura Comum
Cada agente será uma Edge Function com:
- Configuração via `agent_configs` (prompt, modelo, temperatura)
- Histórico de mensagens como input
- Output estruturado via tool calling
- Logging em `system_logs`

### 2.2 Agentes a Implementar

| # | Nome | Função | Input | Output |
|---|------|--------|-------|--------|
| 1 | `crm-spin-analyzer` | Analisa fase SPIN | Mensagens | spin_stage, spin_score, indicators |
| 2 | `crm-bant-qualifier` | Qualifica por BANT | Mensagens | bant_score, budget, authority, need, timeline |
| 3 | `crm-objection-analyzer` | Identifica objeções | Mensagens | objections[], treatment_status |
| 4 | `crm-client-profiler` | Extrai perfil do cliente | Mensagens | profile, pains, decision_makers |
| 5 | `crm-project-extractor` | Extrai dados do projeto | Mensagens | location, specs, timeline |
| 6 | `crm-deal-extractor` | Extrai dados da negociação | Mensagens | proposal, competitors, values |
| 7 | `crm-pipeline-classifier` | Classifica estágio | Outputs 1-6 | stage, probability |
| 8 | `crm-coaching-generator` | Gera recomendações | Outputs 1-6 | actions[], scripts |

### 2.3 Orquestrador
Uma função `crm-process-opportunity` que:
1. Recebe opportunity_id
2. Busca mensagens da vendor_conversation
3. Executa agentes 1-6 em paralelo
4. Executa agente 7 (Pipeline) com outputs anteriores
5. Executa agente 8 (Coaching) com todos os outputs
6. Salva resultados nas tabelas

---

## Fase 3: Interface Administrativa (Admin Only)

### 3.1 Nova Página: `/crm/agentes`
Página exclusiva para admin com:

**Acesso Controlado:**
```typescript
// Verificação de permissão
const { isAdmin } = useUserPermissions();
if (!isAdmin) return <AccessDenied />;
```

**Componentes:**
1. **Lista de Agentes CRM** - Cards com cada agente e status
2. **Editor de Agente** - Modal para editar prompt, modelo, temperatura
3. **Métricas de Execução** - Tokens usados, tempo médio, taxa de sucesso
4. **Logs de Processamento** - Histórico de execuções
5. **Teste Manual** - Testar agente com conversa específica

### 3.2 Estrutura de Arquivos

```text
src/modules/crm/
├── pages/
│   └── AgentManagement.tsx          # Nova página admin
├── components/
│   └── agents/
│       ├── CRMAgentsList.tsx         # Lista de agentes
│       ├── CRMAgentCard.tsx          # Card individual
│       ├── CRMAgentEditor.tsx        # Editor de agente
│       ├── CRMAgentMetrics.tsx       # Métricas
│       ├── CRMAgentLogs.tsx          # Logs de execução
│       └── CRMAgentTester.tsx        # Teste manual
└── hooks/
    ├── useCRMAgentConfigs.ts         # CRUD agentes CRM
    ├── useCRMAgentExtractions.ts     # Extrações
    └── useCRMAgentMetrics.ts         # Métricas
```

### 3.3 Navegação
Adicionar ao sidebar do CRM (visível apenas para admin):

```typescript
// Em CRMSidebar.tsx
{isAdmin && (
  <SidebarMenuItem>
    <NavLink to="/crm/agentes">
      <Bot className="w-4 h-4 mr-2" />
      Agentes IA
    </NavLink>
  </SidebarMenuItem>
)}
```

### 3.4 Rotas
Adicionar em `CRMLayout.tsx`:

```typescript
<Route path="/agentes" element={<AgentManagement />} />
```

---

## Fase 4: Componentes da Interface

### 4.1 Página Principal (`AgentManagement.tsx`)

```text
┌────────────────────────────────────────────────────────────────────┐
│  🤖 Agentes de IA do CRM                              [+ Novo]     │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │  Análise de  │ │  Extração    │ │  Decisão     │               │
│  │   Vendas     │ │  de Dados    │ │  e Ação      │               │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 📊 SPIN Analyzer                              [Ativo] [Edit] │  │
│  │ Analisa em qual fase SPIN a conversa está                    │  │
│  │ Modelo: gpt-4 | Temp: 0.3 | Execuções: 234                   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ✅ BANT Qualifier                             [Ativo] [Edit] │  │
│  │ Verifica qualificação por Budget, Authority, Need, Timeline  │  │
│  │ Modelo: claude-3 | Temp: 0.2 | Execuções: 189                │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ... (demais agentes)                                              │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 4.2 Editor de Agente (Modal)

```text
┌─────────────────────────────────────────────────────────────────┐
│  Editar Agente: SPIN Analyzer                            [X]    │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Configuração │ Prompt │ Comportamento │ Teste │ Histórico │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Nome: [SPIN Analyzer                    ]                       │
│  Descrição: [Analisa fase SPIN...        ]                       │
│  Modelo: [GPT-4         ▼]                                       │
│  Temperatura: [===○=====] 0.3                                    │
│  Status: [✓] Ativo                                               │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Output Esperado (JSON Schema):                            │  │
│  │ {                                                         │  │
│  │   "spin_stage": "situation|problem|implication|need",     │  │
│  │   "spin_score": 0-100,                                    │  │
│  │   "indicators": ["..."],                                  │  │
│  │   "confidence": 0.0-1.0                                   │  │
│  │ }                                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│                              [Cancelar] [Salvar Alterações]      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fase 5: Integração com Oportunidades

### 5.1 Botão na Página de Detalhes
Em `NegotiationDetail.tsx`, adicionar:

```typescript
<Button onClick={processWithAgents}>
  <Brain className="w-4 h-4 mr-2" />
  Analisar com IA
</Button>
```

### 5.2 Exibição de Insights
Mostrar resultados dos agentes na página de detalhes:

```text
┌─────────────────────────────────────────────────────────────────┐
│  🧠 Análise de IA                              [Reprocessar]    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ SPIN: Need  │  │ BANT: 75%   │  │ 3 Objeções  │             │
│  │ Score: 82   │  │ Qualificado │  │ 2 tratadas  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  📌 Próximas Ações Recomendadas:                               │
│  1. Agendar visita técnica para dimensionamento                │
│  2. Enviar proposta com opção de financiamento                 │
│  3. Tratar objeção de preço com case de economia               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detalhes Técnicos

### Hooks Necessários

| Hook | Função |
|------|--------|
| `useCRMAgentConfigs` | CRUD de configurações de agentes CRM |
| `useCRMAgentExtractions` | Buscar/salvar extrações por oportunidade |
| `useCRMAgentMetrics` | Métricas agregadas de execução |
| `useProcessOpportunity` | Executar pipeline de agentes |

### Edge Functions

| Função | Descrição |
|--------|-----------|
| `crm-spin-analyzer` | Análise SPIN |
| `crm-bant-qualifier` | Qualificação BANT |
| `crm-objection-analyzer` | Análise de objeções |
| `crm-client-profiler` | Perfil do cliente |
| `crm-project-extractor` | Dados do projeto |
| `crm-deal-extractor` | Dados da negociação |
| `crm-pipeline-classifier` | Classificação de estágio |
| `crm-coaching-generator` | Geração de coaching |
| `crm-process-opportunity` | Orquestrador |

### Segurança
- Página `/crm/agentes` restrita a `isAdmin === true`
- RLS nas tabelas para garantir isolamento de dados
- Logs de auditoria para alterações em configurações

---

## Ordem de Implementação

1. **Migração de banco** - Criar tabelas e colunas
2. **Hooks de dados** - useCRMAgentConfigs, useCRMAgentExtractions
3. **Página de gerenciamento** - AgentManagement.tsx com lista
4. **Editor de agente** - CRMAgentEditor.tsx
5. **Primeira Edge Function** - crm-client-profiler (mais simples)
6. **Integração** - Botão "Analisar com IA" na página de detalhes
7. **Demais agentes** - Implementar um por vez
8. **Orquestrador** - crm-process-opportunity
9. **Métricas e logs** - Dashboard de acompanhamento
10. **Processamento em lote** - Job agendado para processar todas as oportunidades

---

## Estimativa de Complexidade

| Fase | Esforço | Prioridade |
|------|---------|------------|
| Banco de dados | Médio | Alta |
| Página admin | Médio | Alta |
| Primeiro agente | Alto | Alta |
| Demais agentes | Alto | Média |
| Orquestrador | Médio | Média |
| Integração UI | Baixo | Média |

