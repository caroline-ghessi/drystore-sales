import { DrywallCalculationInput, DrywallCalculationResult } from '../../types/calculation.types';

// Preços base de mão de obra (R$/m² ou R$/hora)
const LABOR_COSTS = {
  structure: 15.00,      // Montagem estrutura (R$/m²)
  installation: 20.00,   // Instalação 1ª face (R$/m²)
  secondFace: 18.00,     // Instalação 2ª face (R$/m²)
  finishing: {
    level_3: 25.00,      // Tratamento nível 3 (R$/m²)
    level_4: 35.00,      // Tratamento nível 4 (R$/m²)
    level_5: 45.00       // Tratamento nível 5 (R$/m²)
  },
  insulation: 8.00       // Aplicação isolamento (R$/m²)
};

// Multiplicadores regionais
const REGIONAL_MULTIPLIERS = {
  north: 1.25,
  northeast: 1.15,
  center_west: 1.10,
  southeast: 1.0,
  south: 1.08
};

// Dados técnicos por configuração
const WALL_CONFIGURATIONS = {
  W111: { // Parede simples
    platesPerFace: 1,
    thickness: { M48: 73, M70: 95, M90: 115 },
    weightPerM2: 19.0
  },
  W112: { // Parede dupla
    platesPerFace: 2,
    thickness: { M48: 98, M70: 120, M90: 140 },
    weightPerM2: 38.0
  },
  W115: { // Parede reforçada (+ OSB)
    platesPerFace: 1,
    thickness: { M48: 85, M70: 107, M90: 127 },
    weightPerM2: 27.0
  },
  mixed: { // Configuração mista
    platesPerFace: 1,
    thickness: { M48: 80, M70: 100, M90: 120 },
    weightPerM2: 25.0
  }
};

// Performance acústica por configuração
const ACOUSTIC_PERFORMANCE = {
  W111: {
    without_insulation: "38-40 dB",
    with_insulation: "44-46 dB"
  },
  W112: {
    without_insulation: "45-47 dB", 
    with_insulation: "50-52 dB"
  },
  W115: {
    without_insulation: "42-44 dB",
    with_insulation: "48-50 dB"
  }
};

// Resistência ao fogo
const FIRE_RESISTANCE = {
  knauf_st: "30 minutos",
  knauf_ru: "30 minutos", 
  knauf_rf: "60-90 minutos",
  placo_performa: "30 minutos",
  placo_performa_ru: "30 minutos"
};

export function calculateAdvancedDrywall(input: DrywallCalculationInput): DrywallCalculationResult {
  const { 
    wallArea, 
    wallHeight, 
    wallConfiguration, 
    plateType, 
    profileType,
    finishType,
    openings,
    features,
    laborIncluded,
    region 
  } = input;

  // Cálculo de área líquida (descontando aberturas)
  const doorArea = openings.doors * 0.80 * 2.10; // 0,80m × 2,10m
  const windowArea = openings.windows * 1.20 * 1.00; // 1,20m × 1,00m
  const netWallArea = wallArea - doorArea - windowArea;

  // Configuração da parede
  const config = WALL_CONFIGURATIONS[wallConfiguration];
  const faces = 2; // Sempre duas faces
  const platesPerM2 = config.platesPerFace * faces;

  // === CÁLCULOS DE QUANTIDADES ===
  
  // 1. Placas (seguindo documentação: área × faces ÷ 2,88 × 1,10)
  const plateQuantity = Math.ceil((netWallArea * platesPerM2) / 2.88 * 1.10);
  
  // 2. Montantes (espaçamento 60cm + 1)
  const wallLength = netWallArea / wallHeight;
  const montanteCount = Math.ceil((wallLength / 0.60) + 1);
  const montanteQuantity = Math.ceil(montanteCount * wallHeight / 3.0); // barras de 3m
  
  // 3. Guias (superior + inferior)
  const guiaQuantity = Math.ceil((wallLength * 2) / 3.0); // barras de 3m
  
  // 4. Parafusos
  const screw25mmQuantity = Math.ceil(netWallArea * 30 * platesPerM2); // 30 por m² por camada
  const screw35mmQuantity = wallConfiguration === 'W112' ? Math.ceil(netWallArea * 15) : 0; // Segunda camada
  const screw13mmQuantity = Math.ceil(netWallArea * 8); // Metal-metal
  
  // 5. Massa para juntas (0,50kg por m² dupla face)
  const massQuantity = netWallArea * 0.50 * (platesPerM2 / 2);
  
  // 6. Fita para juntas (2,50m por m² dupla face)
  const tapeQuantity = netWallArea * 2.50 * (platesPerM2 / 2);
  
  // 7. Isolamento (se selecionado)
  let insulationQuantity = 0;
  if (features.insulation) {
    insulationQuantity = Math.ceil((netWallArea * 0.95) / 15); // Rolos de 15m²
  }
  
  // 8. Banda acústica (se selecionada)
  let acousticBandQuantity = 0;
  if (features.acousticBand) {
    acousticBandQuantity = wallLength * 2; // Superior + inferior
  }
  
  // 9. Reforços para aberturas
  const doorReinforcements = openings.doors * 2; // 2 montantes por porta
  const windowReinforcements = openings.windows * 4; // 2 montantes + 2 guias por janela
  
  // === CÁLCULOS DE MÃO DE OBRA (HORAS) ===
  
  const laborHours = {
    structure: laborIncluded.structure ? netWallArea / 15 : 0, // 15 m²/dia = ~0,53h/m²
    installation: laborIncluded.installation ? (netWallArea * platesPerM2) / 20 : 0, // 20 m²/dia por face
    finishing: laborIncluded.finishing ? netWallArea / 12 : 0, // 12 m²/dia
    insulation: (laborIncluded.insulation && features.insulation) ? netWallArea / 25 : 0 // 25 m²/dia
  };
  
  // === CÁLCULOS DE CUSTOS ===
  
  const regionalMultiplier = REGIONAL_MULTIPLIERS[region];
  
  // Custos de materiais (R$ 0,00 base - usuário define preços)
  const materialCosts = {
    plates: plateQuantity * 0, // Preço definido pelo usuário
    profiles: (montanteQuantity + guiaQuantity) * 0, // Preço definido pelo usuário
    screws: (screw25mmQuantity + screw35mmQuantity + screw13mmQuantity) * 0,
    mass: massQuantity * 0,
    tape: tapeQuantity * 0,
    insulation: insulationQuantity * 0,
    acousticBand: acousticBandQuantity * 0,
    specialBuckets: plateType.includes('placo_performa') ? Math.ceil(netWallArea / 10) * 0 : 0 // Buchas especiais
  };
  
  // Custos de mão de obra
  const laborCosts = {
    structure: laborHours.structure * LABOR_COSTS.structure * regionalMultiplier,
    installation: laborHours.installation * LABOR_COSTS.installation * regionalMultiplier,
    finishing: laborHours.finishing * LABOR_COSTS.finishing[finishType] * regionalMultiplier,
    insulation: laborHours.insulation ? laborHours.insulation * LABOR_COSTS.insulation * regionalMultiplier : 0
  };
  
  const totalMaterialCost = Object.values(materialCosts).reduce((sum, cost) => sum + cost, 0);
  const totalLaborCost = Object.values(laborCosts).reduce((sum, cost) => sum + cost, 0);
  const totalCost = totalMaterialCost + totalLaborCost;
  
  // === DADOS TÉCNICOS ===
  
  const technicalData = {
    finalThickness: config.thickness[profileType],
    acousticPerformance: ACOUSTIC_PERFORMANCE[wallConfiguration]?.[features.insulation ? 'with_insulation' : 'without_insulation'],
    fireResistance: FIRE_RESISTANCE[plateType],
    weightPerM2: config.weightPerM2
  };

  return {
    plateQuantity,
    montanteQuantity,
    guiaQuantity,
    screw25mmQuantity,
    screw35mmQuantity: screw35mmQuantity || undefined,
    screw13mmQuantity,
    massQuantity,
    tapeQuantity,
    insulationQuantity: insulationQuantity || undefined,
    acousticBandQuantity: acousticBandQuantity || undefined,
    
    laborHours,
    
    itemizedCosts: {
      materials: materialCosts,
      labor: laborCosts
    },
    
    totalMaterialCost,
    totalLaborCost,
    totalCost,
    
    technicalData
  };
}