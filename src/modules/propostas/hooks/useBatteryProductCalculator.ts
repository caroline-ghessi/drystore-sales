import { useCallback } from 'react';
import { BatteryBackupInput, BatteryBackupResult } from '../types/calculation.types';
import { useUnifiedProducts } from './useUnifiedProducts';
import { calculateBatteryBackupWithProducts } from '../utils/calculations/productBasedBatteryBackupCalculations';

export function useBatteryProductCalculator() {
  const { products, isLoading, error } = useUnifiedProducts('battery_backup');

  const calculate = useCallback((input: BatteryBackupInput): BatteryBackupResult => {
    if (!products || products.length === 0) {
      throw new Error('Nenhum produto de backup encontrado. Configure produtos na página de produtos.');
    }

    return calculateBatteryBackupWithProducts(input, products);
  }, [products]);

  const getAvailableProducts = useCallback(() => {
    if (!products) return { batteries: [], inverters: [], protection: [], monitoring: [] };
    
    return {
      batteries: products.filter(p => p.subcategory === 'bateria' || p.solar_category === 'battery'),
      inverters: products.filter(p => p.subcategory === 'inversor' || p.solar_category === 'inverter'),
      protection: products.filter(p => p.subcategory === 'protecao'),
      monitoring: products.filter(p => p.subcategory === 'monitoramento')
    };
  }, [products]);

  return {
    calculate,
    getAvailableProducts,
    products: products || [],
    isLoading,
    error,
    hasProducts: products && products.length > 0
  };
}