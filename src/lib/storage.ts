// Utilitário para storage seguro - previne erros de JSON
export class SafeStorage {
  static get(key: string, fallback: any = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return fallback;
      
      // Verificar se é um objeto válido antes de fazer parse
      if (typeof item === 'object') {
        console.warn(`🚨 SafeStorage: Removendo item corrompido do localStorage: ${key}`);
        localStorage.removeItem(key);
        return fallback;
      }
      
      return JSON.parse(item);
    } catch (error) {
      console.warn(`🚨 SafeStorage: Erro ao ler ${key}, limpando item corrompido:`, error);
      localStorage.removeItem(key);
      return fallback;
    }
  }

  static set(key: string, value: any) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`🚨 SafeStorage: Erro ao salvar ${key}:`, error);
      return false;
    }
  }

  static remove(key: string) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`🚨 SafeStorage: Erro ao remover ${key}:`, error);
      return false;
    }
  }

  static clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('🚨 SafeStorage: Erro ao limpar localStorage:', error);
      return false;
    }
  }

  // Função para limpar dados corrompidos conhecidos
  static cleanCorruptedData() {
    let hasCleanedData = false;
    
    const keysToCheck = [
      'supabase.auth.token',
      'sb-groqsnnytvjabgeaekkw-auth-token',
      'react-query-offline-cache',
      'propostas-cache'
    ];

    keysToCheck.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item && typeof item === 'object') {
          console.warn(`🧹 Limpando item corrompido: ${key}`);
          localStorage.removeItem(key);
          hasCleanedData = true;
        }
      } catch (error) {
        console.warn(`🧹 Erro ao verificar ${key}, removendo:`, error);
        localStorage.removeItem(key);
        hasCleanedData = true;
      }
    });
    
    // Marcar que houve limpeza para mostrar toast
    if (hasCleanedData) {
      sessionStorage.setItem('storage-cleaned-up', 'true');
    }
    
    return hasCleanedData;
  }
}

// Auto-limpeza na inicialização
SafeStorage.cleanCorruptedData();