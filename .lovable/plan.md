
# Plano: Melhorar Página de Pipeline (Kanban)

## 1. Resumo das Mudanças

Atualizar a página de Pipeline para corresponder ao novo design NeuroCRM, com foco em:
- Remover cards de estatísticas do topo (KanbanStats)
- Melhorar visual das colunas do Kanban
- Refinar os cards de oportunidade com novos estilos
- Ajustar as cores e labels dos estágios

---

## 2. Comparativo: Atual vs Novo Design

### 2.1 Página Pipeline.tsx

| Elemento | Atual | Novo |
|----------|-------|------|
| Header | Título + descrição + toggle view | Título "Pipeline de Vendas" + toggle view lado a lado |
| Barra de ações | Busca à esquerda, botões à direita | Mesmo layout, manter |
| KanbanStats | 4 cards de estatísticas no topo | **REMOVER** - não aparece no design |
| Container Kanban | bg-muted/30 com padding | Fundo mais clean (bg-gray-bg/50) |

### 2.2 Estágios do Kanban

O HTML mostra estágios diferentes dos atuais. Precisamos mapear:

| HTML (Design) | Enum (DB) | Mapeamento |
|---------------|-----------|------------|
| Leads (IA) | prospecting | Usar para leads com `validation_status = 'ai_generated'` |
| Primeiro Contato | qualification | Primeiro estágio manual |
| Proposta | proposal | Proposta enviada |
| Negociação | negotiation | Em negociação |
| Fechado | closed_won | Ganho |

**Nota**: O design agrupa "Leads (IA)" separadamente. No banco usamos o enum existente, mas podemos filtrar por `validation_status` para diferenciar.

### 2.3 KanbanColumn

| Elemento | Atual | Novo |
|----------|-------|------|
| Header | Apenas cor sólida | Gradiente sutil ou borda colorida no topo |
| Badges | bg-white/20 | Mais visível |
| Footer Total | Centralizado | Alinhado à esquerda com "Total:" |
| Largura | min-w-[280px] max-w-[320px] | Manter similar |

### 2.4 OpportunityCard

| Elemento | Atual | Novo Design |
|----------|-------|-------------|
| Badge "Novo" | No topo | Badge verde "Novo" no canto superior esquerdo |
| Tempo | Clock icon + texto | Apenas texto cinza à direita do nome |
| Nome cliente | Truncado | Nome em destaque com tempo ao lado |
| Título projeto | Texto muted | Texto normal, mais visível |
| Descrição | line-clamp-2 | Texto menor, 2 linhas |
| Next step | Badge outline | Badge arredondado com ícone play |
| Status "Aprovado" | CheckCircle verde | Ícone check com texto |
| Valor | Font bold | Valor com "k" (15k, 45k) |
| Temperatura | Emoji | Avatar pequeno do vendedor |
| Botão Validar | Outline primary | Botão sólido primary menor |

---

## 3. Estrutura Visual Final

```text
+-----------------------------------------------------------------------+
|  Pipeline de Vendas                               [Kanban] [Lista]    |
+-----------------------------------------------------------------------+
|  [🔍 Buscar oportunidades...]        [Filtros] [+ Novo Deal]          |
+-----------------------------------------------------------------------+
|                                                                       |
|  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  |
|  │ ▌Prospecção │ │ ▌Qualificação│ │ ▌Proposta    │ │ ▌Negociação  │  |
|  │      4      │ │      2       │ │      3       │ │      2       │  |
|  ├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤  |
|  │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │  |
|  │ │ 🟢 Novo  │ │ │ │Logística │ │ │ │Banco     │ │ │ │Indústria │ │  |
|  │ │ Tech Sol │ │ │ │Frota Int │ │ │ │Segurança │ │ │ │ERP Custom│ │  |
|  │ │ R$ 15k   │ │ │ │R$ 80k    │ │ │ │R$ 150k   │ │ │ │R$ 200k   │ │  |
|  │ │ [Validar]│ │ │ └──────────┘ │ │ │✓ Aprovado│ │ │ │Aguardando│ │  |
|  │ └──────────┘ │ │              │ │ └──────────┘ │ │ └──────────┘ │  |
|  │ ┌──────────┐ │ │              │ │ ┌──────────┐ │ │              │  |
|  │ │Grupo Alph│ │ │              │ │ │Startup   │ │ │              │  |
|  │ └──────────┘ │ │              │ │ └──────────┘ │ │              │  |
|  ├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────────┤  |
|  │ Total: R$72k │ │ Total: R$105k│ │ Total: R$280k│ │ Total: R$265k│  |
|  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## 4. Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/modules/crm/pages/Pipeline.tsx` | Remover KanbanStats, ajustar layout do header |
| `src/modules/crm/components/pipeline/PipelineKanban.tsx` | Ajustar container e espaçamento |
| `src/modules/crm/components/pipeline/KanbanColumn.tsx` | Novo estilo de header com barra colorida lateral |
| `src/modules/crm/components/pipeline/OpportunityCard.tsx` | Redesign completo do card |
| `src/modules/crm/hooks/useOpportunities.ts` | Atualizar STAGE_CONFIG com novos labels |

---

## 5. Detalhes de Implementação

### 5.1 Pipeline.tsx - Mudanças

**Remover:**
- Import e uso de `KanbanStats`
- Descrição abaixo do título

**Ajustar:**
- Header mais compacto
- Toggle view ao lado do título

### 5.2 KanbanColumn.tsx - Novo Estilo

```tsx
// Header com barra lateral colorida ao invés de fundo todo colorido
<div className="flex items-center gap-2 p-3 border-b bg-white rounded-t-lg">
  <div className={cn('w-1 h-6 rounded-full', config.color)} />
  <h3 className="font-semibold text-sm text-foreground">{config.label}</h3>
  <Badge className="ml-auto bg-gray-100 text-foreground">{count}</Badge>
</div>
```

### 5.3 OpportunityCard.tsx - Redesign

**Nova estrutura:**
```tsx
<Card className="p-3 bg-white border border-gray-200 hover:shadow-md">
  {/* Linha 1: Badge novo (opcional) + Nome cliente + Tempo */}
  <div className="flex items-center gap-2">
    {isNew && <Badge className="bg-green-500 text-white text-xs">Novo</Badge>}
    <span className="font-semibold text-sm flex-1 truncate">{customerName}</span>
    <span className="text-xs text-muted-foreground">{timeAgo}</span>
  </div>
  
  {/* Linha 2: Título do projeto */}
  <p className="text-sm text-foreground mt-1">{title}</p>
  
  {/* Linha 3: Descrição (opcional) */}
  {description && (
    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
  )}
  
  {/* Linha 4: Next step ou status aprovado */}
  {nextStep && (
    <Badge variant="outline" className="mt-2 text-xs bg-primary/10 text-primary border-primary/20">
      <Play className="w-3 h-3 mr-1" />
      {nextStep}
    </Badge>
  )}
  {isValidated && (
    <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
      <CheckCircle className="h-3 w-3" />
      Aprovado pelo técnico
    </div>
  )}
  
  {/* Linha 5: Valor + Avatar vendedor + Botão validar */}
  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
    <span className="font-bold text-sm text-foreground">R$ {value/1000}k</span>
    
    <div className="flex items-center gap-2">
      {needsValidation ? (
        <Button size="sm" className="h-6 text-xs bg-primary hover:bg-primary/90">
          Validar
        </Button>
      ) : (
        <div className="flex items-center gap-1">
          <Avatar className="w-5 h-5">
            <AvatarFallback className="text-xs bg-gray-200">
              {vendorInitial}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  </div>
</Card>
```

### 5.4 STAGE_CONFIG - Atualizar Labels

```tsx
export const STAGE_CONFIG = {
  prospecting: {
    label: 'Prospecção',  // Mantém
    color: 'bg-blue-500',
    // ... resto igual
  },
  qualification: {
    label: 'Qualificação',  // Era "Primeiro Contato" no HTML mas mantemos
    color: 'bg-yellow-500',
  },
  // ... outros estágios mantém igual
};
```

---

## 6. Cores Finais (Drystore)

| Elemento | Cor |
|----------|-----|
| Card background | Branco (#ffffff) |
| Card border | #e5e7eb (gray-200) |
| Badge "Novo" | Verde (#22c55e) |
| Botão Validar | Primary (#ef7d04) |
| Barra lateral stages | Cor do estágio |
| Footer total | Fundo sutil gray-50 |

---

## 7. Ordem de Implementação

| Passo | Ação |
|-------|------|
| 1 | Modificar `Pipeline.tsx` - remover KanbanStats e ajustar header |
| 2 | Modificar `KanbanColumn.tsx` - novo estilo de header e footer |
| 3 | Redesenhar `OpportunityCard.tsx` - layout conforme design |
| 4 | Ajustar `PipelineKanban.tsx` - espaçamento e container |
| 5 | Testar responsividade em mobile |

---

## 8. Dados Usados (Sem Hardcode)

Todos os dados continuam vindo do banco de dados via hooks existentes:
- `useOpportunities()` - lista de oportunidades
- Customer name, title, value, stage, next_step, validation_status - todos do DB
- Nenhum dado de oportunidade será hardcoded
