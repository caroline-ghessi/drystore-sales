import React, { useState } from 'react';
import { AdvancedDrywallCalculator } from './AdvancedDrywallCalculator';
import { DrywallCalculatorResults } from './DrywallCalculatorResults';
import { calculateImprovedDrywall } from '../../utils/calculations/improvedDrywallCalculations';
import { DrywallCalculationInput, DrywallCalculationResult } from '../../types/calculation.types';

interface DrywallCalculatorWrapperProps {
  onCalculate?: (input: DrywallCalculationInput) => void;
}

export function DrywallCalculatorWrapper({ onCalculate }: DrywallCalculatorWrapperProps) {
  const [result, setResult] = useState<DrywallCalculationResult | null>(null);

  const handleCalculate = async (input: DrywallCalculationInput) => {
    try {
      const calculationResult = await calculateImprovedDrywall(input);
      setResult(calculationResult);
      
      // Call external onCalculate if provided (for ProposalGenerator integration)
      if (onCalculate) {
        onCalculate(input);
      }
    } catch (error) {
      console.error('Erro no cálculo de drywall:', error);
    }
  };

  return (
    <div className="space-y-6">
      <AdvancedDrywallCalculator onCalculate={handleCalculate} />
      {result && <DrywallCalculatorResults result={result} />}
    </div>
  );
}