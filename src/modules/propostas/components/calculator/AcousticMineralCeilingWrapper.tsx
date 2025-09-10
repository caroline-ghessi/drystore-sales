import React, { useState } from 'react';
import { AcousticMineralCeilingCalculator } from './AcousticMineralCeilingCalculator';
import { AcousticMineralCeilingResults } from './AcousticMineralCeilingResults';
import { calculateAcousticMineralCeiling } from '../../utils/calculations/acousticMineralCeilingCalculations';
import { AcousticMineralCeilingInput, AcousticMineralCeilingResult } from '../../types/calculation.types';

interface AcousticMineralCeilingWrapperProps {
  onCalculate?: (input: AcousticMineralCeilingInput) => void;
}

export function AcousticMineralCeilingWrapper({ onCalculate }: AcousticMineralCeilingWrapperProps) {
  const [result, setResult] = useState<AcousticMineralCeilingResult | null>(null);

  const handleCalculate = (input: AcousticMineralCeilingInput) => {
    const calculationResult = calculateAcousticMineralCeiling(input);
    setResult(calculationResult);
    
    // Se tem callback externo, chama também (para integração com gerador de propostas)
    if (onCalculate) {
      onCalculate(input);
    }
  };

  return (
    <div className="space-y-6">
      <AcousticMineralCeilingCalculator onCalculate={handleCalculate} />
      {result && <AcousticMineralCeilingResults result={result} />}
    </div>
  );
}