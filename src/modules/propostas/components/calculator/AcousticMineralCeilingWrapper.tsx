import React, { useState } from 'react';
import { AcousticMineralCeilingCalculator } from './AcousticMineralCeilingCalculator';
import { AcousticMineralCeilingResults } from './AcousticMineralCeilingResults';
import { calculateAcousticMineralCeiling, calculateAcousticMineralCeilingSyncLegacy } from '../../utils/calculations/acousticMineralCeilingCalculations';
import { AcousticMineralCeilingInput, AcousticMineralCeilingResult } from '../../types/calculation.types';

interface AcousticMineralCeilingWrapperProps {
  onCalculate?: (data: { input: AcousticMineralCeilingInput; result: AcousticMineralCeilingResult }) => void;
}

export function AcousticMineralCeilingWrapper({ onCalculate }: AcousticMineralCeilingWrapperProps) {
  const [result, setResult] = useState<AcousticMineralCeilingResult | null>(null);

  const handleCalculate = async (input: AcousticMineralCeilingInput) => {
    try {
      const calculationResult = await calculateAcousticMineralCeiling(input);
      setResult(calculationResult);
      
      // Se tem callback externo, chama também (para integração com gerador de propostas)
      if (onCalculate) {
        onCalculate({ input, result: calculationResult });
      }
    } catch (error) {
      console.error('Erro ao calcular forro mineral acústico:', error);
      // Fallback para versão legada
      const legacyResult = calculateAcousticMineralCeilingSyncLegacy(input);
      setResult(legacyResult);
      if (onCalculate) {
        onCalculate({ input, result: legacyResult });
      }
    }
  };

  return (
    <div className="space-y-6">
      <AcousticMineralCeilingCalculator onCalculate={handleCalculate} />
      {result && <AcousticMineralCeilingResults result={result} />}
    </div>
  );
}