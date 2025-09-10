import React from 'react';
import { ShingleCalculator } from './ShingleCalculator';
import { useProductPricing } from '../../hooks/useProductPricing';
import { calculateShingleInstallation } from '../../utils/calculations/shingleCalculations';
import { ShingleCalculationInput } from '../../types/calculation.types';

interface ShingleCalculatorWrapperProps {
  onCalculate: (result: any) => void;
}

export function ShingleCalculatorWrapper({ onCalculate }: ShingleCalculatorWrapperProps) {
  const { products, calculatePricing } = useProductPricing('shingle');

  const handleCalculate = (input: ShingleCalculationInput) => {
    // Encontrar produtos específicos na tabela
    const oakridgeProduct = products.find(p => 
      p.name.toLowerCase().includes('oakridge')
    );
    const supremeProduct = products.find(p => 
      p.name.toLowerCase().includes('supreme')
    );
    const osbProduct = products.find(p => 
      p.name.toLowerCase().includes('osb') || p.name.toLowerCase().includes('compensado')
    );
    const underlaymentProduct = products.find(p => 
      p.name.toLowerCase().includes('manta') || p.name.toLowerCase().includes('subcobertura')
    );

    // Selecionar preço baseado no tipo escolhido
    const selectedShingleProduct = input.shingleType === 'oakridge' ? oakridgeProduct : supremeProduct;
    
    // Montar preços para passar para o cálculo
    const productPrices = {
      shinglePrice: selectedShingleProduct?.base_price || 40,
      osbPrice: osbProduct?.base_price || 35,
      underlaymentPrice: underlaymentProduct?.base_price || 180,
      laborCostPerM2: 25, // Pode vir de configuração
      equipmentCostPerM2: 5, // Pode vir de configuração
      accessoryPrices: {
        ridgeCapPrice: 45,
        valleyPrice: 25,
        flashingPrice: 15,
        sealantPrice: 12
      }
    };

    // Calcular com preços dinâmicos
    const result = calculateShingleInstallation(input, productPrices);
    
    // Aplicar sistema de precificação se necessário
    const pricingResult = calculatePricing(result);
    
    onCalculate({
      ...result,
      pricing: pricingResult
    });
  };

  return <ShingleCalculator onCalculate={handleCalculate} />;
}