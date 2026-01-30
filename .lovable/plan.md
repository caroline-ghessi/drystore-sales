

# Plano: Sistema de Processamento Multimídia para Agentes de IA do CRM

## Situação Atual

### Recursos JÁ Implementados

| Recurso | Função | Status |
|---------|--------|--------|
| **Transcrição de Áudio** | `transcribe-audio` | ✅ Usando ElevenLabs API |
| **Extração de PDF** | `process-knowledge-file` | ✅ Usando GPT-4o para limpeza |
| **Download de Mídia** | `download-whatsapp-media` | ✅ Salva no Storage |
| **Cliente LLM Unificado** | `_shared/llm-client.ts` | ✅ Claude/GPT/Grok |

### APIs Disponíveis

| API | Chave | Capacidade |
|-----|-------|------------|
| **ElevenLabs** | `ELEVENLABS_API_KEY` | Transcrição de áudio (Speech-to-Text) |
| **OpenAI** | `OPENAI_API_KEY` | GPT-4o Vision (imagens) + extração texto |
| **Anthropic** | `ANTHROPIC_API_KEY` | Claude Vision (imagens) |

### Dados de Mídia nas Conversas de Vendedores

```text
┌─────────────────────────────────────────────────────────────────┐
│  vendor_messages - Mídias Armazenadas                            │
│                                                                  │
│  • 13.857 áudios de voz  → Precisam transcrição                  │
│  • 6.238 imagens         → Precisam descrição                    │
│  • 4.976 documentos      → PDFs precisam extração                │
│  • 680 vídeos            → Podem ter caption/descrição           │
│                                                                  │
│  Campos disponíveis:                                             │
│  • media_url             → URL do arquivo (WHAPI/S3)             │
│  • media_metadata        → { mime_type, file_size, filename }    │
│  • message_type          → 'voice', 'image', 'document', etc.    │
│  • content               → Placeholder atual ([Áudio], etc.)     │
└─────────────────────────────────────────────────────────────────┘
```

### O que FALTA

1. **Campo `transcription`** na tabela `vendor_messages` - não existe
2. **Função de descrição de imagens** - não existe
3. **Integração no orquestrador CRM** - `crm-process-opportunity` não processa mídia
4. **Processamento assíncrono de mídia** em conversas de vendedor

---

## Arquitetura Proposta

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FLUXO DE PROCESSAMENTO MULTIMÍDIA                        │
│                                                                              │
│   vendor_messages                                                            │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  [Áudio]  →  transcribe-vendor-audio  →  "Cliente disse que..."     │   │
│   │  [Imagem] →  describe-vendor-image    →  "Foto de um telhado..."    │   │
│   │  [PDF]    →  extract-vendor-document  →  "Orçamento: R$ 50.000..."  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  vendor_messages.processed_content                                   │   │
│   │  "Transcrição/Descrição/Extração armazenada"                         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  crm-process-opportunity                                             │   │
│   │  Usa processed_content no lugar de [Áudio], [Imagem], [PDF]         │   │
│   │  Agentes de IA conseguem "entender" o conteúdo                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementação

### Fase 1: Migração SQL - Adicionar Campos

```sql
-- Campos para armazenar conteúdo processado de mídia
ALTER TABLE vendor_messages ADD COLUMN IF NOT EXISTS
  processed_content TEXT,           -- Transcrição/Descrição/Extração
  processing_status VARCHAR(20),    -- pending/processing/completed/failed
  processing_error TEXT,            -- Mensagem de erro se falhou
  processed_at TIMESTAMPTZ;         -- Quando foi processado

-- Índice para buscar mensagens pendentes
CREATE INDEX IF NOT EXISTS idx_vendor_messages_processing 
ON vendor_messages(processing_status, message_type) 
WHERE processing_status = 'pending';
```

### Fase 2: Criar Utilitário de Processamento de Mídia

**Arquivo:** `supabase/functions/_shared/media-processor.ts`

Funções:
- `transcribeAudio(mediaUrl)` - Usa ElevenLabs
- `describeImage(mediaUrl, context?)` - Usa GPT-4o Vision
- `extractPDFContent(mediaUrl)` - Reutiliza lógica de `process-knowledge-file`
- `processMediaMessage(message)` - Orquestra baseado no tipo

```typescript
export async function transcribeAudio(mediaUrl: string): Promise<string> {
  // Baixar áudio
  const audioResponse = await fetch(mediaUrl);
  const audioBuffer = await audioResponse.arrayBuffer();
  
  // Enviar para ElevenLabs
  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer]), 'audio.ogg');
  formData.append('model_id', 'scribe_v1');
  
  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY')! },
    body: formData
  });
  
  const result = await response.json();
  return result.text || '';
}

export async function describeImage(
  mediaUrl: string, 
  context?: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { 
            type: 'text', 
            text: `Descreva esta imagem de forma objetiva para contexto de vendas.
                   ${context ? `Contexto: ${context}` : ''}
                   Foque em: produtos, medidas, condições, documentos visíveis.` 
          },
          { 
            type: 'image_url', 
            image_url: { url: mediaUrl } 
          }
        ]
      }],
      max_tokens: 500
    })
  });
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
```

### Fase 3: Criar Edge Function de Processamento

**Arquivo:** `supabase/functions/process-vendor-media/index.ts`

Responsabilidades:
1. Receber `messageId` ou processar em lote
2. Identificar tipo de mídia
3. Chamar processador apropriado
4. Salvar `processed_content` no banco
5. Atualizar status de processamento

```text
┌─────────────────────────────────────────────────────────────────┐
│  process-vendor-media                                            │
│                                                                  │
│  Entrada: messageId OU batch (últimas N mensagens pendentes)    │
│                                                                  │
│  1. Buscar mensagem(s) com mídia                                │
│  2. Identificar tipo:                                           │
│     • audio/voice → transcribeAudio()                           │
│     • image → describeImage()                                   │
│     • document (PDF) → extractPDFContent()                      │
│     • video → extrair caption se disponível                     │
│  3. Salvar processed_content                                    │
│  4. Atualizar processing_status = 'completed'                   │
└─────────────────────────────────────────────────────────────────┘
```

### Fase 4: Atualizar crm-process-opportunity

Modificar `crm-process-opportunity` para usar `processed_content`:

**Mudança em:** `supabase/functions/crm-process-opportunity/index.ts`

```typescript
// ANTES: Busca apenas content
const { data: messages } = await supabase
  .from("vendor_messages")
  .select("id, content, from_me, timestamp_whatsapp, from_name")
  
// DEPOIS: Incluir processed_content
const { data: messages } = await supabase
  .from("vendor_messages")
  .select("id, content, from_me, timestamp_whatsapp, from_name, message_type, processed_content")
```

**Mudança em:** `supabase/functions/_shared/crm-agent-executor.ts`

```typescript
// Atualizar interface ConversationMessage
export interface ConversationMessage {
  id: number;
  content: string;
  from_me: boolean;
  timestamp: string;
  sender_name?: string;
  message_type?: string;      // NOVO
  processed_content?: string; // NOVO
}

// Atualizar formatConversationForPrompt
export function formatConversationForPrompt(messages: ConversationMessage[]): string {
  return messages.map(msg => {
    const sender = msg.from_me ? '🧑‍💼 VENDEDOR' : '👤 CLIENTE';
    const time = new Date(msg.timestamp).toLocaleString('pt-BR');
    
    // NOVO: Usar conteúdo processado quando disponível
    let messageContent = msg.content;
    if (msg.processed_content) {
      const typeLabel = getMediaTypeLabel(msg.message_type);
      messageContent = `${typeLabel}: ${msg.processed_content}`;
    }
    
    return `[${time}] ${sender}: ${messageContent}`;
  }).join('\n\n');
}

function getMediaTypeLabel(type?: string): string {
  switch (type) {
    case 'audio':
    case 'voice': return '[Áudio Transcrito]';
    case 'image': return '[Imagem Descrita]';
    case 'document': return '[Documento Extraído]';
    case 'video': return '[Vídeo]';
    default: return '';
  }
}
```

### Fase 5: Trigger de Processamento Automático

**Opção A: Processamento no Webhook** (Recomendado para tempo real)

Modificar `vendor-whatsapp-webhook/index.ts` para disparar processamento:

```typescript
// Após salvar mensagem de mídia
if (['audio', 'voice', 'image', 'document'].includes(type)) {
  // Disparar processamento assíncrono
  supabase.functions.invoke('process-vendor-media', {
    body: { messageId: savedMessage.id }
  }).catch(err => console.error('Media processing trigger failed:', err));
}
```

**Opção B: Cron Job** (Para processar backlog)

Adicionar job que processa mensagens pendentes:

```sql
-- Buscar mensagens com mídia não processadas
SELECT id, message_type, media_url 
FROM vendor_messages 
WHERE message_type IN ('audio', 'voice', 'image', 'document')
  AND (processing_status IS NULL OR processing_status = 'pending')
  AND media_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 50;
```

### Fase 6: UI de Monitoramento (Opcional)

Adicionar na página `/crm/agentes` uma seção de monitoramento de processamento de mídia:

```text
┌─────────────────────────────────────────────────────────────────┐
│  Processamento de Mídia                                          │
│                                                                  │
│  📊 Estatísticas                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Áudios:  8.500 ✅  |  5.357 ⏳  |  0 ❌                   │  │
│  │  Imagens: 4.200 ✅  |  2.038 ⏳  |  0 ❌                   │  │
│  │  PDFs:    3.800 ✅  |  1.176 ⏳  |  0 ❌                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [ Processar Pendentes ] [ Reprocessar Falhas ]                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| Migração SQL | **Criar** | Adicionar campos de processamento |
| `_shared/media-processor.ts` | **Criar** | Utilitário de processamento multimídia |
| `process-vendor-media/index.ts` | **Criar** | Edge Function de processamento |
| `crm-process-opportunity/index.ts` | **Modificar** | Incluir processed_content |
| `_shared/crm-agent-executor.ts` | **Modificar** | Usar processed_content no prompt |
| `vendor-whatsapp-webhook/index.ts` | **Modificar** | Trigger de processamento automático |
| `supabase/config.toml` | **Modificar** | Registrar nova função |

---

## Fluxo Completo

```text
1. WEBHOOK RECEBE MÍDIA
   vendor-whatsapp-webhook → Salva mensagem → Dispara process-vendor-media

2. PROCESSAMENTO DE MÍDIA
   process-vendor-media → Identifica tipo → Chama API apropriada → Salva resultado

3. ANÁLISE CRM
   crm-process-opportunity → Carrega mensagens com processed_content → 
   Agentes de IA "entendem" áudios, imagens e PDFs

4. RESULTADO
   Agentes extraem insights de toda a conversa, incluindo conteúdo multimídia
```

---

## Custo Estimado por API

| Mídia | API | Custo Estimado |
|-------|-----|----------------|
| **Áudio (1 min)** | ElevenLabs STT | ~$0.0001 |
| **Imagem** | GPT-4o Vision | ~$0.01 (baixa res) |
| **PDF (10 pág)** | GPT-4o | ~$0.03 |

---

## Ordem de Implementação

1. **Migração SQL** - Adicionar campos `processed_content`, `processing_status`
2. **Criar `media-processor.ts`** - Utilitário compartilhado
3. **Criar `process-vendor-media/index.ts`** - Edge Function principal
4. **Atualizar `crm-agent-executor.ts`** - Usar conteúdo processado
5. **Atualizar `crm-process-opportunity/index.ts`** - Incluir campos de mídia
6. **Atualizar `vendor-whatsapp-webhook`** - Trigger automático
7. **Testar com oportunidade real**

