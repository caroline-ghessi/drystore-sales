import { WaterproofingMapeiInput, WaterproofingMapeiResult, QuantifiedItem } from '../../types/calculation.types';

// Fórmula Universal MAPEI: QUANTIDADE = (Área × Consumo × Demãos × Fator_Correção) + Desperdício
export function calculateWaterproofingMapei(input: WaterproofingMapeiInput): WaterproofingMapeiResult {
  const {
    areas,
    perimeter,
    applicationEnvironment,
    substrateType,
    substrateCondition,
    waterExposure,
    constructiveDetails,
    systemType = 'mapelastic',
    finalFinish,
    specialRequirements
  } = input;

  // 1. FATOR DE CORREÇÃO DO SUBSTRATO
  const substrateCorrectionFactors = {
    'concreto_novo': 1.20,         // +20%
    'concreto_velho': 1.10,        // +10%
    'alvenaria_reboco': 1.30,      // +30%
    'ceramica_existente': 1.00,    // 0%
    'gesso_drywall': 1.40,         // +40%
    'osb_madeira': 1.50,           // +50%
    'contrapiso_cimenticio': 1.25  // +25%
  };

  // 2. FATOR DE CORREÇÃO DA SUPERFÍCIE
  const surfaceCorrectionFactors = {
    'plano_nivelado': 1.05,        // +5%
    'pequenos_desniveis': 1.10,    // +10%
    'desniveis_medios': 1.15,      // +15%
    'grandes_desniveis': 1.20,     // +20%
    'fissuras_pequenas': 1.08,     // +8%
    'fissuras_grandes': 1.15,      // +15%
    'infiltracao_ativa': 1.12      // +12%
  };

  // 3. FATOR DE CORREÇÃO DE APLICAÇÃO POR AMBIENTE
  const applicationCorrectionFactors = {
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

  // 4. FATOR DE GEOMETRIA (detalhes construtivos)
  const geometryComplexity = calculateGeometryComplexity(constructiveDetails);
  
  // 5. FATOR FINAL DE CORREÇÃO
  const substrateCorrection = substrateCorrectionFactors[substrateType];
  const surfaceCorrection = surfaceCorrectionFactors[substrateCondition];
  const applicationCorrection = applicationCorrectionFactors[applicationEnvironment];
  const finalCorrectionFactor = substrateCorrection * surfaceCorrection * applicationCorrection * geometryComplexity;

  // 6. ESPECIFICAÇÕES DO SISTEMA SELECIONADO
  const systemSpecs = getSystemSpecifications(systemType, waterExposure);

  // 7. CÁLCULO PRINCIPAL - Fórmula Universal
  const baseConsumption = systemSpecs.consumption; // kg/m²/mm
  const totalLayers = systemSpecs.layers;
  const thicknessPerLayer = systemSpecs.thicknessPerLayer; // mm
  
  // Quantidade = (Área × Consumo × Demãos × Fator) + 5% desperdício
  const calculatedQuantity = areas.total * baseConsumption * totalLayers * finalCorrectionFactor;
  const quantityWithWaste = calculatedQuantity * 1.05; // +5% desperdício
  
  // 8. CÁLCULO DE ACESSÓRIOS
  const accessories = calculateAccessories(perimeter, constructiveDetails, systemSpecs);

  // 9. CÁLCULO DE PRIMER (se necessário)
  const primer = calculatePrimer(areas.total, substrateType, systemSpecs);

  // 10. GERAR LISTA QUANTIFICADA
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
      coverage: `${(packagesNeeded * mainProduct.packageSize / areas.total).toFixed(2)} kg/m²`
    }
  });

  // Primer (se necessário)
  if (primer.required && primer.product) {
    const primerPackages = Math.ceil(primer.quantity / primer.product.packageSize);
    quantified_items.push({
      name: primer.product.name,
      description: primer.product.description,
      quantity: primerPackages,
      unit: primer.product.unit,
      unit_price: 0,
      total_price: 0,
      category: 'preparacao',
      specifications: {
        consumption: `${primer.consumption} kg/m²`,
        dilution: primer.dilution,
        application: 'Aplicar antes da impermeabilização'
      }
    });
  }

  // Acessórios
  Object.entries(accessories).forEach(([accessoryType, accessoryData]) => {
    const accessory = accessoryData as any;
    if (accessory?.quantity > 0) {
      quantified_items.push({
        name: accessory.name,
        description: accessory.description,
        quantity: accessory.quantity,
        unit: accessory.unit,
        unit_price: 0,
        total_price: 0,
        category: 'acessorios',
        specifications: accessory.specifications || {}
      });
    }
  });

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
      surface: surfaceCorrection,
      application: applicationCorrection,
      geometry: geometryComplexity,
      method: 1.0, // Para futuras implementações
      final: finalCorrectionFactor
    },
    accessories: {
      mapeband: {
        length: (accessories.mapeband as any)?.totalLength || 0,
        rolls: (accessories.mapeband as any)?.quantity || 0
      },
      reinforcingFabric: (accessories.reinforcingFabric as any) ? {
        area: (accessories.reinforcingFabric as any).area,
        rolls: (accessories.reinforcingFabric as any).quantity
      } : undefined,
      corners: (accessories.corners as any)?.quantity || 0,
      specialPieces: (accessories.specialPieces as any)?.quantity || 0,
      masks: (accessories.masks as any)?.quantity || 0
    },
    technicalSpecs: {
      coverage: `${areas.total}m² em ${totalLayers} demãos`,
      consumptionBase: `${baseConsumption} kg/m²/mm`,
      layers: `${totalLayers} demãos de ${thicknessPerLayer}mm`,
      cureTime: systemSpecs.cureTime,
      walkTime: systemSpecs.walkTime
    },
    validationErrors: validateInputs(input),
    recommendations: generateRecommendations(input, systemSpecs)
  };
}

// Função auxiliar para calcular complexidade geométrica
function calculateGeometryComplexity(details: WaterproofingMapeiInput['constructiveDetails']): number {
  let complexityFactor = 1.05; // Base mínima

  // Ralos e dispositivos
  const totalDevices = details.commonDrains + details.grates + details.passingPipes;
  if (totalDevices <= 2) complexityFactor *= 1.00;
  else if (totalDevices <= 5) complexityFactor *= 1.08;
  else complexityFactor *= 1.15;

  // Cantos e juntas
  const totalLinearDetails = details.internalCorners + details.externalCorners + details.expansionJoints;
  if (totalLinearDetails > 10) complexityFactor *= 1.10;
  if (totalLinearDetails > 20) complexityFactor *= 1.15;

  // Colunas e obstáculos
  if (details.columns > 2) complexityFactor *= 1.12;
  if (details.columns > 5) complexityFactor *= 1.20;

  return Math.min(complexityFactor, 1.30); // Máximo 30% de correção
}

// Função auxiliar para especificações do sistema
function getSystemSpecifications(systemType: string, waterExposure: string) {
  const systems = {
    'mapelastic': {
      name: 'MAPELASTIC',
      consumption: 1.7, // kg/m²/mm
      layers: 2,
      thicknessPerLayer: 1, // mm
      applicationMethod: 'Trincha ou rolo',
      cureTime: '24-48h',
      walkTime: '12h',
      productInfo: {
        name: 'MAPELASTIC Kit 32kg',
        packageSize: 32,
        unit: 'kit'
      },
      needsReinforcement: false
    },
    'mapelastic_smart': {
      name: 'MAPELASTIC SMART',
      consumption: 1.6,
      layers: 2,
      thicknessPerLayer: 1.25,
      applicationMethod: 'Trincha com tela incorporada',
      cureTime: '24h',
      walkTime: '8h',
      productInfo: {
        name: 'MAPELASTIC SMART Kit 30kg',
        packageSize: 30,
        unit: 'kit'
      },
      needsReinforcement: true
    },
    'mapelastic_foundation': {
      name: 'MAPELASTIC FOUNDATION',
      consumption: 1.65,
      layers: 3,
      thicknessPerLayer: 1,
      applicationMethod: 'Trincha - múltiplas demãos',
      cureTime: '48-72h',
      walkTime: '24h',
      productInfo: {
        name: 'MAPELASTIC FOUNDATION Kit 32kg',
        packageSize: 32,
        unit: 'kit'
      },
      needsReinforcement: true
    },
    'aquadefense': {
      name: 'AQUADEFENSE',
      consumption: 0.5, // kg/m² total (2 demãos)
      layers: 2,
      thicknessPerLayer: 0.25,
      applicationMethod: 'Rolo de lã',
      cureTime: '12h',
      walkTime: '4h',
      productInfo: {
        name: 'AQUADEFENSE Balde 15kg',
        packageSize: 15,
        unit: 'balde'
      },
      needsReinforcement: true
    }
  };

  return systems[systemType as keyof typeof systems] || systems.mapelastic;
}

// Função auxiliar para cálculo de acessórios
function calculateAccessories(perimeter: number, details: WaterproofingMapeiInput['constructiveDetails'], systemSpecs: any) {
  const accessories: any = {};

  // MAPEBAND - Fita de vedação
  const mapebandLength = calculateMapebandLength(perimeter, details);
  const mapebandRolls = Math.ceil(mapebandLength / 10); // Rolos de 10m
  
  accessories.mapeband = {
    name: 'MAPEBAND',
    description: 'Fita de vedação para cantos e detalhes',
    quantity: mapebandRolls,
    unit: 'rolo 10m',
    totalLength: mapebandLength,
    specifications: {
      application: 'Cantos, ralos e tubulações',
      width: '10cm'
    }
  };

  // Tela de reforço (se necessário)
  if (systemSpecs.needsReinforcement) {
    const reinforcementArea = Math.ceil(details.commonDrains * 1.0 + details.linearDrains * 2.0); // m²
    if (reinforcementArea > 0) {
      accessories.reinforcingFabric = {
        name: systemSpecs.name.includes('SMART') ? 'MAPETEX SEL' : 'MAPENET 150',
        description: 'Tela de reforço para pontos críticos',
        quantity: Math.ceil(reinforcementArea / 50), // Rolos de 50m²
        unit: 'rolo 50m²',
        area: reinforcementArea
      };
    }
  }

  // Cantoneiras
  const totalCorners = details.internalCorners + details.externalCorners;
  if (totalCorners > 0) {
    accessories.corners = {
      name: 'Cantoneiras 90°',
      description: 'Cantoneiras para cantos internos e externos',
      quantity: Math.ceil(totalCorners / 0.2), // 20cm por canto
      unit: 'unidade'
    };
  }

  // Máscaras para dispositivos
  const totalDevices = details.commonDrains + details.grates + details.passingPipes;
  if (totalDevices > 0) {
    accessories.masks = {
      name: 'Máscaras para dispositivos',
      description: 'Máscaras para ralos e tubulações',
      quantity: totalDevices,
      unit: 'unidade'
    };
  }

  return accessories;
}

// Função auxiliar para cálculo do MAPEBAND
function calculateMapebandLength(perimeter: number, details: WaterproofingMapeiInput['constructiveDetails']): number {
  let totalLength = 0;
  
  // Perímetro base
  totalLength += perimeter;
  
  // Cantos (20cm cada)
  totalLength += (details.internalCorners + details.externalCorners) * 0.20;
  
  // Ralos (π × diâmetro + 20cm sobreposição)
  totalLength += details.commonDrains * (Math.PI * 0.10 + 0.20); // Ralo Ø100mm
  
  // Ralos lineares
  totalLength += details.linearDrains;
  
  // Tubulações (π × diâmetro estimado + 20cm)
  totalLength += details.passingPipes * (Math.PI * 0.05 + 0.20); // Tubo Ø50mm médio
  
  // Juntas de dilatação (ambos os lados)
  totalLength += details.expansionJoints * 2;
  
  // Fator de segurança 15%
  return totalLength * 1.15;
}

// Função auxiliar para cálculo de primer
function calculatePrimer(area: number, substrateType: string, systemSpecs: any) {
  const primerRequirements = {
    'concreto_novo': { required: true, type: 'primer_g', consumption: 0.15, dilution: '1:3' },
    'concreto_velho': { required: true, type: 'primer_g', consumption: 0.15, dilution: '1:3' },
    'alvenaria_reboco': { required: true, type: 'primer_g', consumption: 0.20, dilution: '1:1' },
    'ceramica_existente': { required: true, type: 'eco_prim_grip', consumption: 0.20, dilution: 'puro' },
    'gesso_drywall': { required: true, type: 'primer_g', consumption: 0.25, dilution: '1:1' },
    'osb_madeira': { required: true, type: 'primer_g', consumption: 0.30, dilution: '1:1' },
    'contrapiso_cimenticio': { required: true, type: 'primer_g', consumption: 0.18, dilution: '1:3' }
  };

  const requirement = primerRequirements[substrateType as keyof typeof primerRequirements];
  
  if (!requirement?.required) {
    return { required: false };
  }

  const totalQuantity = area * requirement.consumption * 1.1; // +10% segurança

  const products = {
    'primer_g': {
      name: 'PRIMER G',
      description: 'Primer penetrante para superfícies absorventes',
      packageSize: 5, // kg
      unit: 'galão'
    },
    'eco_prim_grip': {
      name: 'ECO PRIM GRIP',
      description: 'Primer aderente para superfícies não absorventes',
      packageSize: 5, // kg
      unit: 'galão'
    }
  };

  return {
    required: true,
    type: requirement.type,
    consumption: requirement.consumption,
    dilution: requirement.dilution,
    quantity: totalQuantity,
    product: products[requirement.type as keyof typeof products]
  };
}

// Função de validação
function validateInputs(input: WaterproofingMapeiInput): string[] {
  const errors: string[] = [];

  if (!input.areas?.total || input.areas.total <= 0) {
    errors.push('Área total deve ser maior que zero');
  }

  if (!input.perimeter || input.perimeter <= 0) {
    errors.push('Perímetro deve ser maior que zero');
  }

  if (input.areas.total > 0 && input.perimeter > 0) {
    const maxPerimeter = 4 * Math.sqrt(input.areas.total); // Perímetro máximo teórico
    if (input.perimeter > maxPerimeter * 2) {
      errors.push('Perímetro muito grande em relação à área - verificar medições');
    }
  }

  return errors;
}

// Função para gerar recomendações
function generateRecommendations(input: WaterproofingMapeiInput, systemSpecs: any): string[] {
  const recommendations: string[] = [];

  // Recomendações por tipo de ambiente
  if (input.applicationEnvironment === 'piscina') {
    recommendations.push('Para piscinas, recomendamos aplicação de proteção mecânica sobre a impermeabilização');
  }

  if (input.applicationEnvironment === 'subsolo') {
    recommendations.push('Em subsolos, verificar sistema de drenagem antes da aplicação');
  }

  // Recomendações por substrato
  if (input.substrateType === 'ceramica_existente') {
    recommendations.push('Fazer teste de aderência em área pequena antes da aplicação total');
  }

  // Recomendações climáticas
  recommendations.push('Evitar aplicação em dias chuvosos ou com umidade relativa acima de 80%');
  recommendations.push('Temperatura ideal de aplicação: entre 10°C e 30°C');

  return recommendations;
}