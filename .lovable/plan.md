
# Plano: Corrigir Cron Jobs e Quality Analysis

## Problemas Identificados

### Problema 1: Modelo de IA Inválido (CRÍTICO)
O agente `quality_monitor` está configurado com o modelo `claude-3-5-sonnet-20241022` que **NÃO EXISTE** na API da Anthropic.

**Erro nos logs:**
```
AI API Error: {"type":"error","error":{"type":"not_found_error","message":"model: claude-3-5-sonnet-20241022"}}
```

**Modelos válidos da Anthropic:**
- `claude-sonnet-4-20250514` (mais recente)
- `claude-3-5-sonnet-20241022` → INCORRETO (precisa ser `claude-3-5-sonnet-latest` ou outro)

### Problema 2: Cron Job Inexistente
O cron job `process-vendor-opportunities` **NÃO EXISTE**. A edge function está pronta mas nunca é executada automaticamente.

### Estado Atual
| Item | Status |
|------|--------|
| Agente `quality_monitor` | ✅ Existe (mas modelo errado) |
| Cron `daily-quality-analysis` | ✅ Existe (23:00 UTC) |
| Cron `process-vendor-opportunities` | ❌ **NÃO EXISTE** |
| Oportunidades criadas | **0** |
| Análises de qualidade | **13** (de 2.588 conversas) |

---

## Ações a Executar

### AÇÃO 1: Corrigir Modelo do Agente Quality Monitor (SQL)

Atualizar o agente para usar um modelo válido da Anthropic.

```sql
UPDATE agent_configs 
SET llm_model = 'claude-sonnet-4-20250514',
    max_tokens = 2000
WHERE agent_type = 'quality_monitor';
```

### AÇÃO 2: Criar Cron Job para process-vendor-opportunities (SQL)

Criar o cron job que executará a cada 30 minutos.

```sql
SELECT cron.schedule(
  'process-vendor-opportunities',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url:='https://groqsnnytvjabgeaekkw.supabase.co/functions/v1/process-vendor-opportunities',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyb3Fzbm55dHZqYWJnZWFla2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTU3ODcsImV4cCI6MjA2ODE3MTc4N30.HWBJVbSSShx1P8bqa4dvO9jCsCDybt2rhgPPBy8zEVs"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

### AÇÃO 3: Testar Edge Functions

Após as correções, testar manualmente:

1. **process-vendor-opportunities**: Verificar se cria oportunidades no CRM
2. **quality-analysis**: Verificar se salva análises com o novo modelo

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| Nenhum arquivo de código | Apenas atualizações no banco de dados |

---

## Resultado Esperado

Após as correções:
- **Modelo IA**: `claude-sonnet-4-20250514` (válido)
- **Cron Jobs**: 2 ativos (`daily-quality-analysis` + `process-vendor-opportunities`)
- **Oportunidades**: Criadas automaticamente a cada 30 minutos
- **Análises**: Executadas com sucesso usando modelo válido

---

## Verificações Pós-Implementação

```sql
-- Verificar modelo do agente
SELECT llm_model FROM agent_configs WHERE agent_type = 'quality_monitor';

-- Verificar cron jobs
SELECT jobname, schedule FROM cron.job ORDER BY jobname;

-- Verificar oportunidades (após execução)
SELECT COUNT(*) FROM crm_opportunities WHERE created_at > NOW() - INTERVAL '1 hour';
```
