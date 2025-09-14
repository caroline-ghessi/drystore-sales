import React, { useState } from 'react';
import { DrystoreShingleCalculator } from './ShingleCalculator';
import { calculateShingleWithProducts } from '../../utils/calculations/drystoreShingleCalculations';
import { ShingleCalculationInput, ShingleCalculationResult } from '../../types/calculation.types';
import { useCalculatorValidation } from '../../hooks/useCalculatorValidation';
import { ValidationService } from '../../services/validationService';
import { useUnifiedProducts } from '../../hooks/useUnifiedProducts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, Info, CheckCircle2 } from 'lucide-react';

interface DrystoreShingleCalculatorWrapperProps {
  onCalculate?: (input: ShingleCalculationInput, result: ShingleCalculationResult) => void;
}

export function DrystoreShingleCalculatorWrapper({ onCalculate }: DrystoreShingleCalculatorWrapperProps) {
  const [result, setResult] = useState<ShingleCalculationResult | null>(null);
  const { config: validationConfig, isLoading: configLoading } = useCalculatorValidation();
  const { products, isLoading: productsLoading } = useUnifiedProducts();

  const handleCalculate = async (input: ShingleCalculationInput) => {
    try {
      // Validação de inclinação mínima
      const invalidSections = input.roofSections.filter(section => section.slope < 17);
      if (invalidSections.length > 0) {
        console.error('Águas com inclinação inferior ao mínimo:', invalidSections.map(s => s.name));
        return;
      }

      // Validar área total
      const totalArea = input.roofSections.reduce((sum, section) => sum + section.area, 0);
      if (totalArea <= 0) {
        console.error('Área total deve ser maior que zero');
        return;
      }

      // Validar produtos se disponíveis
      if (products && !configLoading) {
        const requiredCategories = ['telha-shingle', 'osb', 'rhinoroof'];
        const validation = ValidationService.validateProducts(products, requiredCategories, validationConfig);
        
        if (validationConfig?.strictValidation && !validation.canProceed) {
          console.error('Validação rigorosa falhou:', validation.errors);
          return;
        }
      }

      const calculationResult = calculateShingleWithProducts(input, products);
      setResult(calculationResult);
      
      // Call external onCalculate if provided
      if (onCalculate) {
        onCalculate(input, calculationResult);
      }
    } catch (error) {
      console.error('Erro no cálculo de shingle Drystore:', error);
    }
  };

  // Validação dos produtos
  const validation = products && !configLoading ? 
    ValidationService.validateProducts(
      products, 
      ['telha-shingle', 'osb', 'rhinoroof'], 
      validationConfig
    ) : null;

  return (
    <div className="space-y-6">
      {/* Status da Validação */}
      {!configLoading && validationConfig?.strictValidation && (
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

      {!configLoading && !validationConfig?.strictValidation && (
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

      <DrystoreShingleCalculator onCalculate={handleCalculate} />

      {/* Resultado do Cálculo */}
      {result && (
        <div className="space-y-4">
          {/* Validações do resultado */}
          {(!result.validations.minimumSlopeCheck.passed || 
            !result.validations.areaConsistencyCheck.passed ||
            !result.validations.productAvailability.passed) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Problemas no cálculo:</p>
                  <ul className="list-disc list-inside text-sm">
                    {!result.validations.minimumSlopeCheck.passed && (
                      <li>{result.validations.minimumSlopeCheck.message}</li>
                    )}
                    {!result.validations.areaConsistencyCheck.passed && (
                      <li>{result.validations.areaConsistencyCheck.message}</li>
                    )}
                    {!result.validations.productAvailability.passed && (
                      <li>Produtos faltantes: {result.validations.productAvailability.missing?.join(', ')}</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Resumo do cálculo */}
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Cálculo realizado com sucesso!</p>
                <p className="text-sm">
                  Área total real: {result.totalRealArea.toFixed(1)}m² | 
                  Telhas: {result.shingleBundles} fardos | 
                  Custo total: R$ {result.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}