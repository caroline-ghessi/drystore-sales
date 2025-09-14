import { ShingleCalculationInput, ShingleCalculationResult, RoofSection, RoofComplexity } from '../../types/calculation.types';
import { UnifiedProduct } from '../../hooks/useUnifiedProducts';
import { ProductCalculationService } from '../../services/productCalculationService';

/**
 * Calculadora de Shingle Drystore - Conforme Manual Técnico
 * Implementa todas as especificações do guia completo Owens Corning/Drystore
 */

// Tabela completa de correção por inclinação - Conforme Manual Técnico
const SLOPE_CORRECTION_FACTORS = {
  17: 1.014,  // 9.6° - Inclinação mínima shingle
  20: 1.020,  // 11.3°
  25: 1.031,  // 14.0°
  30: 1.044,  // 16.7°
  35: 1.061,  // 19.3°
  40: 1.077,  // 21.8°
  45: 1.095,  // 24.2°
  50: 1.118,  // 26.6°
  55: 1.140,  // 28.8°
  60: 1.166,  // 31.0°
  65: 1.193,  // 33.0°
  70: 1.221,  // 35.0°
  75: 1.250,  // 36.9°
  80: 1.281,  // 38.7°
};

// Fatores de perda por complexidade - Conforme Manual
const WASTE_FACTORS: Record<RoofComplexity, number> = {
  simple: 1.10,      // 10% - Telhados simples
  complex: 1.15,     // 15% - Telhados complexos com recortes  
  very_complex: 1.20 // 20% - Primeira experiência ou muito complexo
};

// Rendimentos dos produtos Drystore - Conforme Manual
const PRODUCT_COVERAGE = {
  shingle_bundle: 3.0,      // m² por fardo
  osb_sheet: 2.88,          // m² por placa OSB
  rhinoroof_roll: 86.0,     // m² úteis por rolo (90% de 95.7m²)  
  ridge_cap_bundle: 10.0,   // metros lineares por fardo (Supreme recortada)
  valley_tape_roll: 10.0,   // metros lineares por rolo (0,91x10m)
  monopol_tube: 10.0,       // metros lineares de vedação por tubo
};

/**
 * Calcula fator de correção de inclinação usando fórmula precisa
 * Fórmula: √(1 + (Inclinação/100)²)
 */
function calculateSlopeCorrectionFactor(slopePercent: number): number {
  // Usar tabela para valores conhecidos
  const tableValue = SLOPE_CORRECTION_FACTORS[slopePercent as keyof typeof SLOPE_CORRECTION_FACTORS];
  if (tableValue) return tableValue;
  
  // Fórmula precisa para valores intermediários
  return Math.sqrt(1 + Math.pow(slopePercent / 100, 2));
}

/**
 * Valida inclinação mínima conforme especificações técnicas
 */
function validateMinimumSlope(sections: RoofSection[]): { passed: boolean; message?: string } {
  const invalidSections = sections.filter(section => section.slope < 17);
  
  if (invalidSections.length > 0) {
    return {
      passed: false,
      message: `Águas com inclinação inferior a 17% (mínimo para shingle): ${invalidSections.map(s => s.name).join(', ')}`
    };
  }
  
  return { passed: true };
}

/**
 * Calcula área real de cada água com correção de inclinação
 */
function calculateRealAreas(sections: RoofSection[]) {
  return sections.map(section => {
    const correctionFactor = section.isProjectedArea 
      ? calculateSlopeCorrectionFactor(section.slope)
      : 1.0;
    
    const realArea = section.area * correctionFactor;
    
    return {
      sectionId: section.id,
      projectedArea: section.area,
      realArea,
      correctionFactor,
      slope: section.slope
    };
  });
}

/**
 * Calcula step flashing conforme número de fiadas
 */
function calculateStepFlashing(stepFlashingLength: number, stepFlashingHeight: number): {
  pieces: number;
  aluminumArea: number;
} {
  const exposurePerRow = 0.14; // 14cm exposição padrão das telhas
  const numberOfRows = Math.ceil(stepFlashingHeight / exposurePerRow);
  const totalPieces = numberOfRows * stepFlashingLength;
  
  // Cada peça: 25cm x 18cm = 0.045 m² + 10% desperdício
  const aluminumArea = totalPieces * 0.045 * 1.1;
  
  return {
    pieces: totalPieces,
    aluminumArea
  };
}

/**
 * Calcula quantidade de Monopol Asfáltico por aplicação
 */
function calculateMonopolSealant(
  valleyLength: number,
  stepFlashPieces: number, 
  ridgeLength: number,
  hipLength: number,
  dripEdgeLength: number
): number {
  let totalTubes = 0;
  
  // Águas furtadas: 1 tubo por 10m
  totalTubes += Math.ceil(valleyLength / 10);
  
  // Step flashing: 1 tubo por 20 peças
  totalTubes += Math.ceil(stepFlashPieces / 20);
  
  // Cumeeiras + espigões: 1 tubo por 15m
  totalTubes += Math.ceil((ridgeLength + hipLength) / 15);
  
  // Rufos: 1 tubo por 15m  
  totalTubes += Math.ceil(dripEdgeLength / 15);
  
  return totalTubes;
}

/**
 * Função principal de cálculo conforme Manual Técnico Drystore
 */
export function calculateShingleWithProducts(
  input: ShingleCalculationInput,
  products: UnifiedProduct[]
): ShingleCalculationResult {
  const { 
    roofSections, 
    shingleType,
    linearElements,
    complexity,
    ridgeVentilated,
    includeDripEdge
  } = input;

  // 1. VALIDAÇÕES CONFORME MANUAL
  const slopeValidation = validateMinimumSlope(roofSections);
  
  // 2. CALCULAR ÁREAS REAIS COM CORREÇÃO DE INCLINAÇÃO
  const areaCalculations = calculateRealAreas(roofSections);
  const totalProjectedArea = roofSections.reduce((sum, section) => sum + section.area, 0);
  const totalRealArea = areaCalculations.reduce((sum, calc) => sum + calc.realArea, 0);
  
  // 3. APLICAR FATOR DE PERDAS POR COMPLEXIDADE
  const wasteFactor = WASTE_FACTORS[complexity];
  const totalAreaWithWaste = totalRealArea * wasteFactor;
  
  // 4. BUSCAR PRODUTOS ESPECÍFICOS DRYSTORE
  const shingleProducts = ProductCalculationService.getShingleProducts(products);
  
  // Telhas principais por tipo
  const shingleProduct = shingleProducts.shingles?.find(p => 
    p.name.toLowerCase().includes(shingleType.toLowerCase())
  );
  
  // 5. CALCULAR QUANTIDADES DE MATERIAIS
  
  // Telhas principais - fardos
  const shingleBundles = Math.ceil(totalAreaWithWaste / PRODUCT_COVERAGE.shingle_bundle);
  
  // Placas OSB - com 5% adicional
  const osbSheets = Math.ceil(totalAreaWithWaste / PRODUCT_COVERAGE.osb_sheet * 1.05);
  
  // RhinoRoof - rolos 1,1x87m (86m² úteis)
  const rhinoroofRolls = Math.ceil(totalAreaWithWaste / PRODUCT_COVERAGE.rhinoroof_roll);
  
  // Cumeeiras - Supreme recortada (sempre não ventilada na Drystore)
  const ridgeCapBundles = Math.ceil(linearElements.ridgeLength / PRODUCT_COVERAGE.ridge_cap_bundle);
  
  // Espigões - Supreme recortada (padrão Drystore)
  const hipCapBundles = Math.ceil(linearElements.hipLength / PRODUCT_COVERAGE.ridge_cap_bundle);
  
  // Águas furtadas - fita autoadesiva 0,91x10m + 1 rolo margem
  const valleyTapeRolls = linearElements.valleyLength > 0 
    ? Math.ceil(linearElements.valleyLength / PRODUCT_COVERAGE.valley_tape_roll) + 1
    : 0;
  
  // Step flashing
  const stepFlashingCalc = calculateStepFlashing(
    linearElements.stepFlashingLength, 
    linearElements.stepFlashingHeight
  );
  
  // Rufos (opcional)
  const dripEdgeLength = includeDripEdge && linearElements.dripEdgePerimeter 
    ? linearElements.dripEdgePerimeter * 1.05  // 5% desperdício
    : 0;
    
  // Pregos - 15 pregos por m² = aproximadamente 2kg por fardo
  const nailsKg = Math.ceil(shingleBundles * 2);
  
  // Monopol Asfáltico
  const monopolSealantTubes = calculateMonopolSealant(
    linearElements.valleyLength,
    stepFlashingCalc.pieces,
    linearElements.ridgeLength,
    linearElements.hipLength,
    dripEdgeLength
  );
  
  // Bobina alumínio total (step flash + rufos)
  const dripEdgeAluminum = dripEdgeLength * 0.18 * 1.1; // 18cm largura + 10% desperdício
  const aluminumCoilArea = stepFlashingCalc.aluminumArea + dripEdgeAluminum;
  
  // 6. CALCULAR CUSTOS POR CATEGORIA
  const shinglePrice = shingleProduct?.base_price || 0;
  const osbProduct = shingleProducts.osb?.[0];
  const rhinoroofProduct = products.find(p => p.code === 'SH-RHI-87');

  // Buscar produto bobina alumínio
  const aluminumProduct = products.find(p => p.name.toLowerCase().includes('aluminio'));
  
  const itemizedCosts = {
    shingles: shingleBundles * shinglePrice,
    osb: osbSheets * (osbProduct?.base_price || 0),
    rhinoroof: rhinoroofRolls * (rhinoroofProduct?.base_price || 0),
    ridgeAndHip: (ridgeCapBundles + hipCapBundles) * (shingleProduct?.base_price || 0), // Supreme para caps
    valleySystem: valleyTapeRolls * (shingleProducts.valleyTape?.base_price || 0),
    stepFlashing: aluminumCoilArea * (aluminumProduct?.base_price || 0),
    dripEdge: dripEdgeLength > 0 ? dripEdgeAluminum * (aluminumProduct?.base_price || 0) : 0,
    fasteners: nailsKg * (shingleProducts.nails?.base_price || 0),
    sealant: monopolSealantTubes * (shingleProducts.sealant?.base_price || 0)
  };
  
  const totalCost = Object.values(itemizedCosts).reduce((sum, cost) => sum + cost, 0);
  
  // 7. VALIDAÇÕES FINAIS
  const validations = {
    minimumSlopeCheck: slopeValidation,
    areaConsistencyCheck: { 
      passed: totalProjectedArea > 0,
      message: totalProjectedArea <= 0 ? 'Área total deve ser maior que zero' : undefined
    },
    productAvailability: {
      passed: !!shingleProduct,
      missing: !shingleProduct ? [`Telhas ${shingleType}`] : undefined
    }
  };
  
  // 8. BREAKDOWN DETALHADO
  const materialBreakdown = {
    shingles: { quantity: shingleBundles, unit: 'fardos', coverage: PRODUCT_COVERAGE.shingle_bundle },
    osb: { quantity: osbSheets, unit: 'placas', coverage: PRODUCT_COVERAGE.osb_sheet },
    rhinoroof: { quantity: rhinoroofRolls, unit: 'rolos', coverage: PRODUCT_COVERAGE.rhinoroof_roll },
    ridgeCaps: { quantity: ridgeCapBundles, linearMeters: linearElements.ridgeLength },
    hipCaps: { quantity: hipCapBundles, linearMeters: linearElements.hipLength },
    valleyTape: { quantity: valleyTapeRolls, linearMeters: linearElements.valleyLength },
    stepFlash: { quantity: stepFlashingCalc.pieces, pieces: stepFlashingCalc.pieces },
    dripEdge: includeDripEdge ? { quantity: dripEdgeLength, linearMeters: dripEdgeLength } : undefined,
    nails: { quantity: nailsKg, application: 'fixação telhas' },
    sealant: { quantity: monopolSealantTubes, applications: ['águas furtadas', 'step flash', 'cumeeiras', 'rufos'] }
  };
  
  // 9. QUANTIFIED ITEMS PARA PROPOSTAS
  const quantified_items = [
    {
      name: shingleProduct?.name || `Telhas Shingle ${shingleType}`,
      description: `Fardos de telhas shingle ${shingleType} - ${PRODUCT_COVERAGE.shingle_bundle}m²/fardo`,
      quantity: shingleBundles,
      unit: 'fardos',
      unit_price: shinglePrice,
      total_price: itemizedCosts.shingles,
      category: 'Cobertura',
      specifications: { coverage_area: PRODUCT_COVERAGE.shingle_bundle }
    },
    {
      name: osbProduct?.name || 'Placa OSB 18mm',
      description: 'Placa OSB estrutural para deck',
      quantity: osbSheets,
      unit: 'placas',
      unit_price: osbProduct?.base_price || 0,
      total_price: itemizedCosts.osb,
      category: 'Estrutura',
      specifications: { coverage_area: PRODUCT_COVERAGE.osb_sheet }
    },
    {
      name: rhinoroofProduct?.name || 'RhinoRoof 1,1x87m',
      description: 'Manta asfáltica subcobertura - 86m² úteis por rolo',
      quantity: rhinoroofRolls,
      unit: 'rolos',
      unit_price: rhinoroofProduct?.base_price || 0,
      total_price: itemizedCosts.rhinoroof,
      category: 'Impermeabilização',
      specifications: { coverage_area: PRODUCT_COVERAGE.rhinoroof_roll }
    }
  ];
  
  // Adicionar cumeeiras e espigões se houver
  if (ridgeCapBundles + hipCapBundles > 0) {
    quantified_items.push({
      name: 'Cap de Cumeeira Supreme (Recortada)',
      description: 'Fardos Supreme para recorte de cumeeiras e espigões',
      quantity: ridgeCapBundles + hipCapBundles,
      unit: 'fardos',
      unit_price: shingleProduct?.base_price || 0,
      total_price: itemizedCosts.ridgeAndHip,
      category: 'Acabamento',
      specifications: { coverage_area: PRODUCT_COVERAGE.ridge_cap_bundle }
    });
  }
  
  // Adicionar outros materiais conforme necessidade
  if (valleyTapeRolls > 0) {
    quantified_items.push({
      name: 'Fita Autoadesiva 0,91x10m',
      description: 'Fita para águas furtadas',
      quantity: valleyTapeRolls,
      unit: 'rolos',
      unit_price: shingleProducts.valleyTape?.base_price || 0,
      total_price: itemizedCosts.valleySystem,
      category: 'Vedação',
      specifications: { coverage_area: PRODUCT_COVERAGE.valley_tape_roll }
    });
  }

  return {
    // Dados básicos
    totalRealArea,
    totalProjectedArea,
    appliedWasteFactor: wasteFactor,
    slopeCorrections: areaCalculations.map(calc => ({
      sectionId: calc.sectionId,
      factor: calc.correctionFactor
    })),
    
    // Quantities
    shingleBundles,
    osbSheets,
    rhinoroofRolls,
    ridgeCapBundles,
    hipCapBundles,
    valleyTapeRolls,
    stepFlashPieces: stepFlashingCalc.pieces,
    dripEdgeLength: includeDripEdge ? dripEdgeLength : undefined,
    aluminumCoilArea,
    nailsKg,
    monopolSealantTubes,
    
    // Breakdown
    materialBreakdown,
    
    // Costs
    itemizedCosts,
    totalCost,
    
    // Validations
    validations,
    
    // For proposals
    quantified_items
  };
}