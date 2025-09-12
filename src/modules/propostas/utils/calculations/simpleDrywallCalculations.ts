import { DrywallCalculationInput, DrywallCalculationResult } from '../../types/calculation.types';

// Função de cálculo simplificada para compatibilidade com a calculadora básica
export function calculateDrywallInstallation(input: DrywallCalculationInput): DrywallCalculationResult {
  const { wallArea, wallHeight, wallConfiguration, features, region } = input;

  // Cálculos básicos
  const plateQuantity = Math.ceil(wallArea * 0.70); // Aproximação
  const montanteQuantity = Math.ceil((wallArea / wallHeight) * 2);
  const guiaQuantity = Math.ceil((wallArea / wallHeight) * 0.6);
  
  // Parafusos
  const screw25mmQuantity = Math.ceil(wallArea * 30);
  const screw13mmQuantity = Math.ceil(wallArea * 8);
  
  // Acabamento
  const massQuantity = wallArea * 0.5;
  const tapeQuantity = wallArea * 2.5;
  
  // Isolamento (se selecionado)
  const insulationQuantity = features.insulation ? Math.ceil(wallArea / 15) : undefined;
  
  // Custos zerados (usuário define preços)
  const materialCosts = {
    plates: plateQuantity * 0,
    profiles: (montanteQuantity + guiaQuantity) * 0,
    screws: (screw25mmQuantity + screw13mmQuantity) * 0,
    mass: massQuantity * 0,
    tape: tapeQuantity * 0,
    insulation: insulationQuantity ? insulationQuantity * 0 : 0,
    acousticBand: features.acousticBand ? wallArea * 0.6 * 0 : 0,
    specialBuckets: 0
  };
  
  const laborCosts = {
    structure: wallArea * 0, // Preço zero - deve vir de produtos configurados
    installation: wallArea * 0, // Preço zero - deve vir de produtos configurados
    finishing: wallArea * 0, // Preço zero - deve vir de produtos configurados
    insulation: features.insulation ? wallArea * 0 : 0 // Preço zero - deve vir de produtos configurados
  };
  
  const laborHours = {
    structure: wallArea / 15,
    installation: wallArea / 20,
    finishing: wallArea / 12,
    insulation: features.insulation ? wallArea / 25 : undefined
  };
  
  const totalMaterialCost = Object.values(materialCosts).reduce((sum, cost) => sum + cost, 0);
  const totalLaborCost = Object.values(laborCosts).reduce((sum, cost) => sum + cost, 0);
  
  return {
    plateQuantity,
    plateArea: plateQuantity, // Compatibilidade  
    montanteQuantity,
    guiaQuantity,
    screw25mmQuantity,
    screw13mmQuantity,
    
    // Massas separadas e campo legado
    jointMassQuantity: massQuantity * 0.4, // 40% para juntas
    finishMassQuantity: massQuantity * 0.6, // 60% para acabamento
    massQuantity, // Campo obrigatório
    
    // Campos de compatibilidade com useProposalCalculator
    profileQuantity: montanteQuantity + guiaQuantity,
    screwQuantity: screw25mmQuantity + screw13mmQuantity,
    jointCompoundQuantity: massQuantity,
    
    tapeQuantity,
    insulationQuantity,
    acousticBandQuantity: features.acousticBand ? wallArea * 0.6 : undefined,
    
    laborHours,
    
    itemizedCosts: {
      materials: materialCosts,
      labor: laborCosts
    },
    
    totalMaterialCost,
    totalLaborCost,
    totalCost: totalMaterialCost + totalLaborCost,
    
    technicalData: {
      finalThickness: wallConfiguration === 'W111' ? 95 : wallConfiguration === 'W112' ? 120 : 107,
      acousticPerformance: features.insulation ? "44-46 dB" : "38-40 dB",
      fireResistance: "30 minutos",
      weightPerM2: wallConfiguration === 'W111' ? 19 : wallConfiguration === 'W112' ? 38 : 27,
      configuration: wallConfiguration.replace('_', ' ').toLowerCase(),
      face1Material: 'drywall padrão',
      face2Material: 'drywall padrão',
      recommendedUse: ['Divisórias internas', 'Uso geral']
    },
    
    // Generate quantified items for proposal
    quantified_items: [
      {
        name: 'Placas Drywall',
        description: 'Placas drywall padrão',
        quantity: plateQuantity,
        unit: 'un',
        unit_price: materialCosts.plates / plateQuantity,
        total_price: materialCosts.plates,
        category: 'Estrutura',
        specifications: { configuration: wallConfiguration }
      },
      {
        name: 'Perfis Metálicos',
        description: 'Montantes e guias metálicos',
        quantity: montanteQuantity + guiaQuantity,
        unit: 'un',
        unit_price: materialCosts.profiles / (montanteQuantity + guiaQuantity),
        total_price: materialCosts.profiles,
        category: 'Estrutura',
        specifications: {}
      },
      ...(totalLaborCost > 0 ? [{
        name: 'Mão de Obra',
        description: 'Instalação completa',
        quantity: wallArea,
        unit: 'm²',
        unit_price: totalLaborCost / wallArea,
        total_price: totalLaborCost,
        category: 'Serviços',
        specifications: {}
      }] : [])
    ]
  };
}