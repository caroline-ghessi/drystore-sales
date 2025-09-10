import { DrywallCalculationInput, DrywallCalculationResult, FaceMaterialType, WallConfigurationType } from '../../types/calculation.types';

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

// Configurações pré-definidas por caso de uso
const PRE_DEFINED_CONFIGS = {
  divisoria_escritorio: {
    face1Type: 'knauf_st' as FaceMaterialType,
    face2Type: 'knauf_st' as FaceMaterialType,
    wallConfiguration: 'W111' as WallConfigurationType,
    profileType: 'M70' as ('M48' | 'M70' | 'M90'),
    finishType: 'level_4' as ('level_3' | 'level_4' | 'level_5'),
    insulation: false,
    acousticBand: false,
    description: 'Divisória padrão para escritórios'
  },
  parede_banheiro: {
    face1Type: 'knauf_ru' as FaceMaterialType,
    face2Type: 'knauf_ru' as FaceMaterialType,
    wallConfiguration: 'W111' as WallConfigurationType,
    profileType: 'M70' as ('M48' | 'M70' | 'M90'),
    finishType: 'level_4' as ('level_3' | 'level_4' | 'level_5'),
    insulation: false,
    acousticBand: false,
    waterproofing: true,
    description: 'Parede resistente à umidade'
  },
  parede_tv: {
    face1Type: 'placo_performa' as FaceMaterialType,
    face2Type: 'knauf_st' as FaceMaterialType,
    wallConfiguration: 'W115' as WallConfigurationType,
    profileType: 'M90' as ('M48' | 'M70' | 'M90'),
    finishType: 'level_5' as ('level_3' | 'level_4' | 'level_5'),
    insulation: true,
    acousticBand: true,
    description: 'Parede para TV com reforço'
  },
  parede_rustica: {
    face1Type: 'knauf_st' as FaceMaterialType,
    face2Type: 'osb_15mm' as FaceMaterialType,
    wallConfiguration: 'W111_MIXED' as WallConfigurationType,
    profileType: 'M70' as ('M48' | 'M70' | 'M90'),
    finishType: 'level_3' as ('level_3' | 'level_4' | 'level_5'),
    insulation: false,
    acousticBand: false,
    osbFinish: 'verniz' as ('natural' | 'verniz' | 'tinta'),
    description: 'Parede com acabamento rústico'
  },
  parede_industrial: {
    face1Type: 'cimenticia_8mm' as FaceMaterialType,
    face2Type: 'cimenticia_8mm' as FaceMaterialType,
    wallConfiguration: 'W111_CEMENT' as WallConfigurationType,
    profileType: 'M90' as ('M48' | 'M70' | 'M90'),
    finishType: 'level_3' as ('level_3' | 'level_4' | 'level_5'),
    insulation: false,
    acousticBand: false,
    description: 'Parede para ambiente industrial'
  },
  parede_acustica: {
    face1Type: 'knauf_st' as FaceMaterialType,
    face2Type: 'knauf_st' as FaceMaterialType,
    wallConfiguration: 'W112' as WallConfigurationType,
    profileType: 'M90' as ('M48' | 'M70' | 'M90'),
    finishType: 'level_4' as ('level_3' | 'level_4' | 'level_5'),
    insulation: true,
    acousticBand: true,
    description: 'Parede com isolamento acústico'
  }
};

// Propriedades dos materiais por face
const FACE_MATERIALS = {
  knauf_st: { thickness: 12.5, weight: 9.5, screwType: 'standard', fireRating: 30 },
  knauf_ru: { thickness: 12.5, weight: 9.5, screwType: 'standard', fireRating: 30 },
  knauf_rf: { thickness: 12.5, weight: 9.8, screwType: 'standard', fireRating: 90 },
  placo_performa: { thickness: 12.5, weight: 9.8, screwType: 'standard', fireRating: 30 },
  placo_performa_ru: { thickness: 12.5, weight: 9.8, screwType: 'standard', fireRating: 30 },
  osb_11mm: { thickness: 11, weight: 6.5, screwType: 'wood', fireRating: 0 },
  osb_15mm: { thickness: 15, weight: 9.0, screwType: 'wood', fireRating: 0 },
  cimenticia_6mm: { thickness: 6, weight: 8.5, screwType: 'cement', fireRating: 120 },
  cimenticia_8mm: { thickness: 8, weight: 11.3, screwType: 'cement', fireRating: 120 },
  none: { thickness: 0, weight: 0, screwType: 'none', fireRating: 0 }
};

// Dados técnicos por configuração expandida
const WALL_CONFIGURATIONS = {
  W111: { faces: 2, reinforcement: false, baseThickness: 48 },
  W112: { faces: 2, reinforcement: false, baseThickness: 48, doubleLayer: true },
  W115: { faces: 2, reinforcement: true, baseThickness: 48 },
  W111_OSB: { faces: 2, reinforcement: false, baseThickness: 48 },
  W111_MIXED: { faces: 2, reinforcement: false, baseThickness: 48 },
  W111_CEMENT: { faces: 2, reinforcement: false, baseThickness: 48 },
  W112_OSB: { faces: 2, reinforcement: false, baseThickness: 48, doubleLayer: true },
  W112_MIXED: { faces: 2, reinforcement: false, baseThickness: 48, doubleLayer: true },
  W112_CEMENT: { faces: 2, reinforcement: false, baseThickness: 48, doubleLayer: true },
  ACOUSTIC: { faces: 2, reinforcement: false, baseThickness: 90, specialized: true },
  HUMID: { faces: 2, reinforcement: false, baseThickness: 48, specialized: true },
  FIRE: { faces: 2, reinforcement: true, baseThickness: 70, specialized: true },
  CUSTOM: { faces: 2, reinforcement: false, baseThickness: 48 }
};

// Performance acústica expandida
const ACOUSTIC_PERFORMANCE = {
  W111: { without_insulation: "38-40 dB", with_insulation: "44-46 dB" },
  W112: { without_insulation: "45-47 dB", with_insulation: "50-52 dB" },
  W115: { without_insulation: "42-44 dB", with_insulation: "48-50 dB" },
  W111_OSB: { without_insulation: "35-37 dB", with_insulation: "41-43 dB" },
  W111_MIXED: { without_insulation: "36-38 dB", with_insulation: "42-44 dB" },
  W111_CEMENT: { without_insulation: "40-42 dB", with_insulation: "46-48 dB" },
  W112_OSB: { without_insulation: "43-45 dB", with_insulation: "49-51 dB" },
  W112_MIXED: { without_insulation: "44-46 dB", with_insulation: "50-52 dB" },
  W112_CEMENT: { without_insulation: "47-49 dB", with_insulation: "53-55 dB" },
  ACOUSTIC: { without_insulation: "48-50 dB", with_insulation: "55-58 dB" },
  HUMID: { without_insulation: "38-40 dB", with_insulation: "44-46 dB" },
  FIRE: { without_insulation: "45-47 dB", with_insulation: "51-53 dB" },
  CUSTOM: { without_insulation: "35-45 dB", with_insulation: "41-51 dB" }
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
  // Aplicar configuração pré-definida se selecionada
  let resolvedInput = { ...input };
  if (input.configMode === 'predefined' && input.preDefinedConfig && input.preDefinedConfig !== 'custom') {
    const preConfig = PRE_DEFINED_CONFIGS[input.preDefinedConfig];
    resolvedInput = {
      ...input,
      face1Type: preConfig.face1Type,
      face2Type: preConfig.face2Type,
      wallConfiguration: preConfig.wallConfiguration,
      profileType: preConfig.profileType,
      finishType: preConfig.finishType,
      features: {
        ...input.features,
        insulation: preConfig.insulation,
        acousticBand: preConfig.acousticBand,
        waterproofing: (preConfig as any).waterproofing || false,
        osbFinish: (preConfig as any).osbFinish || undefined
      }
    };
  }

  const { 
    wallArea, 
    wallHeight, 
    wallConfiguration, 
    face1Type,
    face2Type,
    profileType,
    finishType,
    openings,
    features,
    laborIncluded,
    region 
  } = resolvedInput;

  // Cálculo de área líquida (descontando aberturas)
  const doorArea = openings.doors * 0.80 * 2.10;
  const windowArea = openings.windows * 1.20 * 1.00;
  const netWallArea = wallArea - doorArea - windowArea;

  // Configuração da parede
  const config = WALL_CONFIGURATIONS[wallConfiguration];
  const face1Material = FACE_MATERIALS[face1Type];
  const face2Material = FACE_MATERIALS[face2Type];
  
  // Calcular espessura final
  const profileThickness = profileType === 'M48' ? 48 : profileType === 'M70' ? 70 : 90;
  const finalThickness = profileThickness + face1Material.thickness + face2Material.thickness;
  
  // Peso por m²
  const weightPerM2 = face1Material.weight + face2Material.weight + 2.5; // 2.5kg estrutura

  // === CÁLCULOS DE QUANTIDADES POR MATERIAL ===
  
  // 1. Quantidades por tipo de material
  const face1Quantity = face1Type !== 'none' ? Math.ceil((netWallArea / 2.88) * 1.10) : 0;
  const face2Quantity = face2Type !== 'none' ? Math.ceil((netWallArea / 2.88) * 1.10) : 0;
  
  // Separar quantidades por tipo de material
  const plateQuantity = [face1Type, face2Type].filter(type => 
    type.startsWith('knauf_') || type.startsWith('placo_')
  ).length * Math.ceil((netWallArea / 2.88) * 1.10);
  
  const osbQuantity = [face1Type, face2Type].filter(type => 
    type.startsWith('osb_')
  ).length * Math.ceil((netWallArea / 2.88) * 1.10);
  
  const cementiciousQuantity = [face1Type, face2Type].filter(type => 
    type.startsWith('cimenticia_')
  ).length * Math.ceil((netWallArea / 2.88) * 1.10);
  
  // 2. Montantes (espaçamento 60cm + 1)
  const wallLength = netWallArea / wallHeight;
  const montanteCount = Math.ceil((wallLength / 0.60) + 1);
  const montanteQuantity = Math.ceil(montanteCount * wallHeight / 3.0); // barras de 3m
  
  // 3. Guias (superior + inferior)
  const guiaQuantity = Math.ceil((wallLength * 2) / 3.0); // barras de 3m
  
  // 4. Parafusos específicos por material
  const screw25mmQuantity = plateQuantity > 0 ? Math.ceil(netWallArea * 30 * (plateQuantity / Math.ceil((netWallArea / 2.88) * 1.10))) : 0;
  const screw35mmQuantity = (config as any).doubleLayer ? Math.ceil(netWallArea * 15) : 0;
  const screw13mmQuantity = Math.ceil(netWallArea * 8); // Metal-metal
  const screwWoodQuantity = osbQuantity > 0 ? Math.ceil(netWallArea * 25 * (osbQuantity / Math.ceil((netWallArea / 2.88) * 1.10))) : 0;
  const screwCementQuantity = cementiciousQuantity > 0 ? Math.ceil(netWallArea * 20 * (cementiciousQuantity / Math.ceil((netWallArea / 2.88) * 1.10))) : 0;
  
  // 5. Massa e fita (apenas para placas de gesso)
  const drywallFaces = [face1Type, face2Type].filter(type => 
    type.startsWith('knauf_') || type.startsWith('placo_')).length;
  const massQuantity = netWallArea * 0.50 * (drywallFaces / 2);
  const tapeQuantity = netWallArea * 2.50 * (drywallFaces / 2);
  
  // 7. Materiais especiais
  const calculatedWallLength = netWallArea / wallHeight;
  
  let insulationQuantity = 0;
  if (features.insulation) {
    insulationQuantity = Math.ceil((netWallArea * 0.95) / 15);
  }
  
  let acousticBandQuantity = 0;
  if (features.acousticBand) {
    acousticBandQuantity = calculatedWallLength * 2;
  }
  
  let waterproofingQuantity = 0;
  if (features.waterproofing) {
    waterproofingQuantity = netWallArea * 2; // 2 demãos
  }
  
  let osbFinishQuantity = 0;
  if (features.osbFinish && osbQuantity > 0) {
    osbFinishQuantity = netWallArea * (osbQuantity > 0 ? 1 : 0); // Área das faces OSB
  }
  
  let specialAnchorsQuantity = 0;
  if (face1Type.startsWith('placo_performa') || face2Type.startsWith('placo_performa')) {
    specialAnchorsQuantity = Math.ceil(netWallArea / 10); // Buchas especiais a cada 10m²
  }
  
  // === CÁLCULOS DE MÃO DE OBRA (HORAS) ===
  
  const totalFaces = (face1Type !== 'none' ? 1 : 0) + (face2Type !== 'none' ? 1 : 0);
  
  const laborHours = {
    structure: laborIncluded.structure ? netWallArea / 15 : 0,
    installation: laborIncluded.installation ? (netWallArea * totalFaces) / 18 : 0, // Ajustado para materiais diversos
    finishing: laborIncluded.finishing ? (netWallArea * drywallFaces) / 12 : 0, // Apenas faces de gesso
    insulation: (laborIncluded.insulation && features.insulation) ? netWallArea / 25 : 0,
    waterproofing: (laborIncluded.waterproofing && features.waterproofing) ? netWallArea / 30 : 0,
    osbFinishing: (laborIncluded.osbFinishing && features.osbFinish && osbQuantity > 0) ? netWallArea / 20 : 0
  };
  
  // === CÁLCULOS DE CUSTOS ===
  
  const regionalMultiplier = REGIONAL_MULTIPLIERS[region];
  
  // Custos de materiais (R$ 0,00 base - usuário define preços)
  const materialCosts = {
    plates: plateQuantity * 0,
    osb: osbQuantity * 0,
    cementicious: cementiciousQuantity * 0,
    profiles: (montanteQuantity + guiaQuantity) * 0,
    screws: (screw25mmQuantity + screw35mmQuantity + screw13mmQuantity + screwWoodQuantity + screwCementQuantity) * 0,
    mass: massQuantity * 0,
    tape: tapeQuantity * 0,
    insulation: insulationQuantity * 0,
    acousticBand: acousticBandQuantity * 0,
    waterproofing: waterproofingQuantity * 0,
    osbFinish: osbFinishQuantity * 0,
    specialAnchors: specialAnchorsQuantity * 0
  };
  
  // Custos de mão de obra
  const laborCosts = {
    structure: laborHours.structure * LABOR_COSTS.structure * regionalMultiplier,
    installation: laborHours.installation * LABOR_COSTS.installation * regionalMultiplier,
    finishing: laborHours.finishing * LABOR_COSTS.finishing[finishType] * regionalMultiplier,
    insulation: laborHours.insulation ? laborHours.insulation * LABOR_COSTS.insulation * regionalMultiplier : 0,
    waterproofing: laborHours.waterproofing ? laborHours.waterproofing * 15 * regionalMultiplier : 0, // R$15/m²
    osbFinishing: laborHours.osbFinishing ? laborHours.osbFinishing * 12 * regionalMultiplier : 0 // R$12/m²
  };
  
  const totalMaterialCost = Object.values(materialCosts).reduce((sum, cost) => sum + cost, 0);
  const totalLaborCost = Object.values(laborCosts).reduce((sum, cost) => sum + cost, 0);
  const totalCost = totalMaterialCost + totalLaborCost;
  
  // === DADOS TÉCNICOS EXPANDIDOS ===
  
  const fireResistance = Math.max(face1Material.fireRating, face2Material.fireRating);
  const configDescription = wallConfiguration.replace('_', ' ').toLowerCase();
  const recommendedUse = getRecommendedUse(face1Type, face2Type, features);
  
  const technicalData = {
    finalThickness,
    acousticPerformance: ACOUSTIC_PERFORMANCE[wallConfiguration]?.[features.insulation ? 'with_insulation' : 'without_insulation'],
    fireResistance: fireResistance > 0 ? `${fireResistance} minutos` : 'Não aplicável',
    weightPerM2,
    configuration: configDescription,
    face1Material: face1Type.replace('_', ' '),
    face2Material: face2Type.replace('_', ' '),
    recommendedUse
  };

  return {
    plateQuantity,
    osbQuantity: osbQuantity || undefined,
    cementiciousQuantity: cementiciousQuantity || undefined,
    montanteQuantity,
    guiaQuantity,
    screw25mmQuantity,
    screw35mmQuantity: screw35mmQuantity || undefined,
    screw13mmQuantity,
    screwWoodQuantity: screwWoodQuantity || undefined,
    screwCementQuantity: screwCementQuantity || undefined,
    
    // Massas separadas e campo legado
    jointMassQuantity: massQuantity * 0.4, // 40% para juntas  
    finishMassQuantity: massQuantity * 0.6, // 60% para acabamento
    massQuantity, // Campo legado
    tapeQuantity,
    insulationQuantity: insulationQuantity || undefined,
    acousticBandQuantity: acousticBandQuantity || undefined,
    waterproofingQuantity: waterproofingQuantity || undefined,
    osbFinishQuantity: osbFinishQuantity || undefined,
    specialAnchorsQuantity: specialAnchorsQuantity || undefined,
    
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

// Função auxiliar para determinar uso recomendado
function getRecommendedUse(face1: string, face2: string, features: any): string[] {
  const uses: string[] = [];
  
  if (face1.includes('ru') || face2.includes('ru') || features.waterproofing) {
    uses.push('Áreas úmidas');
  }
  if (face1.includes('rf') || face2.includes('rf')) {
    uses.push('Proteção contra fogo');
  }
  if (face1.includes('osb') || face2.includes('osb')) {
    uses.push('Acabamento rústico', 'Ambientes informais');
  }
  if (face1.includes('cimenticia') || face2.includes('cimenticia')) {
    uses.push('Ambientes industriais', 'Alta durabilidade');
  }
  if (face1.includes('performa') || face2.includes('performa')) {
    uses.push('Suporte para TV', 'Cargas pesadas');
  }
  if (features.insulation && features.acousticBand) {
    uses.push('Isolamento acústico');
  }
  
  if (uses.length === 0) {
    uses.push('Uso geral', 'Divisórias internas');
  }
  
  return uses;
}