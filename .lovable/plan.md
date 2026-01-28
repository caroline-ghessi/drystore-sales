
# Plano: Implementar Logging de Uso do RAG

## Contexto do Problema

A tabela `knowledge_usage_log` está vazia porque a edge function `intelligent-agent-response` realiza a busca semântica (RAG) com sucesso, mas não registra o uso após encontrar chunks relevantes.

**Ponto exato do problema** (linhas 305-310):
```typescript
if (knowledgeChunks && knowledgeChunks.length > 0) {
  console.log(`✅ Found ${knowledgeChunks.length} relevant knowledge chunks`);
  
  knowledgeContext = '\n\nBASE DE CONHECIMENTO:\n' + knowledgeChunks
    .map((chunk: any) => `[${chunk.file_name}] ${chunk.content}`)
    .join('\n\n');
  // <-- FALTA: INSERT na tabela knowledge_usage_log
}
```

---

## Solução Proposta

Adicionar um bloco de INSERT imediatamente após a busca bem-sucedida de chunks, de forma assíncrona e não-bloqueante para não impactar a latência da resposta.

---

## Mudanças Específicas

### Arquivo: `supabase/functions/intelligent-agent-response/index.ts`

**Localização:** Após linha 310 (dentro do bloco `if (knowledgeChunks && knowledgeChunks.length > 0)`)

**Código a adicionar:**
```typescript
// Registrar uso do conhecimento (async, não bloqueia resposta)
supabase.from('knowledge_usage_log').insert({
  knowledge_ids: knowledgeChunks.map((chunk: any) => chunk.id),
  query: message.substring(0, 500), // limitar tamanho
  agent_type: conversationCategory,
  conversation_id: conversationId,
  confidence_score: knowledgeChunks[0]?.similarity || 0
}).then(({ error }) => {
  if (error) {
    console.warn('⚠️ Failed to log knowledge usage:', error.message);
  } else {
    console.log('📊 Knowledge usage logged successfully');
  }
});
```

---

## Justificativa Técnica

| Aspecto | Decisão | Motivo |
|---------|---------|--------|
| **Assíncrono** | `.then()` sem `await` | Não bloqueia a geração da resposta |
| **Tratamento de erro** | `console.warn` | Log de falha não impede funcionamento |
| **Campos obrigatórios** | Todos preenchidos | `knowledge_ids`, `query`, `agent_type` são NOT NULL |
| **Compatibilidade** | `conversationCategory` | Já usa ENUM `product_category` correto |

---

## Impacto no Sistema

| Componente | Impactado? | Detalhes |
|------------|------------|----------|
| Fluxo de resposta | Não | Insert é assíncrono |
| Latência | Mínimo | ~5-10ms adicional (paralelo) |
| Tabelas existentes | Não | Apenas insere dados |
| Outras edge functions | Não | Mudança isolada |
| Frontend | Não | Nenhuma mudança necessária |

---

## Benefícios Imediatos

1. **Visibilidade**: Saber quais chunks são mais consultados
2. **Qualidade**: Identificar gaps na base de conhecimento
3. **Otimização**: Dados para melhorar prompts e conteúdo
4. **Auditoria**: Histórico de uso por conversa/agente

---

## Validação Pós-Implementação

```sql
-- Verificar se logs estão sendo criados
SELECT 
  agent_type,
  COUNT(*) as usos,
  AVG(confidence_score) as confianca_media
FROM knowledge_usage_log 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY agent_type;
```

---

## Detalhes Técnicos

### Estrutura da Tabela (confirmada)

| Campo | Tipo | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| knowledge_ids | uuid[] | NO | - |
| query | text | NO | - |
| agent_type | product_category | NO | - |
| conversation_id | uuid | YES | - |
| response_generated | text | YES | - |
| confidence_score | double precision | YES | - |
| user_id | uuid | YES | - |
| created_at | timestamptz | YES | now() |

### Compatibilidade com ENUM

O campo `agent_type` aceita os valores do ENUM `product_category`, que inclui todas as categorias ativas: `energia_solar`, `ferramentas`, `telha_shingle`, `drywall_divisorias`, `steel_frame`, `pisos`, `forros`, etc.

---

## Resumo

Uma única alteração de ~12 linhas na edge function `intelligent-agent-response` para registrar o uso do RAG de forma assíncrona, sem impactar latência ou funcionalidades existentes.
