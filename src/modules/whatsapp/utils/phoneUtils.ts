/**
 * Utilitários de telefone para o frontend
 * Usado para normalização e formatação de números de telefone
 */

/**
 * Normaliza um número de telefone para o formato brasileiro padrão (55XXXXXXXXXXX)
 * @throws Error se o número for inválido
 */
export function normalizePhone(phone: string): string {
  // Remove tudo que não é número
  let cleaned = phone.replace(/\D/g, '');
  
  // Se não começa com 55, adiciona
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  // Valida tamanho (55 + DDD + 8-9 dígitos = 12-13)
  if (cleaned.length < 12 || cleaned.length > 13) {
    throw new Error('Número de telefone inválido. Use o formato: (XX) XXXXX-XXXX');
  }
  
  return cleaned;
}

/**
 * Formata um número de telefone para exibição
 * Entrada: 5551999999999
 * Saída: +55 (51) 99999-9999
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 13) {
    // Celular com 9 dígitos
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  
  if (cleaned.length === 12) {
    // Telefone fixo com 8 dígitos
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  }
  
  // Retorna o número original se não conseguir formatar
  return phone;
}

/**
 * Valida se um número de telefone está no formato correto
 */
export function isValidPhone(phone: string): boolean {
  try {
    normalizePhone(phone);
    return true;
  } catch {
    return false;
  }
}

/**
 * Tipos de contato para a lista de exclusão
 */
export const CONTACT_TYPES = [
  { value: 'employee', label: 'Funcionário/Colega' },
  { value: 'vendor', label: 'Vendedor Monitorado' },
  { value: 'test', label: 'Número de Teste' },
  { value: 'supplier', label: 'Fornecedor' },
  { value: 'partner', label: 'Parceiro de Negócio' },
  { value: 'spam', label: 'Spam/Bot' },
] as const;

export type ContactType = typeof CONTACT_TYPES[number]['value'];
