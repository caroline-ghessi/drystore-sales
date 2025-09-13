import { useUnifiedProducts } from './useUnifiedProducts';
import { UnifiedProduct } from './useUnifiedProducts';

export interface MapeiProductsByType {
  systems: UnifiedProduct[];
  primers: UnifiedProduct[];
  accessories: UnifiedProduct[];
  floorPreparation: UnifiedProduct[];
}

export function useMapeiProducts() {
  const { 
    products: waterproofingProducts, 
    isLoading: isLoadingWaterproofing 
  } = useUnifiedProducts('impermeabilizacao_mapei');
  
  const { 
    products: floorProducts, 
    isLoading: isLoadingFloor 
  } = useUnifiedProducts('preparacao_piso_mapei');

  const allProducts = [...(waterproofingProducts || []), ...(floorProducts || [])];
  const isLoading = isLoadingWaterproofing || isLoadingFloor;

  const organizeProductsByType = (): MapeiProductsByType => {
    const systems = allProducts.filter(p => 
      p.name.includes('MAPELASTIC') || p.name.includes('AQUADEFENSE')
    );
    
    const primers = allProducts.filter(p => 
      p.name.includes('PRIMER') || p.name.includes('ECO PRIM')
    );
    
    const accessories = allProducts.filter(p => 
      p.name.includes('MAPEBAND') || p.name.includes('CORNER') || p.name.includes('MAPENET')
    );
    
    const floorPreparation = allProducts.filter(p => 
      p.name.includes('ULTRAPLAN') || p.name.includes('NOVOPLAN') || p.name.includes('PLANIPLAN')
    );

    return { systems, primers, accessories, floorPreparation };
  };

  const getSystemProduct = (systemType: string): UnifiedProduct | null => {
    const systemMapping: { [key: string]: string } = {
      'mapelastic': 'MAPELASTIC Kit 32kg',
      'mapelastic_smart': 'MAPELASTIC SMART Kit 30kg', 
      'mapelastic_foundation': 'MAPELASTIC FOUNDATION Kit 32kg',
      'aquadefense': 'AQUADEFENSE Balde 15kg'
    };
    
    const productName = systemMapping[systemType];
    if (!productName) return null;
    
    return allProducts.find(p => p.name === productName) || null;
  };

  const getPrimerProduct = (primerType: string): UnifiedProduct | null => {
    const primerMapping: { [key: string]: string } = {
      'PRIMER G': 'PRIMER G Galão 10kg',
      'ECO PRIM GRIP': 'ECO PRIM GRIP Balde 5kg',
      'PRIMER SN': 'PRIMER SN Galão 10kg'
    };
    
    const productName = primerMapping[primerType];
    if (!productName) return null;
    
    return allProducts.find(p => p.name === productName) || null;
  };

  const getAccessoryProduct = (accessoryType: string): UnifiedProduct | null => {
    const accessoryMapping: { [key: string]: string } = {
      'MAPEBAND': 'MAPEBAND Rolo 10m',
      'MAPEBAND_CORNER': 'MAPEBAND CORNER Peça',
      'MAPENET_150': 'MAPENET 150 Rolo 50m'
    };
    
    const productName = accessoryMapping[accessoryType];
    if (!productName) return null;
    
    return allProducts.find(p => p.name === productName) || null;
  };

  return {
    products: allProducts,
    productsByType: organizeProductsByType(),
    isLoading,
    hasProducts: allProducts.length > 0,
    getSystemProduct,
    getPrimerProduct,
    getAccessoryProduct
  };
}