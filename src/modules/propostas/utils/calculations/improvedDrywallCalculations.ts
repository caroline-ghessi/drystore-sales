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
  const { wallArea, wallHeight, openings, features, region, selectedProducts } = input;

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
  
  // MASSA PARA JUNTAS: 0,3-0,4 kg por metro linear
  const jointMassQuantity = totalJointMeters * 0.35; // Usando valor médio
  
  // MASSA DE ACABAMENTO: 0,5-0,8 kg por m² de área total
  const finishMassQuantity = totalPlateArea * 0.65; // Usando valor médio
  
  // 5. FITA PARA JUNTAS
  const tapeQuantity = totalJointMeters * 1.10; // 10% de perda
  
  // 6. ISOLAMENTO (se selecionado)
  const insulationQuantity = features.insulation ? netArea * 1.05 : undefined;
  
  // 7. BANDA ACÚSTICA (se selecionada)
  const acousticBandQuantity = features.acousticBand ? wallLength * 0.6 : undefined;
  
  // Buscar preços dos produtos selecionados
  const productPrices = await getSelectedProductPrices(selectedProducts);
  
  // Cálculo de custos usando produtos específicos ou preços padrão
  const materialCosts = {
    plates: plateQuantity * (productPrices.placas?.price || 25), // Preço padrão se não selecionado
    profiles: (montanteQuantity + guiaQuantity) * (productPrices.perfisMetalicos?.price || 15),
    screws: (screw25mmQuantity * 0.05) + (screw13mmQuantity * 0.08),
    jointMass: jointMassQuantity * (productPrices.massaJuntas?.price || 8), // R$/kg
    finishMass: finishMassQuantity * (productPrices.massaAcabamento?.price || 12), // R$/kg
    tape: tapeQuantity * (productPrices.fita?.price || 0.80), // R$/metro
    insulation: insulationQuantity ? insulationQuantity * (productPrices.isolamento?.price || 15) : 0,
    acousticBand: acousticBandQuantity ? acousticBandQuantity * 2.50 : 0
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
  
  // Custos de mão de obra
  const laborCosts = {
    structure: netArea * 15 * regionalMultiplier,
    installation: netArea * 20 * regionalMultiplier,
    finishing: netArea * 35 * regionalMultiplier,
    insulation: features.insulation ? netArea * 8 * regionalMultiplier : 0
  };
  
  // Horas de mão de obra
  const laborHours = {
    structure: netArea / 15,
    installation: netArea / 20,
    finishing: netArea / 12,
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
    
    // Massas separadas corretamente
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
        mass: materialCosts.jointMass + materialCosts.finishMass, // Legado
        tape: materialCosts.tape,
        insulation: materialCosts.insulation,
        acousticBand: materialCosts.acousticBand
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
      recommendedUse: ['Divisórias internas', 'Uso geral']
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