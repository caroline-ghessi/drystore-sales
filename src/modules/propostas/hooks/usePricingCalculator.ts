import { useState, useCallback } from 'react';
import { ProductType } from '../types/proposal.types';
import { CalculationResult } from '../types/calculation.types';
import { useProductPricing } from './useProductPricing';

interface PricedCalculationResult {
  // Include all calculation result properties
  totalCost: number;
  // Add pricing-specific properties
  pricedItems: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    category: string;
  }>;
  totalMaterialCost: number;
  totalProfit: number;
  finalPrice: number;
  appliedMultipliers: {
    regional: number;
    complexity: number;
    urgency: number;
    total: number;
  };
}

interface PricingInput {
  region: string;
  complexity: 'simple' | 'medium' | 'complex';
  urgency: 'normal' | 'urgent' | 'super_urgent';
  customMargin?: number;
}

export function usePricingCalculator(productType: ProductType) {
  const [pricedResult, setPricedResult] = useState<PricedCalculationResult | null>(null);
  const [isCalculatingPrices, setIsCalculatingPrices] = useState(false);
  
  const { calculatePricing, getPricingSuggestions, products } = useProductPricing(productType);

  // Map calculation results to actual products and prices
  const calculateFinalPricing = useCallback(async (
    calculationResult: CalculationResult,
    pricingInput: PricingInput
  ): Promise<PricedCalculationResult> => {
    setIsCalculatingPrices(true);
    
    try {
      // Get pricing suggestions based on region/complexity
      const suggestions = getPricingSuggestions(pricingInput.region, pricingInput.complexity);
      
      // Apply urgency multiplier
      const urgencyMultipliers = {
        'normal': 1.0,
        'urgent': 1.15,
        'super_urgent': 1.3
      };

      const finalMultiplier = suggestions.regionalMultiplier * 
                              suggestions.complexityMultiplier * 
                              urgencyMultipliers[pricingInput.urgency];

      const profitMargin = pricingInput.customMargin || 0.3;

      // Calculate pricing using the product pricing hook
      const pricingResult = calculatePricing(calculationResult, {
        regionalMultiplier: suggestions.regionalMultiplier,
        complexityMultiplier: suggestions.complexityMultiplier,
        urgencyMultiplier: urgencyMultipliers[pricingInput.urgency],
        profitMargin
      });

      // Create priced items based on product type
      let pricedItems: PricedCalculationResult['pricedItems'] = [];

      switch (productType) {
        case 'shingle': {
          const result = calculationResult as any;
          
          // Main shingles
          if (result.shingleQuantity && products.length > 0) {
            const shingleProduct = products.find(p => p.name.toLowerCase().includes('shingle'));
            if (shingleProduct) {
              pricedItems.push({
                id: 'shingles',
                name: 'Telhas Shingle',
                quantity: Math.ceil(result.shingleQuantity / 33), // bundles
                unit: 'fardo',
                unitPrice: shingleProduct.base_price * finalMultiplier * (1 + profitMargin),
                totalPrice: (Math.ceil(result.shingleQuantity / 33) * shingleProduct.base_price * finalMultiplier * (1 + profitMargin)),
                category: 'Cobertura'
              });
            }
          }

          // OSB/Plywood
          if (result.osbQuantity && products.length > 0) {
            const osbProduct = products.find(p => p.name.toLowerCase().includes('osb'));
            if (osbProduct) {
              pricedItems.push({
                id: 'osb',
                name: 'Placa OSB 15mm',
                quantity: result.osbQuantity,
                unit: 'placa',
                unitPrice: osbProduct.base_price * finalMultiplier * (1 + profitMargin),
                totalPrice: result.osbQuantity * osbProduct.base_price * finalMultiplier * (1 + profitMargin),
                category: 'Estrutura'
              });
            }
          }

          // Underlayment
          if (result.underlaymentArea && products.length > 0) {
            const underlaymentProduct = products.find(p => p.name.toLowerCase().includes('manta'));
            if (underlaymentProduct) {
              pricedItems.push({
                id: 'underlayment',
                name: 'Manta Asfáltica',
                quantity: result.underlaymentArea,
                unit: 'm²',
                unitPrice: underlaymentProduct.base_price * finalMultiplier * (1 + profitMargin),
                totalPrice: result.underlaymentArea * underlaymentProduct.base_price * finalMultiplier * (1 + profitMargin),
                category: 'Impermeabilização'
              });
            }
          }

          // Nails and accessories
          if (result.nailsKg && products.length > 0) {
            const nailsProduct = products.find(p => p.name.toLowerCase().includes('prego'));
            if (nailsProduct) {
              pricedItems.push({
                id: 'nails',
                name: 'Pregos Galvanizados',
                quantity: result.nailsKg,
                unit: 'kg',
                unitPrice: nailsProduct.base_price * finalMultiplier * (1 + profitMargin),
                totalPrice: result.nailsKg * nailsProduct.base_price * finalMultiplier * (1 + profitMargin),
                category: 'Fixação'
              });
            }
          }
          break;
        }

        case 'forro_drywall': {
          const result = calculationResult as any;
          
          // Drywall plates
          if (result.plateQuantity && products.length > 0) {
            const plateProduct = products.find(p => p.name.toLowerCase().includes('placa'));
            if (plateProduct) {
              pricedItems.push({
                id: 'plates',
                name: 'Placa Drywall 12,5mm',
                quantity: result.plateQuantity,
                unit: 'placa',
                unitPrice: plateProduct.base_price * finalMultiplier * (1 + profitMargin),
                totalPrice: result.plateQuantity * plateProduct.base_price * finalMultiplier * (1 + profitMargin),
                category: 'Fechamento'
              });
            }
          }

          // Metal profiles
          if (result.profileBars && products.length > 0) {
            const profileProduct = products.find(p => p.name.toLowerCase().includes('perfil'));
            if (profileProduct) {
              pricedItems.push({
                id: 'profiles',
                name: 'Perfis Metálicos',
                quantity: result.profileBars,
                unit: 'barra',
                unitPrice: profileProduct.base_price * finalMultiplier * (1 + profitMargin),
                totalPrice: result.profileBars * profileProduct.base_price * finalMultiplier * (1 + profitMargin),
                category: 'Estrutura'
              });
            }
          }

          // Screws and finishing
          if (result.screwsQuantity && products.length > 0) {
            const screwsProduct = products.find(p => p.name.toLowerCase().includes('parafuso'));
            if (screwsProduct) {
              pricedItems.push({
                id: 'screws',
                name: 'Parafusos Drywall',
                quantity: result.screwsQuantity,
                unit: 'pc',
                unitPrice: screwsProduct.base_price * finalMultiplier * (1 + profitMargin),
                totalPrice: result.screwsQuantity * screwsProduct.base_price * finalMultiplier * (1 + profitMargin),
                category: 'Fixação'
              });
            }
          }
          break;
        }

        default: {
          // Generic fallback for other product types
          pricedItems.push({
            id: 'generic',
            name: `Sistema ${productType}`,
            quantity: 1,
            unit: 'sistema',
            unitPrice: pricingResult.finalPrice,
            totalPrice: pricingResult.finalPrice,
            category: 'Sistema Completo'
          });
        }
      }

      const totalMaterialCost = pricingResult.materialCost;
      const totalProfit = pricingResult.profitAmount;
      const finalPrice = pricingResult.finalPrice;

      const pricedCalculationResult: PricedCalculationResult = {
        totalCost: (calculationResult as any).totalCost,
        pricedItems,
        totalMaterialCost,
        totalProfit,
        finalPrice,
        appliedMultipliers: pricingResult.appliedMultipliers
      };

      setPricedResult(pricedCalculationResult);
      return pricedCalculationResult;
      
    } finally {
      setIsCalculatingPrices(false);
    }
  }, [productType, calculatePricing, getPricingSuggestions, products]);

  const clearPricing = useCallback(() => {
    setPricedResult(null);
  }, []);

  return {
    pricedResult,
    isCalculatingPrices,
    calculateFinalPricing,
    clearPricing,
    availableProducts: products
  };
}