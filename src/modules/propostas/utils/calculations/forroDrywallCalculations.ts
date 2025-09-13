import { ForroDrywallCalculationInput, ForroDrywallCalculationResult } from '../../types/calculation.types';
import { supabase } from '@/lib/supabase';

// Get prices from product database - using ONLY database values, no hardcoded fallbacks
async function getProductPrices() {
  try {
    console.log('🔍 Buscando produtos na categoria: forro_drywall');
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'forro_drywall')
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error fetching products:', error);
      // Return zero prices structure - no hardcoded fallbacks
      return {
        plates: { standard: 0, moisture_resistant: 0, acoustic: 0 },
        profiles: { steel: 0 },
        suspension: { complete_set: 0 },
        perimetral: { L_profile: 0, shadow_gap: 0, decorative_molding: 0 },
        screws: { plate: 0 },
        finishing: { mass: { PVA: 0, acrylic: 0 }, fiber: { fiberglass: 0, paper: 0 } },
        insulation: { rockwool: 0, fiberglass: 0, polyurethane: 0 }
      };
    }

    console.log(`✅ Produtos encontrados: ${products?.length || 0}`);
    
    const prices: any = {
      plates: { standard: 0, moisture_resistant: 0, acoustic: 0 },
      profiles: { steel: 0 },
      suspension: { complete_set: 0 },
      perimetral: { L_profile: 0, shadow_gap: 0, decorative_molding: 0 },
      screws: { plate: 0 },
      finishing: { mass: { PVA: 0, acrylic: 0 }, fiber: { fiberglass: 0, paper: 0 } },
      insulation: { rockwool: 0, fiberglass: 0, polyurethane: 0 }
    };

    products?.forEach(product => {
      const basePrice = Number(product.base_price) || 0;
      console.log(`📦 Produto: ${product.name} | Subcategoria: ${product.subcategory || 'N/A'} | Preço: R$ ${basePrice}`);
      
      // Map products based on subcategory and name keywords
      const subcategory = product.subcategory?.toLowerCase() || '';
      const productName = product.name.toLowerCase();
      
      // Placas - usar subcategorias
      if (subcategory.includes('placas_st') || productName.includes('placa') && productName.includes('st')) {
        prices.plates.standard = basePrice;
        console.log(`✅ Mapeado placa standard: R$ ${basePrice}`);
      } else if (subcategory.includes('placas_ru') || productName.includes('placa') && productName.includes('ru')) {
        prices.plates.moisture_resistant = basePrice;
        console.log(`✅ Mapeado placa RU: R$ ${basePrice}`);
      } else if (subcategory.includes('placas_rf') || productName.includes('placa') && productName.includes('rf')) {
        prices.plates.acoustic = basePrice;
        console.log(`✅ Mapeado placa RF: R$ ${basePrice}`);
      }
      
      // Perfis
      else if (productName.includes('perfil') || subcategory.includes('perfis')) {
        prices.profiles.steel = basePrice;
        console.log(`✅ Mapeado perfil: R$ ${basePrice}`);
      }
      
      // Sistema de suspensão
      else if (productName.includes('suspensao') || productName.includes('suporte') || subcategory.includes('suspensao')) {
        prices.suspension.complete_set = basePrice;
        console.log(`✅ Mapeado suspensão: R$ ${basePrice}`);
      }
      
      // Acabamento perimetral
      else if (productName.includes('perimetral') || productName.includes('perfil l')) {
        prices.perimetral.L_profile = basePrice;
        console.log(`✅ Mapeado perfil L: R$ ${basePrice}`);
      } else if (productName.includes('shadow') || productName.includes('sombra')) {
        prices.perimetral.shadow_gap = basePrice;
        console.log(`✅ Mapeado shadow gap: R$ ${basePrice}`);
      } else if (productName.includes('moldura') || productName.includes('decorativ')) {
        prices.perimetral.decorative_molding = basePrice;
        console.log(`✅ Mapeado moldura decorativa: R$ ${basePrice}`);
      }
      
      // Parafusos
      else if (productName.includes('parafuso') || subcategory.includes('parafusos')) {
        prices.screws.plate = basePrice;
        console.log(`✅ Mapeado parafuso: R$ ${basePrice}`);
      }
      
      // Massa para juntas
      else if (productName.includes('massa')) {
        if (productName.includes('pva')) {
          prices.finishing.mass.PVA = basePrice;
          console.log(`✅ Mapeado massa PVA: R$ ${basePrice}`);
        } else if (productName.includes('acril')) {
          prices.finishing.mass.acrylic = basePrice;
          console.log(`✅ Mapeado massa acrílica: R$ ${basePrice}`);
        }
      }
      
      // Fita para juntas
      else if (productName.includes('fita')) {
        if (productName.includes('vidro') || productName.includes('fiberglass')) {
          prices.finishing.fiber.fiberglass = basePrice;
          console.log(`✅ Mapeado fita fibra de vidro: R$ ${basePrice}`);
        } else if (productName.includes('papel') || productName.includes('paper')) {
          prices.finishing.fiber.paper = basePrice;
          console.log(`✅ Mapeado fita de papel: R$ ${basePrice}`);
        }
      }
      
      // Isolamento
      else if (productName.includes('isolamento') || productName.includes('la')) {
        if (productName.includes('rocha') || productName.includes('rockwool')) {
          prices.insulation.rockwool = basePrice;
          console.log(`✅ Mapeado isolamento lã de rocha: R$ ${basePrice}`);
        } else if (productName.includes('vidro') || productName.includes('fiberglass')) {
          prices.insulation.fiberglass = basePrice;
          console.log(`✅ Mapeado isolamento fibra de vidro: R$ ${basePrice}`);
        } else if (productName.includes('poliuretano') || productName.includes('polyurethane')) {
          prices.insulation.polyurethane = basePrice;
          console.log(`✅ Mapeado isolamento poliuretano: R$ ${basePrice}`);
        }
      }
    });

    console.log('💰 Estrutura final de preços:', prices);
    return prices;
    
  } catch (error) {
    console.error('❌ Error in getProductPrices:', error);
    // Return zero prices structure - no hardcoded fallbacks
    return {
      plates: { standard: 0, moisture_resistant: 0, acoustic: 0 },
      profiles: { steel: 0 },
      suspension: { complete_set: 0 },
      perimetral: { L_profile: 0, shadow_gap: 0, decorative_molding: 0 },
      screws: { plate: 0 },
      finishing: { mass: { PVA: 0, acrylic: 0 }, fiber: { fiberglass: 0, paper: 0 } },
      insulation: { rockwool: 0, fiberglass: 0, polyurethane: 0 }
    };
  }
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
  const laborCost = input.laborConfig?.includeLabor 
    ? ceilingArea * (input.laborConfig.laborCostPerM2 || 25)
    : 0;
  
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
  ];

  // Add labor if enabled
  if (input.laborConfig?.includeLabor) {
    quantified_items.push({
      name: 'Mão de Obra',
      description: 'Instalação completa do forro de drywall',
      quantity: ceilingArea,
      unit: 'm²',
      unit_price: input.laborConfig.laborCostPerM2 || 25,
      total_price: laborCost,
      category: 'Serviços',
      specifications: {}
    });
  }

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