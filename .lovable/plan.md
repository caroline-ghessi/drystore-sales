
# Plano: Corrigir Detecção de Duplicatas

## Problema Identificado

A Edge Function `crm-deduplication-cleanup` agrupa por `phone + vendor_id + product_category`, mas isso ignora casos onde uma oportunidade tem categoria `NULL` e outra tem uma categoria real.

**Dados encontrados no banco:**
| Telefone | Vendedor | Categorias | Títulos |
|----------|----------|------------|---------|
| 5511932303494 | 30365ae4... | `{indefinido, NULL}` | "Oportunidade - indefinido", "Oportunidade - Nova" |
| 5515998481785 | 32e80e62... | `{saudacao, NULL}` | "Oportunidade - saudacao", "Oportunidade - Nova" |
| ...mais 8 grupos... | | | |

**Total: 10 grupos de duplicatas reais** (20+ oportunidades afetadas)

---

## Causa Raiz

1. **Edge Function (linha 71):** Agrupa por `${phone}|${vendor_id}|${product_category || 'null'}`
2. **Resultado:** `NULL` vira string `'null'` e não agrupa com outras categorias

**O problema:** Uma oportunidade "Oportunidade - Nova" com `product_category = NULL` **deveria** ser agrupada com a oportunidade que tem categoria definida (ex: `indefinido`, `ferramentas`), pois são do mesmo cliente com o mesmo vendedor.

---

## Solução: Relaxar Critério de Categoria

Mudar a lógica para agrupar **apenas por phone + vendor_id**, ignorando a categoria. Se o mesmo cliente estiver conversando com o mesmo vendedor, é a mesma negociação.

### Arquivo: `supabase/functions/crm-deduplication-cleanup/index.ts`

**Alteração 1: Mudar critério de agrupamento (linhas 67-77)**

```typescript
// ANTES:
const key = `${phone}|${opp.vendor_id}|${opp.product_category || 'null'}`;

// DEPOIS:
const key = `${phone}|${opp.vendor_id}`;  // Ignorar categoria
```

**Alteração 2: Atualizar interface DuplicateGroup para refletir mudança**

```typescript
// Interface se mantém igual, product_category vem do registro mais antigo
```

**Alteração 3: Ao criar log, registrar a categoria do registro mantido**

```typescript
// Na linha 166, pegar categoria do registro mais antigo
product_category: keepOpp.product_category,
```

---

### Arquivo: `src/modules/crm/hooks/useDuplicateOpportunities.ts`

**Alteração 1: useDuplicateGroups - agrupar por phone + vendor_id apenas (linhas 131-132)**

```typescript
// ANTES:
const key = `${phone}|${opp.vendor_id}|${opp.product_category || 'null'}`;

// DEPOIS:
const key = `${phone}|${opp.vendor_id}`;
```

**Alteração 2: Mostrar todas as categorias do grupo na interface**

```typescript
// Adicionar campo para listar categorias do grupo
categories: Array.from(new Set(opps.map(o => o.product_category || 'Indefinido')))
```

---

## Regra de Decisão: Qual Categoria Manter?

Quando houver conflito de categorias:
1. **Manter categoria da oportunidade mais antiga** (já era a regra para o ID)
2. Se a mais antiga tem `NULL`, usar a categoria da próxima que tiver definida

---

## Resultado Esperado

Após correção:
- **Grupos detectados:** 10 (atualmente 0)
- **Duplicatas a remover:** 10 (1 de cada grupo)
- **Comportamento:** Interface e Edge Function sincronizados

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/crm-deduplication-cleanup/index.ts` | Remover `product_category` do critério de agrupamento |
| `src/modules/crm/hooks/useDuplicateOpportunities.ts` | Sincronizar lógica e mostrar categorias do grupo |
