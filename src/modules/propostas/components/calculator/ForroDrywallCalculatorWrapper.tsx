import React, { useState } from 'react';
import { ForroDrywallCalculator } from './ForroDrywallCalculator';
import { ForroDrywallCalculationResults } from './ForroDrywallCalculationResults';
import { calculateForroDrywall } from '../../utils/calculations/forroDrywallCalculations';
import { ForroDrywallCalculationInput, ForroDrywallCalculationResult } from '../../types/calculation.types';
import { useCalculatorValidation } from '../../hooks/useCalculatorValidation';
import { ValidationService } from '../../services/validationService';
import { useUnifiedProducts } from '../../hooks/useUnifiedProducts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, Info } from 'lucide-react';

interface ForroDrywallCalculatorWrapperProps {
  onCalculate?: (result: any) => void;
}

// Type mapping between UI values and calculation function values
const mapPlateType = (uiType: string): 'standard' | 'moisture_resistant' | 'acoustic' => {
  switch (uiType) {
    case 'ru': return 'moisture_resistant';
    case 'rf': return 'acoustic';
    case 'standard':
    default: return 'standard';
  }
};

export function ForroDrywallCalculatorWrapper({ onCalculate }: ForroDrywallCalculatorWrapperProps) {
  const [result, setResult] = useState<ForroDrywallCalculationResult | null>(null);
  const { config: validationConfig, isLoading: configLoading } = useCalculatorValidation();
  const { products, isLoading: productsLoading } = useUnifiedProducts();

  const handleCalculate = async (input: any) => {
    // Map UI input to calculation input with proper types
    const calculationInput: ForroDrywallCalculationInput = {
      ...input,
      plateType: mapPlateType(input.plateType),
      region: 'southeast' as const, // Default region
    };

    // Validate products before calculation
    if (products && !configLoading) {
      const requiredCategories = ['forro-drywall-placa', 'forro-drywall-perfil', 'forro-drywall-suspensao'];
      const validation = ValidationService.validateProducts(products, requiredCategories, validationConfig);
      
      if (!validation.canProceed && validationConfig.strictValidation) {
        console.error('Validation failed:', validation.errors);
        return;
      }
    }

    try {
      const calculationResult = await calculateForroDrywall(calculationInput);
      setResult(calculationResult);
      
      // Call external onCalculate if provided (for ProposalGenerator integration)
      if (onCalculate) {
        onCalculate(calculationResult);
      }
    } catch (error) {
      console.error('Erro no cálculo de forro drywall:', error);
    }
  };

  // Product validation
  const validation = products && !configLoading ? 
    ValidationService.validateProducts(
      products, 
      ['forro-drywall-placa', 'forro-drywall-perfil', 'forro-drywall-suspensao'], 
      validationConfig
    ) : null;

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      {!configLoading && validationConfig.strictValidation && (
        <Alert variant={validation?.canProceed ? "default" : "destructive"}>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Modo de validação rigorosa ativo. 
            {validation?.canProceed 
              ? "Todos os produtos necessários estão válidos."
              : "Alguns produtos precisam ser configurados antes de calcular."
            }
          </AlertDescription>
        </Alert>
      )}

      {!configLoading && !validationConfig.strictValidation && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Modo de teste ativo. Cálculos permitidos mesmo com produtos incompletos.
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {validation && validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Problemas encontrados:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {validation.errors.map((error, idx) => (
                  <li key={idx}>{error.message}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <ForroDrywallCalculator 
        onCalculate={handleCalculate}
      />
      {result && <ForroDrywallCalculationResults result={result} />}
    </div>
  );
}