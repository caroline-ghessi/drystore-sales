import React, { useState } from 'react';
import { AdvancedDrywallCalculator } from './AdvancedDrywallCalculator';
import { DrywallCalculatorResults } from './DrywallCalculatorResults';
import { calculateImprovedDrywall } from '../../utils/calculations/improvedDrywallCalculations';
import { DrywallCalculationInput, DrywallCalculationResult } from '../../types/calculation.types';
import { useCalculatorValidation } from '../../hooks/useCalculatorValidation';
import { ValidationService } from '../../services/validationService';
import { useUnifiedProducts } from '../../hooks/useUnifiedProducts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, Info } from 'lucide-react';

interface DrywallCalculatorWrapperProps {
  onCalculate?: (result: any) => void;
}

export function DrywallCalculatorWrapper({ onCalculate }: DrywallCalculatorWrapperProps) {
  const [result, setResult] = useState<DrywallCalculationResult | null>(null);
  const { config: validationConfig, isLoading: configLoading } = useCalculatorValidation();
  const { products, isLoading: productsLoading } = useUnifiedProducts();

  const handleCalculate = async (input: DrywallCalculationInput) => {
    // Validar produtos antes do cálculo
    if (products && !configLoading) {
      const requiredCategories = ['drywall-placa', 'drywall-perfil', 'drywall-parafuso'];
      const validation = ValidationService.validateProducts(products, requiredCategories, validationConfig);
      
      if (!validation.canProceed) {
        console.error('Validação falhou:', validation.errors);
        return;
      }
    }

    try {
      const calculationResult = await calculateImprovedDrywall(input);
      setResult(calculationResult);
      
      // Call external onCalculate if provided (for ProposalGenerator integration)
      // Pass the complete result, not just input
      if (onCalculate) {
        onCalculate(calculationResult);
      }
    } catch (error) {
      console.error('Erro no cálculo de drywall:', error);
    }
  };

  // Validação dos produtos
  const validation = products && !configLoading ? 
    ValidationService.validateProducts(
      products, 
      ['drywall-placa', 'drywall-perfil', 'drywall-parafuso'], 
      validationConfig
    ) : null;

  return (
    <div className="space-y-6">
      {/* Status da Validação */}
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

      {/* Erros de Validação */}
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

      <AdvancedDrywallCalculator 
        onCalculate={handleCalculate}
      />
      {result && <DrywallCalculatorResults result={result} />}
    </div>
  );
}