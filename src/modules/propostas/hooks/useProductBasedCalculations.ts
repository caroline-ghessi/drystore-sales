import { useState, useMemo, useCallback } from 'react';
import { useUnifiedProducts, UnifiedProduct } from './useUnifiedProducts';
import { ProductCalculationService, ProductCalculationSpecs } from '../services/productCalculationService';
import { LaborCostConfig } from '../components/shared/LaborCostSelector';

export interface ProductBasedCalculationInput {
  productType: 'shingle' | 'solar' | 'battery' | 'drywall' | 'acoustic';
  laborConfig: LaborCostConfig;
}

export interface ProductBasedCalculationResult {
  products: {
    [category: string]: UnifiedProduct[];
  };
  quantities: {
    [productId: string]: number;
  };
  costs: {
    materials: { [productId: string]: number };
    labor: number;
    total: number;
  };
  validationErrors: string[];
  fallbacksUsed: string[];
}

export function useProductBasedCalculations(productType: string) {
  const { products, isLoading } = useUnifiedProducts();
  const [fallbacksUsed, setFallbacksUsed] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Filtrar produtos por tipo
  const filteredProducts = useMemo(() => {
    if (!products.length) return {};

    switch (productType) {
      case 'shingle':
        return ProductCalculationService.getShingleProducts(products);
      case 'solar':
        return ProductCalculationService.getSolarProducts(products);
      case 'battery':
        return ProductCalculationService.getBatteryProducts(products);
      case 'drywall':
        return ProductCalculationService.getDrywallProducts(products);
      default:
        return {};
    }
  }, [products, productType]);

  // Validar se produtos necessários existem
  const validateProducts = useCallback((requiredCategories: string[]) => {
    const errors: string[] = [];
    const fallbacks: string[] = [];

    requiredCategories.forEach(category => {
      const categoryProducts = filteredProducts[category];
      if (!categoryProducts || categoryProducts.length === 0) {
        errors.push(`Nenhum produto encontrado para categoria: ${category}`);
        fallbacks.push(`Usando valores padrão para ${category}`);
      }
    });

    setValidationErrors(errors);
    setFallbacksUsed(fallbacks);

    return errors.length === 0;
  }, [filteredProducts]);

  // Buscar produto específico com fallback
  const findProductWithFallback = useCallback((
    category: string, 
    criteria?: (product: UnifiedProduct) => boolean,
    fallbackSpecs?: ProductCalculationSpecs
  ) => {
    const categoryProducts = filteredProducts[category] || [];
    
    let product = criteria 
      ? categoryProducts.find(criteria)
      : categoryProducts[0];

    if (!product && fallbackSpecs) {
      // Criar produto virtual com especificações fallback
      product = {
        id: `fallback-${category}`,
        name: `Produto Padrão - ${category}`,
        category: productType as any,
        unit: 'unidade',
        base_price: fallbackSpecs.yield_per_unit || 1,
        specifications: fallbackSpecs,
        is_active: true,
        created_at: new Date().toISOString(),
        source: 'products' as const
      };
      
      setFallbacksUsed(prev => [...prev, `Produto padrão usado para ${category}`]);
    }

    return product;
  }, [filteredProducts, productType]);

  // Calcular quantidades baseado em produtos reais
  const calculateQuantities = useCallback((
    calculations: {
      [category: string]: {
        totalArea?: number;
        totalPower?: number;
        customQuantity?: number;
        wasteFactor?: number;
      };
    }
  ) => {
    const quantities: { [productId: string]: number } = {};
    const costs: { [productId: string]: number } = {};

    Object.entries(calculations).forEach(([category, calc]) => {
      const categoryProducts = filteredProducts[category] || [];
      
      categoryProducts.forEach(product => {
        let quantity = 0;

        if (calc.customQuantity !== undefined) {
          quantity = calc.customQuantity;
        } else if (calc.totalArea) {
          quantity = ProductCalculationService.calculateQuantityFromSpecs(
            calc.totalArea,
            product,
            calc.wasteFactor || 1.0
          );
        } else if (calc.totalPower) {
          const specs = ProductCalculationService.getProductSpecs(product);
          const productPower = specs.power_rating || 1;
          quantity = Math.ceil(calc.totalPower / productPower);
        }

        if (quantity > 0) {
          quantities[product.id] = quantity;
          costs[product.id] = quantity * product.base_price;
        }
      });
    });

    return { quantities, costs };
  }, [filteredProducts]);

  // Calcular custo de mão de obra
  const calculateLaborCost = useCallback((
    laborConfig: LaborCostConfig,
    totalArea?: number,
    systemPower?: number
  ) => {
    if (!laborConfig.includeLabor) return 0;

    // Custo customizado tem prioridade
    if (laborConfig.customLaborCost) {
      return laborConfig.customLaborCost;
    }

    // Custo por m² para produtos baseados em área
    if (laborConfig.laborCostPerM2 && totalArea) {
      return laborConfig.laborCostPerM2 * totalArea;
    }

    // Custo por kWp para sistemas de energia
    if (systemPower && (productType === 'solar' || productType === 'battery')) {
      const costPerKwp = productType === 'solar' ? 2000 : 1500;
      return systemPower * costPerKwp;
    }

    return 0;
  }, [productType]);

  // Função principal de cálculo
  const calculateWithProducts = useCallback((
    input: any,
    requiredCategories: string[]
  ): ProductBasedCalculationResult => {
    // Validar produtos necessários
    const hasValidProducts = validateProducts(requiredCategories);

    // Calcular quantidades baseado no input específico
    // Esta lógica será implementada especificamente para cada calculadora
    const { quantities, costs } = calculateQuantities({});

    // Calcular mão de obra
    const laborCost = calculateLaborCost(
      input.laborConfig || { includeLabor: false },
      input.totalArea,
      input.systemPower
    );

    const totalMaterialCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

    return {
      products: filteredProducts,
      quantities,
      costs: {
        materials: costs,
        labor: laborCost,
        total: totalMaterialCost + laborCost
      },
      validationErrors,
      fallbacksUsed
    };
  }, [validateProducts, calculateQuantities, calculateLaborCost, filteredProducts, validationErrors, fallbacksUsed]);

  return {
    products: filteredProducts,
    isLoading,
    validateProducts,
    findProductWithFallback,
    calculateQuantities,
    calculateLaborCost,
    calculateWithProducts,
    validationErrors,
    fallbacksUsed
  };
}