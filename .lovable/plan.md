

# Plano: Separação de Métricas Bot vs Vendedores no Analytics WhatsApp

## Contexto do Problema

Atualmente, o módulo de Analytics do WhatsApp não distingue claramente entre:
- **Atendimento do Bot (IA)**: Conversas gerenciadas pelos agentes de IA via WhatsApp da empresa
- **Atendimento dos Vendedores**: Conversas nos WhatsApps individuais dos vendedores

As métricas estão misturadas ou focam apenas em um dos dois, dificultando a análise de performance de cada camada do funil de atendimento.

## Arquitetura de Dados Atual

| Camada | Tabela Conversas | Tabela Mensagens | Identificador |
|--------|------------------|------------------|---------------|
| **Bot** | `conversations` | `messages` | `sender_type = 'bot'` |
| **Atendente Humano** | `conversations` | `messages` | `sender_type = 'agent'` |
| **Vendedores** | `vendor_conversations` | `vendor_messages` | `from_me = true` |

**Volume atual (últimos 30 dias):**
- Bot: ~17.000 mensagens em ~2.100 conversas
- Atendentes humanos: ~168 mensagens
- Vendedores: ~3.200 mensagens em ~314 conversas

## Solução Proposta

### Fase 1: Criar Hooks Separados para Métricas

#### 1.1 Hook `useBotAnalytics.ts`
Métricas específicas do atendimento por IA:
- Total de conversas atendidas pelo bot
- Mensagens enviadas pelo bot por dia
- Tempo médio de resposta do bot (instantâneo)
- Taxa de classificação correta (por categoria de produto)
- Taxa de handoff (bot → vendedor)
- Distribuição por agent_type (specialist, general)
- Conversas ainda em atendimento bot vs encerradas

#### 1.2 Hook `useVendorAnalytics.ts` (refatorar existente)
Métricas específicas do atendimento humano dos vendedores:
- Total de conversas por vendedor
- Mensagens enviadas vs recebidas
- Tempo médio de resposta dos vendedores
- Score de qualidade por vendedor
- Taxa de conversão (proposta enviada)
- Tempo até primeira resposta

### Fase 2: Criar Componentes de Visualização Separados

#### 2.1 Novo Componente `BotMetrics.tsx`
Dashboard específico para performance do bot:
- Cards: Conversas Ativas, Taxa Handoff, Tempo Resposta, Classificações
- Gráfico: Conversas por dia (bot)
- Gráfico: Distribuição por categoria de produto
- Gráfico: Taxa de sucesso por agent_type
- Tabela: Conversas recentes com status

#### 2.2 Refatorar `VendorPerformance.tsx`
Manter foco exclusivo em vendedores, usando dados de `vendor_conversations`:
- Cards: Vendedores Ativos, Tempo Médio, Score Qualidade
- Gráfico: Performance por vendedor
- Ranking de vendedores
- Alertas de qualidade

### Fase 3: Atualizar Página Analytics

#### 3.1 Modificar `Analytics.tsx`
Adicionar nova aba "Bot" ou reorganizar tabs:

```
Tabs atuais:
- Visão Geral
- Conversas
- Vendedores
- Leads
- Qualidade

Tabs propostas:
- Visão Geral (mantém KPIs consolidados)
- Atendimento Bot (nova - métricas do bot)
- Atendimento Vendedores (renomear "Vendedores")
- Leads
- Qualidade (separar por bot vs vendedor)
```

#### 3.2 Atualizar `AnalyticsOverview.tsx`
Mostrar métricas lado a lado:
- Seção "Atendimento Bot": conversas, tempo, taxa handoff
- Seção "Atendimento Vendedores": conversas, tempo, qualidade

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/modules/whatsapp/hooks/useBotAnalytics.ts` | Hook para métricas do bot |
| `src/modules/whatsapp/components/analytics/BotMetrics.tsx` | Componente de métricas do bot |

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/modules/whatsapp/pages/Analytics.tsx` | Adicionar tab "Atendimento Bot" |
| `src/modules/whatsapp/components/analytics/AnalyticsOverview.tsx` | Separar seções bot vs vendedor |
| `src/modules/whatsapp/components/analytics/VendorPerformance.tsx` | Garantir foco em vendedores |
| `src/modules/whatsapp/hooks/useVendorPerformance.ts` | Ajustar para usar apenas vendor_conversations |

## Métricas Específicas por Camada

### Métricas do Bot (IA)
- **Conversas Atendidas**: Total de conversas onde o bot respondeu
- **Taxa de Handoff**: % de conversas transferidas para vendedor
- **Tempo Médio Resposta**: Tempo entre mensagem cliente e resposta bot
- **Taxa de Classificação**: % de conversas classificadas corretamente por categoria
- **Conversas por Categoria**: Distribuição por produto (solar, telhas, etc.)
- **Conversas Pendentes**: Ainda em atendimento bot

### Métricas dos Vendedores
- **Conversas por Vendedor**: Total de conversas individuais
- **Tempo Primeira Resposta**: Tempo até vendedor responder lead
- **Score de Qualidade**: Baseado em análise de IA (SPIN, vocabulário)
- **Taxa de Conversão**: Leads que viraram propostas
- **Mensagens por Conversa**: Volume de interação

## Visualização Proposta

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYTICS WHATSAPP                            │
├─────────────────────────────────────────────────────────────────┤
│  [Visão Geral] [Bot] [Vendedores] [Leads] [Qualidade]           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │   ATENDIMENTO BOT    │  │ ATENDIMENTO VENDEDOR │             │
│  ├──────────────────────┤  ├──────────────────────┤             │
│  │ Conversas: 2.139     │  │ Conversas: 314       │             │
│  │ Msgs Bot: 17.042     │  │ Msgs Vendedor: 3.199 │             │
│  │ Tempo Resp: <1s      │  │ Tempo Resp: 4.2min   │             │
│  │ Handoff: 14.7%       │  │ Qualidade: 7.2/10    │             │
│  └──────────────────────┘  └──────────────────────┘             │
│                                                                  │
│  [Gráficos comparativos e tendências]                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Queries SQL de Suporte

### Métricas do Bot
```sql
-- Conversas atendidas pelo bot
SELECT COUNT(DISTINCT conversation_id) as bot_conversations
FROM messages 
WHERE sender_type = 'bot' 
  AND created_at >= NOW() - INTERVAL '30 days';

-- Taxa de handoff (bot → vendedor)
SELECT 
  COUNT(CASE WHEN status = 'with_agent' THEN 1 END)::float / COUNT(*) * 100 as handoff_rate
FROM conversations 
WHERE created_at >= NOW() - INTERVAL '30 days';
```

### Métricas dos Vendedores
```sql
-- Performance por vendedor
SELECT 
  v.name,
  COUNT(vc.id) as total_conversations,
  SUM(vc.vendor_messages) as messages_sent,
  AVG(qm.response_time_avg_minutes) as avg_response_time,
  AVG(qm.automated_quality_score) as quality_score
FROM vendors v
LEFT JOIN vendor_conversations vc ON v.id = vc.vendor_id
LEFT JOIN quality_metrics qm ON v.id = qm.vendor_id
WHERE v.is_active = true
GROUP BY v.id, v.name;
```

## Resultado Esperado

Após implementação:
1. Gestores poderão ver performance do bot separadamente
2. Métricas de vendedores não serão "poluídas" com dados do bot
3. Comparação clara entre as duas camadas de atendimento
4. Identificação de gargalos específicos (bot lento? handoff alto? vendedor demorado?)
5. KPIs mais precisos para cada etapa do funil

