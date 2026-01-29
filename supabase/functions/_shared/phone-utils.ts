/**
 * Utilitários de telefone para Edge Functions
 * Usado para normalização e verificação de contatos excluídos
 */

/**
 * Normaliza um número de telefone para o formato brasileiro padrão (55XXXXXXXXXXX)
 * Retorna null se o telefone for inválido
 */
export function normalizePhone(phone: string): string | null {
  // Remove tudo que não é número
  let cleaned = phone.replace(/\D/g, '');
  
  // Se não começa com 55, adiciona
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  // Valida tamanho (55 + DDD + 8-9 dígitos = 12-13)
  if (cleaned.length < 12 || cleaned.length > 13) {
    console.warn(`[phone-utils] Número inválido rejeitado: ${phone} -> ${cleaned} (length: ${cleaned.length})`);
    return null;
  }
  
  return cleaned;
}

/**
 * Extrai número de telefone de um chat_id do WhatsApp
 * Formato esperado: 5551999999999@s.whatsapp.net
 */
export function extractPhoneFromChatId(chatId: string): string {
  return chatId.split('@')[0].replace(/\D/g, '');
}

// Cache em memória para verificação rápida de contatos excluídos
let excludedPhonesCache: Set<string> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Verifica se um número está na lista de contatos excluídos
 * Usa cache em memória para performance
 */
export async function isExcludedContact(
  supabase: any, 
  phone: string
): Promise<boolean> {
  try {
    const normalizedPhone = normalizePhone(phone);
    
    // Verificar cache
    const now = Date.now();
    if (excludedPhonesCache && (now - cacheTimestamp) < CACHE_TTL) {
      return excludedPhonesCache.has(normalizedPhone);
    }
    
    // Recarregar cache
    const { data, error } = await supabase
      .from('excluded_contacts')
      .select('phone_number')
      .eq('is_active', true);
    
    if (error) {
      console.error('[phone-utils] Erro ao buscar contatos excluídos:', error.message);
      // Em caso de erro, retorna false para não bloquear o fluxo
      return false;
    }
    
    excludedPhonesCache = new Set(data?.map((d: { phone_number: string }) => d.phone_number) || []);
    cacheTimestamp = now;
    
    const isExcluded = excludedPhonesCache.has(normalizedPhone);
    
    if (isExcluded) {
      console.log(`[phone-utils] Contato interno detectado: ${normalizedPhone}`);
    }
    
    return isExcluded;
  } catch (err) {
    console.error('[phone-utils] Erro inesperado em isExcludedContact:', err);
    return false;
  }
}

/**
 * Limpa o cache de contatos excluídos
 * Útil para forçar recarregamento após atualizações
 */
export function clearExcludedContactsCache(): void {
  excludedPhonesCache = null;
  cacheTimestamp = 0;
  console.log('[phone-utils] Cache de contatos excluídos limpo');
}
