import { ShingleCalculationInput, ShingleCalculationResult } from '../../types/calculation.types';

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


// Multiplicadores regionais
const REGIONAL_MULTIPLIERS = {
  north: 1.25,
  northeast: 1.15,
  center_west: 1.10,
  southeast: 1.0,
  south: 1.08
};

// Preços serão passados como parâmetro do sistema de produtos

// Rendimentos dos materiais
const MATERIAL_YIELDS = {
  shingleCoverage: 3.0,        // m² por fardo
  osbPlate: 2.88,             // m² por placa OSB
  underlaymentRoll: 50,       // m² por rolo
  nailsPerM2: 15,             // pregos por m²
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

export function calculateShingleInstallation(
  input: ShingleCalculationInput, 
  productPrices?: {
    shinglePrice?: number;
    osbPrice?: number; 
    underlaymentPrice?: number;
    laborCostPerM2?: number;
    equipmentCostPerM2?: number;
    accessoryPrices?: {
      ridgeCapPrice?: number;
      valleyPrice?: number;
      flashingPrice?: number;
      sealantPrice?: number;
    };
  }
): ShingleCalculationResult {
  const { 
    roofArea, 
    roofSlope, 
    shingleType,
    roofDetails,
    features,
    region
  } = input;
  
  // 1. Calcular área real com correção de inclinação
  const slopeFactor = getSlopeCorrectionFactor(roofSlope);
  const realArea = roofArea * slopeFactor;
  
  // 2. Aplicar fator de perdas padrão (12%)
  const wasteFactor = 1.12;
  const totalArea = realArea * wasteFactor;
  
  // Multiplicador regional fixado em 1.0 (uniformidade nacional)
  const regionalMultiplier = 1.0;
  const totalMultiplier = regionalMultiplier;
  
  // 4. QUANTIDADES DE MATERIAIS
  
  // Telhas principais (fardos)
  const shingleQuantity = Math.ceil(totalArea / MATERIAL_YIELDS.shingleCoverage);
  
  // Placas OSB
  const osbQuantity = Math.ceil(totalArea / MATERIAL_YIELDS.osbPlate * 1.05); // 5% adicional
  
  // Subcobertura (rolos)
  const underlaymentQuantity = Math.ceil(totalArea / MATERIAL_YIELDS.underlaymentRoll);
  
  // Telhas para cumeeiras
  const ridgeCapQuantity = Math.ceil(roofDetails.ridgeLength / 5); // 5m por fardo
  
  // Fita para águas furtadas
  const valleyQuantity = roofDetails.valleyLength;
  
  // Rufos (metros lineares)
  const flashingQuantity = roofDetails.perimeterLength;
  
  // Pregos (kg)
  const nailsQuantity = Math.ceil(totalArea * MATERIAL_YIELDS.nailsPerM2 / 1000); // converter para kg
  
  // Selante (tubos)
  const sealantQuantity = Math.ceil((roofDetails.ridgeLength + roofDetails.valleyLength) / 10);
  
  // Calhas (se incluídas)
  const gutterQuantity = features.gutters ? roofDetails.perimeterLength : undefined;
  
  // Isolamento (se incluído)
  const insulationQuantity = features.insulation ? totalArea : undefined;
  
  // Unidades de ventilação (se incluídas)
  const ventilationUnits = features.ventilation ? Math.ceil(totalArea / 50) : undefined;
  
  // 5. CUSTOS - Usar preços do sistema de produtos ou fallback
  const shinglePrice = productPrices?.shinglePrice || 40; // Fallback price
  const osbPrice = productPrices?.osbPrice || 35;
  const underlaymentPrice = productPrices?.underlaymentPrice || 180;
  const laborCostPerM2 = productPrices?.laborCostPerM2 || 25;
  const equipmentCostPerM2 = productPrices?.equipmentCostPerM2 || 5;
  
  const accessoryPrices = productPrices?.accessoryPrices || {
    ridgeCapPrice: 45,
    valleyPrice: 25, 
    flashingPrice: 15,
    sealantPrice: 12
  };
  
  const shinglesCost = shingleQuantity * shinglePrice * 3 * totalMultiplier; // 3m² por fardo
  const osbCost = osbQuantity * osbPrice * totalMultiplier;
  const underlaymentCost = underlaymentQuantity * underlaymentPrice * totalMultiplier;
  const accessoriesCost = (
    ridgeCapQuantity * accessoryPrices.ridgeCapPrice + 
    valleyQuantity * accessoryPrices.valleyPrice + 
    flashingQuantity * accessoryPrices.flashingPrice + 
    sealantQuantity * accessoryPrices.sealantPrice
  ) * totalMultiplier;
  const laborCost = totalArea * laborCostPerM2 * totalMultiplier;
  const equipmentCost = totalArea * equipmentCostPerM2;
  
  const itemizedCosts = {
    shingles: shinglesCost,
    osb: osbCost,
    underlayment: underlaymentCost,
    accessories: accessoriesCost,
    labor: laborCost,
    equipment: equipmentCost,
  };
  
  const totalCost = Object.values(itemizedCosts).reduce((sum, cost) => sum + cost, 0);
  
  return {
    // Material quantities
    shingleQuantity,
    osbQuantity,
    underlaymentQuantity,
    ridgeCapQuantity,
    startingStripQuantity: Math.ceil(roofDetails.perimeterLength / 6), // 6m por fardo
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