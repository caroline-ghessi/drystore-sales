import React, { useState } from 'react';
import { AcousticMineralCeilingCalculator } from './AcousticMineralCeilingCalculator';
import { AcousticMineralCeilingResults } from './AcousticMineralCeilingResults';
import { calculateAcousticMineralCeiling } from '../../utils/calculations/acousticMineralCeilingCalculations';
import { AcousticMineralCeilingInput, AcousticMineralCeilingResult } from '../../types/calculation.types';

export function AcousticMineralCeilingWrapper() {
  const [result, setResult] = useState<AcousticMineralCeilingResult | null>(null);

  const handleCalculate = (input: AcousticMineralCeilingInput) => {
    const calculationResult = calculateAcousticMineralCeiling(input);
    setResult(calculationResult);
  };

  return (
    <div className="space-y-6">
      <AcousticMineralCeilingCalculator onCalculate={handleCalculate} />
      {result && <AcousticMineralCeilingResults result={result} />}
    </div>
  );
}