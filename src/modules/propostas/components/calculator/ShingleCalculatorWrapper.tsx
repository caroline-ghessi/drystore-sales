import React, { useState } from 'react';
import { ShingleCalculator } from './ShingleCalculator';
import { calculateShingleWithProducts } from '../../utils/calculations/productBasedShingleCalculations';
import { ShingleCalculationInput, ShingleCalculationResult } from '../../types/calculation.types';
import { useCalculatorValidation } from '../../hooks/useCalculatorValidation';
import { ValidationService } from '../../services/validationService';
import { useUnifiedProducts } from '../../hooks/useUnifiedProducts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, Info } from 'lucide-react';

interface ShingleCalculatorWrapperProps {
  onCalculate?: (input: ShingleCalculationInput) => void;
}

export function ShingleCalculatorWrapper({ onCalculate }: ShingleCalculatorWrapperProps) {
  const [result, setResult] = useState<ShingleCalculationResult | null>(null);
  const { config: validationConfig, isLoading: configLoading } = useCalculatorValidation();
  const { products, isLoading: productsLoading } = useUnifiedProducts();

  const handleCalculate = async (input: ShingleCalculationInput) => {
    // Validar produtos antes do cálculo
    if (products && !configLoading) {
      const requiredCategories = ['telha-shingle', 'osb', 'rhinoroof', 'cumeeira', 'pregos'];
      const validation = ValidationService.validateProducts(products, requiredCategories, validationConfig);
      
      if (!validation.canProceed) {
        console.error('Validação falhou:', validation.errors);
        return;
      }
    }

    try {
      const calculationResult = calculateShingleWithProducts(input, products);
      setResult(calculationResult);
      
      // Call external onCalculate if provided (for ProposalGenerator integration)
      if (onCalculate) {
        onCalculate(input);
      }
    } catch (error) {
      console.error('Erro no cálculo de shingle:', error);
    }
  };

  // Validação dos produtos
  const validation = products && !configLoading ? 
    ValidationService.validateProducts(
      products, 
      ['telha-shingle', 'osb', 'rhinoroof', 'cumeeira', 'pregos'], 
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

      <ShingleCalculator onCalculate={handleCalculate} />
    </div>
  );
}