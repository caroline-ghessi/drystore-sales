import { useCallback } from 'react';
import { BatteryBackupInput, BatteryBackupResult } from '../types/calculation.types';
import { useUnifiedProducts } from './useUnifiedProducts';
import { calculateBatteryBackupWithProducts } from '../utils/calculations/productBasedBatteryBackupCalculations';
import { calculateBatteryBackup } from '../utils/calculations/batteryBackupCalculations';

export function useBatteryProductCalculator() {
  const { products, isLoading, error } = useUnifiedProducts('battery_backup');

  const calculate = useCallback((input: BatteryBackupInput): BatteryBackupResult => {
    console.log('🔄 Executando cálculo de backup:', { 
      hasProducts: products && products.length > 0, 
      productCount: products?.length || 0,
      input
    });

    // Se há produtos cadastrados, usar cálculo baseado em produtos
    if (products && products.length > 0) {
      console.log('✅ Usando cálculo com produtos cadastrados');
      return calculateBatteryBackupWithProducts(input, products);
    }
    
    // Fallback: usar cálculo padrão sem produtos específicos
    console.log('⚠️ Usando cálculo padrão (sem produtos cadastrados)');
    return calculateBatteryBackup(input);
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