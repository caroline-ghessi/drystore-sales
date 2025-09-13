import React from 'react';
import { WaterproofingMapeiCalculator } from './WaterproofingMapeiCalculator';
import { WaterproofingMapeiResult } from '../../types/calculation.types';

interface WaterproofingMapeiCalculatorWrapperProps {
  onCalculate: (result: any) => void;
}

export function WaterproofingMapeiCalculatorWrapper({ onCalculate }: WaterproofingMapeiCalculatorWrapperProps) {
  const handleCalculationComplete = (result: WaterproofingMapeiResult) => {
    // Transform the result to match the expected format for the calculator system
    const transformedResult = {
      quantified_items: result.quantified_items,
      totalMaterialCost: result.totalMaterialCost,
      totalLaborCost: result.totalLaborCost,
      totalCost: result.totalCost,
      // Add MAPEI-specific data
      calculatedAreas: result.calculatedAreas,
      systemSpecs: result.systemSpecs,
      correctionFactors: result.correctionFactors,
      accessories: result.accessories,
      validationErrors: result.validationErrors,
      recommendations: result.recommendations
    };

    onCalculate(transformedResult);
  };

  return (
    <WaterproofingMapeiCalculator 
      onCalculationComplete={handleCalculationComplete}
    />
  );
}