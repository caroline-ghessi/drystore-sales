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

  // Calcular área líquida (descontar 50% das aberturas)
  const standardDoorArea = 0.80 * 2.10; // Porta padrão
  const standardWindowArea = 1.20 * 1.00; // Janela padrão
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
  
  // Assumindo placas de 2.88 m² (1.20 × 2.40m)
  const plateArea = 2.88;
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
  
  // Materiais extras por nível de acabamento
  const extraMaterials = getExtraMaterialsByFinishLevel(finishType, netArea);
  
  // Cálculo de custos usando produtos específicos ou preços padrão
  const materialCosts = {
    plates: plateQuantity * (productPrices.placas?.price || 25),
    profiles: (montanteQuantity + guiaQuantity) * (productPrices.perfisMetalicos?.price || 15),
    screws: (screw25mmQuantity * 0.05) + (screw13mmQuantity * 0.08),
    jointMass: jointMassQuantity * (productPrices.massaJuntas?.price || 8),
    finishMass: finishMassQuantity * (productPrices.massaAcabamento?.price || 12),
    tape: tapeQuantity * (productPrices.fita?.price || 0.80),
    insulation: insulationQuantity ? insulationQuantity * (productPrices.isolamento?.price || 15) : 0,
    acousticBand: acousticBandQuantity ? acousticBandQuantity * 2.50 : 0,
    // Custos dos materiais extras
    extraMaterialsCost: (extraMaterials.primer * 12) + (extraMaterials.sandpaper * 5) + 
                        (extraMaterials.extraCoats * 50) + (extraMaterials.specialTools * 100)
  };
  
  // Multiplicadores regionais
  const regionalMultipliers = {
    north: 1.25,
    northeast: 1.15,
    center_west: 1.10,
    southeast: 1.0,
    south: 1.08
  };
  
  const regionalMultiplier = regionalMultipliers[region] || 1.0;
  
  // Custos de mão de obra com Sistema Inteligente
  const baseLaborCosts = {
    structure: 15,      // R$/m² para estrutura (constante)
    installation: 20,   // R$/m² para instalação (constante)
    finishing: 35       // R$/m² base para acabamento Level 4
  };
  
  const laborCosts = {
    structure: netArea * baseLaborCosts.structure * regionalMultiplier,
    installation: netArea * baseLaborCosts.installation * regionalMultiplier,
    finishing: netArea * baseLaborCosts.finishing * levelConfig.laborMultiplier * regionalMultiplier,
    insulation: features.insulation ? netArea * 8 * regionalMultiplier : 0
  };
  
  // Horas de mão de obra com Sistema Inteligente
  // Produtividade por nível: Level 3: 8.33 m²/h, Level 4: 6.67 m²/h, Level 5: 5 m²/h
  const finishProductivity = {
    level_3: 8.33, // 12h para 100m²
    level_4: 6.67, // 15h para 100m²  
    level_5: 5.0   // 20h para 100m²
  };
  
  const laborHours = {
    structure: netArea / 15,        // 15 m²/hora para estrutura (constante)
    installation: netArea / 20,     // 20 m²/hora para instalação (constante)
    finishing: netArea / finishProductivity[finishType],
    insulation: features.insulation ? netArea / 25 : undefined
  };
  
  const totalMaterialCost = Object.values(materialCosts).reduce((sum, cost) => sum + cost, 0);
  const totalLaborCost = Object.values(laborCosts).reduce((sum, cost) => sum + cost, 0);
  
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
    }
  };
}

async function getSelectedProductPrices(selectedProducts?: any) {
  if (!selectedProducts) return {};
  
  const productIds = Object.values(selectedProducts).filter(Boolean) as string[];
  if (productIds.length === 0) return {};
  
  try {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, base_price, unit')
      .in('id', productIds);
    
    if (!products) return {};
    
    // Mapear produtos por tipo
    const priceMap: any = {};
    
    products.forEach(product => {
      Object.entries(selectedProducts).forEach(([type, productId]) => {
        if (productId === product.id) {
          priceMap[type] = {
            name: product.name,
            price: product.base_price,
            unit: product.unit
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

// Sistema de materiais extras por nível de acabamento
function getExtraMaterialsByFinishLevel(finishType: 'level_3' | 'level_4' | 'level_5', area: number) {
  switch (finishType) {
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
function getFinishDescription(finishType: 'level_3' | 'level_4' | 'level_5'): string {
  const descriptions = {
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