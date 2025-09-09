import React, { useState } from 'react';
import { AdvancedDrywallCalculator } from './AdvancedDrywallCalculator';
import { DrywallCalculatorResults } from './DrywallCalculatorResults';
import { calculateAdvancedDrywall } from '../../utils/calculations/advancedDrywallCalculations';
import { DrywallCalculationInput, DrywallCalculationResult } from '../../types/calculation.types';

export function DrywallCalculatorWrapper() {
  const [result, setResult] = useState<DrywallCalculationResult | null>(null);

  const handleCalculate = (input: DrywallCalculationInput) => {
    const calculationResult = calculateAdvancedDrywall(input);
    setResult(calculationResult);
  };

  return (
    <div className="space-y-6">
      <AdvancedDrywallCalculator onCalculate={handleCalculate} />
      {result && <DrywallCalculatorResults result={result} />}
    </div>
  );
}