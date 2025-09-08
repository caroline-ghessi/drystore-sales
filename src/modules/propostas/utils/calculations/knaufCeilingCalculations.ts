import { KnaufCeilingCalculationInput, KnaufCeilingCalculationResult } from '../../types/calculation.types';

// Fatores de consumo por m² (baseados no documento Knauf/Ananda)
const KNAUF_CONSUMPTION_FACTORS = {
  // Placas por m² (considerando área da placa)
  plates: {
    '1_20x2_40': 1 / 2.88, // = 0.347 placas/m²
    '1_20x1_80': 1 / 2.16, // = 0.463 placas/m²
    '1_20x2_50': 1 / 3.00, // = 0.333 placas/m²
  },
  
  // Perfis F530 - 2,20 ml por m²
  profilePerSqm: 2.20,
  
  // Tirantes e pendurais - 1,80 conjuntos por m²
  suspensionPerSqm: 1.80,
  
  // Parafusos
  plateScrewsPerSqm: 17, // parafusos 25mm
  profileScrewsPerSqm: 4, // parafusos 13mm
  
  // Acabamento
  mass: {
    powder: 0.35, // kg/m² massa em pó
    ready: 0.70,  // kg/m² massa pronta
  },
  fiber: 3.0, // ml/m² de fita
  
  // Isolamento opcional
  insulation: 1.05, // m²/m² (5% a mais para sobreposição)
};

// Perdas recomendadas (baseadas no documento)
const WASTE_FACTORS = {
  plates: 1.10,      // 10% de perda
  profiles: 1.05,    // 5% de perda
  screws: 1.20,      // 20% de perda
  mass: 1.10,        // 10% de perda
  fiber: 1.10,       // 10% de perda
  suspension: 1.05,  // 5% de perda
};

// Multiplicadores regionais e de complexidade
const REGIONAL_MULTIPLIERS = {
  north: 1.25,
  northeast: 1.15,
  center_west: 1.10,
  southeast: 1.0,
  south: 1.08
};

const COMPLEXITY_MULTIPLIERS = {
  low: 1.0,
  medium: 1.25,
  high: 1.50
};

const URGENCY_MULTIPLIERS = {
  normal: 1.0,
  express: 1.35
};

// Preços base (serão zero no banco, mas mantemos aqui para referência de cálculo)
const BASE_PRICES = {
  plates: {
    standard: 85,  // R$/m²
    ru: 95,        // R$/m²
    rf: 105,       // R$/m²
  },
  profileF530: 15,     // R$/ml
  suspension: 8,       // R$/conjunto
  tabica: 12,         // R$/ml
  screws25mm: 0.15,   // R$/unidade
  screws13mm: 0.12,   // R$/unidade
  anchors: 0.25,      // R$/unidade
  mass: {
    powder: 8,        // R$/kg
    ready: 12,        // R$/kg
  },
  fiber: {
    telada: 2.5,      // R$/ml
    papel: 2.8,       // R$/ml
  },
  insulation: {
    glass_wool: 18,   // R$/m²
    pet_wool: 22,     // R$/m²
  },
  accessories: {
    trapdoor: 180,    // R$/peça
    spotBox: 25,      // R$/peça
    acDiffuser: 85,   // R$/peça
  },
  labor: 35,          // R$/m²
};

export function calculateKnaufCeiling(input: KnaufCeilingCalculationInput): KnaufCeilingCalculationResult {
  const { 
    ceilingArea, 
    perimeter, 
    plateType, 
    plateDimension, 
    tabicaType, 
    massType, 
    fiberType,
    includeInsulation,
    insulationType = 'glass_wool',
    includeAccessories,
    accessoryQuantities = {},
    complexity,
    region,
    urgency
  } = input;

  // ===== CÁLCULO DE QUANTIDADES =====
  
  // 1. Placas
  const platesPerSqm = KNAUF_CONSUMPTION_FACTORS.plates[plateDimension];
  const rawPlateQuantity = ceilingArea * platesPerSqm;
  const plateQuantity = Math.ceil(rawPlateQuantity * WASTE_FACTORS.plates);
  
  // Área real das placas (pode ser maior que área do forro devido às perdas)
  const plateAreaMultiplier = {
    '1_20x2_40': 2.88,
    '1_20x1_80': 2.16,
    '1_20x2_50': 3.00,
  }[plateDimension];
  const plateArea = plateQuantity * plateAreaMultiplier;

  // 2. Perfis F530
  const profileQuantityRaw = ceilingArea * KNAUF_CONSUMPTION_FACTORS.profilePerSqm;
  const profileQuantity = profileQuantityRaw * WASTE_FACTORS.profiles;
  const profileBars = Math.ceil(profileQuantity / 3); // barras de 3m

  // 3. Sistema de Suspensão
  const suspensionSetsRaw = ceilingArea * KNAUF_CONSUMPTION_FACTORS.suspensionPerSqm;
  const suspensionSets = Math.ceil(suspensionSetsRaw * WASTE_FACTORS.suspension);

  // 4. Acabamento Perimetral
  const perimetralQuantity = perimeter;
  const perimetralBars = Math.ceil(perimetralQuantity / 3); // barras de 3m

  // 5. Parafusos
  const plateScrewsRaw = ceilingArea * KNAUF_CONSUMPTION_FACTORS.plateScrewsPerSqm;
  const plateScews = Math.ceil(plateScrewsRaw * WASTE_FACTORS.screws);
  
  const profileScrewsRaw = ceilingArea * KNAUF_CONSUMPTION_FACTORS.profileScrewsPerSqm;
  const profileScrews = Math.ceil(profileScrewsRaw * WASTE_FACTORS.screws);
  
  const anchors = suspensionSets; // 1 bucha por ponto de suspensão

  // 6. Acabamento
  const massQuantityRaw = ceilingArea * KNAUF_CONSUMPTION_FACTORS.mass[massType];
  const massQuantity = massQuantityRaw * WASTE_FACTORS.mass;
  
  const fiberQuantityRaw = ceilingArea * KNAUF_CONSUMPTION_FACTORS.fiber;
  const fiberQuantity = fiberQuantityRaw * WASTE_FACTORS.fiber;

  // 7. Isolamento (opcional)
  let insulationQuantity: number | undefined;
  if (includeInsulation) {
    insulationQuantity = ceilingArea * KNAUF_CONSUMPTION_FACTORS.insulation;
  }

  // 8. Acessórios
  let accessories: { trapdoors: number; spotBoxes: number; acDiffusers: number; } | undefined;
  if (includeAccessories && accessoryQuantities) {
    accessories = {
      trapdoors: accessoryQuantities.trapdoor || 0,
      spotBoxes: accessoryQuantities.spotBoxes || 0,
      acDiffusers: accessoryQuantities.acDiffusers || 0,
    };
  }

  // ===== CÁLCULO DE MULTIPLICADORES =====
  const regionalMultiplier = REGIONAL_MULTIPLIERS[region];
  const complexityMultiplier = COMPLEXITY_MULTIPLIERS[complexity];
  const urgencyMultiplier = URGENCY_MULTIPLIERS[urgency];
  const totalMultiplier = regionalMultiplier * complexityMultiplier * urgencyMultiplier;

  // ===== CÁLCULO DE CUSTOS =====
  const platePrice = BASE_PRICES.plates[plateType];
  const plateCost = plateArea * platePrice * totalMultiplier;
  
  const profileCost = profileQuantity * BASE_PRICES.profileF530 * totalMultiplier;
  
  const suspensionCost = suspensionSets * BASE_PRICES.suspension * totalMultiplier;
  
  const perimetralCost = perimetralQuantity * BASE_PRICES.tabica * totalMultiplier;
  
  const screwsCost = (plateScews * BASE_PRICES.screws25mm) + 
                     (profileScrews * BASE_PRICES.screws13mm) +
                     (anchors * BASE_PRICES.anchors);
  
  const massCost = massQuantity * BASE_PRICES.mass[massType];
  const fiberCost = fiberQuantity * BASE_PRICES.fiber[fiberType];
  const finishingCost = (massCost + fiberCost) * totalMultiplier;
  
  let insulationCost = 0;
  if (insulationQuantity && includeInsulation) {
    insulationCost = insulationQuantity * BASE_PRICES.insulation[insulationType] * totalMultiplier;
  }

  let accessoriesCost = 0;
  if (accessories) {
    accessoriesCost = (
      (accessories.trapdoors * BASE_PRICES.accessories.trapdoor) +
      (accessories.spotBoxes * BASE_PRICES.accessories.spotBox) +
      (accessories.acDiffusers * BASE_PRICES.accessories.acDiffuser)
    ) * totalMultiplier;
  }

  // Mão de obra
  const laborCost = ceilingArea * BASE_PRICES.labor * totalMultiplier;

  // ===== TEMPOS DE INSTALAÇÃO =====
  // Baseado na produtividade do documento: 20-30 m²/dia para estrutura + placas
  const baseInstallationDays = Math.ceil(ceilingArea / 25); // 25 m²/dia médio
  const installationTime = Math.max(1, baseInstallationDays * complexityMultiplier);
  
  // Horas de mão de obra (8 horas por dia, 2 pessoas)
  const laborHours = installationTime * 8 * 2;

  // ===== RESULTADO FINAL =====
  const itemizedCosts = {
    plates: plateCost,
    profiles: profileCost,
    suspension: suspensionCost,
    perimetral: perimetralCost,
    screws: screwsCost,
    finishing: finishingCost,
    insulation: includeInsulation ? insulationCost : undefined,
    accessories: includeAccessories ? accessoriesCost : undefined,
    labor: laborCost,
  };

  const totalCost = plateCost + profileCost + suspensionCost + perimetralCost + 
                   screwsCost + finishingCost + insulationCost + accessoriesCost + laborCost;

  return {
    plateQuantity,
    plateArea,
    profileQuantity,
    profileBars,
    suspensionSets,
    perimetralQuantity,
    perimetralBars,
    plateScews,
    profileScrews,
    anchors,
    massQuantity,
    fiberQuantity,
    insulationQuantity,
    accessories,
    laborHours,
    installationTime,
    itemizedCosts,
    totalCost,
  };
}