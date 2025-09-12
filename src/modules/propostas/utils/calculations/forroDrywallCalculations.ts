import { ForroDrywallCalculationInput, ForroDrywallCalculationResult } from '../../types/calculation.types';
import { supabase } from '@/lib/supabase';

// Get prices from product database
async function getProductPrices() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .in('category', ['forros', 'drywall_divisorias']);

    if (error) {
      console.error('Error fetching products:', error);
      return getDefaultPrices();
    }

    const prices: any = {
      plates: {},
      profiles: {},
      suspension: {},
      perimetral: {},
      screws: {},
      finishing: { mass: {}, fiber: {} },
      insulation: {}
    };

    products?.forEach(product => {
      const basePrice = product.base_price || 0;
      
      // Map products based on name keywords
      const productName = product.name.toLowerCase();
      
      if (productName.includes('placa') || productName.includes('chapa')) {
        if (productName.includes('standard') || productName.includes('st')) {
          prices.plates.standard = basePrice;
        } else if (productName.includes('ru') || productName.includes('umidade')) {
          prices.plates.moisture_resistant = basePrice;
        } else if (productName.includes('rf') || productName.includes('acustic')) {
          prices.plates.acoustic = basePrice;
        }
      } else if (productName.includes('perfil')) {
        prices.profiles.steel = basePrice;
      } else if (productName.includes('suspensao') || productName.includes('suporte')) {
        prices.suspension.complete_set = basePrice;
      } else if (productName.includes('massa')) {
        if (productName.includes('pva')) {
          prices.finishing.mass.PVA = basePrice;
        } else if (productName.includes('acril')) {
          prices.finishing.mass.acrylic = basePrice;
        }
      } else if (productName.includes('fita')) {
        if (productName.includes('vidro') || productName.includes('fiberglass')) {
          prices.finishing.fiber.fiberglass = basePrice;
        } else if (productName.includes('papel') || productName.includes('paper')) {
          prices.finishing.fiber.paper = basePrice;
        }
      } else if (productName.includes('isolamento') || productName.includes('la')) {
        if (productName.includes('rocha') || productName.includes('rockwool')) {
          prices.insulation.rockwool = basePrice;
        } else if (productName.includes('vidro') || productName.includes('fiberglass')) {
          prices.insulation.fiberglass = basePrice;
        } else if (productName.includes('poliuretano') || productName.includes('polyurethane')) {
          prices.insulation.polyurethane = basePrice;
        }
      }
      
      // Set default perimeter and screw prices
      if (!prices.perimetral.L_profile) prices.perimetral.L_profile = 12;
      if (!prices.perimetral.shadow_gap) prices.perimetral.shadow_gap = 15;
      if (!prices.perimetral.decorative_molding) prices.perimetral.decorative_molding = 18;
      if (!prices.screws.plate) prices.screws.plate = 0.15;
    });

    return prices;
  } catch (error) {
    console.error('Error in getProductPrices:', error);
    return getDefaultPrices();
  }
}

// Default prices as fallback
function getDefaultPrices() {
  return {
    plates: {
      standard: 85,
      moisture_resistant: 95,
      acoustic: 105,
    },
    profiles: {
      steel: 15,
    },
    suspension: {
      complete_set: 8,
    },
    perimetral: {
      L_profile: 12,
      shadow_gap: 15,
      decorative_molding: 18,
    },
    screws: {
      plate: 0.15,
    },
    finishing: {
      mass: {
        PVA: 8,
        acrylic: 12,
      },
      fiber: {
        fiberglass: 2.5,
        paper: 2.8,
      },
    },
    insulation: {
      rockwool: 18,
      fiberglass: 16,
      polyurethane: 25,
    },
  };
}

export async function calculateForroDrywall(input: ForroDrywallCalculationInput): Promise<ForroDrywallCalculationResult> {
  const { 
    ceilingArea, 
    perimeterLength, 
    plateType, 
    plateDimensions, 
    perimeterFinishingType, 
    massType, 
    fiberType,
    insulation,
    accessories,
    region = 'southeast'
  } = input;

  // Get prices from database
  const productPrices = await getProductPrices();

  // Calculate quantities - rounded with Math.ceil for accurate material needs
  const plateQuantity = Math.ceil(ceilingArea / 2.88 * 1.1); // 10% waste
  const profileQuantity = Math.ceil(ceilingArea * 2.2 * 1.05); // 5% waste, rounded
  const suspensionSetQuantity = Math.ceil(ceilingArea * 1.8);
  const perimetralFinishingQuantity = Math.ceil(perimeterLength);
  const screwQuantity = Math.ceil(ceilingArea * 17 * 1.2);
  const massQuantity = Math.ceil(ceilingArea * (massType === 'PVA' ? 0.35 : 0.7) * 1.1);
  const tapeQuantity = Math.ceil(ceilingArea * 3.0 * 1.1);

  let insulationQuantity: number | undefined;
  if (insulation.enabled) {
    insulationQuantity = Math.ceil(ceilingArea * 1.05);
  }

  // Regional multiplier fixed at 1.0 (national uniformity)
  const totalMultiplier = 1.0;
  
  const platesCost = plateQuantity * productPrices.plates[plateType] * totalMultiplier;
  const profilesCost = profileQuantity * productPrices.profiles.steel * totalMultiplier;
  const suspensionCost = suspensionSetQuantity * productPrices.suspension.complete_set * totalMultiplier;
  const perimetralCost = perimetralFinishingQuantity * productPrices.perimetral[perimeterFinishingType] * totalMultiplier;
  const screwsCost = screwQuantity * productPrices.screws.plate;
  const massCost = massQuantity * productPrices.finishing.mass[massType];
  const tapeCost = tapeQuantity * productPrices.finishing.fiber[fiberType];
  const laborCost = ceilingArea * 25;
  
  let insulationCost = 0;
  if (insulationQuantity && insulation.type) {
    insulationCost = insulationQuantity * productPrices.insulation[insulation.type] * totalMultiplier;
  }

  const accessoriesTotal = Object.values(accessories).reduce((sum, qty) => sum + qty, 0);
  const accessoriesCost = accessoriesTotal * 50;

  const itemizedCosts = {
    plates: platesCost,
    profiles: profilesCost,
    suspension: suspensionCost,
    perimetralFinishing: perimetralCost,
    screws: screwsCost,
    mass: massCost,
    tape: tapeCost,
    insulation: insulationCost,
    accessories: accessoriesCost,
    labor: laborCost,
  };

  const totalCost = Object.values(itemizedCosts).reduce((sum, cost) => sum + cost, 0);

  // Generate quantified items for proposal - filter out items with zero quantity
  const quantified_items = [
    {
      name: 'Placas de Forro Drywall',
      description: `Placas ${plateType} para forro`,
      quantity: plateQuantity,
      unit: 'un',
      unit_price: productPrices.plates[plateType] * totalMultiplier,
      total_price: platesCost,
      category: 'Estrutura',
      specifications: { plate_type: plateType }
    },
    {
      name: 'Perfis Metálicos',
      description: 'Perfis de sustentação e travamento',
      quantity: profileQuantity,
      unit: 'm',
      unit_price: productPrices.profiles.steel * totalMultiplier,
      total_price: profilesCost,
      category: 'Estrutura',
      specifications: {}
    },
    {
      name: 'Sistema de Suspensão',
      description: 'Conjuntos completos de suspensão',
      quantity: suspensionSetQuantity,
      unit: 'conj',
      unit_price: productPrices.suspension.complete_set * totalMultiplier,
      total_price: suspensionCost,
      category: 'Estrutura',
      specifications: {}
    },
    {
      name: 'Acabamento Perimetral',
      description: `${perimeterFinishingType} para acabamento`,
      quantity: perimetralFinishingQuantity,
      unit: 'm',
      unit_price: productPrices.perimetral[perimeterFinishingType] * totalMultiplier,
      total_price: perimetralCost,
      category: 'Acabamento',
      specifications: {}
    },
    {
      name: 'Parafusos',
      description: 'Parafusos para fixação das placas',
      quantity: screwQuantity,
      unit: 'un',
      unit_price: productPrices.screws.plate,
      total_price: screwsCost,
      category: 'Fixação',
      specifications: {}
    },
    {
      name: 'Massa para Juntas',
      description: `Massa ${massType} para tratamento de juntas`,
      quantity: massQuantity,
      unit: 'kg',
      unit_price: productPrices.finishing.mass[massType],
      total_price: massCost,
      category: 'Acabamento',
      specifications: {}
    },
    {
      name: 'Fita para Juntas',
      description: `Fita ${fiberType} para reforço`,
      quantity: tapeQuantity,
      unit: 'm',
      unit_price: productPrices.finishing.fiber[fiberType],
      total_price: tapeCost,
      category: 'Acabamento',
      specifications: {}
    },
    {
      name: 'Mão de Obra',
      description: 'Instalação completa do forro de drywall',
      quantity: ceilingArea,
      unit: 'm²',
      unit_price: 25,
      total_price: laborCost,
      category: 'Serviços',
      specifications: {}
    }
  ];

  // Add insulation if enabled
  if (insulationQuantity && insulationQuantity > 0 && insulation.type) {
    quantified_items.push({
      name: 'Isolamento Térmico/Acústico',
      description: `Isolamento ${insulation.type}`,
      quantity: insulationQuantity,
      unit: 'm²',
      unit_price: productPrices.insulation[insulation.type] * totalMultiplier,
      total_price: insulationCost,
      category: 'Isolamento',
      specifications: {}
    });
  }

  // Add accessories if any
  if (accessoriesTotal > 0) {
    quantified_items.push({
      name: 'Acessórios Especiais',
      description: 'Spots, difusores e alçapões',
      quantity: accessoriesTotal,
      unit: 'un',
      unit_price: 50,
      total_price: accessoriesCost,
      category: 'Acessórios',
      specifications: {}
    });
  }

  // Filter out items with zero quantity
  const filteredItems = quantified_items.filter(item => item.quantity > 0);

  return {
    plateQuantity,
    profileQuantity,
    suspensionSetQuantity,
    perimetralFinishingQuantity,
    screwQuantity,
    massQuantity,
    tapeQuantity,
    insulationQuantity,
    accessoriesQuantity: accessories,
    itemizedCosts,
    totalCost,
    quantified_items: filteredItems,
  };
}