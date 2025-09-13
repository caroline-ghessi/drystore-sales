import { WaterproofingMapeiInput, WaterproofingMapeiResult, QuantifiedItem } from '../../types/calculation.types';

// Climatic correction calculation helper
function calculateClimaticCorrection(conditions: WaterproofingMapeiInput['climaticConditions']): number {
  let correction = 1.0;
  
  // Temperature correction
  switch (conditions.temperature) {
    case 'baixa':  // < 10°C
      correction *= 1.08; // +8% (secagem lenta, retrabalho)
      break;
    case 'normal': // 10-25°C
      correction *= 1.00; // Normal
      break;
    case 'alta':   // > 30°C
      correction *= 1.12; // +12% (secagem rápida, desperdício)
      break;
  }
  
  // Humidity correction
  switch (conditions.humidity) {
    case 'baixa':  // < 40%
      correction *= 1.10; // +10% (secagem muito rápida)
      break;
    case 'normal': // 40-70%
      correction *= 1.00; // Normal
      break;
    case 'alta':   // > 70%
      correction *= 1.05; // +5% (secagem lenta)
      break;
  }
  
  // Wind correction
  switch (conditions.wind) {
    case 'sem_vento':
      correction *= 1.00; // Normal
      break;
    case 'brisa_leve':
      correction *= 1.03; // +3%
      break;
    case 'vento_forte':
      correction *= 1.15; // +15% (evaporação)
      break;
  }
  
  // Direct sun correction
  switch (conditions.directSun) {
    case 'sombra':
      correction *= 1.00; // Normal
      break;
    case 'sol_parcial':
      correction *= 1.05; // +5%
      break;
    case 'sol_pleno':
      correction *= 1.10; // +10%
      break;
  }
  
  return correction;
}

// Fórmula Universal MAPEI: QUANTIDADE = (Área × Consumo × Demãos × Fator_Correção) + Desperdício
export function calculateWaterproofingMapei(input: WaterproofingMapeiInput): WaterproofingMapeiResult {
  const {
    detailedDimensions,
    applicationEnvironment,
    substrateType,
    substrateCondition,
    surfaceRoughness,
    applicationMethod,
    climaticConditions,
    applicatorExperience,
    waterExposure,
    constructiveDetails,
    systemType = 'mapelastic',
    finalFinish,
    specialRequirements
  } = input;

  // CÁLCULO AUTOMÁTICO DE ÁREAS POR AMBIENTE (conforme manual MAPEI)
  const calculatedAreas = calculateAreasByEnvironment(detailedDimensions, applicationEnvironment);
  const calculatedPerimeter = calculatePerimeter(detailedDimensions, applicationEnvironment);

  // 1. FATOR DE CORREÇÃO DO SUBSTRATO (POROSIDADE)
  const substrateCorrectionFactors = {
    'concreto_novo': 1.20,         // Muito poroso +20%
    'concreto_velho': 1.10,        // Poroso normal +10%
    'alvenaria_reboco': 1.30,      // Muito poroso +20% + rugosidade
    'ceramica_existente': 1.00,    // Não poroso 0%
    'gesso_drywall': 1.40,         // Muito poroso +20% + absorção
    'osb_madeira': 1.50,           // Muito poroso +20% + fibras
    'contrapiso_cimenticio': 1.20  // Muito poroso +20%
  };

  // 2. FATOR DE CORREÇÃO DA RUGOSIDADE DA SUPERFÍCIE
  const surfaceRoughnessCorrectionFactors = {
    'muito_rugosa': 1.15,     // +15%
    'rugosidade_media': 1.10, // +10%
    'lisa': 1.05,             // +5%
    'polida': 1.00            // 0%
  };

  // 3. FATOR DE CORREÇÃO DO MÉTODO DE APLICAÇÃO
  const applicationMethodCorrectionFactors = {
    'projecao_mecanica': 1.30, // +30%
    'rolo': 1.10,              // +10%
    'trincha': 1.08,           // +8%
    'desempenadeira': 1.05     // +5%
  };

  // 4. FATOR DE CORREÇÃO CLIMÁTICA
  const climaticCorrection = calculateClimaticCorrection(climaticConditions);

  // 5. FATOR DE CORREÇÃO DA EXPERIÊNCIA DO APLICADOR
  const applicatorCorrectionFactors = {
    'primeira_vez': 1.15,      // Inexperiente +15%
    'condicoes_adversas': 1.10, // Condições adversas +10%
    'prazo_apertado': 1.08,    // Prazo apertado +8%
    'condicoes_ideais': 1.05   // Condições ideais +5%
  };

  // 6. FATOR DE CORREÇÃO DA CONDIÇÃO DO SUBSTRATO
  const substrateConditionCorrectionFactors = {
    'plano_nivelado': 1.00,        // Normal
    'pequenos_desniveis': 1.05,    // +5%
    'desniveis_medios': 1.10,      // +10%
    'grandes_desniveis': 1.15,     // +15%
    'fissuras_pequenas': 1.08,     // +8%
    'fissuras_grandes': 1.15,      // +15%
    'infiltracao_ativa': 1.12      // +12%
  };

  // 7. FATOR DE CORREÇÃO POR AMBIENTE
  const applicationEnvironmentCorrectionFactors = {
    'banheiro_residencial': 1.05,    // +5%
    'banheiro_coletivo': 1.10,       // +10%
    'cozinha_residencial': 1.08,     // +8%
    'cozinha_industrial': 1.15,      // +15%
    'sacada_varanda': 1.10,          // +10%
    'terraço_descoberto': 1.15,      // +15%
    'terraço_coberto': 1.10,         // +10%
    'piscina': 1.20,                 // +20%
    'reservatorio': 1.25,            // +25%
    'subsolo': 1.30,                 // +30%
    'garagem': 1.12,                 // +12%
    'floreiras': 1.18                // +18%
  };

  // 8. FATOR DE GEOMETRIA (detalhes construtivos)
  const geometryComplexity = calculateGeometryComplexity(constructiveDetails);
  
  // 9. FATOR FINAL DE CORREÇÃO - FÓRMULA COMPLETA DO MANUAL
  const substrateCorrection = substrateCorrectionFactors[substrateType];
  const roughnessCorrection = surfaceRoughnessCorrectionFactors[surfaceRoughness];
  const methodCorrection = applicationMethodCorrectionFactors[applicationMethod];
  const experienceCorrection = applicatorCorrectionFactors[applicatorExperience];
  const conditionCorrection = substrateConditionCorrectionFactors[substrateCondition];
  const environmentCorrection = applicationEnvironmentCorrectionFactors[applicationEnvironment];

  const finalCorrectionFactor = substrateCorrection * 
                               roughnessCorrection * 
                               methodCorrection * 
                               climaticCorrection * 
                               experienceCorrection * 
                               conditionCorrection *
                               environmentCorrection * 
                               geometryComplexity;

  // 10. ESPECIFICAÇÕES DO SISTEMA SELECIONADO
  const systemSpecs = getSystemSpecifications(systemType, waterExposure);

  // 11. CÁLCULO PRINCIPAL - Fórmula Universal
  const baseConsumption = systemSpecs.consumption; // kg/m²/mm
  const totalLayers = systemSpecs.layers;
  const thicknessPerLayer = systemSpecs.thicknessPerLayer; // mm
  
  // Quantidade = (Área × Consumo × Demãos × Fator) + 5% desperdício
  const calculatedQuantity = calculatedAreas.total * baseConsumption * totalLayers * finalCorrectionFactor;
  const quantityWithWaste = calculatedQuantity * 1.05; // +5% desperdício
  
  // 12. CÁLCULO DE ACESSÓRIOS
  const accessories = calculateAccessories(calculatedPerimeter, constructiveDetails, systemSpecs);

  // 13. CÁLCULO DE PRIMER (se necessário)
  const primer = calculatePrimer(calculatedAreas.total, substrateType, systemSpecs);

  // 14. GERAR LISTA QUANTIFICADA
  const quantified_items: QuantifiedItem[] = [];

  // Produto principal
  const mainProduct = systemSpecs.productInfo;
  const packagesNeeded = Math.ceil(quantityWithWaste / mainProduct.packageSize);
  quantified_items.push({
    name: mainProduct.name,
    description: `Sistema de impermeabilização ${systemType.toUpperCase()}`,
    quantity: packagesNeeded,
    unit: mainProduct.unit,
    unit_price: 0, // Será preenchido pelo sistema de preços
    total_price: 0,
    category: 'impermeabilizacao',
    specifications: {
      consumption: `${baseConsumption} kg/m²/mm`,
      layers: totalLayers,
      thickness: `${totalLayers * thicknessPerLayer}mm total`,
      correctionFactor: finalCorrectionFactor.toFixed(2),
      calculatedQuantity: `${calculatedQuantity.toFixed(1)} kg`,
      quantityWithWaste: `${quantityWithWaste.toFixed(1)} kg`
    }
  });

  // Primer (se necessário)
  if (primer.required && primer.product) {
    const primerPackages = Math.ceil(primer.quantity / primer.product.packageSize);
    quantified_items.push({
      name: primer.product.name,
      description: `Primer para ${systemType}`,
      quantity: primerPackages,
      unit: primer.product.unit,
      unit_price: 0,
      total_price: 0,
      category: 'primer',
      specifications: {
        consumption: `${primer.consumption} kg/m²`,
        dilution: primer.dilution || 'Puro',
        coverage: `${primer.coverage} m²`,
        requiredQuantity: `${primer.quantity.toFixed(1)} kg`
      }
    });
  }

  // Acessórios - MAPEBAND
  if (accessories.mapeband && (accessories.mapeband as any).quantity > 0) {
    quantified_items.push({
      name: 'MAPEBAND',
      description: 'Fita selante para juntas e detalhes',
      quantity: (accessories.mapeband as any).quantity,
      unit: 'rolo',
      unit_price: 0,
      total_price: 0,
      category: 'acessorio',
      specifications: {
        totalLength: `${(accessories.mapeband as any).totalLength}m`,
        rollSize: '10m por rolo'
      }
    });
  }

  // Validações
  const validationErrors = validateInputs(input);
  const recommendations = generateRecommendations(input, systemSpecs);

  return {
    quantified_items,
    totalMaterialCost: 0, // Será calculado pelo sistema de preços
    totalLaborCost: 0,
    totalCost: 0,
    systemSpecs: {
      systemType: systemSpecs.name,
      totalLayers,
      thicknessPerLayer,
      totalThickness: totalLayers * thicknessPerLayer,
      applicationMethod: systemSpecs.applicationMethod
    },
    correctionFactors: {
      substrate: substrateCorrection,
      surface: roughnessCorrection,
      application: environmentCorrection,
      geometry: geometryComplexity,
      method: methodCorrection,
      final: finalCorrectionFactor
    },
    accessories: {
      mapeband: {
        length: (accessories.mapeband as any)?.totalLength || 0,
        rolls: (accessories.mapeband as any)?.quantity || 0
      },
      corners: accessories.corners || 0,
      specialPieces: accessories.specialPieces || 0,
      masks: accessories.masks || 0
    },
    calculatedAreas: {
      floor: calculatedAreas.piso,
      wall: calculatedAreas.parede,
      total: calculatedAreas.total,
      perimeter: calculatedPerimeter
    },
    technicalSpecs: {
      coverage: `${calculatedAreas.total} m²`,
      consumptionBase: `${baseConsumption} kg/m²/mm`,
      layers: `${totalLayers} demãos de ${thicknessPerLayer}mm`,
      cureTime: systemSpecs.cureTime || '24-48h',
      walkTime: systemSpecs.walkTime || '3-4h'
    },
    validationErrors,
    recommendations
  };
}

// Geometry complexity calculation
function calculateGeometryComplexity(details: WaterproofingMapeiInput['constructiveDetails']): number {
  let complexity = 1.05; // Base complexity
  
  // Ralos
  const totalDrains = details.commonDrains + Math.ceil(details.linearDrains / 2);
  if (totalDrains <= 2) complexity *= 1.05;      // Simples
  else if (totalDrains <= 5) complexity *= 1.10; // Médio  
  else complexity *= 1.15;                        // Complexo

  // Colunas e obstáculos
  if (details.columns === 0) complexity *= 1.00;
  else if (details.columns <= 2) complexity *= 1.08;
  else complexity *= 1.12;

  // Tubulações passantes
  if (details.passingPipes <= 5) complexity *= 1.03;
  else complexity *= 1.08;

  // Juntas de dilatação
  if (details.expansionJoints > 0) complexity *= 1.05;

  return Math.min(complexity, 1.20); // Máximo 20% de acréscimo
}

// System specifications retrieval
function getSystemSpecifications(systemType: string, waterExposure: string) {
  const systems = {
    'mapelastic': {
      name: 'MAPELASTIC',
      consumption: 1.7, // kg/m²/mm
      layers: 2,
      thicknessPerLayer: 1.0, // mm
      applicationMethod: 'trincha_rolo',
      cureTime: '24h',
      walkTime: '3h',
      productInfo: {
        name: 'MAPELASTIC Kit 32kg',
        packageSize: 32,
        unit: 'kit'
      }
    },
    'mapelastic_smart': {
      name: 'MAPELASTIC SMART',
      consumption: 1.6,
      layers: 2,
      thicknessPerLayer: 1.25,
      applicationMethod: 'trincha_rolo',
      cureTime: '24h',
      walkTime: '3h',
      productInfo: {
        name: 'MAPELASTIC SMART Kit 30kg',
        packageSize: 30,
        unit: 'kit'
      }
    },
    'mapelastic_foundation': {
      name: 'MAPELASTIC FOUNDATION',
      consumption: 1.65,
      layers: 3,
      thicknessPerLayer: 1.0,
      applicationMethod: 'trincha_rolo',
      cureTime: '48h',
      walkTime: '4h',
      productInfo: {
        name: 'MAPELASTIC FOUNDATION Kit 32kg',
        packageSize: 32,
        unit: 'kit'
      }
    },
    'aquadefense': {
      name: 'AQUADEFENSE',
      consumption: 0.5, // kg/m² (2 demãos)
      layers: 2,
      thicknessPerLayer: 0.25,
      applicationMethod: 'rolo_trincha',
      cureTime: '2-4h',
      walkTime: '1h',
      productInfo: {
        name: 'AQUADEFENSE Balde 15kg',
        packageSize: 15,
        unit: 'balde'
      }
    }
  };

  return systems[systemType as keyof typeof systems] || systems.mapelastic;
}

// Accessory calculations  
function calculateAccessories(perimeter: number, details: WaterproofingMapeiInput['constructiveDetails'], systemSpecs: any) {
  const mapebandLength = calculateMapebandLength(perimeter, details);
  const mapebandRolls = Math.ceil(mapebandLength / 10); // Rolos de 10m

  return {
    mapeband: {
      totalLength: mapebandLength,
      quantity: mapebandRolls
    },
    corners: details.internalCorners + details.externalCorners,
    specialPieces: details.passingPipes + details.commonDrains,
    masks: details.commonDrains + details.passingPipes
  };
}

// MAPEBAND length calculation
function calculateMapebandLength(perimeter: number, details: WaterproofingMapeiInput['constructiveDetails']): number {
  let totalLength = perimeter;
  
  // Adicionar detalhes construtivos
  totalLength += details.commonDrains * 0.5;        // 0.5m por ralo
  totalLength += details.linearDrains;              // Comprimento linear
  totalLength += details.passingPipes * 0.3;       // 0.3m por tubo
  totalLength += details.expansionJoints * 2;      // Ambos lados da junta
  totalLength += (details.internalCorners + details.externalCorners) * 0.2; // Sobreposição cantos
  
  // Fator de sobreposição (15%)
  return totalLength * 1.15;
}

// Primer calculation
function calculatePrimer(area: number, substrateType: string, systemSpecs: any) {
  const primerRequirements = {
    'concreto_novo': { required: true, type: 'PRIMER G', consumption: 0.15, dilution: '1:3' },
    'concreto_velho': { required: true, type: 'PRIMER G', consumption: 0.15, dilution: '1:3' },
    'alvenaria_reboco': { required: true, type: 'PRIMER G', consumption: 0.20, dilution: '1:2' },
    'ceramica_existente': { required: true, type: 'ECO PRIM GRIP', consumption: 0.20, dilution: 'puro' },
    'gesso_drywall': { required: true, type: 'PRIMER G', consumption: 0.25, dilution: '1:1' },
    'osb_madeira': { required: true, type: 'PRIMER SN', consumption: 0.30, dilution: 'puro' },
    'contrapiso_cimenticio': { required: true, type: 'PRIMER G', consumption: 0.18, dilution: '1:3' }
  };

  const requirement = primerRequirements[substrateType as keyof typeof primerRequirements];
  
  if (!requirement?.required) {
    return { required: false, quantity: 0 };
  }

  const quantity = area * requirement.consumption * 1.1; // +10% margem
  
  return {
    required: true,
    type: requirement.type,
    consumption: requirement.consumption,
    dilution: requirement.dilution,
    quantity,
    coverage: area,
    product: {
      name: requirement.type,
      packageSize: requirement.type === 'ECO PRIM GRIP' ? 5 : 10,
      unit: requirement.type === 'ECO PRIM GRIP' ? 'balde' : 'galão'
    }
  };
}

// CÁLCULO AUTOMÁTICO DE ÁREAS POR AMBIENTE (conforme manual MAPEI)
function calculateAreasByEnvironment(dimensions: any, environment: string) {
  const { length, width, ceilingHeight, boxHeight, baseboard_height } = dimensions;
  const floorArea = length * width;
  let wallArea = 0;
  
  switch (environment) {
    case 'banheiro_residencial':
    case 'banheiro_coletivo':
      // Box: 3 lados × altura + Rodapé restante
      const boxPerimeter = (dimensions.boxWidth || 0.9) * 3; // 3 lados do box
      const boxWallArea = boxPerimeter * (boxHeight || 1.8);
      const remainingPerimeter = (2 * (length + width)) - (dimensions.boxWidth || 0.9);
      const baseboardArea = remainingPerimeter * (baseboard_height || 0.3);
      wallArea = boxWallArea + baseboardArea;
      break;
      
    case 'cozinha_industrial':
      // Rodapé 1m (norma sanitária)
      const kitchenPerimeter = 2 * (length + width);
      wallArea = kitchenPerimeter * 1.0;
      break;
      
    case 'cozinha_residencial':
      // Rodapé padrão
      const residentialKitchenPerimeter = 2 * (length + width);
      wallArea = residentialKitchenPerimeter * (baseboard_height || 0.3);
      break;
      
    case 'terraço_descoberto':
    case 'sacada_varanda':
      // Platibanda
      const terracePerimeter = 2 * (length + width);
      wallArea = terracePerimeter * (dimensions.parapetHeight || 0.5);
      break;
      
    case 'piscina':
      // Paredes por profundidade
      const poolPerimeter = 2 * (length + width);
      wallArea = poolPerimeter * (dimensions.averageDepth || 1.5);
      break;
      
    default:
      // Rodapé padrão para outros ambientes
      const defaultPerimeter = 2 * (length + width);
      wallArea = defaultPerimeter * (baseboard_height || 0.3);
  }
  
  return {
    piso: floorArea,
    parede: wallArea,
    total: floorArea + wallArea
  };
}

// CÁLCULO AUTOMÁTICO DE PERÍMETRO
function calculatePerimeter(dimensions: any, environment: string) {
  const { length, width } = dimensions;
  return 2 * (length + width);
}

// Input validation
function validateInputs(input: WaterproofingMapeiInput): string[] {
  const errors: string[] = [];
  
  if (!input.detailedDimensions.length || input.detailedDimensions.length <= 0) {
    errors.push('Comprimento deve ser maior que zero');
  }
  
  if (!input.detailedDimensions.width || input.detailedDimensions.width <= 0) {
    errors.push('Largura deve ser maior que zero');
  }
  
  if (input.applicationEnvironment.includes('banheiro') && 
      (!input.detailedDimensions.boxHeight || input.detailedDimensions.boxHeight <= 0)) {
    errors.push('Altura do box é obrigatória para banheiros');
  }
  
  if (input.applicationEnvironment === 'piscina' && 
      (!input.detailedDimensions.averageDepth || input.detailedDimensions.averageDepth <= 0)) {
    errors.push('Profundidade média é obrigatória para piscinas');
  }
  
  return errors;
}

// Recommendation generation
function generateRecommendations(input: WaterproofingMapeiInput, systemSpecs: any): string[] {
  const recommendations: string[] = [];
  
  // Recomendações por tipo de ambiente
  if (input.applicationEnvironment === 'piscina' || input.applicationEnvironment === 'reservatorio') {
    recommendations.push('Para áreas de imersão, considere proteção mecânica sobre a impermeabilização');
  }
  
  if (input.applicationEnvironment === 'subsolo') {
    recommendations.push('Em subsolos com pressão negativa, verifique drenagem e aplique FOUNDATION');
  }
  
  // Recomendações por substrato
  if (input.substrateType === 'ceramica_existente') {
    recommendations.push('Verificar aderência da cerâmica existente antes da aplicação');
  }
  
  // Recomendações climáticas
  if (input.climaticConditions.temperature === 'baixa') {
    recommendations.push('Temperatura baixa: Aumentar tempo de cura e evitar aplicação se <5°C');
  }
  
  if (input.climaticConditions.humidity === 'alta') {
    recommendations.push('Alta umidade: Garantir ventilação adequada durante aplicação');
  }
  
  return recommendations;
}