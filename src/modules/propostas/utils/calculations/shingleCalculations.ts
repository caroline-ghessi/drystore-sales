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

// Preços base por tipo de telha (R$/m²)
const SHINGLE_PRICES = {
  asphalt: 45,
  ceramic: 65,
  concrete: 35,
  metal: 85
};

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

export function calculateShingleInstallation(input: ShingleCalculationInput): ShingleCalculationResult {
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
  
  // 3. Calcular multiplicadores
  const regionalMultiplier = REGIONAL_MULTIPLIERS[region];
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
  
  // 5. CUSTOS
  const shingleUnitPrice = SHINGLE_PRICES[shingleType];
  const laborCostPerM2 = 25; // R$/m²
  const equipmentCostPerM2 = 5; // R$/m²
  
  const shinglesCost = shingleQuantity * shingleUnitPrice * 3 * totalMultiplier; // 3m² por fardo
  const osbCost = osbQuantity * 35 * totalMultiplier; // R$ 35 por placa
  const underlaymentCost = underlaymentQuantity * 180 * totalMultiplier; // R$ 180 por rolo
  const accessoriesCost = (ridgeCapQuantity * 45 + valleyQuantity * 25 + flashingQuantity * 15 + sealantQuantity * 12) * totalMultiplier;
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