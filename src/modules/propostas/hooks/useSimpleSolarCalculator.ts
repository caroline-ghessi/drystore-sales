import { useCallback } from 'react';
import { SimpleSolarCalculationInput, SimpleSolarCalculationResult } from '../types/calculation.types';
import { calculateSimpleSolarSystem } from '../utils/calculations/simpleSolarCalculations';

export function useSimpleSolarCalculator() {
  const calculate = useCallback((input: SimpleSolarCalculationInput): SimpleSolarCalculationResult => {
    return calculateSimpleSolarSystem(input);
  }, []);

  return {
    calculate
  };
}