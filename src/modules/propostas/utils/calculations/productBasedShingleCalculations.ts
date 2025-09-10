import { ShingleCalculationInput, ShingleCalculationResult } from '../../types/calculation.types';
import { UnifiedProduct } from '../../hooks/useUnifiedProducts';
import { ProductCalculationService } from '../../services/productCalculationService';

// Correção por inclinação conforme documentação técnica
const SLOPE_CORRECTION_FACTORS = {
  17: 1.015,  // 17% (10°)
  25: 1.031,  // 25% (14°)
  30: 1.044,  // 30% (17°)
  35: 1.058,  // 35% (19°)
  40: 1.077,  // 40% (22°)
  45: 1.097,  // 45% (24°)
  50: 1.118,  // 50% (27°)
};

// Fallback para compatibilidade quando produtos não são encontrados
const FALLBACK_SPECS = {
  shingle: { coverage_area: 3.0, price: 40 },
  osb: { coverage_area: 2.88, price: 35 },
  rhinoroof: { coverage_area: 86, price: 180 },
  ridgeCap: { coverage_area: 5.0, price: 45 },
  accessories: { price_per_meter: 25 }
};

function getSlopeCorrectionFactor(slope: number): number {
  if (slope <= 17) return SLOPE_CORRECTION_FACTORS[17];
  if (slope <= 25) return SLOPE_CORRECTION_FACTORS[25];
  if (slope <= 30) return SLOPE_CORRECTION_FACTORS[30];
  if (slope <= 35) return SLOPE_CORRECTION_FACTORS[35];
  if (slope <= 40) return SLOPE_CORRECTION_FACTORS[40];
  if (slope <= 45) return SLOPE_CORRECTION_FACTORS[45];
  return SLOPE_CORRECTION_FACTORS[50];
}

export function calculateShingleWithProducts(
  input: ShingleCalculationInput,
  products: UnifiedProduct[]
): ShingleCalculationResult {
  const { 
    roofArea, 
    roofSlope, 
    shingleType,
    roofDetails,
    features,
    laborConfig
  } = input;
  
  // 1. Calcular área real com correção de inclinação
  const slopeFactor = getSlopeCorrectionFactor(roofSlope);
  const realArea = roofArea * slopeFactor;
  
  // 2. Aplicar fator de perdas padrão (12%)
  const wasteFactor = 1.12;
  const totalArea = realArea * wasteFactor;
  
  // 3. BUSCAR PRODUTOS REAIS DO CADASTRO
  const shingleProducts = ProductCalculationService.getShingleProducts(products);
  
  // Telhas principais - buscar por tipo
  const shingleProduct = shingleProducts.shingles?.find(p => 
    p.name.toLowerCase().includes(shingleType.toLowerCase())
  ) || shingleProducts.shingles?.[0];
  
  // Placa OSB
  const osbProduct = shingleProducts.osb?.[0];
  
  // Subcobertura RhinoRoof específica
  const underlaymentProduct = shingleProducts.underlayment || 
    products.find(p => p.code === 'SH-RHI-87');
  
  // Cumeeira
  const ridgeCapProduct = shingleProducts.ridgeCap?.[0];
  
  // 4. CALCULAR QUANTIDADES USANDO ESPECIFICAÇÕES DOS PRODUTOS
  
  // Telhas principais
  let shingleQuantity = 0;
  let shinglePrice = FALLBACK_SPECS.shingle.price;
  if (shingleProduct) {
    const specs = ProductCalculationService.getProductSpecs(shingleProduct);
    const coverage = specs.coverage_area || FALLBACK_SPECS.shingle.coverage_area;
    shingleQuantity = Math.ceil(totalArea / coverage);
    shinglePrice = shingleProduct.base_price;
  } else {
    shingleQuantity = Math.ceil(totalArea / FALLBACK_SPECS.shingle.coverage_area);
  }

  // Placas OSB
  let osbQuantity = 0;
  let osbPrice = FALLBACK_SPECS.osb.price;
  if (osbProduct) {
    const specs = ProductCalculationService.getProductSpecs(osbProduct);
    const coverage = specs.coverage_area || FALLBACK_SPECS.osb.coverage_area;
    osbQuantity = Math.ceil(totalArea / coverage * 1.05); // 5% adicional
    osbPrice = osbProduct.base_price;
  } else {
    osbQuantity = Math.ceil(totalArea / FALLBACK_SPECS.osb.coverage_area * 1.05);
  }

  // Subcobertura RhinoRoof
  let underlaymentQuantity = 0;
  let underlaymentPrice = FALLBACK_SPECS.rhinoroof.price;
  if (underlaymentProduct) {
    const specs = ProductCalculationService.getProductSpecs(underlaymentProduct);
    const coverage = specs.coverage_area || FALLBACK_SPECS.rhinoroof.coverage_area;
    underlaymentQuantity = Math.ceil(totalArea / coverage);
    underlaymentPrice = underlaymentProduct.base_price;
  } else {
    underlaymentQuantity = Math.ceil(totalArea / FALLBACK_SPECS.rhinoroof.coverage_area);
  }

  // Cumeeira
  let ridgeCapQuantity = 0;
  let ridgeCapPrice = FALLBACK_SPECS.ridgeCap.price;
  if (ridgeCapProduct) {
    const specs = ProductCalculationService.getProductSpecs(ridgeCapProduct);
    const coverage = specs.coverage_area || FALLBACK_SPECS.ridgeCap.coverage_area;
    ridgeCapQuantity = Math.ceil(roofDetails.ridgeLength / coverage);
    ridgeCapPrice = ridgeCapProduct.base_price;
  } else {
    ridgeCapQuantity = Math.ceil(roofDetails.ridgeLength / FALLBACK_SPECS.ridgeCap.coverage_area);
  }

  // Outros materiais (usando valores padrão por enquanto)
  const valleyQuantity = roofDetails.valleyLength;
  const flashingQuantity = roofDetails.perimeterLength;
  const nailsQuantity = Math.ceil(totalArea * 15 / 1000); // 15 pregos por m²
  const sealantQuantity = Math.ceil((roofDetails.ridgeLength + roofDetails.valleyLength) / 10);
  const startingStripQuantity = Math.ceil(roofDetails.perimeterLength / 6);

  // Materiais opcionais
  const gutterQuantity = features.gutters ? roofDetails.perimeterLength : undefined;
  const insulationQuantity = features.insulation ? totalArea : undefined;
  const ventilationUnits = features.ventilation ? Math.ceil(totalArea / 50) : undefined;

  // 5. CALCULAR CUSTOS
  const shinglesCost = shingleQuantity * shinglePrice;
  const osbCost = osbQuantity * osbPrice; 
  const underlaymentCost = underlaymentQuantity * underlaymentPrice;
  const accessoriesCost = (
    ridgeCapQuantity * ridgeCapPrice + 
    valleyQuantity * FALLBACK_SPECS.accessories.price_per_meter + 
    flashingQuantity * 15 + 
    sealantQuantity * 12
  );

  // Custos itemizados sem mão de obra automática
  const itemizedCosts = {
    shingles: shinglesCost,
    osb: osbCost,
    underlayment: underlaymentCost,
    accessories: accessoriesCost,
    labor: 0,
    equipment: 0, // Adicionado para compatibilidade
  };

  // Adicionar custo de mão de obra apenas se configurado
  if (laborConfig?.includeLabor) {
    const laborCost = laborConfig.customLaborCost || 
      (laborConfig.laborCostPerM2 ? laborConfig.laborCostPerM2 * totalArea : 0);
    itemizedCosts.labor = laborCost;
  }

  const totalCost = Object.values(itemizedCosts).reduce((sum, cost) => sum + cost, 0);

  return {
    // Material quantities
    shingleQuantity,
    osbQuantity,
    underlaymentQuantity,
    ridgeCapQuantity,
    startingStripQuantity,
    flashingQuantity,
    nailsQuantity,
    sealantQuantity,
    
    // Optional materials
    gutterQuantity,
    insulationQuantity,
    ventilationUnits,
    
    // Cost breakdown
    itemizedCosts,
    totalCost,
  };
}