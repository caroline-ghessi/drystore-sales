import { FloorPreparationMapeiInput, FloorPreparationMapeiResult, QuantifiedItem } from '../../types/calculation.types';
import { UnifiedProduct } from '../../hooks/useUnifiedProducts';

// Cálculo de preparação de piso MAPEI - Com dados dinâmicos de produtos
export function calculateFloorPreparationMapeiWithProducts(
  input: FloorPreparationMapeiInput, 
  products: UnifiedProduct[]
): FloorPreparationMapeiResult {
  const {
    area,
    currentCondition,
    thicknessMeasurements,
    averageThickness,
    maxThickness,
    minThickness,
    preparationType,
    productType,
    baseSubstrate,
    primerRequired,
    primerType,
    primerDilution,
    slopeConfiguration,
    applicationConditions
  } = input;

  // 1. VALIDAR MEDIÇÕES E CALCULAR VOLUME
  const volumeCalculation = calculateVolume(area, thicknessMeasurements, averageThickness, preparationType, slopeConfiguration);

  // 2. ENCONTRAR PRODUTO REAL NA BASE DE DADOS
  const productData = findFloorPreparationProduct(productType, products);
  if (!productData) {
    throw new Error(`Produto ${productType} não encontrado na base de dados`);
  }

  // 3. OBTER ESPECIFICAÇÕES DO PRODUTO (combinando dados da base + especificações técnicas)
  const productSpecs = getProductSpecificationsWithData(productType, productData);

  // 4. CALCULAR FATORES DE CORREÇÃO
  const correctionFactors = calculateCorrectionFactors(
    baseSubstrate,
    currentCondition,
    applicationConditions,
    preparationType
  );

  // 5. CÁLCULO PRINCIPAL - Quantidade de produto
  const baseWeight = volumeCalculation.totalVolume * productSpecs.density; // kg
  const correctedWeight = baseWeight * correctionFactors.total;
  const finalWeight = correctedWeight * (1 + volumeCalculation.wastePercentage / 100);

  // 6. CALCULAR PRIMER (se necessário)
  const primer = calculatePrimerFloorWithProducts(area, primerRequired, primerType, primerDilution, baseSubstrate, products);

  // 7. GERAR LISTA QUANTIFICADA COM PREÇOS REAIS
  const quantified_items: QuantifiedItem[] = [];

  // Produto principal (autonivelante/regularizador)
  const packagesNeeded = Math.ceil(finalWeight / productSpecs.packageSize);
  const productPrice = productData.base_price || 0;
  quantified_items.push({
    name: productData.name,
    description: productData.description || productSpecs.description,
    quantity: packagesNeeded,
    unit: productData.unit,
    unit_price: productPrice,
    total_price: packagesNeeded * productPrice,
    category: 'preparacao_piso',
    specifications: {
      consumption: `${productSpecs.consumptionPerMm} kg/m²/mm`,
      averageThickness: `${averageThickness.toFixed(1)}mm`,
      coverage: `${(finalWeight / area).toFixed(2)} kg/m²`,
      totalWeight: `${finalWeight.toFixed(1)}kg`,
      waterRatio: productSpecs.waterRatio,
      potLife: productSpecs.potLife
    }
  });

  // Primer (se necessário)
  if (primer.required && primer.product && primer.productData) {
    const primerPackages = Math.ceil(primer.quantity / primer.product.packageSize);
    const primerPrice = primer.productData.base_price || 0;
    quantified_items.push({
      name: primer.productData.name,
      description: primer.productData.description || primer.product.description,
      quantity: primerPackages,
      unit: primer.productData.unit,
      unit_price: primerPrice,
      total_price: primerPackages * primerPrice,
      category: 'preparacao',
      specifications: {
        consumption: `${primer.consumption} kg/m²`,
        dilution: primer.dilution,
        application: 'Aplicar antes do autonivelante'
      }
    });
  }

  // Calcular custos totais
  const totalMaterialCost = quantified_items
    .filter(item => item.category !== 'ferramentas')
    .reduce((sum, item) => sum + item.total_price, 0);

  const totalLaborCost = totalMaterialCost * 0.4; // 40% do material
  const totalCost = totalMaterialCost + totalLaborCost;

  return {
    quantified_items,
    totalMaterialCost,
    totalLaborCost,
    totalCost,
    volumeCalculation: {
      totalVolume: volumeCalculation.totalVolume,
      averageThickness: volumeCalculation.averageThickness,
      thicknessVariation: maxThickness - minThickness,
      wastePercentage: volumeCalculation.wastePercentage
    },
    primer: {
      required: primer.required,
      type: primer.type,
      consumption: primer.consumption,
      dilution: primer.dilution
    },
    mixingSpecs: {
      waterRatio: productSpecs.waterRatio,
      mixingTime: productSpecs.mixingTime,
      potLife: productSpecs.potLife,
      walkingTime: productSpecs.walkingTime,
      fullCure: productSpecs.fullCure
    },
    applicationGuide: {
      toolsNeeded: [
        'Furadeira com batedor',
        'Balde plástico graduado',
        'Rolo desareador',
        'Sapato de prego'
      ],
      applicationMethod: productSpecs.applicationMethod,
      layerSequence: generateLayerSequence(preparationType, averageThickness),
      qualityChecks: [
        'Verificar planicidade com régua de 2m',
        'Aguardar cura completa antes do revestimento',
        'Manter área ventilada durante aplicação'
      ]
    },
    validationErrors: validateFloorInputs(input),
    recommendations: generateFloorRecommendations(input, volumeCalculation, productSpecs)
  };
}

// Encontrar produto de preparação de piso na base de dados
function findFloorPreparationProduct(productType: string, products: UnifiedProduct[]): UnifiedProduct | null {
  const productMapping = {
    'ultraplan_eco': 'ULTRAPLAN ECO Saco 23kg',
    'ultraplan_eco_20': 'ULTRAPLAN ECO 20 Saco 23kg', 
    'novoplan_2_plus': 'NOVOPLAN 2 PLUS Saco 25kg',
    'planitop_fast_330': 'PLANITOP FAST 330 Saco 25kg'
  };

  const productName = productMapping[productType as keyof typeof productMapping];
  if (!productName) return null;

  return products.find(p => 
    p.name.includes(productName.split(' ')[0]) && 
    p.name.includes(productName.split(' ')[1]) &&
    p.category === 'preparacao_piso_mapei'
  ) || null;
}

// Encontrar primer na base de dados
function findPrimerProduct(primerType: string, products: UnifiedProduct[]): UnifiedProduct | null {
  const primerMapping = {
    'primer_g': 'PRIMER G',
    'eco_prim_grip': 'ECO PRIM GRIP'
  };

  const primerName = primerMapping[primerType as keyof typeof primerMapping];
  if (!primerName) return null;

  return products.find(p => 
    p.name.includes(primerName) &&
    p.category === 'impermeabilizacao_mapei'
  ) || null;
}

// Função para calcular volume considerando espessura variável
function calculateVolume(
  area: number,
  measurements: number[],
  averageThickness: number,
  preparationType: string,
  slopeConfig?: FloorPreparationMapeiInput['slopeConfiguration']
): {
  totalVolume: number;
  averageThickness: number;
  wastePercentage: number;
} {
  let calculatedAverageThickness = averageThickness;
  let wastePercentage = 5; // Base 5%

  // Para regularização com caimento
  if (preparationType === 'regularizacao_caimento' && slopeConfig?.createSlope) {
    const slopeThickness = (slopeConfig.slopePercentage / 100) * Math.sqrt(area);
    calculatedAverageThickness = (calculatedAverageThickness + slopeThickness) / 2;
    wastePercentage += 3; // +3% para caimento
  }

  // Ajustar desperdício baseado na variação de espessura
  if (measurements.length >= 9) {
    const variation = Math.max(...measurements) - Math.min(...measurements);
    if (variation > 10) wastePercentage += 5; // +5% para grande variação
    else if (variation > 5) wastePercentage += 3; // +3% para variação média
  }

  // Volume em m³ = área (m²) × espessura média (m)
  const totalVolume = area * (calculatedAverageThickness / 1000); // mm para m

  return {
    totalVolume,
    averageThickness: calculatedAverageThickness,
    wastePercentage
  };
}

// Especificações dos produtos MAPEI (dados técnicos que não estão na base)
function getProductSpecificationsWithData(productType: string, productData: UnifiedProduct) {
  const technicalSpecs = {
    'ultraplan_eco': {
      consumptionPerMm: 1.6, // kg/m²/mm
      density: 1600, // kg/m³
      packageSize: 23, // kg
      waterRatio: '22% (5,1L por saco)',
      mixingTime: '2-3 minutos',
      potLife: '30 minutos',
      walkingTime: '4-6 horas',
      fullCure: '24 horas',
      applicationMethod: 'Despeje e espalhe com rodo, passe rolo desareador',
      minThickness: 1, // mm
      maxThickness: 10, // mm
      description: 'Massa autonivelante de secagem rápida'
    },
    'ultraplan_eco_20': {
      consumptionPerMm: 1.6,
      density: 1600,
      packageSize: 23,
      waterRatio: '22% (5,1L por saco)',
      mixingTime: '2-3 minutos',
      potLife: '30 minutos',
      walkingTime: '6-8 horas',
      fullCure: '24 horas',
      applicationMethod: 'Despeje e espalhe com rodo, passe rolo desareador',
      minThickness: 3,
      maxThickness: 20,
      description: 'Massa autonivelante para grandes espessuras'
    },
    'novoplan_2_plus': {
      consumptionPerMm: 1.7,
      density: 1700,
      packageSize: 25,
      waterRatio: '20% (5,0L por saco)',
      mixingTime: '3-4 minutos',
      potLife: '45 minutos',
      walkingTime: '4-5 horas',
      fullCure: '24 horas',
      applicationMethod: 'Despeje e espalhe com rodo dentado, passe rolo desareador',
      minThickness: 3,
      maxThickness: 25,
      description: 'Massa autonivelante modificada com polímeros'
    },
    'planitop_fast_330': {
      consumptionPerMm: 1.8,
      density: 1800,
      packageSize: 25,
      waterRatio: '16% (4,0L por saco)',
      mixingTime: '2 minutos',
      potLife: '15 minutos',
      walkingTime: '2 horas',
      fullCure: '4 horas',
      applicationMethod: 'Aplique com desempenadeira, regularize com régua',
      minThickness: 5,
      maxThickness: 50,
      description: 'Argamassa de pega rápida para regularização'
    }
  };

  const specs = technicalSpecs[productType as keyof typeof technicalSpecs] || technicalSpecs.ultraplan_eco;
  
  return {
    ...specs,
    name: productData.name,
    // Sobrescrever com dados da base se disponíveis
    description: productData.description || specs.description
  };
}

// Calcular primer para piso com produtos da base
function calculatePrimerFloorWithProducts(
  area: number,
  required: boolean,
  type?: string,
  dilution?: string,
  substrate?: string,
  products: UnifiedProduct[] = []
) {
  if (!required) return { required: false };

  const primerProductData = type ? findPrimerProduct(type, products) : null;

  const primerSpecs = {
    'primer_g': {
      name: 'PRIMER G',
      description: 'Primer consolidante para substratos absorventes',
      packageSize: 5,
      unit: 'galão',
      baseConsumption: 0.15 // kg/m²
    },
    'eco_prim_grip': {
      name: 'ECO PRIM GRIP',
      description: 'Primer aderente para superfícies lisas',
      packageSize: 5,
      unit: 'galão',
      baseConsumption: 0.20
    }
  };

  const selectedPrimer = primerSpecs[type as keyof typeof primerSpecs] || primerSpecs.primer_g;
  
  // Ajustar consumo baseado na diluição
  let consumptionMultiplier = 1.0;
  if (dilution === '1:3') consumptionMultiplier = 0.8;
  else if (dilution === '1:1') consumptionMultiplier = 1.2;

  const totalConsumption = selectedPrimer.baseConsumption * consumptionMultiplier;
  const quantity = area * totalConsumption * 1.1; // +10% segurança

  return {
    required: true,
    type,
    consumption: totalConsumption,
    dilution,
    quantity,
    product: selectedPrimer,
    productData: primerProductData // Dados reais da base
  };
}

// Calcular fatores de correção
function calculateCorrectionFactors(
  baseSubstrate: string,
  currentCondition: string,
  applicationConditions: FloorPreparationMapeiInput['applicationConditions'],
  preparationType: string
) {
  let substrateCorrection = 1.0;
  let conditionCorrection = 1.0;
  let environmentalCorrection = 1.0;

  // Correção por substrato
  const substrateFactors = {
    'concreto': 1.05,
    'ceramica': 1.00,
    'madeira': 1.15,
    'gesso': 1.10,
    'contrapiso': 1.08
  };
  substrateCorrection = substrateFactors[baseSubstrate as keyof typeof substrateFactors] || 1.05;

  // Correção por condição
  const conditionFactors = {
    'nivelado': 1.00,
    'pequenos_desniveis': 1.08,
    'grandes_desniveis': 1.15,
    'muito_irregular': 1.20
  };
  conditionCorrection = conditionFactors[currentCondition as keyof typeof conditionFactors] || 1.08;

  // Correção ambiental
  if (applicationConditions.temperature < 15) environmentalCorrection *= 1.05;
  if (applicationConditions.temperature > 25) environmentalCorrection *= 1.03;
  if (applicationConditions.humidity > 70) environmentalCorrection *= 1.05;
  if (applicationConditions.ventilation === 'poor') environmentalCorrection *= 1.08;

  const totalCorrection = substrateCorrection * conditionCorrection * environmentalCorrection;

  return {
    substrate: substrateCorrection,
    condition: conditionCorrection,
    environmental: environmentalCorrection,
    total: Math.min(totalCorrection, 1.30) // Máximo 30%
  };
}

// Gerar sequência de aplicação
function generateLayerSequence(preparationType: string, averageThickness: number): string[] {
  const sequence: string[] = [];

  if (preparationType === 'autonivelante') {
    if (averageThickness <= 10) {
      sequence.push('1. Preparar substrato e aplicar primer');
      sequence.push('2. Misturar produto conforme especificação');
      sequence.push('3. Despejar e espalhar em camada única');
      sequence.push('4. Passar rolo desareador imediatamente');
    } else {
      sequence.push('1. Preparar substrato e aplicar primer');
      sequence.push('2. Primeira camada até 10mm máximo');
      sequence.push('3. Aguardar cura (4-6h) e aplicar segunda camada');
      sequence.push('4. Passar rolo desareador a cada camada');
    }
  } else if (preparationType === 'regularizacao_caimento') {
    sequence.push('1. Marcar pontos de caimento com laser');
    sequence.push('2. Criar mestras de referência');
    sequence.push('3. Aplicar em faixas seguindo caimento');
    sequence.push('4. Regularizar com régua e desempenadeira');
  }

  return sequence;
}

// Validação específica para pisos
function validateFloorInputs(input: FloorPreparationMapeiInput): string[] {
  const errors: string[] = [];

  if (!input.area || input.area <= 0) {
    errors.push('Área deve ser maior que zero');
  }

  if (!input.averageThickness || input.averageThickness <= 0) {
    errors.push('Espessura média deve ser maior que zero');
  }

  if (input.averageThickness > 50) {
    errors.push('Espessura muito alta - considere usar argamassa de regularização');
  }

  if (input.thicknessMeasurements.length < 9) {
    errors.push('São necessárias 9 medições de espessura para cálculo preciso');
  }

  const variation = input.maxThickness - input.minThickness;
  if (variation > input.averageThickness) {
    errors.push('Variação de espessura muito alta - verifique medições');
  }

  return errors;
}

// Recomendações específicas
function generateFloorRecommendations(
  input: FloorPreparationMapeiInput,
  volumeCalculation: any,
  productSpecs: any
): string[] {
  const recommendations: string[] = [];

  // Recomendações por espessura
  if (input.averageThickness < productSpecs.minThickness) {
    recommendations.push(`Espessura mínima recomendada para ${productSpecs.name}: ${productSpecs.minThickness}mm`);
  }

  if (input.averageThickness > productSpecs.maxThickness) {
    recommendations.push(`Considere usar ${productSpecs.name === 'ULTRAPLAN ECO' ? 'PLANITOP FAST 330' : 'produto específico'} para espessuras acima de ${productSpecs.maxThickness}mm`);
  }

  // Recomendações ambientais
  if (input.applicationConditions.temperature < 10) {
    recommendations.push('Temperatura muito baixa - considere aquecer o ambiente');
  }

  if (input.applicationConditions.humidity > 80) {
    recommendations.push('Umidade alta - garanta ventilação adequada');
  }

  // Recomendações por substrato
  if (input.baseSubstrate === 'ceramica') {
    recommendations.push('Fazer teste de aderência em área pequena antes da aplicação total');
  }

  // Recomendações gerais
  recommendations.push('Manter temperatura entre 15-25°C durante aplicação e cura');
  recommendations.push('Proteger de correntes de ar fortes durante as primeiras 4 horas');

  return recommendations;
}