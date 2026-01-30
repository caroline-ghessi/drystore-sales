/**
 * Media Processor - Processa mídia de conversas de vendedores
 * 
 * Responsabilidades:
 * - Transcrever áudio (ElevenLabs STT)
 * - Descrever imagens (GPT-4o Vision)
 * - Extrair texto de PDFs (GPT-4o)
 */

export interface MediaProcessingResult {
  success: boolean;
  content: string;
  processingTimeMs: number;
  error?: string;
}

export interface VendorMessage {
  id: number;
  message_type: string;
  media_url?: string;
  content: string;
  media_metadata?: {
    mime_type?: string;
    file_size?: number;
    filename?: string;
  };
}

/**
 * Transcreve áudio usando ElevenLabs Speech-to-Text
 */
export async function transcribeAudio(mediaUrl: string): Promise<MediaProcessingResult> {
  const startTime = Date.now();
  
  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY não configurada');
    }

    // Baixar o áudio
    console.log('[media-processor] Baixando áudio:', mediaUrl);
    const audioResponse = await fetch(mediaUrl);
    if (!audioResponse.ok) {
      throw new Error(`Falha ao baixar áudio: ${audioResponse.status}`);
    }
    
    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/ogg' });

    // Enviar para ElevenLabs
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.ogg');
    formData.append('model_id', 'scribe_v1');
    formData.append('language_code', 'por'); // Português

    console.log('[media-processor] Enviando para ElevenLabs STT...');
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const transcription = result.text || '';

    console.log('[media-processor] Transcrição concluída:', transcription.substring(0, 100) + '...');

    return {
      success: true,
      content: transcription,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[media-processor] Erro na transcrição:', errorMessage);
    
    return {
      success: false,
      content: '',
      processingTimeMs: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

/**
 * Descreve uma imagem usando GPT-4o Vision
 */
export async function describeImage(
  mediaUrl: string,
  context?: string
): Promise<MediaProcessingResult> {
  const startTime = Date.now();
  
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    console.log('[media-processor] Descrevendo imagem:', mediaUrl);

    const systemPrompt = `Você é um assistente especializado em analisar imagens de conversas de vendas.
Descreva a imagem de forma objetiva e concisa, focando em:
- Produtos visíveis (materiais de construção, equipamentos, etc.)
- Medidas ou dimensões mencionadas
- Condições ou estado de materiais/locais
- Documentos visíveis (orçamentos, notas, plantas)
- Qualquer informação relevante para uma negociação comercial

Responda em português, de forma direta, em até 200 palavras.`;

    const userPrompt = context 
      ? `Contexto da conversa: ${context}\n\nDescreva esta imagem:`
      : 'Descreva esta imagem:';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: mediaUrl, detail: 'low' } },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content || '';

    console.log('[media-processor] Descrição concluída:', description.substring(0, 100) + '...');

    return {
      success: true,
      content: description,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[media-processor] Erro na descrição de imagem:', errorMessage);
    
    return {
      success: false,
      content: '',
      processingTimeMs: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

/**
 * Extrai texto de um documento PDF usando GPT-4o
 */
export async function extractPDFContent(
  mediaUrl: string,
  filename?: string
): Promise<MediaProcessingResult> {
  const startTime = Date.now();
  
  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    console.log('[media-processor] Baixando documento:', mediaUrl);
    
    // Baixar o documento
    const docResponse = await fetch(mediaUrl);
    if (!docResponse.ok) {
      throw new Error(`Falha ao baixar documento: ${docResponse.status}`);
    }
    
    const docBuffer = await docResponse.arrayBuffer();
    const base64Doc = btoa(String.fromCharCode(...new Uint8Array(docBuffer)));
    
    // Para PDFs, usamos GPT-4o com capacidade de análise de documentos
    // Primeiro tentamos como imagem (se for PDF visual)
    const systemPrompt = `Você é um assistente especializado em extrair informações de documentos comerciais.
Analise o documento e extraia as informações mais relevantes, incluindo:
- Valores e preços mencionados
- Produtos ou serviços listados
- Quantidades e especificações
- Dados de empresas ou pessoas
- Datas e prazos
- Condições de pagamento

Organize as informações de forma estruturada e concisa. Responda em português.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: `Extraia as informações deste documento${filename ? ` (${filename})` : ''}:` 
              },
              { 
                type: 'image_url', 
                image_url: { 
                  url: `data:application/pdf;base64,${base64Doc}`,
                  detail: 'high' 
                } 
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Se falhar com PDF direto, tenta processar como texto simples
      if (response.status === 400) {
        console.log('[media-processor] Tentando extração alternativa...');
        return await extractDocumentAsText(mediaUrl, filename);
      }
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content || '';

    console.log('[media-processor] Extração concluída:', extractedText.substring(0, 100) + '...');

    return {
      success: true,
      content: extractedText,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[media-processor] Erro na extração de PDF:', errorMessage);
    
    return {
      success: false,
      content: '',
      processingTimeMs: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

/**
 * Fallback: Extrai texto de documento usando abordagem de texto
 */
async function extractDocumentAsText(
  mediaUrl: string,
  filename?: string
): Promise<MediaProcessingResult> {
  const startTime = Date.now();
  
  try {
    // Tentar baixar e converter para texto básico
    const response = await fetch(mediaUrl);
    const buffer = await response.arrayBuffer();
    
    // Tentar decodificar como texto
    const decoder = new TextDecoder('utf-8');
    let text = '';
    
    try {
      text = decoder.decode(buffer);
      // Limpar caracteres não-texto
      text = text.replace(/[^\x20-\x7E\xC0-\xFF\n\r\t]/g, ' ').trim();
    } catch {
      text = `[Documento: ${filename || 'arquivo'}]`;
    }

    // Se o texto extraído for muito pequeno ou não fizer sentido, usar placeholder
    if (text.length < 50 || text.includes('%PDF')) {
      return {
        success: true,
        content: `[Documento PDF: ${filename || 'arquivo'} - conteúdo não extraível diretamente]`,
        processingTimeMs: Date.now() - startTime,
      };
    }

    return {
      success: true,
      content: text.substring(0, 5000), // Limitar tamanho
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      processingTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Processa uma mensagem de mídia baseado no seu tipo
 */
export async function processMediaMessage(
  message: VendorMessage,
  context?: string
): Promise<MediaProcessingResult> {
  const { message_type, media_url, media_metadata } = message;

  if (!media_url) {
    return {
      success: false,
      content: '',
      processingTimeMs: 0,
      error: 'URL de mídia não disponível',
    };
  }

  console.log(`[media-processor] Processando ${message_type}: ${media_url}`);

  switch (message_type) {
    case 'audio':
    case 'voice':
    case 'ptt': // Push-to-talk (áudio de WhatsApp)
      return transcribeAudio(media_url);

    case 'image':
      return describeImage(media_url, context);

    case 'document':
      const filename = media_metadata?.filename;
      const mimeType = media_metadata?.mime_type || '';
      
      // Verificar se é PDF
      if (mimeType.includes('pdf') || filename?.toLowerCase().endsWith('.pdf')) {
        return extractPDFContent(media_url, filename);
      }
      
      // Outros documentos - tentar extração de texto
      return extractDocumentAsText(media_url, filename);

    case 'video':
      // Para vídeos, apenas retornar placeholder por enquanto
      // Futuramente pode-se extrair thumbnail e descrever
      return {
        success: true,
        content: '[Vídeo enviado - análise de conteúdo não disponível]',
        processingTimeMs: 0,
      };

    case 'sticker':
      return {
        success: true,
        content: '[Figurinha/Sticker enviado]',
        processingTimeMs: 0,
      };

    default:
      return {
        success: false,
        content: '',
        processingTimeMs: 0,
        error: `Tipo de mídia não suportado: ${message_type}`,
      };
  }
}

/**
 * Verifica se uma mensagem precisa de processamento de mídia
 */
export function needsMediaProcessing(message: VendorMessage): boolean {
  const mediaTypes = ['audio', 'voice', 'ptt', 'image', 'document', 'video'];
  return mediaTypes.includes(message.message_type) && !!message.media_url;
}
