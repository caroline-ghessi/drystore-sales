
# Plano: Rotina de Análise Diária + Alertas WhatsApp

## Resumo

Implementar sistema completo de análise de qualidade com:
1. **Análise diária às 20h** - Processar todas as conversas do dia
2. **Alertas críticos às 8:30h** - Enviar problemas graves diariamente  
3. **Acompanhamento semanal às 8:30h (segundas)** - Resumo de alertas amarelos

## Fluxo Completo

```text
                    ┌─────────────────────────────────────────┐
                    │         ANÁLISE DIÁRIA (20:00)          │
                    │  daily-quality-analysis Edge Function    │
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │        Para cada vendedor ativo:         │
                    │  - Buscar conversas do dia               │
                    │  - Chamar quality-analysis               │
                    │  - Salvar em vendor_quality_analysis     │
                    │  - Criar alertas em quality_alerts       │
                    └──────────────────┬──────────────────────┘
                                       │
          ┌────────────────────────────┼────────────────────────────┐
          │                            │                            │
          ▼                            ▼                            ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│  quality_alerts     │    │ vendor_quality_     │    │   quality_metrics   │
│  (severity: high/   │    │ analysis            │    │   (dashboard)       │
│   medium/low)       │    │ (scores, SPIN)      │    │                     │
└─────────┬───────────┘    └─────────────────────┘    └─────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    DISPARO DE ALERTAS                                    │
├─────────────────────────────────────┬───────────────────────────────────┤
│  DIÁRIO (8:30h) - Alertas Críticos  │  SEMANAL (Seg 8:30h) - Resumo     │
│  severity = 'high' ou 'critical'    │  severity = 'medium' (amarelos)   │
│  Não resolvidos (resolved = false)  │  Agregado por vendedor            │
└─────────────────────────────────────┴───────────────────────────────────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────────────┐
                    │    WhatsApp via WHAPI                    │
                    │    De: +55 51 81155622 (Bot de Leads)   │
                    │    Para: +55 51 98140-3789              │
                    └─────────────────────────────────────────┘
```

## Fase 1: Criar Edge Function de Análise Diária

### Arquivo: `supabase/functions/daily-quality-analysis/index.ts`

**Responsabilidades:**
- Executar às 20h (Brasília)
- Buscar todos os vendedores ativos
- Para cada vendedor: buscar conversas com atividade nas últimas 24h
- Chamar `quality-analysis` para conversas não analisadas
- Classificar alertas por severidade baseado no score

**Lógica de classificação de severidade:**
| Score | Severidade | Cor |
|-------|------------|-----|
| 0-40 | critical/high | Vermelho |
| 41-60 | medium | Amarelo |
| 61-100 | low | Verde |

## Fase 2: Criar Edge Function de Disparo de Alertas

### Arquivo: `supabase/functions/send-quality-alerts/index.ts`

**Responsabilidades:**
- Consultar alertas pendentes (resolved = false)
- Formatar mensagem consolidada por vendedor
- Enviar via WHAPI usando token `LEAD_BOT_WHAPI_TOKEN`
- Marcar alertas como notificados (novo campo)

**Parâmetros de entrada:**
- `alertType`: 'critical' (diário) ou 'weekly' (semanal)
- `targetPhone`: '+5551981403789'

**Formato da mensagem crítica (diária):**
```text
🔴 ALERTAS CRÍTICOS DE QUALIDADE

📅 Data: 28/01/2026

⚠️ VENDEDOR: Antônio César
• Cliente: Fernanda E.R.S.
  Score: 15/100 - Tempo resposta: 144min
  Problema: Sem SPIN, sem cross-selling
  
• Cliente: Rodrigo Luongo
  Score: 25/100 - Tempo resposta: 6min
  Problema: Sem confirmação de valores

Total: 2 atendimentos críticos
Ação requerida: Intervenção urgente
```

**Formato da mensagem semanal (segundas):**
```text
📊 ACOMPANHAMENTO SEMANAL DE QUALIDADE

📅 Semana: 20/01 a 26/01/2026

🟡 ALERTAS DE ATENÇÃO

VENDEDOR: Felipe Tubino
• 3 atendimentos com pontuação média
• Score médio: 52/100
• Principal ponto: Falta de cross-selling

VENDEDOR: Gabriel Rodrigues  
• 2 atendimentos com pontuação média
• Score médio: 48/100
• Principal ponto: Tempo de resposta alto

📈 Recomendação: Treinamento em técnicas SPIN
```

## Fase 3: Adicionar Campo de Controle

Adicionar campo `notified_at` na tabela `quality_alerts` para evitar duplicação de notificações.

## Fase 4: Criar Cron Jobs

### Job 1: Análise Diária (20h Brasília = 23h UTC)
```sql
-- daily-quality-analysis às 23:00 UTC (20:00 Brasília)
SELECT cron.schedule(
  'daily-quality-analysis',
  '0 23 * * *',
  $$
  SELECT net.http_post(
    url:='https://groqsnnytvjabgeaekkw.supabase.co/functions/v1/daily-quality-analysis',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ..."}'::jsonb,
    body:='{"automated": true}'::jsonb
  );
  $$
);
```

### Job 2: Alertas Críticos Diários (8:30h Brasília = 11:30 UTC)
```sql
-- send-quality-alerts críticos às 11:30 UTC (8:30 Brasília)
SELECT cron.schedule(
  'send-critical-quality-alerts',
  '30 11 * * *',
  $$
  SELECT net.http_post(
    url:='https://groqsnnytvjabgeaekkw.supabase.co/functions/v1/send-quality-alerts',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ..."}'::jsonb,
    body:='{"alertType": "critical", "targetPhone": "5551981403789"}'::jsonb
  );
  $$
);
```

### Job 3: Resumo Semanal (Segundas 8:30h Brasília)
```sql
-- send-quality-alerts semanal às segundas 11:30 UTC (8:30 Brasília)
SELECT cron.schedule(
  'send-weekly-quality-summary',
  '30 11 * * 1',
  $$
  SELECT net.http_post(
    url:='https://groqsnnytvjabgeaekkw.supabase.co/functions/v1/send-quality-alerts',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ..."}'::jsonb,
    body:='{"alertType": "weekly", "targetPhone": "5551981403789"}'::jsonb
  );
  $$
);
```

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/daily-quality-analysis/index.ts` | Criar | Orquestrador de análise diária |
| `supabase/functions/send-quality-alerts/index.ts` | Criar | Disparo de alertas WhatsApp |
| `supabase/config.toml` | Editar | Registrar novas funções |
| Database (migration) | SQL | Adicionar campo `notified_at` |
| Database (insert) | SQL | Criar 3 cron jobs |

## Pré-requisitos

### Secret já configurado
O token `LEAD_BOT_WHAPI_TOKEN` já existe e é usado pela função `send-lead-to-vendor`.

### Número de destino
- **Para:** +55 51 98140-3789 (formatado: 5551981403789)
- **De:** +55 51 81155622 (Bot de Leads)

## Validação

Após implementação:
1. Executar `daily-quality-analysis` manualmente
2. Verificar alertas criados em `quality_alerts`
3. Executar `send-quality-alerts` com `alertType: 'critical'`
4. Confirmar recebimento no WhatsApp +55 51 98140-3789
5. Verificar logs em `system_logs`

## Resultado Esperado

- **20:00** - Sistema analisa todas as conversas do dia
- **8:30 (diário)** - Supervisor recebe alertas críticos no WhatsApp
- **8:30 (segundas)** - Supervisor recebe resumo semanal de atenções
- Dashboard atualizado com métricas em tempo real
