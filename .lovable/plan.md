

# Plano Revisado: Corrigir CRM com Análise de Riscos

## Verificações Realizadas

| Item | Resultado |
|------|-----------|
| Duplicatas de telefone | ✅ 0 encontradas |
| Registros com phone NULL | ✅ 0 registros |
| Total de clientes no CRM | 1 registro |
| Conversas pendentes | ~2.588 |

**Conclusão**: É seguro criar a constraint UNIQUE direta.

---

## Ações a Executar

### AÇÃO 1: Criar Constraint UNIQUE (SQL)

```sql
-- Remover índice parcial existente
DROP INDEX IF EXISTS idx_crm_customers_phone_unique;

-- Criar constraint UNIQUE direta (necessário para UPSERT)
ALTER TABLE crm_customers 
ADD CONSTRAINT crm_customers_phone_unique UNIQUE (phone);
```

### AÇÃO 2 (Opcional): Melhorar Validação de Telefone

Modificar `supabase/functions/_shared/phone-utils.ts` para rejeitar telefones inválidos:

```typescript
export function normalizePhone(phone: string): string | null {
  let cleaned = phone.replace(/\D/g, '');
  
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  // Rejeitar telefones inválidos ao invés de aceitar
  if (cleaned.length < 12 || cleaned.length > 13) {
    console.warn(`[phone-utils] Número inválido rejeitado: ${phone}`);
    return null; // Retornar null para indicar erro
  }
  
  return cleaned;
}
```

E atualizar `process-vendor-opportunities/index.ts` para tratar o null:

```typescript
const normalizedPhone = normalizePhone(conv.customer_phone);
if (!normalizedPhone) {
  console.log(`[VendorOpportunities] Conversa ${conv.id} telefone inválido, pulando`);
  continue;
}
```

---

## Comandos de Rollback (Se Necessário)

```sql
-- Remover constraint
ALTER TABLE crm_customers DROP CONSTRAINT IF EXISTS crm_customers_phone_unique;

-- Recriar índice parcial (estado anterior)
CREATE INDEX idx_crm_customers_phone_unique 
ON crm_customers(phone) 
WHERE phone IS NOT NULL;
```

---

## Verificações Pós-Implementação

```sql
-- Confirmar constraint criada
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'crm_customers' AND constraint_type = 'UNIQUE';

-- Monitorar oportunidades após 30 minutos
SELECT COUNT(*) as total_opportunities 
FROM crm_opportunities 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Verificar logs de processamento
SELECT level, message, data 
FROM system_logs 
WHERE source = 'process-vendor-opportunities' 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## Estimativa de Tempo

| Etapa | Tempo |
|-------|-------|
| Criar constraint | Instantâneo (1 registro) |
| Primeira execução do cron | Próximo ciclo de 30min |
| Processar 2.588 conversas | ~6 execuções = **~3 horas** |
| Validação completa | ~4 horas após início |

---

## Arquivos a Modificar

| Arquivo | Mudança | Prioridade |
|---------|---------|------------|
| Banco de dados | Criar constraint UNIQUE | Alta (obrigatório) |
| `supabase/functions/_shared/phone-utils.ts` | Rejeitar telefones inválidos | Média (opcional) |
| `supabase/functions/process-vendor-opportunities/index.ts` | Tratar null de normalizePhone | Média (opcional) |

---

## Resumo Técnico

O CRM não está criando oportunidades porque:

```text
┌─────────────────────────────────────────────────────────────┐
│  PROBLEMA: UPSERT falha em ON CONFLICT                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Código atual:                                              │
│  .upsert({ phone: normalizedPhone, ... },                  │
│    { onConflict: 'phone' })                                │
│           │                                                 │
│           ▼                                                 │
│  PostgreSQL: "phone" não tem UNIQUE constraint válida       │
│  (índice parcial WHERE phone IS NOT NULL ≠ constraint)      │
│           │                                                 │
│           ▼                                                 │
│  ERRO: there is no unique or exclusion constraint          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  SOLUÇÃO: Criar constraint UNIQUE direta                    │
│                                                             │
│  ALTER TABLE crm_customers                                  │
│  ADD CONSTRAINT crm_customers_phone_unique UNIQUE (phone);  │
│           │                                                 │
│           ▼                                                 │
│  PostgreSQL: UPSERT funciona corretamente                   │
│           │                                                 │
│           ▼                                                 │
│  CRM popula oportunidades automaticamente                   │
└─────────────────────────────────────────────────────────────┘
```

