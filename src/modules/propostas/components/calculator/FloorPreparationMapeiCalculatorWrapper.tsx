import React from 'react';
import { FloorPreparationMapeiCalculator } from './FloorPreparationMapeiCalculator';
import { FloorPreparationMapeiResult } from '../../types/calculation.types';

interface FloorPreparationMapeiCalculatorWrapperProps {
  onCalculate: (result: any) => void;
}

export function FloorPreparationMapeiCalculatorWrapper({ onCalculate }: FloorPreparationMapeiCalculatorWrapperProps) {
  const handleCalculationComplete = (result: FloorPreparationMapeiResult) => {
    // Transform the result to match the expected format for the calculator system
    const transformedResult = {
      quantified_items: result.quantified_items,
      totalMaterialCost: result.totalMaterialCost,
      totalLaborCost: result.totalLaborCost,
      totalCost: result.totalCost,
      // Add MAPEI-specific data
      volumeCalculation: result.volumeCalculation,
      primer: result.primer,
      mixingSpecs: result.mixingSpecs,
      validationErrors: result.validationErrors,
      recommendations: result.recommendations
    };

    onCalculate(transformedResult);
  };

  return (
    <FloorPreparationMapeiCalculator 
      onCalculationComplete={handleCalculationComplete}
    />
  );
}