import { useCallback } from 'react';
import { SimpleSolarCalculationInput, SimpleSolarCalculationResult } from '../types/calculation.types';
import { calculateSimpleSolarSystem } from '../utils/calculations/simpleSolarCalculations';
import { UnifiedProduct } from './useUnifiedProducts';

export function useSimpleSolarCalculator() {
  const calculate = useCallback((input: SimpleSolarCalculationInput, products: UnifiedProduct[] = []): SimpleSolarCalculationResult => {
    return calculateSimpleSolarSystem(input, products);
  }, []);

  return {
    calculate
  };
}