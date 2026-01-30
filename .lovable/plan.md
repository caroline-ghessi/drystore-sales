
# Plano: Corrigir Limite de Busca na Edge Function

## Problema Identificado

A Edge Function `crm-deduplication-cleanup` está buscando apenas os **primeiros 1000 registros** (limite padrão do Supabase), mas as duplicatas estão nas posições **2400+** (são oportunidades criadas mais recentemente).

| Telefone | Posição | Problema |
|----------|---------|----------|
| 5511932303494 | 2473, 2482 | Fora dos primeiros 1000 |
| 553184868401 | 2478, 2483 | Fora dos primeiros 1000 |
| 5515998481785 | 2508, 2510 | Fora dos primeiros 1000 |

**Total de oportunidades ativas:** 2.514
**Registros buscados pela função:** 1.000 (apenas 40%)

---

## Solução

Adicionar parâmetro `.limit()` explícito na query do Supabase para buscar todos os registros:

### Arquivo: `supabase/functions/crm-deduplication-cleanup/index.ts`

**Alteração (linhas 41-56):** Adicionar `.limit(10000)` na query

```typescript
// ANTES:
const { data: rawOpportunities, error: fetchError } = await supabase
  .from('crm_opportunities')
  .select(`...`)
  .is('duplicate_of_id', null)
  .not('stage', 'in', '("closed_won","closed_lost")')
  .order('created_at', { ascending: true });

// DEPOIS:
const { data: rawOpportunities, error: fetchError } = await supabase
  .from('crm_opportunities')
  .select(`...`)
  .is('duplicate_of_id', null)
  .not('stage', 'in', '("closed_won","closed_lost")')
  .order('created_at', { ascending: true })
  .limit(10000);  // ADICIONAR: buscar mais que o limite padrão
```

---

## Por que 10.000?

- É um número seguro que cobre crescimento futuro
- Não é infinito (evita problemas de memória)
- Pode ser ajustado conforme necessário
- Se houver mais de 10.000 oportunidades ativas, podemos implementar paginação

---

## Resultado Esperado

Após a correção:
- **Registros buscados:** 2.514 (todos)
- **Grupos de duplicatas encontrados:** 10
- **Duplicatas a remover:** 10

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/crm-deduplication-cleanup/index.ts` | Adicionar `.limit(10000)` na query |
