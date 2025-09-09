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

// Multiplicadores de complexidade do telhado (perdas)
const ROOF_COMPLEXITY_WASTE = {
  simple: 1.10,   // 10% de perdas
  medium: 1.12,   // 12% de perdas  
  complex: 1.15   // 15% de perdas
};

// Multiplicadores de urgência
const URGENCY_MULTIPLIERS = {
  normal: 1.0,
  express: 1.30
};

// Rendimentos dos materiais (conforme documentação)
const MATERIAL_YIELDS = {
  shingleBundle: 3.0,        // m² por fardo
  starterBundle: 6.0,        // metros lineares por fardo Supreme
  ridgeBundle: 5.0,          // metros lineares por fardo Supreme recortada (cap de cumeeira)
  osbPlate: 2.88,           // m² por placa (1,20m x 2,40m)
  underlaymentRoll87: 86.0,  // m² úteis (90% de 95,7m²)
  underlaymentRoll50: 54.0,  // m² úteis (90% de 60m²)
  nailsPerShingle: 4,        // pregos mínimos por telha
  nailsPerOsb: 50,          // pregos por placa OSB
  clampsPerRoll: 100,       // grampos por rolo de manta
};

// Cálculo da área de ventilação (regra 1/300)
const VENTILATION_RULE = {
  areaRatio: 1/300,         // 1m² de ventilação para cada 300m² de telhado
  aeratorNfva: 72,          // cm² NFVA por aerador
  ridgeNfva: 141,           // cm² NFVA por metro de cumeeira ventilada
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
    roofArea, roofSlope, roofComplexity, perimeter, ridgeLength, espigaoLength, 
    valleyLength, stepFlashingLength, stepFlashingHeight, ventilationRequired, 
    rufosIncluded, rufosPerimeter 
  } = input;
  
  // 1. Calcular área real com correção de inclinação
  const slopeFactor = getSlopeCorrectionFactor(roofSlope);
  const realArea = roofArea * slopeFactor;
  
  // 2. Aplicar fator de perdas conforme complexidade do telhado
  const wasteFactor = ROOF_COMPLEXITY_WASTE[roofComplexity];
  const totalArea = realArea * wasteFactor;
  
  // 3. Calcular multiplicador de urgência (único multiplicador mantido)
  const urgencyMultiplier = URGENCY_MULTIPLIERS[input.urgency || 'normal'];
  
  // 4. QUANTIDADES DE MATERIAIS
  
  // Telhas principais
  const shingleBundles = Math.ceil(totalArea / MATERIAL_YIELDS.shingleBundle);
  
  // Telhas Supreme para starter (primeira fiada)
  const starterBundles = Math.ceil(perimeter / MATERIAL_YIELDS.starterBundle);
  
  // Telhas para cumeeiras (não ventiladas - Supreme recortada)
  const ridgeBundles = Math.ceil(ridgeLength / MATERIAL_YIELDS.ridgeBundle);
  
  // Telhas para espigões (sempre Supreme recortada)
  const espigaoBundles = Math.ceil(espigaoLength / MATERIAL_YIELDS.ridgeBundle);
  
  // Total de fardos
  const totalShingleBundles = shingleBundles + starterBundles + ridgeBundles + espigaoBundles;
  
  // Placas OSB 11,1mm
  const osbPlates = Math.ceil(totalArea / MATERIAL_YIELDS.osbPlate * 1.05); // 5% adicional
  
  // Subcobertura (usar rolo de 87m como padrão)
  const underlaymentRolls = Math.ceil(totalArea / MATERIAL_YIELDS.underlaymentRoll87);
  
  // Águas furtadas - Fita Autoadesiva 0,91m × 10m
  const valleyRolls = valleyLength > 0 ? Math.ceil(valleyLength / 10) + 1 : 0;
  
  // Step Flashing - peças individuais 25cm × 18cm
  const stepFlashingPieces = stepFlashingLength > 0 && stepFlashingHeight > 0 
    ? Math.ceil((stepFlashingHeight / 0.14) * stepFlashingLength) 
    : 0;
  
  // Rufos - bobina de alumínio (opcional)
  const rufosMeters = rufosIncluded && rufosPerimeter 
    ? rufosPerimeter * 1.05 
    : undefined;
  
  // Pregos para telhas
  const totalShingles = Math.ceil(totalArea / 0.09); // cada telha cobre ~0,09m²
  const nailsForShingles = totalShingles * MATERIAL_YIELDS.nailsPerShingle;
  
  // Pregos para OSB
  const nailsForOsb = osbPlates * MATERIAL_YIELDS.nailsPerOsb;
  
  // Grampos para subcobertura
  const underlaymentClamps = underlaymentRolls * MATERIAL_YIELDS.clampsPerRoll;
  
  // Monopol Asfáltico - vedação geral
  let monopolAsphalticTubes = 0;
  if (valleyLength > 0) monopolAsphalticTubes += Math.ceil(valleyLength / 10);
  if (stepFlashingPieces > 0) monopolAsphalticTubes += Math.ceil(stepFlashingPieces / 20);
  if (rufosMeters) monopolAsphalticTubes += Math.ceil(rufosMeters / 15);
  monopolAsphalticTubes += Math.ceil((ridgeLength + espigaoLength) / 15); // cumeeiras e espigões
  
  // Ventilação (se solicitada)
  let ventilationAerators = 0;
  let ventilatedRidgeMeters = 0;
  
  if (ventilationRequired) {
    const ventilationAreaNeeded = totalArea * VENTILATION_RULE.areaRatio * 10000; // converter para cm²
    const exitVentilationNeeded = ventilationAreaNeeded / 2; // 50% saída
    
    // Calcular aeradores necessários
    ventilationAerators = Math.ceil(exitVentilationNeeded / VENTILATION_RULE.aeratorNfva);
    
    // Alternativa: metros de cumeeira ventilada
    ventilatedRidgeMeters = Math.ceil(exitVentilationNeeded / VENTILATION_RULE.ridgeNfva);
  }
  
  // 5. CUSTOS (preços base zerados - serão preenchidos posteriormente)
  const baseCosts = {
    shingles: 0,
    osb: 0,
    underlayment: 0,
    valleys: 0,
    stepFlashing: 0,
    rufos: rufosIncluded ? 0 : undefined,
    nails: 0,
    sealing: 0,
    ventilation: ventilationRequired ? 0 : undefined,
  };
  
  const totalCost = 0; // Será calculado quando os preços dos produtos forem definidos
  
  return {
    // Quantidades
    shingleBundles,
    starterBundles,
    ridgeBundles,
    espigaoBundles,
    totalShingleBundles,
    osbPlates,
    underlaymentRolls,
    valleyRolls,
    stepFlashingPieces,
    rufosMeters,
    nailsForShingles,
    nailsForOsb,
    underlaymentClamps,
    monopolAsphalticTubes,
    ventilationAerators,
    ventilatedRidgeMeters,
    
    // Custos
    itemizedCosts: baseCosts,
    totalCost,
  };
}