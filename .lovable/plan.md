

# Plano Corrigido: CRM Invisivel - Arquitetura Simplificada

## 1. Analise Critica Aceita

Voce tem razao em todos os pontos levantados. O plano original tinha problemas de:

| Problema | Correcao |
|----------|----------|
| Duplicacao de dados | Usar tabelas existentes |
| Tabela intermediaria desnecessaria | Escrever direto em `crm_opportunities` |
| Tipo incorreto (BIGINT vs INTEGER) | Usar `INTEGER` para `vendor_conversations.id` |
| Fluxo de validacao indefinido | Definir claramente o que acontece |
| Ignora estruturas existentes | Aproveitar `crm_customers`, `crm_opportunities` |

---

## 2. Arquitetura Corrigida

### Fluxo de Dados Simplificado

```text
vendor_conversations ──────────────────────────────────────────────────────────►
         │                                                                      
         │  PIPELINE DIARIO (21h)                                              
         │                                                                      
         ├──► FERRAMENTAS ──► vendor_sales_metrics (NOVA, unica tabela nova)   
         │                    • Metricas simples de conversao                  
         │                    • Nao cria opportunity                           
         │                                                                      
         └──► SOLAR/BUILD ──► crm_opportunities (EXISTENTE, adaptada)          
                              + vendor_conversation_id (FK nova)               
                              + ai_confidence (DECIMAL)                        
                              + validation_status (ENUM)                       
                              + temperature (TEXT)                             
                              + objections (TEXT[])                            
                              + next_step (TEXT)                               
                              │                                                
                              └──► crm_customers (EXISTENTE)                   
                                   Vincula ou cria cliente                     
```

---

## 3. Mudancas no Banco de Dados

### 3.1 NOVA Tabela: `vendor_sales_metrics` (apenas para Ferramentas)

Esta e a UNICA tabela nova necessaria. Ferramentas tem ciclo curto e nao justifica pipeline completo.

```sql
CREATE TABLE vendor_sales_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  vendor_conversation_id INTEGER NOT NULL REFERENCES vendor_conversations(id),
  
  -- Resultado da conversa
  converted BOOLEAN NOT NULL,
  sale_value NUMERIC,
  loss_reason TEXT, -- 'price', 'stock', 'competitor', 'gave_up', 'other'
  product_sold TEXT,
  
  -- Metricas de tempo
  cycle_time_hours INTEGER,
  messages_analyzed INTEGER,
  
  -- IA
  ai_model TEXT DEFAULT 'claude-sonnet',
  ai_confidence DECIMAL(3,2),
  
  -- Controle
  extraction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(vendor_conversation_id, extraction_date)
);
```

### 3.2 ALTERAR Tabela: `crm_opportunities` (adicionar campos)

Adicionar colunas para suportar extracao automatica e validacao:

```sql
ALTER TABLE crm_opportunities
  ADD COLUMN vendor_id UUID REFERENCES vendors(id),
  ADD COLUMN vendor_conversation_id INTEGER REFERENCES vendor_conversations(id),
  ADD COLUMN validation_status TEXT DEFAULT 'ai_generated' 
    CHECK (validation_status IN ('ai_generated', 'pending', 'validated', 'edited', 'rejected')),
  ADD COLUMN temperature TEXT CHECK (temperature IN ('hot', 'warm', 'cold')),
  ADD COLUMN objections TEXT[] DEFAULT '{}',
  ADD COLUMN next_step TEXT,
  ADD COLUMN ai_confidence DECIMAL(3,2),
  ADD COLUMN ai_model TEXT,
  ADD COLUMN ai_extracted_at TIMESTAMPTZ,
  ADD COLUMN validated_at TIMESTAMPTZ,
  ADD COLUMN validated_by UUID REFERENCES profiles(user_id);
```

### 3.3 ALTERAR Tabela: `vendor_conversations` (adicionar classificacao)

Para saber qual categoria de produto cada conversa trata:

```sql
ALTER TABLE vendor_conversations
  ADD COLUMN product_category product_category,
  ADD COLUMN has_opportunity BOOLEAN DEFAULT false,
  ADD COLUMN last_processed_at TIMESTAMPTZ;
```

### 3.4 NOVO Enum: `validation_status`

```sql
CREATE TYPE validation_status AS ENUM (
  'ai_generated',  -- Recem extraido pela IA
  'pending',       -- Aguardando revisao do vendedor
  'validated',     -- Vendedor confirmou dados corretos
  'edited',        -- Vendedor editou os dados
  'rejected'       -- Vendedor rejeitou (conversa nao era negociacao)
);
```

---

## 4. Fluxo de Validacao (Clarificado)

### O que acontece quando vendedor valida:

| Acao | O que acontece |
|------|----------------|
| **Validar** | `validation_status = 'validated'`, `validated_at = now()`, `validated_by = user_id` |
| **Editar** | Abre modal de edicao, salva campos alterados, `validation_status = 'edited'` |
| **Rejeitar** | `validation_status = 'rejected'`, opportunity permanece mas nao aparece em metricas |

### Onde ficam os dados:

- **Dados do cliente**: `crm_customers` (vinculado via `customer_id`)
- **Dados da negociacao**: `crm_opportunities` (campos existentes + novos)
- **Historico de edicoes**: Campo `metadata` JSONB ja existe, pode armazenar versoes anteriores

---

## 5. Fases de Implementacao

### FASE 1: Schema e Pipeline Basico (3-4 dias)

**Banco de Dados:**
- Criar tabela `vendor_sales_metrics`
- Alterar `crm_opportunities` com novos campos
- Alterar `vendor_conversations` com classificacao

**Edge Functions:**
- `daily-crm-pipeline` - Orquestrador (cron 21h)
- `classify-vendor-conversation` - Classifica por produto
- `analyze-vendor-sales` - Extrai metricas de Ferramentas
- `extract-opportunity-data` - Extrai dados para Solar/Build

**Logica do Pipeline:**
```typescript
async function dailyCRMPipeline() {
  // 1. Buscar conversas com atividade hoje
  const conversations = await getConversationsWithActivityToday();
  
  for (const conv of conversations) {
    // 2. Classificar (se ainda nao classificada)
    if (!conv.product_category) {
      await classifyConversation(conv);
    }
    
    // 3. Processar baseado na categoria
    if (conv.product_category === 'ferramentas') {
      // Apenas metricas - nao cria opportunity
      await upsertSalesMetric(conv);
    } else if (['energia_solar', 'telha_shingle', 'steel_frame'].includes(conv.product_category)) {
      // Pipeline completo
      const customer = await findOrCreateCustomer(conv);
      await upsertOpportunity(conv, customer);
    }
  }
}
```

### FASE 2: Interface de Validacao (2-3 dias)

**Nova Pagina:** `/crm/validar`

- Lista de cards pendentes (validation_status = 'pending')
- Filtro por vendedor
- Cards mostram: cliente, produto, valor estimado, temperatura
- Botoes: Validar | Editar | Rejeitar
- Modal de edicao com campos editaveis

**Componentes:**
- `ValidationCardList.tsx`
- `ValidationCard.tsx`
- `EditOpportunityModal.tsx`

### FASE 3: Pipeline Kanban Funcional (2-3 dias)

**Atualizar:** `/crm/pipeline`

- Kanban com dados reais de `crm_opportunities`
- Drag & drop para mudar estagio
- Filtros por categoria, vendedor, valor
- Estagios existentes: `prospecting` -> `qualification` -> `proposal` -> `negotiation` -> `closed_won`/`closed_lost`

### FASE 4: Dashboard de Metricas (1-2 dias)

**Atualizar:** `/crm/dashboard`

- Metricas reais de conversao (Ferramentas)
- Valor do pipeline (Solar/Build)
- Tempo medio de ciclo
- Taxa de resposta por vendedor

---

## 6. Relacionamentos Corretos

```text
vendors
├── id (UUID)
└── phone_number

vendor_conversations
├── id (INTEGER) ◄── CHAVE CORRETA
├── vendor_id (UUID) → vendors.id
├── customer_phone
├── product_category (NOVO)
└── has_opportunity (NOVO)

crm_customers
├── id (UUID)
├── phone → normalizado para comparar com customer_phone
└── conversation_id → conversations.id (BOT)

crm_opportunities
├── id (UUID)
├── customer_id (UUID) → crm_customers.id
├── conversation_id (UUID) → conversations.id (BOT, opcional)
├── vendor_id (UUID, NOVO) → vendors.id
├── vendor_conversation_id (INTEGER, NOVO) → vendor_conversations.id
├── validation_status (TEXT, NOVO)
├── temperature (TEXT, NOVO)
├── objections (TEXT[], NOVO)
├── next_step (TEXT, NOVO)
└── stage (ENUM existente)

vendor_sales_metrics (NOVA - apenas Ferramentas)
├── vendor_id (UUID) → vendors.id
└── vendor_conversation_id (INTEGER) → vendor_conversations.id
```

---

## 7. Prompt de Extracao para Oportunidades

```typescript
const extractOpportunityPrompt = `
Analise a conversa de WhatsApp abaixo e extraia informacoes de negociacao.

CONVERSA:
{messages}

CATEGORIA DO PRODUTO: {product_category}

Extraia as seguintes informacoes (retorne JSON):
{
  "customer_name": "nome do cliente se mencionado",
  "customer_city": "cidade se mencionada",
  "customer_state": "estado se mencionado (sigla)",
  "customer_type": "residencial | comercial | instalador",
  "stage": "prospecting | qualification | proposal | negotiation | closed_won | closed_lost",
  "estimated_value": numero ou null,
  "temperature": "hot | warm | cold",
  "probability": numero 0-100,
  "objections": ["lista de objecoes mencionadas"],
  "next_step": "proximo passo acordado ou null",
  "summary": "resumo em 2-3 frases"
}

Regras:
- Se nao conseguir determinar, use null
- temperature: hot = cliente quer fechar, warm = interessado mas com duvidas, cold = apenas consultando
- probability: baseado no estagio e sinais do cliente
`;
```

---

## 8. Respostas as Perguntas

**1. Refazer o plano usando tabelas existentes?**
Sim, este plano corrigido faz exatamente isso.

**2. `product_category` em `vendor_conversations` - preenchido automaticamente?**
Sim, o pipeline classifica usando IA e salva em `vendor_conversations.product_category`.

**3. Estagios do funil estao corretos?**
Usaremos o enum existente `opportunity_stage`:
- `prospecting` -> `qualification` -> `proposal` -> `negotiation` -> `closed_won`/`closed_lost`

**4. Horario do pipeline?**
21h esta OK? Ou prefere outro horario?

**5. Interface mobile?**
A interface de validacao sera responsiva (funciona em mobile e desktop).

---

## 9. Resumo das Mudancas

| O que | Acao |
|-------|------|
| Tabela nova | Apenas `vendor_sales_metrics` (Ferramentas) |
| Alteracoes | `crm_opportunities` + 9 campos, `vendor_conversations` + 3 campos |
| Aproveitado | `crm_customers`, `crm_opportunities`, enum `opportunity_stage` |
| Evitado | Tabela intermediaria, duplicacao de dados |
| Total tabelas | 1 nova vs 3 do plano original |

---

## 10. Proximos Passos

1. **Aprovar este plano corrigido**
2. **Confirmar horario do cron** (21h ou outro?)
3. **Implementar FASE 1** - Schema + Pipeline basico
4. **Testar com dados reais** - 5-10 conversas existentes
5. **Implementar FASE 2** - Interface de validacao

