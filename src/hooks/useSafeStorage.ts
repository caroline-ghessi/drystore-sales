import { useCallback, useEffect } from 'react';
import { SafeStorage } from '@/lib/storage';

export function useSafeStorage() {
  // Limpar storage corrompido na inicialização
  useEffect(() => {
    SafeStorage.cleanCorruptedData();
  }, []);

  const getItem = useCallback((key: string, fallback?: any) => {
    return SafeStorage.get(key, fallback);
  }, []);

  const setItem = useCallback((key: string, value: any) => {
    return SafeStorage.set(key, value);
  }, []);

  const removeItem = useCallback((key: string) => {
    return SafeStorage.remove(key);
  }, []);

  const clearStorage = useCallback(() => {
    return SafeStorage.clear();
  }, []);

  return {
    getItem,
    setItem,
    removeItem,
    clearStorage
  };
}