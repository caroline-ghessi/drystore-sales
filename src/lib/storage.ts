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

  // 🚨 NOVA FUNÇÃO: Limpeza forçada de emergência
  static emergencyCleanup() {
    console.log('🆘 EXECUTANDO LIMPEZA DE EMERGÊNCIA DO STORAGE');
    
    try {
      // Salvar apenas dados essenciais
      const authData = localStorage.getItem('sb-groqsnnytvjabgeaekkw-auth-token');
      
      // Limpar TUDO
      localStorage.clear();
      sessionStorage.clear();
      
      // Restaurar apenas auth se válido
      if (authData) {
        try {
          JSON.parse(authData); // Testar se é JSON válido
          localStorage.setItem('sb-groqsnnytvjabgeaekkw-auth-token', authData);
          console.log('✅ Auth preservado após limpeza');
        } catch {
          console.log('⚠️ Auth também estava corrompido, removido');
        }
      }
      
      // Marcar limpeza de emergência
      sessionStorage.setItem('emergency-cleanup-performed', 'true');
      console.log('✅ Limpeza de emergência concluída');
      
      return true;
    } catch (error) {
      console.error('❌ Erro na limpeza de emergência:', error);
      return false;
    }
  }

  // 🚨 NOVA FUNÇÃO: Diagnóstico completo do storage
  static diagnoseStorage() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DO STORAGE');
    
    const issues = [];
    const totalItems = localStorage.length;
    
    console.log(`📊 Total de itens no localStorage: ${totalItems}`);
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      try {
        const value = localStorage.getItem(key);
        console.log(`🔑 ${key}: ${typeof value} (${value?.length || 0} chars)`);
        
        // Tentar fazer parse se parecer JSON
        if (value && (value.startsWith('{') || value.startsWith('['))) {
          JSON.parse(value);
        }
      } catch (error) {
        console.error(`❌ ITEM CORROMPIDO: ${key}`, error);
        issues.push(key);
      }
    }
    
    if (issues.length > 0) {
      console.log(`🚨 ENCONTRADOS ${issues.length} ITENS CORROMPIDOS:`, issues);
      return issues;
    }
    
    console.log('✅ Storage aparenta estar íntegro');
    return [];
  }
}

// Auto-limpeza na inicialização
SafeStorage.cleanCorruptedData();