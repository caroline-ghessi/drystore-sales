import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ProductType } from '../types/proposal.types';
import { CalculationResult } from '../types/calculation.types';
import { Database } from '@/integrations/supabase/types';

type DatabaseProductCategory = Database['public']['Enums']['product_category'];

interface PricingConfig {
  regionalMultiplier: number;
  complexityMultiplier: number;
  urgencyMultiplier: number;
  profitMargin: number;
}

interface ProductPricing {
  id: string;
  name: string;
  category: DatabaseProductCategory;
  base_price: number;
  cost: number;
  unit: string;
}

const categoryMapping: Record<ProductType, DatabaseProductCategory> = {
  'solar': 'energia_solar',
  'solar_advanced': 'energia_solar',
  'shingle': 'telha_shingle', 
  'drywall': 'drywall_divisorias',
  'steel_frame': 'steel_frame',
  'ceiling': 'forros',
  'forro_drywall': 'forro_drywall',
  'battery_backup': 'battery_backup',
  'acoustic_mineral_ceiling': 'forro_mineral_acustico',
  'waterproofing_mapei': 'impermeabilizacao_mapei',
  'floor_preparation_mapei': 'preparacao_piso_mapei'
};

export function useProductPricing(productType: ProductType) {
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>({
    regionalMultiplier: 1.0, // Fixado para uniformidade nacional
    complexityMultiplier: 1.0,
    urgencyMultiplier: 1.0,
    profitMargin: 0.3 // 30% default margin
  });

  // Fetch products for the specific category
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['product-pricing', productType],
    queryFn: async () => {
      const category = categoryMapping[productType];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .eq('is_active', true);
      
      if (error) throw error;
      return data as ProductPricing[];
    }
  });

  // Calculate final pricing based on calculation results and products
  const calculatePricing = useCallback((
    calculationResult: CalculationResult,
    config?: Partial<PricingConfig>
  ) => {
    const finalConfig = { ...pricingConfig, ...config };
    const baseMultiplier = finalConfig.regionalMultiplier * 
                          finalConfig.complexityMultiplier * 
                          finalConfig.urgencyMultiplier;

    let totalMaterialCost = 0;
    const itemizedPrices: Record<string, number> = {};

    // Apply pricing logic based on product type
    switch (productType) {
      case 'shingle': {
        const result = calculationResult as any;
        
        // Find products by specific shingle type
        const oakridgeProduct = products.find(p => p.name.toLowerCase().includes('oakridge'));
        const supremeProduct = products.find(p => p.name.toLowerCase().includes('supreme'));
        const osbProduct = products.find(p => p.name.toLowerCase().includes('osb'));
        const underlaymentProduct = products.find(p => p.name.toLowerCase().includes('manta'));
        
        // Use shingle type from result to select correct product
        const selectedShingleProduct = result.shingleType === 'oakridge' ? oakridgeProduct : supremeProduct;
        
        if (selectedShingleProduct && result.shingleQuantity) {
          const shingleCost = (result.shingleQuantity * selectedShingleProduct.base_price) * baseMultiplier;
          itemizedPrices['shingles'] = shingleCost * (1 + finalConfig.profitMargin);
          totalMaterialCost += shingleCost;
        }

        if (osbProduct && result.osbQuantity) {
          const osbCost = (result.osbQuantity * osbProduct.base_price) * baseMultiplier;
          itemizedPrices['osb'] = osbCost * (1 + finalConfig.profitMargin);
          totalMaterialCost += osbCost;
        }

        if (underlaymentProduct && result.underlaymentQuantity) {
          const underlaymentCost = (result.underlaymentQuantity * underlaymentProduct.base_price) * baseMultiplier;
          itemizedPrices['underlayment'] = underlaymentCost * (1 + finalConfig.profitMargin);
          totalMaterialCost += underlaymentCost;
        }
        break;
      }

      case 'forro_drywall': {
        const result = calculationResult as any;
        
        // Find drywall products
        const plateProduct = products.find(p => p.name.toLowerCase().includes('placa') || p.name.toLowerCase().includes('drywall'));
        const profileProduct = products.find(p => p.name.toLowerCase().includes('perfil'));
        
        if (plateProduct && result.plateQuantity) {
          const plateCost = (result.plateQuantity * plateProduct.base_price) * baseMultiplier;
          itemizedPrices['plates'] = plateCost * (1 + finalConfig.profitMargin);
          totalMaterialCost += plateCost;
        }

        if (profileProduct && result.profileBars) {
          const profileCost = (result.profileBars * profileProduct.base_price) * baseMultiplier;
          itemizedPrices['profiles'] = profileCost * (1 + finalConfig.profitMargin);
          totalMaterialCost += profileCost;
        }
        break;
      }

      default: {
        // Generic pricing based on total cost
        const result = calculationResult as any;
        totalMaterialCost = (result.totalCost || 0) * baseMultiplier;
      }
    }

    const finalPrice = totalMaterialCost * (1 + finalConfig.profitMargin);

    return {
      materialCost: totalMaterialCost,
      finalPrice,
      itemizedPrices,
      appliedMultipliers: {
        regional: finalConfig.regionalMultiplier,
        complexity: finalConfig.complexityMultiplier,
        urgency: finalConfig.urgencyMultiplier,
        total: baseMultiplier
      },
      profitMargin: finalConfig.profitMargin,
      profitAmount: finalPrice - totalMaterialCost
    };
  }, [products, pricingConfig, productType]);

  // Get pricing suggestions without regional variations
  const getPricingSuggestions = useCallback((region: string, complexity: 'simple' | 'medium' | 'complex') => {
    const complexityMultipliers = {
      'simple': 1.0,
      'medium': 1.1,
      'complex': 1.25
    };

    return {
      regionalMultiplier: 1.0, // Uniformidade nacional
      complexityMultiplier: complexityMultipliers[complexity] || 1.0,
      urgencyMultiplier: 1.0
    };
  }, []);

  const availableProducts = useMemo(() => products, [products]);

  return {
    products: availableProducts,
    isLoading,
    pricingConfig,
    setPricingConfig,
    calculatePricing,
    getPricingSuggestions
  };
}