
# Plano: Melhorar Interface do CRM - NeuroCRM Design

## 1. Resumo

Implementar o novo design visual do CRM baseado no template HTML fornecido (NeuroCRM), aplicando as cores da marca Drystore e usando os estágios de negociação corretos do enum existente.

---

## 2. Estágios do Pipeline (Corretos)

Baseado no enum `opportunity_stage` já existente no sistema:

| Ordem | Stage (DB) | Label (PT-BR) | Cor |
|-------|-----------|---------------|-----|
| 1 | `prospecting` | Prospecção | Azul |
| 2 | `qualification` | Qualificação | Amarelo |
| 3 | `proposal` | Proposta | Laranja |
| 4 | `negotiation` | Negociação | Verde-claro |
| 5 | `closed_won` | Fechado (Ganho) | Verde |
| 6 | `closed_lost` | Fechado (Perdido) | Vermelho |

---

## 3. Mudanças Visuais Principais

### 3.1 Paleta de Cores (Drystore)

```
primary: #ef7d04 (Laranja Drystore)
secondary: #3c3c3b (Cinza Escuro)
gray-medium: #868787
gray-light: #dadada
gray-bg: #f6f6f6
```

### 3.2 Sidebar (Nova Estrutura)

| Antes | Depois |
|-------|--------|
| CRM azul genérico | "NeuroCRM" com ícone AI |
| Itens simples | Agrupados por seção: Menu Principal + Gestão |
| Sem indicador IA | Badge de notificação IA (novas oportunidades) |

### 3.3 Header (Novo Layout)

| Antes | Depois |
|-------|--------|
| Breadcrumb simples | Breadcrumb + Usuário com avatar + Status IA |
| - | Indicador "IA Monitorando" com contagem de novidades |

### 3.4 Dashboard (Redesign Completo)

**Cards de Estatísticas:**
- Total Pipeline
- Taxa de Conversão
- Tempo Médio Ciclo
- Leads Ativos

**Novo Kanban Visual:**
- Colunas por estágio com cores distintas
- Cards de oportunidade com:
  - Nome do cliente + tempo (10 min, 2h, 1d)
  - Título do projeto
  - Descrição resumida
  - Valor + Indicador de temperatura
  - Badges de ação (Validar para leads IA)
- Total por coluna no rodapé
- Drag & Drop entre colunas

---

## 4. Arquivos a Criar/Modificar

### 4.1 Componentes Novos

| Arquivo | Descrição |
|---------|-----------|
| `src/modules/crm/components/pipeline/PipelineKanban.tsx` | Componente Kanban principal |
| `src/modules/crm/components/pipeline/KanbanColumn.tsx` | Coluna individual do Kanban |
| `src/modules/crm/components/pipeline/OpportunityCard.tsx` | Card de oportunidade |
| `src/modules/crm/components/pipeline/KanbanStats.tsx` | Estatísticas do pipeline |
| `src/modules/crm/components/layout/AIStatusIndicator.tsx` | Indicador "IA Monitorando" |

### 4.2 Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/modules/crm/components/layout/CRMSidebar.tsx` | Novo design com seções + ícone NeuroCRM |
| `src/modules/crm/components/layout/CRMHeader.tsx` | Adicionar avatar + indicador IA |
| `src/modules/crm/pages/Dashboard.tsx` | Integrar novo layout com Kanban |
| `src/modules/crm/pages/Pipeline.tsx` | Substituir placeholder pelo Kanban funcional |

### 4.3 Hooks a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/modules/crm/hooks/useOpportunities.ts` | Buscar oportunidades agrupadas por estágio |
| `src/modules/crm/hooks/usePipelineStats.ts` | Calcular métricas do pipeline |

---

## 5. Detalhes de Implementação

### 5.1 Estrutura do Kanban

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    KANBAN DO PIPELINE DE VENDAS                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ PROSPECÇÃO  │  │ QUALIFICAÇÃO│  │  PROPOSTA   │  │ NEGOCIAÇÃO  │    │
│  │    (4)      │  │    (2)      │  │    (3)      │  │    (2)      │    │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤    │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │    │
│  │ │ Card 1  │ │  │ │ Card 1  │ │  │ │ Card 1  │ │  │ │ Card 1  │ │    │
│  │ │         │ │  │ │         │ │  │ │         │ │  │ │         │ │    │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │    │
│  │ ┌─────────┐ │  │             │  │ ┌─────────┐ │  │             │    │
│  │ │ Card 2  │ │  │             │  │ │ Card 2  │ │  │             │    │
│  │ │         │ │  │             │  │ │         │ │  │             │    │
│  │ └─────────┘ │  │             │  │ └─────────┘ │  │             │    │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤    │
│  │ R$ 72.000   │  │ R$ 105.000  │  │ R$ 280.000  │  │ R$ 265.000  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Estrutura do Card de Oportunidade

```tsx
interface OpportunityCardProps {
  id: string;
  customerName: string;
  title: string;
  description?: string;
  value: number;
  temperature: 'hot' | 'warm' | 'cold';
  validationStatus: 'ai_generated' | 'pending' | 'validated' | 'edited' | 'rejected';
  timeAgo: string; // "10 min", "2h", "1d"
  productCategory: string;
  actionBadge?: string; // "Validar", "Agendar Call", etc.
}
```

### 5.3 Cores por Estágio

```tsx
const STAGE_COLORS = {
  prospecting: { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-500' },
  qualification: { bg: 'bg-yellow-50', border: 'border-yellow-200', header: 'bg-yellow-500' },
  proposal: { bg: 'bg-orange-50', border: 'border-orange-200', header: 'bg-orange-500' },
  negotiation: { bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-500' },
  closed_won: { bg: 'bg-green-50', border: 'border-green-200', header: 'bg-green-600' },
  closed_lost: { bg: 'bg-red-50', border: 'border-red-200', header: 'bg-red-500' },
};
```

### 5.4 Indicador de Temperatura

```tsx
const TEMPERATURE_INDICATORS = {
  hot: { icon: '🔥', color: 'text-red-500' },
  warm: { icon: '🟠', color: 'text-orange-500' },
  cold: { icon: '❄️', color: 'text-blue-500' },
};
```

---

## 6. Sidebar Redesenhada

### Estrutura Nova

```
┌────────────────────────────────┐
│   🧠 NeuroCRM                  │
├────────────────────────────────┤
│   [IA Monitorando]             │
│   3 novas oportunidades        │
├────────────────────────────────┤
│   MENU PRINCIPAL               │
│   • Dashboard                  │
│   • Pipeline (Kanban)          │
│   • Insights IA [3]            │
│   • Agenda                     │
│   • Contatos                   │
├────────────────────────────────┤
│   GESTÃO                       │
│   • Relatórios                 │
│   • Configurações              │
├────────────────────────────────┤
│   👤 Carlos Mendes             │
│   Executivo de Vendas          │
└────────────────────────────────┘
```

---

## 7. Funcionalidades do Kanban

| Funcionalidade | Prioridade | Descrição |
|----------------|------------|-----------|
| Visualização | Alta | Cards organizados por estágio |
| Drag & Drop | Média | Mover cards entre colunas (atualiza `stage` no DB) |
| Filtros | Média | Por vendedor, categoria, valor, temperatura |
| Toggle View | Baixa | Alternar entre Kanban e Lista |
| Busca | Baixa | Filtrar cards por nome/título |

---

## 8. Dados - Conexão com crm_opportunities

```tsx
// Hook para buscar oportunidades
const useOpportunities = () => {
  return useQuery({
    queryKey: ['crm-opportunities'],
    queryFn: async () => {
      const { data } = await supabase
        .from('crm_opportunities')
        .select(`
          *,
          customer:crm_customers(name, phone, city),
          vendor:vendors(name)
        `)
        .not('validation_status', 'eq', 'rejected')
        .order('updated_at', { ascending: false });
      
      // Agrupar por estágio
      return groupByStage(data);
    }
  });
};
```

---

## 9. Próximos Passos (Ordem de Implementação)

| Fase | Descrição | Tempo |
|------|-----------|-------|
| 1 | Criar hooks `useOpportunities` e `usePipelineStats` | 1h |
| 2 | Criar componentes do Kanban (Column, Card, Stats) | 2-3h |
| 3 | Redesenhar CRMSidebar com novo layout | 1h |
| 4 | Redesenhar CRMHeader com indicador IA | 30min |
| 5 | Atualizar Pipeline.tsx com Kanban funcional | 1h |
| 6 | Atualizar Dashboard.tsx com novo layout | 1h |
| 7 | Implementar Drag & Drop | 1-2h |
| 8 | Adicionar filtros e busca | 1h |

**Total estimado:** 8-10 horas de desenvolvimento

---

## 10. Resumo Visual

**Mudanças Principais:**
1. **Sidebar** → NeuroCRM com seções agrupadas e indicador IA
2. **Header** → Avatar do usuário + Status IA monitorando
3. **Pipeline** → Kanban visual completo com cards coloridos
4. **Dashboard** → Métricas reais + Conversas recentes + Mini Kanban

**Cores:** Manter identidade Drystore (laranja #ef7d04 como primary)

**Estágios corretos:**
- Prospecção → Qualificação → Proposta → Negociação → Fechado (Ganho/Perdido)

