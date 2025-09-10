import { AcousticMineralCeilingInput, AcousticMineralCeilingResult, AcousticMineralCeilingModel, CeilingModulation, EdgeType } from '../../types/calculation.types';

// Base de dados dos modelos baseada no manual técnico
export const CEILING_MODELS = {
  ALCOR: {
    manufacturer: 'Hunter Douglas',
    modulations: ['625x625'] as CeilingModulation[],
    edgeType: 'tegular' as EdgeType,
    nrc: 0.90,
    rh: 90,
    weight: 2.8,
    platesPerBox: 10,
    costMultiplier: 1.8, // Premium
    suitableFor: ['auditorios', 'salas_reuniao', 'escritorios_executivos']
  },
  APUS: {
    manufacturer: 'Hunter Douglas', 
    modulations: ['600x1200'] as CeilingModulation[],
    edgeType: 'lay_in' as EdgeType,
    nrc: 0.70,
    rh: 90,
    weight: 3.2,
    platesPerBox: 10,
    costMultiplier: 1.6,
    suitableFor: ['escritorios', 'salas_comerciais', 'consultrios']
  },
  LUCIDA: {
    manufacturer: 'Hunter Douglas',
    modulations: ['625x1250'] as CeilingModulation[],
    edgeType: 'tegular' as EdgeType,
    nrc: 0.76,
    rh: 90,
    weight: 4.4,
    platesPerBox: 14,
    costMultiplier: 1.7,
    suitableFor: ['recepcoes', 'salas_vip', 'ambientes_corporativos']
  },
  NAVI: {
    manufacturer: 'Hunter Douglas',
    modulations: ['625x625'] as CeilingModulation[],
    edgeType: 'tegular' as EdgeType,
    nrc: 0.60,
    rh: 90,
    weight: 9.0,
    platesPerBox: 14,
    costMultiplier: 1.9, // Premium robusto
    suitableFor: ['areas_industriais', 'garagens', 'areas_tecnicas']
  },
  ADHARA: {
    manufacturer: 'Nacional',
    modulations: ['625x625', '625x1250'] as CeilingModulation[],
    edgeType: 'lay_in' as EdgeType,
    nrc: 0.55,
    rh: 90,
    weight: 3.34,
    platesPerBox: 12,
    costMultiplier: 0.9, // Economia
    suitableFor: ['corredores', 'areas_servico', 'depositos']
  },
  KYROS: {
    manufacturer: 'Nacional',
    modulations: ['625x625', '625x1250'] as CeilingModulation[],
    edgeType: 'tegular' as EdgeType,
    nrc: 0.70,
    rh: 90,
    weight: 5.38,
    platesPerBox: 10,
    costMultiplier: 1.2,
    suitableFor: ['escritorios', 'salas_reuniao', 'clinicas']
  },
  LYRA: {
    manufacturer: 'Nacional',
    modulations: ['625x625', '625x1250'] as CeilingModulation[],
    edgeType: 'lay_in' as EdgeType,
    nrc: 0.55,
    rh: 90,
    weight: 3.95,
    platesPerBox: 10,
    costMultiplier: 1.0,
    suitableFor: ['escritorios_basicos', 'salas_aula', 'comercio']
  },
  ECOMIN: {
    manufacturer: 'Knauf AMF',
    modulations: ['600x600', '600x1200'] as CeilingModulation[],
    edgeType: 'lay_in' as EdgeType,
    nrc: 0.55,
    rh: 70,
    weight: 3.0,
    platesPerBox: 8,
    costMultiplier: 0.8, // Mais econômico
    suitableFor: ['areas_secas', 'depositos', 'corredores']
  },
  THERMATEX: {
    manufacturer: 'Knauf AMF',
    modulations: ['600x600', '600x1200'] as CeilingModulation[],
    edgeType: 'lay_in' as EdgeType,
    nrc: 0.60,
    rh: 93,
    weight: 3.7,
    platesPerBox: 8,
    costMultiplier: 1.4,
    suitableFor: ['banheiros', 'cozinhas', 'areas_umidas']
  },
  TOPIQ_PRIME: {
    manufacturer: 'Knauf AMF',
    modulations: ['625x625', '625x1250', '600x600', '600x1200'] as CeilingModulation[],
    edgeType: 'tegular' as EdgeType,
    nrc: 0.90,
    rh: 100,
    weight: 2.4,
    platesPerBox: 10,
    costMultiplier: 2.0, // Premium máximo
    suitableFor: ['auditorios', 'home_theater', 'estudios', 'salas_cirurgia']
  }
} as const;

// Áreas das modulações (área real das placas)
export const MODULATION_AREAS = {
  '625x625': 0.38, // 618x618mm
  '625x1250': 0.77, // 618x1243mm  
  '600x600': 0.36, // 595x595mm
  '600x1200': 0.72 // 595x1195mm
} as const;

// Árvore de decisão para seleção automática
export function selectOptimalModel(input: AcousticMineralCeilingInput): AcousticMineralCeilingModel {
  // Se modelo manual selecionado, usar ele
  if (input.manualModel) {
    return input.manualModel;
  }

  // Árvore de decisão baseada no manual
  if (input.primaryNeed === 'humidity') {
    if (input.humidityLevel && input.humidityLevel > 90) {
      return 'TOPIQ_PRIME'; // ou THERMATEX
    } else {
      return 'THERMATEX'; // APUS, KYROS, LYRA também servem
    }
  }

  if (input.primaryNeed === 'acoustic') {
    if (input.nrcRequired && input.nrcRequired > 0.70) {
      return 'TOPIQ_PRIME'; // ALCOR, TOPIQ, APUS
    } else {
      return 'KYROS'; // LÚCIDA, KYROS
    }
  }

  if (input.primaryNeed === 'economy') {
    return 'ADHARA'; // ADHARA, LYRA, ECOMIN
  }

  // Premium por padrão
  return 'LUCIDA';
}

// Selecionar modulação otimizada
export function selectOptimalModulation(input: AcousticMineralCeilingInput, model: AcousticMineralCeilingModel): CeilingModulation {
  if (input.manualModulation) {
    return input.manualModulation;
  }

  const area = input.roomLength * input.roomWidth;
  const availableModulations = CEILING_MODELS[model].modulations;

  // Ambiente pequeno (<30m²): usar modulações pequenas
  if (area < 30) {
    if (availableModulations.includes('625x625')) return '625x625';
    if (availableModulations.includes('600x600')) return '600x600';
  }

  // Ambiente grande (>100m²): prefere modulações grandes
  if (area > 100) {
    if (availableModulations.includes('625x1250')) return '625x1250';
    if (availableModulations.includes('600x1200')) return '600x1200';
  }

  // Default: primeira modulação disponível
  return availableModulations[0];
}

// Calcular percentual de perda baseado no formato
export function calculateLossPercentage(format: AcousticMineralCeilingInput['roomFormat'], hasColumns: boolean): number {
  let basePercentage = 0;

  switch (format) {
    case 'rectangular': basePercentage = 5; break;
    case 'l_shape': basePercentage = 8; break;
    case 'irregular': basePercentage = 10; break;
    case 'multiple_rooms': basePercentage = 12; break;
  }

  // Adicional por colunas
  if (hasColumns) basePercentage += 4;

  return basePercentage;
}

// Função principal de cálculo
export function calculateAcousticMineralCeiling(input: AcousticMineralCeilingInput): AcousticMineralCeilingResult {
  // 1. Seleção do modelo e configuração
  const selectedModelName = selectOptimalModel(input);
  const modelData = CEILING_MODELS[selectedModelName];
  const selectedModulation = selectOptimalModulation(input, selectedModelName);
  const selectedEdgeType = input.manualEdgeType || input.edgeType || modelData.edgeType;

  // 2. Cálculos de área
  const totalArea = input.roomLength * input.roomWidth;
  
  // Área de obstáculos mais precisa
  let obstacleArea = 0;
  if (input.obstacles.columnDimensions?.length) {
    obstacleArea = input.obstacles.columnDimensions.reduce((sum, col) => sum + (col.width * col.depth), 0);
  } else {
    obstacleArea = input.obstacles.columns * 1; // 1m² por coluna estimado
  }
  
  // Adicionar área de recortes/aberturas
  const cutoutArea = input.cutoutArea || 0;
  
  const usefulArea = totalArea - obstacleArea - cutoutArea;
  
  // Perímetro: usar valor manual ou calculado
  const perimeter = input.roomPerimeter || (2 * (input.roomLength + input.roomWidth));

  // 3. Cálculo de placas
  const plateArea = MODULATION_AREAS[selectedModulation];
  const basePlateQuantity = Math.ceil(usefulArea / plateArea);
  const lossPercentage = calculateLossPercentage(input.roomFormat, input.obstacles.columns > 0);
  const totalPlates = Math.ceil(basePlateQuantity * (1 + lossPercentage / 100));
  const platesAfterLights = totalPlates - input.installations.lightFixtures;
  const boxesNeeded = Math.ceil(totalPlates / modelData.platesPerBox);

  // 4. Estrutura de sustentação (baseada no manual)
  
  // Perfil principal: 1,60m por m²
  const mainProfileMeters = usefulArea * 1.60;
  const mainProfileBars = Math.ceil(mainProfileMeters / 3.66);

  // Perfis secundários (dependem da modulação)
  let secondaryProfile1250, secondaryProfile625;
  
  if (selectedModulation === '625x1250' || selectedModulation === '600x1200') {
    // Para modulação retangular
    secondaryProfile1250 = {
      meters: usefulArea * 1.60,
      pieces: Math.ceil((usefulArea * 1.60) / 1.25)
    };
    secondaryProfile625 = {
      meters: usefulArea * 0.80,
      pieces: Math.ceil((usefulArea * 0.80) / 0.625)
    };
  } else {
    // Para modulação quadrada  
    secondaryProfile625 = {
      meters: usefulArea * 1.60,
      pieces: Math.ceil((usefulArea * 1.60) / 0.625)
    };
  }

  // Cantoneira perimetral: perímetro + 10%
  const perimeterEdgeMeters = perimeter * 1.10;
  const perimeterEdgeBars = Math.ceil(perimeterEdgeMeters / 3);

  // Sistema de suspensão: 1 tirante a cada 1,20m²
  const hangers = Math.ceil(usefulArea / 1.20);

  // 5. Acessórios especiais
  const accessories = {
    tegularClips: selectedEdgeType === 'tegular' ? Math.ceil((usefulArea / 100) * 20) : 0,
    lightSupports: input.installations.lightFixtures * 4,
    specialAnchors: Math.ceil(hangers * 0.1) // 10% de buchas especiais
  };

  // 6. Custos (preços base por região)
  const regionMultiplier = getRegionMultiplier(input.region);
  const basePlatePrice = 45; // R$ por m²
  const baseProfilePrice = 25; // R$ por metro
  const baseLaborPrice = 35; // R$ por m²

  const itemizedCosts = {
    plates: totalPlates * plateArea * basePlatePrice * modelData.costMultiplier * regionMultiplier,
    mainProfile: mainProfileMeters * baseProfilePrice * regionMultiplier,
    secondaryProfiles: ((secondaryProfile1250?.meters || 0) + (secondaryProfile625?.meters || 0)) * baseProfilePrice * regionMultiplier,
    perimeterEdge: perimeterEdgeMeters * baseProfilePrice * 0.8 * regionMultiplier,
    suspension: hangers * 15 * regionMultiplier, // R$ 15 por kit
    accessories: (accessories.tegularClips * 2) + (accessories.lightSupports * 8) + (accessories.specialAnchors * 25),
    labor: usefulArea * baseLaborPrice * regionMultiplier
  };

  const totalCost = Object.values(itemizedCosts).reduce((sum, cost) => sum + cost, 0);

  // 7. Performance acústica
  const acousticPerformance = {
    nrc: modelData.nrc,
    classification: (modelData.nrc >= 0.85 ? 'premium' : modelData.nrc >= 0.70 ? 'alta' : modelData.nrc >= 0.60 ? 'média' : 'baixa') as 'premium' | 'alta' | 'média' | 'baixa',
    suitableFor: [...modelData.suitableFor]
  };

  // 8. Validações automáticas
  const validations = {
    minSpaceOk: input.availableSpace >= 15,
    structureCompatible: true, // Sempre compatível com forros minerais
    modelSuitable: checkModelSuitability(selectedModelName, input),
    warnings: generateWarnings(input, selectedModelName, modelData)
  };

  return {
    selectedModel: {
      name: selectedModelName,
      manufacturer: modelData.manufacturer,
      modulation: selectedModulation,
      edgeType: selectedEdgeType,
      nrc: modelData.nrc,
      rh: modelData.rh,
      weight: modelData.weight,
      platesPerBox: modelData.platesPerBox
    },
    areas: {
      total: totalArea,
      obstacles: obstacleArea,
      cutouts: cutoutArea,
      useful: usefulArea,
      perimeter: perimeter
    },
    plates: {
      baseQuantity: basePlateQuantity,
      lossPercentage: lossPercentage,
      totalPlates: totalPlates,
      boxesNeeded: boxesNeeded,
      platesDiscountedLights: platesAfterLights
    },
    structure: {
      mainProfile: {
        meters: mainProfileMeters,
        bars: mainProfileBars
      },
      secondaryProfile1250,
      secondaryProfile625,
      perimeterEdge: {
        meters: perimeterEdgeMeters,
        bars: perimeterEdgeBars
      },
      suspension: {
        hangers: hangers,
        regulators: hangers,
        anchors: hangers
      }
    },
    accessories,
    itemizedCosts,
    totalCost,
    acousticPerformance,
    technicalSpecs: {
      configuration: `${selectedModulation} ${selectedEdgeType}`,
      finalThickness: 15, // Espessura padrão sistema mineral
      weight: modelData.weight,
      moistureResistance: modelData.rh,
      installationComplexity: selectedEdgeType === 'tegular' ? 'média' : 'simples'
    },
    validations
  };
}

// Funções auxiliares
function getRegionMultiplier(region: string): number {
  const multipliers = {
    'north': 1.15,
    'northeast': 1.10, 
    'center_west': 1.05,
    'southeast': 1.00,
    'south': 1.08
  };
  return multipliers[region as keyof typeof multipliers] || 1.00;
}

function checkModelSuitability(model: AcousticMineralCeilingModel, input: AcousticMineralCeilingInput): boolean {
  const modelData = CEILING_MODELS[model];
  
  // Verificar umidade se necessário
  if (input.primaryNeed === 'humidity' && input.humidityLevel) {
    return modelData.rh >= input.humidityLevel;
  }
  
  // Verificar acústica se necessário  
  if (input.primaryNeed === 'acoustic' && input.nrcRequired) {
    return modelData.nrc >= input.nrcRequired;
  }
  
  return true;
}

function generateWarnings(input: AcousticMineralCeilingInput, model: AcousticMineralCeilingModel, modelData: any): string[] {
  const warnings: string[] = [];
  
  if (input.availableSpace < 15) {
    warnings.push('Espaço disponível insuficiente. Mínimo 15cm necessário.');
  }
  
  if (input.primaryNeed === 'humidity' && modelData.rh < 90) {
    warnings.push('Modelo selecionado pode não ser adequado para alta umidade.');
  }
  
  if (input.obstacles.columns > 5) {
    warnings.push('Muitas colunas podem complicar a instalação.');
  }
  
  if (input.installations.lightFixtures > Math.floor(input.roomLength * input.roomWidth / 4)) {
    warnings.push('Densidade de luminárias muito alta. Verificar estrutura.');
  }
  
  return warnings;
}