import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AcousticMineralProduct {
  id: string;
  code: string;
  name: string;
  description?: string;
  base_price: number;
  cost: number;
  supplier?: string;
  specifications: any; // Use any for JSON field from Supabase
  is_active: boolean;
}

export function useAcousticMineralProducts() {
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['acoustic-mineral-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'forro_mineral_acustico')
        .eq('is_active', true)
        .order('base_price', { ascending: true });
      
      if (error) throw error;
      return data as AcousticMineralProduct[];
    }
  });

  const getProductByCode = (code: string) => {
    return products.find(p => p.code.toLowerCase().includes(code.toLowerCase()));
  };

  const getProductsBySpecification = (specs: { nrc?: number; humidity_resistance?: boolean; edge_type?: string }) => {
    return products.filter(product => {
      const productSpecs = product.specifications as any;
      if (specs.nrc && productSpecs?.nrc < specs.nrc) return false;
      if (specs.humidity_resistance !== undefined && 
          productSpecs?.humidity_resistance !== specs.humidity_resistance) return false;
      if (specs.edge_type && productSpecs?.edge_type !== specs.edge_type) return false;
      return true;
    });
  };

  const findBestModelForNeed = (need: 'acoustic' | 'humidity' | 'economy', requirement?: number) => {
    switch (need) {
      case 'acoustic':
        return products
          .filter(p => {
            const specs = p.specifications as any;
            return requirement ? (specs?.nrc || 0) >= requirement : true;
          })
          .sort((a, b) => {
            const aSpecs = a.specifications as any;
            const bSpecs = b.specifications as any;
            return (bSpecs?.nrc || 0) - (aSpecs?.nrc || 0);
          })[0];
      
      case 'humidity':
        return products
          .filter(p => {
            const specs = p.specifications as any;
            return specs?.humidity_resistance === true;
          })
          .sort((a, b) => {
            const aSpecs = a.specifications as any;
            const bSpecs = b.specifications as any;
            return (bSpecs?.nrc || 0) - (aSpecs?.nrc || 0);
          })[0];
      
      case 'economy':
        return products
          .sort((a, b) => a.base_price - b.base_price)[0];
      
      default:
        return products[0];
    }
  };

  return {
    products,
    isLoading,
    error,
    getProductByCode,
    getProductsBySpecification,
    findBestModelForNeed
  };
}