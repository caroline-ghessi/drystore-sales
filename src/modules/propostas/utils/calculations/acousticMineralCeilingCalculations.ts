import { AcousticMineralCeilingInput, AcousticMineralCeilingResult, AcousticMineralCeilingModel, CeilingModulation, EdgeType } from '../../types/calculation.types';
import { supabase } from '@/lib/supabase';

// Função para buscar produtos da base de dados
async function getAcousticMineralProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', 'forro_mineral_acustico')
    .eq('is_active', true)
    .order('base_price', { ascending: true });
  
  if (error) {
    console.error('Erro ao buscar produtos de forro mineral acústico:', error);
    throw new Error('Erro ao buscar produtos de forro mineral acústico');
  }
  
  return data || [];
}

// Função para buscar produtos auxiliares reutilizáveis (tirantes, buchas, cantoneiras)
async function getAuxiliaryStructuralProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('category', ['forro_drywall', 'forro_mineral_acustico', 'drywall_divisorias'])
    .eq('is_active', true)
    .or('code.ilike.%tirante%,name.ilike.%tirante%,code.ilike.%bucha%,name.ilike.%bucha%,code.ilike.%cantoneira%,name.ilike.%cantoneira%');
  
  if (error) {
    console.error('Erro ao buscar produtos auxiliares:', error);
    return [];
  }
  
  return data || [];
}

// COMENTÁRIO: Função auxiliar mantida para futuras expansões
// async function getAuxiliaryProducts() {
//   const { data, error } = await supabase
//     .from('products')
//     .select('*')
//     .in('category', ['ferramentas', 'acabamentos', 'forros'])
//     .eq('is_active', true);
//   
//   if (error) {
//     console.error('Erro ao buscar produtos auxiliares:', error);
//     return [];
//   }
//   
//   return data || [];
// }

// Base de dados dos modelos baseada no manual técnico (DEPRECATED - usar produtos da base)
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

// Seleção otimizada baseada em produtos da base de dados
export async function selectOptimalProduct(input: AcousticMineralCeilingInput) {
  const products = await getAcousticMineralProducts();
  
  // Se modelo manual selecionado pelo código, buscar produto
  if (input.manualModel) {
    const product = products.find(p => 
      p.code.toLowerCase().includes(input.manualModel!.toLowerCase())
    );
    if (product) return product;
  }

  // Seleção automática baseada na necessidade principal
  if (input.primaryNeed === 'humidity') {
    return products
      .filter(p => {
        const specs = p.specifications as any;
        return specs?.humidity_resistance === true;
      })
      .sort((a, b) => {
        const aSpecs = a.specifications as any;
        const bSpecs = b.specifications as any;
        return (bSpecs?.nrc || 0) - (aSpecs?.nrc || 0);
      })[0];
  }

  if (input.primaryNeed === 'acoustic') {
    const minNrc = input.nrcRequired || 0.70;
    return products
      .filter(p => {
        const specs = p.specifications as any;
        return (specs?.nrc || 0) >= minNrc;
      })
      .sort((a, b) => {
        const aSpecs = a.specifications as any;
        const bSpecs = b.specifications as any;
        return (bSpecs?.nrc || 0) - (aSpecs?.nrc || 0);
      })[0];
  }

  if (input.primaryNeed === 'economy') {
    return products
      .sort((a, b) => a.base_price - b.base_price)[0];
  }

  // Produto intermediário por padrão
  return products
    .sort((a, b) => {
      const aSpecs = a.specifications as any;
      const bSpecs = b.specifications as any;
      return (bSpecs?.nrc || 0) - (aSpecs?.nrc || 0);
    })[2] || products[0];
}

// DEPRECATED: Manter para compatibilidade temporária
export function selectOptimalModel(input: AcousticMineralCeilingInput): AcousticMineralCeilingModel {
  return 'ALCOR'; // Fallback - deve usar selectOptimalProduct
}

// Selecionar modulação otimizada baseada no produto
export function selectOptimalModulation(input: AcousticMineralCeilingInput, product: any): CeilingModulation {
  if (input.manualModulation) {
    return input.manualModulation;
  }

  const area = input.roomLength * input.roomWidth;
  const productSpecs = product.specifications as any;
  const availableModulations = productSpecs?.modulations || ['625x625'];

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
  return availableModulations[0] as CeilingModulation;
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

export async function calculateAcousticMineralCeiling(input: AcousticMineralCeilingInput): Promise<AcousticMineralCeilingResult> {
  // 1. Buscar produtos da base de dados
  const products = await getAcousticMineralProducts();
  const auxiliaryProducts = await getAuxiliaryStructuralProducts();
  
  if (!products || products.length === 0) {
    throw new Error('Nenhum produto de forro mineral acústico encontrado na base de dados');
  }
  
  // Mapear produtos estruturais por tipo
  const getProductByType = (type: string) => products.find(p => {
    const specs = p.specifications as any;
    return specs?.type === type;
  });

  const getAuxiliaryProduct = (name: string) => auxiliaryProducts.find(p =>
    p.name.toLowerCase().includes(name.toLowerCase()) || 
    p.code.toLowerCase().includes(name.toLowerCase())
  );

  const structuralProducts = {
    mainProfile: getProductByType('main_profile'),
    secondaryProfile: getProductByType('secondary_profile'), 
    tegularClips: getProductByType('tegular_clip'),
    lightSupports: getProductByType('light_support'),
    regulators: getProductByType('suspension_regulator'),
    // Produtos reutilizáveis de outras categorias
    hanger: getAuxiliaryProduct('tirante'),
    anchor: getAuxiliaryProduct('bucha'),
    perimeterEdge: getAuxiliaryProduct('cantoneira')
  };
  
  // 2. Seleção do produto adequado baseado nas necessidades
  let selectedProduct;
  
  // Preferência 1: Se seleção manual foi feita
  if (input.manualModel && typeof input.manualModel === 'string') {
    selectedProduct = products.find(p => 
      p.name.toLowerCase().includes(input.manualModel!.toLowerCase()) ||
      p.code.toLowerCase().includes(input.manualModel!.toLowerCase())
    );
  }
  
  if (!selectedProduct) {
    // Preferência 2: Filtrar por necessidade específica
    let filteredProducts = [...products];

    switch (input.primaryNeed) {
      case 'humidity':
        filteredProducts = products.filter(p => {
          const specs = p.specifications as any;
          return specs?.humidity_resistance === true;
        });
        break;
      
      case 'acoustic':
        if (input.nrcRequired) {
          filteredProducts = products.filter(p => {
            const specs = p.specifications as any;
            return (specs?.nrc || 0) >= input.nrcRequired!;
          });
        }
        // Ordenar por melhor performance acústica
        filteredProducts.sort((a, b) => {
          const aNrc = (a.specifications as any)?.nrc || 0;
          const bNrc = (b.specifications as any)?.nrc || 0;
          return bNrc - aNrc;
        });
        break;
      
      case 'economy':
        filteredProducts.sort((a, b) => a.base_price - b.base_price);
        break;
      
      case 'premium':
        filteredProducts.sort((a, b) => b.base_price - a.base_price);
        break;
    }

    // Se não encontrou produtos após filtro, usar todos
    if (filteredProducts.length === 0) {
      filteredProducts = products;
    }

    selectedProduct = filteredProducts[0];
  }
  
  if (!selectedProduct) {
    throw new Error('Não foi possível selecionar um produto adequado para os requisitos informados.');
  }
  
  const selectedModulation = selectOptimalModulation(input, selectedProduct);
  const productSpecs = selectedProduct.specifications as any;
  const selectedEdgeType = input.manualEdgeType || input.edgeType || productSpecs?.edge_type || 'tegular';

  // 2. Cálculos de área
  const totalArea = input.roomLength * input.roomWidth;
  
  // Calcular área de obstáculos considerando formato das colunas
  let obstacleArea = 0;
  let columnPerimeter = 0;
  
  if (input.obstacles.columnDimensions) {
    obstacleArea = input.obstacles.columnDimensions.reduce((total, col) => {
      if (col.type === 'circular') {
        const radius = (col.diameter || 0) / 2;
        return total + (Math.PI * radius * radius);
      } else {
        return total + ((col.width || 0) * (col.depth || 0));
      }
    }, 0);

    columnPerimeter = input.obstacles.columnDimensions.reduce((total, col) => {
      if (col.type === 'circular') {
        return total + (Math.PI * (col.diameter || 0));
      } else {
        return total + (2 * ((col.width || 0) + (col.depth || 0)));
      }
    }, 0);
  } else {
    // Fallback para cálculo legado (assumir colunas retangulares de 1m²)
    obstacleArea = input.obstacles.columns * 1.0;
    columnPerimeter = input.obstacles.columns * 4.0; // perímetro de 1m x 1m
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
  
  // Assumir 10 placas por caixa como padrão se não especificado
  const platesPerBox = 10;
  const boxesNeeded = Math.ceil(totalPlates / platesPerBox);

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
    columnEdgeProfiles: columnPerimeter > 0 ? {
      meters: columnPerimeter * 1.05, // 5% de perda
      pieces: Math.ceil((columnPerimeter * 1.05) / 3) // barras de 3m
    } : undefined,
    specialAnchors: Math.ceil(hangers * 0.1) // 10% de buchas especiais
  };

// 6. Custos baseados nos produtos cadastrados na base de dados
  const regionMultiplier = 1.0; // Fixado para uniformidade nacional
  
  const itemizedCosts = {
    plates: totalPlates * plateArea * selectedProduct.base_price,
    mainProfile: structuralProducts.mainProfile 
      ? mainProfileBars * structuralProducts.mainProfile.base_price 
      : 0,
    secondaryProfiles: (() => {
      let cost = 0;
      if (secondaryProfile1250 && structuralProducts.secondaryProfile) {
        cost += secondaryProfile1250.pieces * structuralProducts.secondaryProfile.base_price;
      }
      if (secondaryProfile625 && structuralProducts.secondaryProfile) {
        cost += secondaryProfile625.pieces * structuralProducts.secondaryProfile.base_price;
      }
      return cost;
    })(),
    perimeterEdge: structuralProducts.perimeterEdge 
      ? perimeterEdgeBars * structuralProducts.perimeterEdge.base_price 
      : 0,
    suspension: (() => {
      let cost = 0;
      if (structuralProducts.hanger) cost += hangers * structuralProducts.hanger.base_price;
      if (structuralProducts.regulators) cost += hangers * structuralProducts.regulators.base_price;
      if (structuralProducts.anchor) cost += hangers * structuralProducts.anchor.base_price;
      return cost;
    })(),
    accessories: (() => {
      let cost = 0;
      if (structuralProducts.tegularClips) cost += accessories.tegularClips * structuralProducts.tegularClips.base_price;
      if (structuralProducts.lightSupports) cost += accessories.lightSupports * structuralProducts.lightSupports.base_price;
      return cost;
    })(),
    labor: input.laborConfig?.includeLabor 
      ? (input.laborConfig.customLaborCost || 
         (input.laborConfig.laborCostPerM2 ? input.laborConfig.laborCostPerM2 * usefulArea : 0))
      : 0
  };

  const totalCost = Object.values(itemizedCosts).reduce((sum, cost) => sum + cost, 0);

  // 7. Performance acústica do produto
  const modelSpecs = selectedProduct.specifications as any;
  const nrcValue = modelSpecs?.nrc || 0.7;
  const acousticPerformance = {
    nrc: nrcValue,
    classification: (nrcValue >= 0.85 ? 'premium' : nrcValue >= 0.70 ? 'alta' : nrcValue >= 0.60 ? 'média' : 'baixa') as 'premium' | 'alta' | 'média' | 'baixa',
    suitableFor: ['Escritórios', 'Salas de reunião', 'Consultórios'] // Genérico
  };

  // 8. Validações automáticas
  const validations = {
    minSpaceOk: input.availableSpace >= 15,
    structureCompatible: true, // Sempre compatível com forros minerais
    modelSuitable: checkProductSuitability(selectedProduct, input),
    warnings: generateProductWarnings(input, selectedProduct)
  };

  return {
    selectedModel: {
      name: selectedProduct.name as AcousticMineralCeilingModel,
      manufacturer: selectedProduct.supplier || 'Nacional',
      modulation: selectedModulation,
      edgeType: selectedEdgeType,
      nrc: modelSpecs?.nrc || 0.7,
      rh: modelSpecs?.humidity_resistance ? 95 : 85,
      weight: modelSpecs?.weight_kg_m2 || 3.0,
      platesPerBox: platesPerBox
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
    itemizedCosts: {
      ...itemizedCosts,
      columnEdgeProfiles: (accessories.columnEdgeProfiles?.meters || 0) * 35 * regionMultiplier
    },
    totalCost,
    acousticPerformance,
    technicalSpecs: {
      configuration: `${selectedModulation} ${selectedEdgeType}`,
      finalThickness: modelSpecs?.thickness_mm || 15,
      weight: modelSpecs?.weight_kg_m2 || 3.0,
      moistureResistance: modelSpecs?.humidity_resistance ? 95 : 85,
      installationComplexity: selectedEdgeType === 'tegular' ? 'média' : 'simples'
    },
    validations,
    
    // Generate quantified items for proposal - LISTA COMPLETA
    quantified_items: [
      // 1. Placas minerais acústicas
      {
        name: selectedProduct.name,
        description: `Placas de forro mineral acústico ${selectedModulation}`,
        quantity: totalPlates,
        unit: 'un',
        unit_price: selectedProduct.base_price,
        total_price: itemizedCosts.plates,
        category: 'Forro',
        specifications: {
          modulation: selectedModulation,
          edge_type: selectedEdgeType,
          nrc: modelSpecs?.nrc || 0.7,
          manufacturer: selectedProduct.supplier || 'Nacional'
        }
      },
      
      // 2. Perfil principal
      ...(structuralProducts.mainProfile ? [{
        name: structuralProducts.mainProfile.name,
        description: `Perfil principal de sustentação - ${mainProfileBars} barras de 3,66m`,
        quantity: mainProfileBars,
        unit: 'peca',
        unit_price: structuralProducts.mainProfile.base_price,
        total_price: mainProfileBars * structuralProducts.mainProfile.base_price,
        category: 'Estrutura',
        specifications: { length_meters: 3.66, type: 'main_profile' }
      }] : []),
      
      // 3. Perfis secundários 1250mm (se aplicável)
      ...(secondaryProfile1250 && structuralProducts.secondaryProfile ? [{
        name: structuralProducts.secondaryProfile.name.replace('625mm', '1250mm'),
        description: `Perfil secundário 1250mm - ${secondaryProfile1250.pieces} peças`,
        quantity: secondaryProfile1250.pieces,
        unit: 'peca',
        unit_price: structuralProducts.secondaryProfile.base_price,
        total_price: secondaryProfile1250.pieces * structuralProducts.secondaryProfile.base_price,
        category: 'Estrutura',
        specifications: { length_meters: 1.25, type: 'secondary_profile' }
      }] : []),
      
      // 4. Perfis secundários 625mm
      ...(secondaryProfile625 && structuralProducts.secondaryProfile ? [{
        name: structuralProducts.secondaryProfile.name,
        description: `Perfil secundário 625mm - ${secondaryProfile625.pieces} peças`,
        quantity: secondaryProfile625.pieces,
        unit: 'peca',
        unit_price: structuralProducts.secondaryProfile.base_price,
        total_price: secondaryProfile625.pieces * structuralProducts.secondaryProfile.base_price,
        category: 'Estrutura',
        specifications: { length_meters: 0.625, type: 'secondary_profile' }
      }] : []),
      
      // 5. Cantoneira perimetral
      ...(structuralProducts.perimeterEdge ? [{
        name: structuralProducts.perimeterEdge.name,
        description: `Cantoneira perimetral - ${perimeterEdgeBars} barras de 3m`,
        quantity: perimeterEdgeBars,
        unit: 'peca',
        unit_price: structuralProducts.perimeterEdge.base_price,
        total_price: perimeterEdgeBars * structuralProducts.perimeterEdge.base_price,
        category: 'Estrutura',
        specifications: { length_meters: 3, type: 'perimeter_edge' }
      }] : []),
      
      // 6. Sistema de suspensão - Tirantes
      ...(structuralProducts.hanger ? [{
        name: structuralProducts.hanger.name,
        description: `Tirantes de suspensão Ø3,4mm - ${hangers} unidades`,
        quantity: hangers,
        unit: 'unidade',
        unit_price: structuralProducts.hanger.base_price,
        total_price: hangers * structuralProducts.hanger.base_price,
        category: 'Suspensão',
        specifications: { diameter_mm: 3.4, type: 'hanger' }
      }] : []),
      
      // 7. Reguladores de suspensão
      ...(structuralProducts.regulators ? [{
        name: structuralProducts.regulators.name,
        description: `Reguladores para ajuste de altura - ${hangers} unidades`,
        quantity: hangers,
        unit: 'unidade',
        unit_price: structuralProducts.regulators.base_price,
        total_price: hangers * structuralProducts.regulators.base_price,
        category: 'Suspensão',
        specifications: { type: 'suspension_regulator', adjustable: true }
      }] : []),
      
      // 8. Buchas de fixação
      ...(structuralProducts.anchor ? [{
        name: structuralProducts.anchor.name,
        description: `Buchas para fixação na laje - ${hangers} unidades`,
        quantity: hangers,
        unit: 'unidade',
        unit_price: structuralProducts.anchor.base_price,
        total_price: hangers * structuralProducts.anchor.base_price,
        category: 'Fixação',
        specifications: { type: 'ceiling_anchor' }
      }] : []),
      
      // 9. Clips tegular (se borda tegular)
      ...(accessories.tegularClips > 0 && structuralProducts.tegularClips ? [{
        name: structuralProducts.tegularClips.name,
        description: `Clips de união para borda tegular - ${accessories.tegularClips} unidades`,
        quantity: accessories.tegularClips,
        unit: 'unidade',
        unit_price: structuralProducts.tegularClips.base_price,
        total_price: accessories.tegularClips * structuralProducts.tegularClips.base_price,
        category: 'Acessórios',
        specifications: { edge_type: 'tegular', type: 'union_clip' }
      }] : []),
      
      // 10. Suportes para luminárias
      ...(accessories.lightSupports > 0 && structuralProducts.lightSupports ? [{
        name: structuralProducts.lightSupports.name,
        description: `Suportes para luminárias embutidas - ${accessories.lightSupports} unidades`,
        quantity: accessories.lightSupports,
        unit: 'unidade',
        unit_price: structuralProducts.lightSupports.base_price,
        total_price: accessories.lightSupports * structuralProducts.lightSupports.base_price,
        category: 'Acessórios',
        specifications: { type: 'light_support', fixtures_supported: input.installations.lightFixtures }
      }] : []),
      
      // 11. Mão de obra (se configurada)
      ...(input.laborConfig?.includeLabor && itemizedCosts.labor > 0 ? [{
        name: 'Mão de Obra',
        description: 'Instalação completa do forro mineral acústico',
        quantity: usefulArea,
        unit: 'm²',
        unit_price: itemizedCosts.labor / usefulArea,
        total_price: itemizedCosts.labor,
        category: 'Serviços',
        specifications: {}
      }] : [])
    ]
  };
}

// Funções auxiliares
// Função de multiplicador regional removida - mantendo uniformidade de preços

function checkProductSuitability(product: any, input: AcousticMineralCeilingInput): boolean {
  const suitabilitySpecs = product.specifications as any;
  
  // Verificar umidade se necessário
  if (input.primaryNeed === 'humidity' && input.humidityLevel) {
    return suitabilitySpecs?.humidity_resistance || false;
  }
  
  // Verificar acústica se necessário  
  if (input.primaryNeed === 'acoustic' && input.nrcRequired) {
    return (suitabilitySpecs?.nrc || 0) >= input.nrcRequired;
  }
  
  return true;
}

// DEPRECATED: Manter compatibilidade
function checkModelSuitability(model: AcousticMineralCeilingModel, input: AcousticMineralCeilingInput): boolean {
  return true;
}

function generateProductWarnings(input: AcousticMineralCeilingInput, product: any): string[] {
  const warnings: string[] = [];
  const warningSpecs = product.specifications as any;
  
  if (input.availableSpace < 15) {
    warnings.push('Espaço disponível insuficiente. Mínimo 15cm necessário.');
  }
  
  if (input.primaryNeed === 'humidity' && !warningSpecs?.humidity_resistance) {
    warnings.push('Produto selecionado pode não ser adequado para alta umidade.');
  }
  
  if (input.obstacles.columns > 5) {
    warnings.push('Muitas colunas podem complicar a instalação.');
  }
  
  if (input.installations.lightFixtures > Math.floor(input.roomLength * input.roomWidth / 4)) {
    warnings.push('Densidade de luminárias muito alta. Verificar estrutura.');
  }
  
  return warnings;
}

// DEPRECATED: Manter compatibilidade
function generateWarnings(input: AcousticMineralCeilingInput, model: AcousticMineralCeilingModel, modelData: any): string[] {
  return generateProductWarnings(input, {});
}

// Função síncrona para compatibilidade com código existente
export function calculateAcousticMineralCeilingSyncLegacy(input: AcousticMineralCeilingInput): AcousticMineralCeilingResult {
  // Fallback usando dados hardcoded para compatibilidade
  const selectedModelName = selectOptimalModel(input);
  const modelData = CEILING_MODELS[selectedModelName];
  const selectedModulation = '625x625' as CeilingModulation;
  const selectedEdgeType = input.manualEdgeType || input.edgeType || 'tegular';

  const totalArea = input.roomLength * input.roomWidth;
  const obstacleArea = input.obstacles.columns * 1;
  const cutoutArea = input.cutoutArea || 0;
  const usefulArea = totalArea - obstacleArea - cutoutArea;
  const perimeter = input.roomPerimeter || (2 * (input.roomLength + input.roomWidth));

  const plateArea = MODULATION_AREAS[selectedModulation];
  const basePlateQuantity = Math.ceil(usefulArea / plateArea);
  const lossPercentage = calculateLossPercentage(input.roomFormat, input.obstacles.columns > 0);
  const totalPlates = Math.ceil(basePlateQuantity * (1 + lossPercentage / 100));
  const platesAfterLights = totalPlates - input.installations.lightFixtures;
  const boxesNeeded = Math.ceil(totalPlates / modelData.platesPerBox);

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
      mainProfile: { meters: 0, bars: 0 },
      perimeterEdge: { meters: 0, bars: 0 },
      suspension: { hangers: 0, regulators: 0, anchors: 0 }
    },
    accessories: { tegularClips: 0, lightSupports: 0, specialAnchors: 0 },
    itemizedCosts: {
      plates: totalPlates * plateArea * 45 * modelData.costMultiplier,
      mainProfile: 0,
      secondaryProfiles: 0,
      perimeterEdge: 0,
      suspension: 0,
      accessories: 0,
      columnEdgeProfiles: 0,
      labor: usefulArea * 35
    },
    totalCost: totalPlates * plateArea * 45 * modelData.costMultiplier + usefulArea * 35,
    acousticPerformance: {
      nrc: modelData.nrc,
      classification: (modelData.nrc >= 0.85 ? 'premium' : 'alta') as 'premium' | 'alta' | 'média' | 'baixa',
      suitableFor: [...modelData.suitableFor]
    },
    technicalSpecs: {
      configuration: `${selectedModulation} ${selectedEdgeType}`,
      finalThickness: 15,
      weight: modelData.weight,
      moistureResistance: modelData.rh,
      installationComplexity: 'média'
    },
    validations: {
      minSpaceOk: true,
      structureCompatible: true,
      modelSuitable: true,
      warnings: []
    },
    
    // Generate quantified items for proposal (legacy function)
    quantified_items: [
      {
        name: selectedModelName,
        description: `Placas de forro mineral acústico ${selectedModulation}`,
        quantity: totalPlates,
        unit: 'un',
        unit_price: 45 * modelData.costMultiplier,
        total_price: totalPlates * plateArea * 45 * modelData.costMultiplier,
        category: 'Forro',
        specifications: {
          modulation: selectedModulation,
          edge_type: selectedEdgeType,
          nrc: modelData.nrc,
          manufacturer: modelData.manufacturer
        }
      },
      {
        name: 'Mão de Obra',
        description: 'Instalação completa do forro mineral acústico',
        quantity: usefulArea,
        unit: 'm²',
        unit_price: 35,
        total_price: usefulArea * 35,
        category: 'Serviços',
        specifications: {}
      }
    ]
  };
}