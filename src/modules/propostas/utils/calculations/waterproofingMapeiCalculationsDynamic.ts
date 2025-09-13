import { WaterproofingMapeiInput, WaterproofingMapeiResult, QuantifiedItem } from '../../types/calculation.types';
import { UnifiedProduct } from '../../hooks/useUnifiedProducts';

// Recommend the best MAPEI system based on technical criteria
export function recommendMapeiSystem(input: WaterproofingMapeiInput): {
  recommendedSystem: string;
  score: number;
  reasons: string[];
  alternatives: Array<{ system: string; score: number; reason: string }>;
} {
  const systems = [
    { id: 'mapelastic', name: 'MAPELASTIC' },
    { id: 'mapelastic_smart', name: 'MAPELASTIC SMART' },
    { id: 'mapelastic_foundation', name: 'MAPELASTIC FOUNDATION' },
    { id: 'aquadefense', name: 'AQUADEFENSE' }
  ];

  const scores: { [key: string]: { score: number; reasons: string[] } } = {};

  systems.forEach(system => {
    scores[system.id] = { score: 0, reasons: [] };
  });

  // Environment-based scoring
  switch (input.applicationEnvironment) {
    case 'subsolo':
      scores.mapelastic_foundation.score += 50;
      scores.mapelastic_foundation.reasons.push('Especialmente desenvolvido para subsolos com pressão negativa');
      break;
    case 'terraço_descoberto':
      scores.mapelastic_smart.score += 40;
      scores.mapelastic_smart.reasons.push('Alta elasticidade ideal para terraços com movimentação térmica');
      scores.mapelastic.score += 20;
      break;
    case 'piscina':
      scores.mapelastic_foundation.score += 45;
      scores.mapelastic_foundation.reasons.push('Certificado para contato permanente com água');
      scores.mapelastic_smart.score += 30;
      break;
    case 'banheiro_residencial':
      scores.mapelastic.score += 35;
      scores.mapelastic.reasons.push('Sistema padrão confiável para banheiros residenciais');
      scores.aquadefense.score += 25;
      scores.aquadefense.reasons.push('Aplicação rápida e fácil para banheiros pequenos');
      break;
    case 'cozinha_industrial':
      scores.aquadefense.score += 30;
      scores.aquadefense.reasons.push('Aplicação rápida ideal para cozinhas industriais');
      scores.mapelastic.score += 25;
      break;
    default:
      scores.mapelastic.score += 20;
      break;
  }

  // Water exposure scoring
  switch (input.waterExposure) {
    case 'imersao_constante':
      scores.mapelastic_foundation.score += 40;
      scores.mapelastic_foundation.reasons.push('Certificado para contato permanente com água');
      break;
    case 'pressao_negativa':
      scores.mapelastic_foundation.score += 50;
      scores.mapelastic_foundation.reasons.push('Único sistema certificado para pressão negativa');
      break;
    case 'respingos_eventuais':
      scores.aquadefense.score += 30;
      scores.aquadefense.reasons.push('Solução prática para proteção contra respingos');
      break;
    case 'umidade_frequente':
      scores.mapelastic_smart.score += 35;
      scores.mapelastic_smart.reasons.push('Alta resistência à umidade constante');
      break;
  }

  // Find best system
  const bestSystem = Object.entries(scores).reduce((best, [systemId, data]) => {
    return data.score > best.score ? { systemId, ...data } : best;
  }, { systemId: 'mapelastic', score: 0, reasons: [] });

  // Generate alternatives
  const alternatives = Object.entries(scores)
    .filter(([systemId]) => systemId !== bestSystem.systemId)
    .map(([systemId, data]) => ({
      system: systemId,
      score: data.score,
      reason: data.reasons[0] || 'Sistema alternativo disponível'
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  return {
    recommendedSystem: bestSystem.systemId,
    score: bestSystem.score,
    reasons: bestSystem.reasons,
    alternatives
  };
}

// Calculate climatic correction factor
function calculateClimaticCorrection(conditions: WaterproofingMapeiInput['climaticConditions']): number {
  let correction = 1.0;
  
  // Temperature corrections
  const temp = parseFloat(conditions.temperature);
  if (!isNaN(temp)) {
    if (temp < 10) correction += 0.15;
    else if (temp > 35) correction += 0.10;
  }
  
  // Humidity corrections  
  const humidity = parseFloat(conditions.humidity);
  if (!isNaN(humidity)) {
    if (humidity > 80) correction += 0.08;
    else if (humidity < 40) correction += 0.05;
  }
  
  // Wind corrections
  const wind = parseFloat(conditions.wind);
  if (!isNaN(wind) && wind > 15) correction += 0.12;
  
  // Direct sun corrections
  if (conditions.directSun) correction += 0.10;
  
  return Math.min(correction, 1.5); // Cap at 50% increase
}

// Main calculation function with dynamic products
export function calculateWaterproofingMapeiWithProducts(
  input: WaterproofingMapeiInput, 
  products: UnifiedProduct[]
): WaterproofingMapeiResult {
  // Helper function to find product by name
  const findProduct = (productName: string): UnifiedProduct | null => {
    return products.find(p => p.name === productName) || null;
  };

  // Helper function to get system product
  const getSystemProduct = (systemType: string): UnifiedProduct | null => {
    const systemMapping: { [key: string]: string } = {
      'mapelastic': 'MAPELASTIC Kit 32kg',
      'mapelastic_smart': 'MAPELASTIC SMART Kit 30kg', 
      'mapelastic_foundation': 'MAPELASTIC FOUNDATION Kit 32kg',
      'aquadefense': 'AQUADEFENSE Balde 15kg'
    };
    
    const productName = systemMapping[systemType];
    return productName ? findProduct(productName) : null;
  };

  // Helper function to get primer product  
  const getPrimerProduct = (primerType: string): UnifiedProduct | null => {
    const primerMapping: { [key: string]: string } = {
      'PRIMER G': 'PRIMER G Galão 10kg',
      'ECO PRIM GRIP': 'ECO PRIM GRIP Balde 5kg',
      'PRIMER SN': 'PRIMER SN Galão 10kg'
    };
    
    const productName = primerMapping[primerType];
    return productName ? findProduct(productName) : null;
  };

  // Get system recommendation first
  const systemRecommendation = recommendMapeiSystem(input);
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
    systemType = systemRecommendation.recommendedSystem,
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

  // Get system specifications dynamically from products
  const systemProduct = getSystemProduct(systemType);
  const systemSpecs = getSystemSpecificationsDynamic(systemType, waterExposure, systemProduct);

  // Apply all correction factors
  const substrateCorrection = substrateCorrectionFactors[substrateType as keyof typeof substrateCorrectionFactors] || 1.0;
  const roughnessCorrection = getSurfaceRoughnessCorrection(surfaceRoughness);
  const methodCorrection = getApplicationMethodCorrection(applicationMethod);
  const climaticCorrection = calculateClimaticCorrection(climaticConditions);
  const experienceCorrection = getApplicatorExperienceCorrection(applicatorExperience);
  const conditionCorrection = getSubstrateConditionCorrection(substrateCondition);
  const environmentCorrection = getEnvironmentCorrection(applicationEnvironment);
  const geometryCorrection = calculateGeometryComplexity(constructiveDetails);

  // Calculate final quantity with all corrections
  const totalCorrectionFactor = substrateCorrection * roughnessCorrection * methodCorrection * 
                               climaticCorrection * experienceCorrection * conditionCorrection * 
                               environmentCorrection * geometryCorrection;

  const finalQuantity = calculatedAreas.total * systemSpecs.consumption * totalCorrectionFactor;
  const packagesNeeded = Math.ceil(finalQuantity / systemSpecs.productInfo.packageSize);

  // Calculate accessories dynamically
  const accessories = calculateAccessoriesDynamic(calculatedPerimeter, constructiveDetails, products);

  // Calculate primer dynamically
  const primer = calculatePrimerDynamic(calculatedAreas.total, substrateType, systemSpecs, products);

  // Build quantified items list with real prices
  const quantified_items: QuantifiedItem[] = [];

    // Main system product
    if (systemProduct) {
      quantified_items.push({
        name: systemSpecs.productInfo.name,
        description: `Sistema ${systemSpecs.name} - ${systemSpecs.layers} camadas`,
        quantity: packagesNeeded,
        unit: systemSpecs.productInfo.unit,
        unit_price: systemProduct.base_price,
        total_price: packagesNeeded * systemProduct.base_price,
        category: 'impermeabilizacao_mapei',
        specifications: {
          coverage: `${calculatedAreas.total.toFixed(1)}m²`,
          consumption: `${systemSpecs.consumption}kg/m²`,
          layers: systemSpecs.layers,
          correctionFactors: {
            substrate: substrateCorrection,
            surface: roughnessCorrection,
            application: methodCorrection,
            geometry: geometryCorrection,
            method: climaticCorrection,
            final: totalCorrectionFactor
          }
        }
      });
    }

    // Add accessories with real prices
    if (accessories.mapeband.quantity > 0) {
      const mapebandProduct = findProduct('MAPEBAND Rolo 10m');
      if (mapebandProduct) {
        quantified_items.push({
          name: 'MAPEBAND Rolo 10m',
          description: 'Fita de vedação para cantos e encontros',
          quantity: accessories.mapeband.quantity,
          unit: 'rolo',
          unit_price: mapebandProduct.base_price,
          total_price: accessories.mapeband.quantity * mapebandProduct.base_price,
          category: 'impermeabilizacao_mapei',
          specifications: {
            totalLength: `${accessories.mapeband.totalLength.toFixed(1)}m`,
            usage: 'Vedação de cantos e encontros'
          }
        });
      }
    }

    // Add primer with real prices
    if (primer.required && primer.quantity > 0) {
      const primerProduct = getPrimerProduct(primer.type);
      if (primerProduct) {
        const primerPackages = Math.ceil(primer.quantity / (primerProduct.specifications?.packageSize || 10));
        quantified_items.push({
          name: primerProduct.name,
          description: `Primer ${primer.type} - Preparação de substrato`,
          quantity: primerPackages,
          unit: primerProduct.unit,
          unit_price: primerProduct.base_price,
          total_price: primerPackages * primerProduct.base_price,
          category: 'preparacao_piso_mapei',
          specifications: {
            coverage: `${primer.coverage.toFixed(1)}m²`,
            consumption: `${primer.consumption}L/m²`,
            dilution: primer.dilution
          }
        });
      }
    }

  // Calculate totals
  const totalMaterialCost = quantified_items.reduce((sum, item) => sum + item.total_price, 0);
  const totalLaborCost = totalMaterialCost * 0.8; // 80% of material cost
  const totalCost = totalMaterialCost + totalLaborCost;

  // Validation
  const validationErrors = validateInputs(input);

  // Recommendations
  const recommendations = generateRecommendations(input, systemSpecs);

  return {
    quantified_items,
    totalMaterialCost,
    totalLaborCost,
    totalCost,
    calculatedAreas: {
      ...calculatedAreas,
      perimeter: calculatedPerimeter
    },
    systemSpecs: {
      systemType,
      totalLayers: systemSpecs.layers,
      thicknessPerLayer: systemSpecs.thicknessPerLayer,
      totalThickness: systemSpecs.layers * systemSpecs.thicknessPerLayer,
      applicationMethod: systemSpecs.applicationMethod
    },
    correctionFactors: {
      substrate: substrateCorrection,
      surface: roughnessCorrection,
      application: methodCorrection,
      geometry: geometryCorrection,
      method: climaticCorrection,
      final: totalCorrectionFactor
    },
    accessories: {
      mapeband: {
        length: accessories.mapeband.totalLength,
        rolls: accessories.mapeband.quantity
      }
    },
    technicalSpecs: {
      coverage: `${calculatedAreas.total.toFixed(1)}m²`,
      consumptionBase: `${systemSpecs.consumption}kg/m²`,
      layers: `${systemSpecs.layers} camadas`,
      cureTime: systemSpecs.cureTime,
      walkTime: systemSpecs.walkTime
    },
    systemRecommendation: systemRecommendation,
    validationErrors,
    recommendations
  };
}

// Dynamic system specifications using product data
function getSystemSpecificationsDynamic(systemType: string, waterExposure: string, product: UnifiedProduct | null) {
  const defaultSpecs = {
    'mapelastic': {
      name: 'MAPELASTIC',
      consumption: 1.7, // kg/m²/mm
      layers: 2,
      thicknessPerLayer: 1.0, // mm
      applicationMethod: 'trincha_rolo',
      cureTime: '24h',
      walkTime: '3h'
    },
    'mapelastic_smart': {
      name: 'MAPELASTIC SMART',
      consumption: 1.6,
      layers: 2,
      thicknessPerLayer: 1.25,
      applicationMethod: 'trincha_rolo',
      cureTime: '24h',
      walkTime: '3h'
    },
    'mapelastic_foundation': {
      name: 'MAPELASTIC FOUNDATION',
      consumption: 1.65,
      layers: 3,
      thicknessPerLayer: 1.0,
      applicationMethod: 'trincha_rolo',
      cureTime: '48h',
      walkTime: '4h'
    },
    'aquadefense': {
      name: 'AQUADEFENSE',
      consumption: 0.5, // kg/m² (2 demãos)
      layers: 2,
      thicknessPerLayer: 0.25,
      applicationMethod: 'rolo_trincha',
      cureTime: '2-4h',
      walkTime: '1h'
    }
  };

  const baseSpecs = defaultSpecs[systemType as keyof typeof defaultSpecs] || defaultSpecs.mapelastic;

  return {
    ...baseSpecs,
    productInfo: {
      name: product?.name || baseSpecs.name,
      packageSize: product?.specifications?.packageSize || getDefaultPackageSize(systemType),
      unit: product?.unit || getDefaultUnit(systemType)
    }
  };
}

// Helper functions for correction factors (keeping existing logic)
function getSurfaceRoughnessCorrection(roughness: string): number {
  const factors = {
    'muito_rugosa': 1.15,
    'rugosidade_media': 1.10,
    'lisa': 1.05,
    'polida': 1.00
  };
  return factors[roughness as keyof typeof factors] || 1.05;
}

function getApplicationMethodCorrection(method: string): number {
  const factors = {
    'projecao_mecanica': 1.30,
    'rolo': 1.10,
    'trincha': 1.08,
    'desempenadeira': 1.05
  };
  return factors[method as keyof typeof factors] || 1.08;
}

function getApplicatorExperienceCorrection(experience: string): number {
  const factors = {
    'primeira_vez': 1.15,
    'condicoes_adversas': 1.10,
    'prazo_apertado': 1.08,
    'condicoes_ideais': 1.05
  };
  return factors[experience as keyof typeof factors] || 1.08;
}

function getSubstrateConditionCorrection(condition: string): number {
  const factors = {
    'plano_nivelado': 1.00,
    'pequenos_desniveis': 1.05,
    'desniveis_significativos': 1.15,
    'muito_irregular': 1.25
  };
  return factors[condition as keyof typeof factors] || 1.05;
}

function getEnvironmentCorrection(environment: string): number {
  const factors = {
    'interno_seco': 1.00,
    'interno_umido': 1.05,
    'externo_coberto': 1.10,
    'externo_descoberto': 1.15,
    'subterraneo': 1.20
  };
  return factors[environment as keyof typeof factors] || 1.05;
}

function calculateGeometryComplexity(details: WaterproofingMapeiInput['constructiveDetails']): number {
  let complexity = 1.00;
  
  complexity += details.commonDrains * 0.02;
  complexity += details.linearDrains * 0.01;
  complexity += details.internalCorners * 0.005;
  complexity += details.externalCorners * 0.005;
  complexity += details.columns * 0.01;
  complexity += details.passingPipes * 0.005;
  complexity += details.expansionJoints * 0.01;
  
  return Math.min(complexity, 1.3);
}

// Dynamic accessories calculation
function calculateAccessoriesDynamic(perimeter: number, details: WaterproofingMapeiInput['constructiveDetails'], products: UnifiedProduct[]) {
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

function calculateMapebandLength(perimeter: number, details: WaterproofingMapeiInput['constructiveDetails']): number {
  let totalLength = perimeter;
  
  totalLength += details.commonDrains * 0.5;
  totalLength += details.linearDrains;
  totalLength += details.passingPipes * 0.3;
  totalLength += details.expansionJoints * 2;
  totalLength += (details.internalCorners + details.externalCorners) * 0.2;
  
  return totalLength * 1.15; // 15% overlap
}

// Dynamic primer calculation
function calculatePrimerDynamic(area: number, substrateType: string, systemSpecs: any, products: UnifiedProduct[]) {
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

  const quantity = area * requirement.consumption * 1.1; // +10% margin
  
  return {
    required: true,
    type: requirement.type,
    consumption: requirement.consumption,
    dilution: requirement.dilution,
    quantity,
    coverage: area
  };
}

// Area calculations (keeping existing logic)
function calculateAreasByEnvironment(dimensions: WaterproofingMapeiInput['detailedDimensions'], environment: string) {
  const { length, width, ceilingHeight, boxHeight, boxWidth, baseboard_height, parapetHeight } = dimensions;
  
  let floorArea = length * width;
  let wallArea = 0;
  
  switch (environment) {
    case 'banheiro_residencial':
      wallArea = (2 * length + 2 * width) * boxHeight;
      break;
    case 'cozinha_industrial':
      wallArea = (2 * length + 2 * width) * baseboard_height;
      break;
    case 'terraço_descoberto':
      wallArea = (2 * length + 2 * width) * parapetHeight;
      break;
    case 'piscina':
      wallArea = (2 * length + 2 * width) * ceilingHeight;
      break;
    default:
      wallArea = 0;
  }
  
  return {
    floor: floorArea,
    wall: wallArea,
    total: floorArea + wallArea
  };
}

function calculatePerimeter(dimensions: WaterproofingMapeiInput['detailedDimensions'], environment: string): number {
  const { length, width } = dimensions;
  return 2 * (length + width);
}

// Validation and recommendations (keeping existing logic)
function validateInputs(input: WaterproofingMapeiInput): string[] {
  const errors: string[] = [];
  
  if (input.detailedDimensions.length <= 0) {
    errors.push('Comprimento deve ser maior que zero');
  }
  
  if (input.detailedDimensions.width <= 0) {
    errors.push('Largura deve ser maior que zero');
  }
  
  return errors;
}

function generateRecommendations(input: WaterproofingMapeiInput, systemSpecs: any): string[] {
  const recommendations: string[] = [];
  
  const temp = parseFloat(input.climaticConditions.temperature);
  if (!isNaN(temp) && temp < 5) {
    recommendations.push('Temperatura muito baixa. Considere aquecer o ambiente antes da aplicação.');
  }
  
  const humidity = parseFloat(input.climaticConditions.humidity);
  if (!isNaN(humidity) && humidity > 85) {
    recommendations.push('Umidade muito alta. Aguarde condições mais secas para aplicação.');
  }
  
  return recommendations;
}

// Helper functions for default values
function getDefaultPackageSize(systemType: string): number {
  const sizes = {
    'mapelastic': 32,
    'mapelastic_smart': 30,
    'mapelastic_foundation': 32,
    'aquadefense': 15
  };
  return sizes[systemType as keyof typeof sizes] || 32;
}

function getDefaultUnit(systemType: string): string {
  const units = {
    'mapelastic': 'kit',
    'mapelastic_smart': 'kit',
    'mapelastic_foundation': 'kit',
    'aquadefense': 'balde'
  };
  return units[systemType as keyof typeof units] || 'kit';
}
