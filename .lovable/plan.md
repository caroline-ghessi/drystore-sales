
# Plano: Verificação e Limpeza de Oportunidades Duplicadas no CRM

## Diagnóstico Encontrado

A análise do banco de dados revelou a situação atual:

| Métrica | Valor |
|---------|-------|
| **Total de oportunidades** | 2.514 |
| **Clientes únicos (telefones)** | 2.219 |
| **Todas têm status** | `ai_generated` + `prospecting` |

### Tipos de "Duplicação" Identificados

**1. Mesmo telefone, DIFERENTES vendedores: 515 oportunidades (228 telefones)**
- Isso é **comportamento esperado**: o mesmo lead foi distribuído para múltiplos vendedores
- Exemplo: Caroline Ghessi (555181223033) tem 6 oportunidades com 6 vendedores diferentes
- **NÃO são duplicatas reais** - são leads paralelos

**2. Mesmo telefone, MESMO vendedor: 16 oportunidades (8 telefones)**
- Isso são **duplicatas reais** que precisam ser limpas
- Ocorreram antes do Opportunity Matcher ser implementado
- Exemplo: "Glaucia Santa Fé" com 2 oportunidades para Gabriel Rodrigues

---

## Solução Proposta: 3 Partes

### PARTE 1: Edge Function de Deduplicação (One-time Cleanup)

Criar uma Edge Function `crm-deduplication-cleanup` que:

1. **Identifica duplicatas reais** (mesmo telefone + mesmo vendedor + mesma categoria)
2. **Mantém a oportunidade mais antiga** (primeira criada)
3. **Remove ou marca as demais** como `validation_status: 'duplicate_removed'`
4. **Registra todas as ações** em `crm_opportunity_match_log`

```text
┌──────────────────────────────────────────────────────────────┐
│                  FLUXO DE DEDUPLICAÇÃO                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Buscar grupos de duplicatas:                             │
│     WHERE mesmo_telefone AND mesmo_vendor                    │
│     GROUP BY phone, vendor_id HAVING COUNT(*) > 1            │
│                                                              │
│  2. Para cada grupo:                                         │
│     • Manter a oportunidade MAIS ANTIGA (created_at ASC)     │
│     • Marcar as demais como duplicadas                       │
│     • Consolidar dados se necessário                         │
│                                                              │
│  3. Registrar no log de matching:                            │
│     • decision: 'cleanup_duplicate_removed'                  │
│     • Vincular IDs original e removido                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### PARTE 2: Interface de Gerenciamento de Duplicatas

Criar uma nova página `/crm/duplicatas` com:

1. **Dashboard de Duplicatas**
   - Contador de duplicatas pendentes
   - Lista de grupos com mesmo telefone + mesmo vendedor
   - Lista de grupos com mesmo telefone + diferentes vendedores (para auditoria)

2. **Ações em Lote**
   - "Limpar duplicatas reais automaticamente" (usa a Edge Function)
   - "Revisar duplicatas manualmente"
   - "Exportar relatório"

3. **Detalhes do Grupo**
   - Exibir todas as oportunidades do grupo
   - Permitir escolher qual manter
   - Opção de merge manual (consolidar dados)

---

### PARTE 3: Migração de Banco de Dados

Adicionar suporte para marcação de duplicatas:

```sql
-- 1. Adicionar novo status de validação para duplicatas
ALTER TABLE crm_opportunities 
  ADD COLUMN IF NOT EXISTS duplicate_of_id UUID REFERENCES crm_opportunities(id);

-- 2. Índice para busca de duplicatas
CREATE INDEX IF NOT EXISTS idx_crm_opps_duplicate_lookup 
  ON crm_opportunities(customer_id, vendor_id, product_category)
  WHERE duplicate_of_id IS NULL;
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/crm-deduplication-cleanup/index.ts` | Criar | Edge function de limpeza |
| `src/modules/crm/pages/Duplicates.tsx` | Criar | Página de gerenciamento |
| `src/modules/crm/hooks/useDuplicateOpportunities.ts` | Criar | Hook de dados |
| `src/modules/crm/components/duplicates/*` | Criar | Componentes UI |
| `src/App.tsx` | Modificar | Adicionar rota `/crm/duplicatas` |
| Migração SQL | Criar | Adicionar coluna `duplicate_of_id` |

---

## Fluxo de Uso

```text
┌─────────────────────────────────────────────────────────────────┐
│                      FLUXO DO ADMINISTRADOR                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Acessar /crm/duplicatas                                     │
│     • Ver dashboard com estatísticas de duplicatas              │
│                                                                 │
│  2. Clicar "Executar Limpeza Automática"                        │
│     • Sistema identifica as 8 duplicatas reais                  │
│     • Remove/marca as oportunidades duplicadas                  │
│     • Mantém a mais antiga de cada grupo                        │
│                                                                 │
│  3. Revisar logs de ações                                       │
│     • Ver quais foram removidas e por quê                       │
│     • Reverter se necessário                                    │
│                                                                 │
│  4. (Opcional) Revisar "leads paralelos"                        │
│     • Ver casos onde mesmo cliente tem múltiplos vendedores     │
│     • Decidir se é correto ou precisa consolidar                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Regras de Deduplicação

A função seguirá estas regras:

| Cenário | Regra | Ação |
|---------|-------|------|
| Mesmo telefone + mesmo vendedor + mesma categoria | Duplicata real | Manter mais antiga, remover outras |
| Mesmo telefone + mesmo vendedor + categorias diferentes | Cross-sell | Manter todas (são produtos diferentes) |
| Mesmo telefone + diferentes vendedores | Lead paralelo | Manter todas (comportamento esperado) |
| Oportunidade com `stage: closed_won/closed_lost` | Já fechada | Nunca remover |

---

## Resultado Esperado

Após execução:

- **16 oportunidades duplicadas** serão removidas ou marcadas
- **2.498 oportunidades únicas** permanecerão
- Log completo de todas as ações para auditoria
- Interface para monitoramento contínuo de duplicatas
