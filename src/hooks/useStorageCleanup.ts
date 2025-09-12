import { useEffect } from 'react';
import { SafeStorage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

export function useStorageCleanup() {
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se houve limpeza automática
    const wasCleanedUp = sessionStorage.getItem('storage-cleaned-up');
    
    if (wasCleanedUp) {
      toast({
        title: "✅ Sistema Otimizado",
        description: "Dados corrompidos foram limpos automaticamente. O sistema está funcionando normalmente.",
        duration: 5000,
      });
      
      // Remover flag para não mostrar novamente
      sessionStorage.removeItem('storage-cleaned-up');
    }

    // Interceptar erros de JSON no console
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
      if (message.includes('[object Object]" is not valid JSON') || 
          message.includes('JSON.parse')) {
        
        console.warn('🚨 Erro de JSON detectado, executando limpeza...');
        SafeStorage.cleanCorruptedData();
        
        // Marcar que foi feita limpeza
        sessionStorage.setItem('storage-cleaned-up', 'true');
        
        toast({
          title: "🔧 Corrigindo Problema",
          description: "Detectamos dados corrompidos e estamos limpando automaticamente...",
          duration: 3000,
        });
      }
      
      // Chamar console.error original
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, [toast]);
}