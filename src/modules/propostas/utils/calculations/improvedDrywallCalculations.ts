import { DrywallCalculationInput, DrywallCalculationResult } from '../../types/calculation.types';
import { supabase } from '@/integrations/supabase/client';

interface DrywallProduct {
  id: string;
  name: string;
  base_price: number;
  unit: string;
  specifications?: any;
}

export async function calculateImprovedDrywall(input: DrywallCalculationInput): Promise<DrywallCalculationResult> {
  const { wallArea, wallHeight, openings, features, region, selectedProducts, finishType = 'level_4' } = input;

  // Buscar especificações dos produtos configurados
  const productSpecs = await getProductSpecifications(selectedProducts);
  
  // Calcular área líquida usando dimensões dos produtos ou área fornecida
  const standardDoorArea = productSpecs.door_dimensions?.area || (wallArea * 0.1); // Se não configurado, assume 10% da área
  const standardWindowArea = productSpecs.window_dimensions?.area || (wallArea * 0.05); // Se não configurado, assume 5% da área
  const totalOpeningsArea = (openings.doors * standardDoorArea) + (openings.windows * standardWindowArea);
  const netArea = wallArea - (totalOpeningsArea * 0.5); // Desconto parcial de 50%
  
  // Calcular dimensões baseadas na área e altura
  const wallLength = netArea / wallHeight;
  
  // Cálculos de materiais baseados na documentação técnica
  
  // 1. PLACAS DE DRYWALL
  const plateAreaPerFace = netArea;
  const totalPlateArea = plateAreaPerFace * 2; // 2 faces
  const wasteFactor = 1.15; // 15% de perda
  const plateAreaWithWaste = totalPlateArea * wasteFactor;
  
  // Usar área da placa configurada no produto ou calcular baseado na área total
  const plateArea = productSpecs.plate_dimensions?.area || (plateAreaWithWaste / Math.ceil(plateAreaWithWaste / 2.88));
  const plateQuantity = Math.ceil(plateAreaWithWaste / plateArea);
  
  // 2. PERFIS METÁLICOS
  
  // Guias (superior e inferior)
  const guiaLength = wallLength * 2; // Superior + inferior
  const guiaQuantity = Math.ceil(guiaLength / 3) * 1.05; // Barras de 3m + 5% perda
  
  // Montantes (espaçamento de 60cm)
  const montanteSpacing = 0.60;
  const baseMontantes = Math.floor(wallLength / montanteSpacing) + 1;
  
  // Montantes extras para reforços em aberturas
  const doorReinforcementMontantes = openings.doors * 4; // 4 montantes por porta
  const windowReinforcementMontantes = openings.windows * 6; // 6 montantes por janela
  
  const totalMontantes = baseMontantes + doorReinforcementMontantes + windowReinforcementMontantes;
  const montanteLength = wallHeight - 0.01; // 1cm de folga
  const totalMontanteLength = totalMontantes * montanteLength;
  const montanteQuantity = Math.ceil(totalMontanteLength / 3) * 1.05; // Barras de 3m + 5% perda
  
  // 3. PARAFUSOS
  const screw13mmQuantity = totalMontantes * 6; // 6 parafusos por montante
  const screw25mmQuantity = Math.ceil((totalPlateArea / 0.30) * 1.10); // Espaçamento de 30cm + 10%
  
  // 4. CÁLCULO CORRETO DE MASSAS (conforme documentação)
  
  // Calcular metros lineares de juntas
  const platesPerRow = Math.ceil(wallLength / 1.20); // Placas de 1.20m de largura
  const platesPerColumn = Math.ceil(wallHeight / 2.40); // Placas de 2.40m de altura
  
  // Juntas verticais (entre placas na horizontal)
  const verticalJoints = (platesPerRow - 1) * wallHeight * 2; // 2 faces
  
  // Juntas horizontais (entre placas na vertical, se existirem)
  const horizontalJoints = platesPerColumn > 1 ? (platesPerColumn - 1) * wallLength * 2 : 0;
  
  // Perímetro (bordas da parede)
  const perimeter = 2 * (wallLength + wallHeight);
  
  // Total de metros lineares de junta
  const totalJointMeters = verticalJoints + horizontalJoints + perimeter;
  
  // 5. SISTEMA INTELIGENTE DE ACABAMENTO POR NÍVEL
  const finishLevelMultipliers = {
    no_finish: {
      joint: 0.15,      // kg/m linear - Apenas rejunte básico mínimo
      finish: 0.0,      // kg/m² - Sem massa de acabamento
      laborMultiplier: 0.0,     // Zero mão de obra
      timeline: 0.4     // Apenas logística de materiais
    },
    level_3: { 
      joint: 0.3,       // kg/m linear - Texturizado (menor consumo)
      finish: 0.45,     // kg/m² - Superfície para textura
      laborMultiplier: 1.0,     // Multiplicador base (12h/100m²)
      timeline: 1.0     // Cronograma base
    },
    level_4: { 
      joint: 0.35,      // kg/m linear - Tinta fosca (consumo médio)
      finish: 0.65,     // kg/m² - Boa uniformidade
      laborMultiplier: 1.25,    // 25% mais tempo (15h/100m²)
      timeline: 1.15    // 15% mais tempo total
    },
    level_5: { 
      joint: 0.4,       // kg/m linear - Tinta brilhante (maior consumo)
      finish: 0.9,      // kg/m² - Superfície perfeita
      laborMultiplier: 1.67,    // 67% mais tempo (20h/100m²)
      timeline: 1.35    // 35% mais tempo total
    }
  };
  
  const levelConfig = finishLevelMultipliers[finishType];
  
  // MASSAS com Sistema Inteligente
  const jointMassQuantity = totalJointMeters * levelConfig.joint;
  const finishMassQuantity = totalPlateArea * levelConfig.finish;
  
  // 6. FITA PARA JUNTAS
  const tapeQuantity = totalJointMeters * 1.10; // 10% de perda
  
  // 7. ISOLAMENTO (se selecionado)
  const insulationQuantity = features.insulation ? netArea * 1.05 : undefined;
  
  // 8. BANDA ACÚSTICA (se selecionada)
  const acousticBandQuantity = features.acousticBand ? wallLength * 0.6 : undefined;
  
  // Buscar preços dos produtos selecionados
  const productPrices = await getSelectedProductPrices(selectedProducts);
  
  // Buscar preços dos serviços (mão de obra)
  const servicePrices = await getServicePricing();
  
  // Materiais extras por nível de acabamento
  const extraMaterials = getExtraMaterialsByFinishLevel(finishType, netArea);
  
  // Cálculo de custos usando APENAS produtos configurados (preço 0 se não configurado)
  const materialCosts = {
    plates: plateQuantity * (productPrices.placas?.price || 0),
    profiles: (montanteQuantity + guiaQuantity) * (productPrices.perfisMetalicos?.price || 0),
    screws: (screw25mmQuantity * (productPrices.parafusos?.price || 0)) + (screw13mmQuantity * (productPrices.parafusos?.price || 0)),
    jointMass: jointMassQuantity * (productPrices.massaJuntas?.price || 0),
    finishMass: finishMassQuantity * (productPrices.massaAcabamento?.price || 0),
    tape: tapeQuantity * (productPrices.fita?.price || 0),
    insulation: insulationQuantity ? insulationQuantity * (productPrices.isolamento?.price || 0) : 0,
    acousticBand: acousticBandQuantity ? acousticBandQuantity * (productPrices.bandaAcustica?.price || 0) : 0,
    // Custos dos materiais extras usando preços de produtos
    extraMaterialsCost: (extraMaterials.primer * (productPrices.primer?.price || 0)) + 
                        (extraMaterials.sandpaper * (productPrices.lixa?.price || 0)) + 
                        (extraMaterials.extraCoats * (productPrices.demaoExtra?.price || 0)) + 
                        (extraMaterials.specialTools * (productPrices.ferramentasEspeciais?.price || 0))
  };
  
  // Multiplicador regional fixado em 1.0 (sem variação regional)
  const regionalMultiplier = 1.0;
  
  // Custos de mão de obra usando APENAS serviços configurados
  const baseLaborCosts = {
    structure: servicePrices.estrutura?.price || 0,      // R$/m² vindo de produtos de serviço
    installation: servicePrices.instalacao?.price || 0,  // R$/m² vindo de produtos de serviço
    finishing: servicePrices.acabamento?.price || 0      // R$/m² vindo de produtos de serviço
  };
  
  // ZERO mão de obra para "Sem Acabamento"
  const laborCosts = finishType === 'no_finish' ? {
    structure: 0,
    installation: 0,
    finishing: 0,
    insulation: 0
  } : {
    structure: netArea * baseLaborCosts.structure * regionalMultiplier,
    installation: netArea * baseLaborCosts.installation * regionalMultiplier,
    finishing: netArea * baseLaborCosts.finishing * levelConfig.laborMultiplier * regionalMultiplier,
    insulation: features.insulation ? netArea * (servicePrices.isolamento?.price || 0) * regionalMultiplier : 0
  };
  
  // Horas de mão de obra com Sistema Inteligente
  // Produtividade por nível: Level 3: 8.33 m²/h, Level 4: 6.67 m²/h, Level 5: 5 m²/h
  const finishProductivity = {
    no_finish: 0,       // Zero horas para sem acabamento
    level_3: 8.33,      // 12h para 100m²
    level_4: 6.67,      // 15h para 100m²  
    level_5: 5.0        // 20h para 100m²
  };
  
  // ZERO horas para "Sem Acabamento"
  const laborHours = finishType === 'no_finish' ? {
    structure: 0,
    installation: 0,
    finishing: 0,
    insulation: 0
  } : {
    structure: netArea / 15,        // 15 m²/hora para estrutura (constante)
    installation: netArea / 20,     // 20 m²/hora para instalação (constante)
    finishing: netArea / finishProductivity[finishType],
    insulation: features.insulation ? netArea / 25 : undefined
  };
  
  const totalMaterialCost = Object.values(materialCosts).reduce((sum, cost) => sum + cost, 0);
  const totalLaborCost = Object.values(laborCosts).reduce((sum, cost) => sum + cost, 0);
  
  // Generate quantified items for proposal
  const quantified_items = [
    {
      name: 'Placas Drywall',
      description: `Placas drywall para ${input.wallConfiguration || 'divisórias'}`,
      quantity: plateQuantity,
      unit: 'un',
      unit_price: materialCosts.plates / plateQuantity,
      total_price: materialCosts.plates,
      category: 'Estrutura',
      specifications: { area_coverage: plateArea }
    },
    {
      name: 'Perfis Metálicos',
      description: 'Montantes e guias metálicos',
      quantity: totalMontantes + Math.ceil(guiaLength / 3),
      unit: 'un',
      unit_price: materialCosts.profiles / (totalMontantes + Math.ceil(guiaLength / 3)),
      total_price: materialCosts.profiles,
      category: 'Estrutura',
      specifications: {}
    },
    {
      name: 'Massa para Juntas',
      description: 'Massa para tratamento de juntas',
      quantity: jointMassQuantity,
      unit: 'kg',
      unit_price: productPrices.massaJuntas?.price || 0,
      total_price: materialCosts.jointMass,
      category: 'Acabamento',
      specifications: {}
    },
    {
      name: 'Massa de Acabamento',
      description: `Massa de acabamento ${finishType}`,
      quantity: finishMassQuantity,
      unit: 'kg',
      unit_price: productPrices.massaAcabamento?.price || 0,
      total_price: materialCosts.finishMass,
      category: 'Acabamento',
      specifications: { finish_level: finishType }
    },
    {
      name: 'Fita para Juntas',
      description: 'Fita de papel para juntas',
      quantity: tapeQuantity,
      unit: 'm',
      unit_price: productPrices.fita?.price || 0,
      total_price: materialCosts.tape,
      category: 'Acabamento',
      specifications: {}
    }
  ];

  // Add insulation if specified
  if (features.insulation && insulationQuantity) {
    quantified_items.push({
      name: 'Isolamento Termoacústico',
      description: 'Lã de vidro ou rocha para isolamento',
      quantity: insulationQuantity,
      unit: 'm²',
      unit_price: productPrices.isolamento?.price || 0,
      total_price: materialCosts.insulation,
      category: 'Isolamento',
      specifications: {}
    });
  }

  // Add labor if not "no_finish"
  if (finishType !== 'no_finish' && totalLaborCost > 0) {
    quantified_items.push({
      name: 'Mão de Obra',
      description: `Instalação completa com acabamento ${finishType}`,
      quantity: netArea,
      unit: 'm²',
      unit_price: totalLaborCost / netArea,
      total_price: totalLaborCost,
      category: 'Serviços',
      specifications: { finish_level: finishType }
    });
  }

  return {
    plateQuantity,
    plateArea: plateQuantity, // Compatibilidade
    montanteQuantity: totalMontantes,
    guiaQuantity: Math.ceil(guiaLength / 3),
    screw25mmQuantity,
    screw13mmQuantity,
    
    // Massas separadas com Sistema Inteligente
    jointMassQuantity,
    finishMassQuantity,
    tapeQuantity,
    
    // Campos legados obrigatórios para compatibilidade
    massQuantity: jointMassQuantity + finishMassQuantity,
    
    // Campos legados adicionais para compatibilidade com useProposalCalculator
    profileQuantity: totalMontantes + Math.ceil(guiaLength / 3),
    screwQuantity: screw25mmQuantity + screw13mmQuantity,
    jointCompoundQuantity: jointMassQuantity + finishMassQuantity,
    
    insulationQuantity,
    acousticBandQuantity,
    
    laborHours,
    
    itemizedCosts: {
      materials: {
        plates: materialCosts.plates,
        profiles: materialCosts.profiles,
        screws: materialCosts.screws,
        mass: materialCosts.jointMass + materialCosts.finishMass,
        tape: materialCosts.tape,
        insulation: materialCosts.insulation,
        acousticBand: materialCosts.acousticBand,
        extraMaterials: materialCosts.extraMaterialsCost
      },
      labor: laborCosts
    },
    
    totalMaterialCost,
    totalLaborCost,
    totalCost: totalMaterialCost + totalLaborCost,
    
    technicalData: {
      finalThickness: input.wallConfiguration === 'W111' ? 95 : input.wallConfiguration === 'W112' ? 120 : 107,
      acousticPerformance: features.insulation ? "44-46 dB" : "38-40 dB",
      fireResistance: "30 minutos",
      weightPerM2: input.wallConfiguration === 'W111' ? 19 : input.wallConfiguration === 'W112' ? 38 : 27,
      configuration: input.wallConfiguration.replace('_', ' ').toLowerCase(),
      face1Material: 'drywall padrão',
      face2Material: 'drywall padrão',
      recommendedUse: ['Divisórias internas', 'Uso geral'],
      
      // Dados específicos do Sistema Inteligente de Acabamento
      finishLevel: finishType,
      finishDescription: getFinishDescription(finishType),
      extraMaterials: extraMaterials,
      timelineMultiplier: levelConfig.timeline,
      estimatedDays: Math.ceil((netArea / 20) * levelConfig.timeline) // Base: 20m²/dia
    },
    quantified_items
  };
}

async function getSelectedProductPrices(selectedProducts?: any) {
  if (!selectedProducts) return {};
  
  const productIds = Object.values(selectedProducts).filter(Boolean) as string[];
  if (productIds.length === 0) return {};
  
  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, base_price, unit, specifications')
      .in('id', productIds);
    
    if (!products) return {};
    
    // Mapear produtos por tipo
    const priceMap: any = {};
    
    products.forEach(product => {
      Object.entries(selectedProducts).forEach(([type, productId]) => {
        if (productId === product.id) {
          priceMap[type] = {
            name: product.name,
            price: product.base_price || 0,
            unit: product.unit,
            specifications: product.specifications
          };
        }
      });
    });
    
    return priceMap;
  } catch (error) {
    console.error('Erro ao buscar preços dos produtos:', error);
    return {};
  }
}

// Nova função para buscar especificações técnicas dos produtos
async function getProductSpecifications(selectedProducts?: any) {
  if (!selectedProducts) return {};
  
  try {
    // Buscar produtos de drywall_divisorias configurados
    const { data: products } = await supabase
      .from('products')
      .select('id, name, specifications, subcategory')
      .eq('category', 'drywall_divisorias')
      .eq('is_active', true);
    
    if (!products) return {};
    
    const specs: any = {};
    
    // Buscar especificações por subcategoria
    products.forEach(product => {
      if (product.specifications) {
        const subcategory = product.subcategory || 'general';
        if (subcategory.includes('placa')) {
          specs.plate_dimensions = product.specifications;
        } else if (subcategory.includes('porta')) {
          specs.door_dimensions = product.specifications;
        } else if (subcategory.includes('janela')) {
          specs.window_dimensions = product.specifications;
        }
      }
    });
    
    return specs;
  } catch (error) {
    console.error('Erro ao buscar especificações dos produtos:', error);
    return {};
  }
}

// Nova função para buscar preços de serviços (mão de obra)
async function getServicePricing() {
  try {
    const { data: services } = await supabase
      .from('products')
      .select('id, name, base_price, subcategory')
      .eq('category', 'drywall_divisorias')
      .eq('subcategory', 'servicos')
      .eq('is_active', true);
    
    if (!services) return {};
    
    const servicePrices: any = {};
    
    services.forEach(service => {
      const serviceName = service.name.toLowerCase();
      if (serviceName.includes('estrutura')) {
        servicePrices.estrutura = { price: service.base_price || 0 };
      } else if (serviceName.includes('instalacao') || serviceName.includes('instalação')) {
        servicePrices.instalacao = { price: service.base_price || 0 };
      } else if (serviceName.includes('acabamento')) {
        servicePrices.acabamento = { price: service.base_price || 0 };
      } else if (serviceName.includes('isolamento')) {
        servicePrices.isolamento = { price: service.base_price || 0 };
      }
    });
    
    return servicePrices;
  } catch (error) {
    console.error('Erro ao buscar preços dos serviços:', error);
    return {};
  }
}

// Sistema de materiais extras por nível de acabamento (apenas quantidades)
function getExtraMaterialsByFinishLevel(finishType: 'level_3' | 'level_4' | 'level_5' | 'no_finish', area: number) {
  switch (finishType) {
    case 'no_finish':
      return {
        primer: 0,
        sandpaper: 0,
        extraCoats: 0,
        specialTools: 0,
        description: 'Sem acabamento - Apenas materiais estruturais'
      };
    case 'level_5':
      return {
        primer: area * 0.15, // L/m² - Primer específico para nível 5
        sandpaper: area * 0.25, // m² - Lixa mais fina e maior quantidade  
        extraCoats: 2, // Demãos extras de massa
        specialTools: 1, // Ferramentas especializadas
        description: 'Primer de alta aderência, lixa grão 220/320, ferramentas de precisão'
      };
    case 'level_4':
      return {
        primer: area * 0.10, // L/m² - Primer padrão
        sandpaper: area * 0.15, // m² - Lixa padrão
        extraCoats: 1, // Uma demão extra
        specialTools: 0,
        description: 'Primer padrão, lixa grão 150/180'
      };
    case 'level_3':
    default:
      return {
        primer: area * 0.05, // L/m² - Primer básico  
        sandpaper: area * 0.08, // m² - Lixa básica
        extraCoats: 0, // Sem demãos extras
        specialTools: 0,
        description: 'Primer básico, lixa grão 100/120, textura aplicada'
      };
  }
}

// Descrições técnicas dos níveis de acabamento
function getFinishDescription(finishType: 'level_3' | 'level_4' | 'level_5' | 'no_finish'): string {
  const descriptions = {
    no_finish: 'Sem Acabamento - Apenas Materiais: Fornecimento de materiais para construção da estrutura. Não inclui mão de obra de instalação ou acabamento.',
    level_3: 'Acabamento Nível 3 - Texturizado: Superfície preparada para texturas decorativas e tintas que escondem pequenas imperfeições. Ideal para áreas residenciais com acabamento texturizado.',
    level_4: 'Acabamento Nível 4 - Tinta Fosca/Acetinada: Superfície lisa preparada para tintas foscas e acetinadas. Padrão comercial com excelente relação custo-benefício.',
    level_5: 'Acabamento Nível 5 - Tinta Brilhante/Semibrilho: Superfície perfeitamente lisa para tintas brilhantes e semibrillhantes. Máxima qualidade para ambientes sofisticados.'
  };
  
  return descriptions[finishType];
}

// Função auxiliar para seleção automática de produtos (mais econômicos)
async function getOptimalProducts(category: 'drywall_divisorias' | 'energia_solar' | 'battery_backup', functionTypes: string[]) {
  try {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('base_price', { ascending: true });
    
    if (!products) return {};
    
    const optimal: any = {};
    
    functionTypes.forEach(functionType => {
      // Buscar o produto mais barato que atenda à função
      const candidates = products.filter(p => 
        (p.subcategory && p.subcategory.includes(functionType)) ||
        p.name.toLowerCase().includes(functionType.toLowerCase())
      );
      
      if (candidates.length > 0) {
        optimal[functionType] = candidates[0].id;
      }
    });
    
    return optimal;
  } catch (error) {
    console.error('Erro ao buscar produtos otimizados:', error);
    return {};
  }
}