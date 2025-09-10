import { useCallback } from 'react';
import { SolarCalculationInput, SolarCalculationResult } from '../types/calculation.types';
import { useUnifiedProducts } from './useUnifiedProducts';
import { calculateSolarWithProducts } from '../utils/calculations/productBasedSolarCalculations';

export function useSolarProductCalculator() {
  const { products, isLoading, error } = useUnifiedProducts('energia_solar');

  const calculate = useCallback((input: SolarCalculationInput): SolarCalculationResult => {
    if (!products || products.length === 0) {
      throw new Error('Nenhum produto solar encontrado. Configure produtos na página de produtos.');
    }

    return calculateSolarWithProducts(input, products);
  }, [products]);

  const getAvailableProducts = useCallback(() => {
    if (!products) return { panels: [], inverters: [], batteries: [], structure: [] };
    
    return {
      panels: products.filter(p => p.subcategory === 'painel' || p.solar_category === 'panel'),
      inverters: products.filter(p => p.subcategory === 'inversor' || p.solar_category === 'inverter'),
      batteries: products.filter(p => p.subcategory === 'bateria' || p.solar_category === 'battery'),
      structure: products.filter(p => p.subcategory === 'estrutura')
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