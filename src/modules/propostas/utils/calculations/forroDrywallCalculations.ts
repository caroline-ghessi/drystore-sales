import { ForroDrywallCalculationInput, ForroDrywallCalculationResult } from '../../types/calculation.types';

const BASE_PRICES = {
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

const REGIONAL_MULTIPLIERS = {
  north: 1.25,
  northeast: 1.15,
  center_west: 1.10,
  southeast: 1.0,
  south: 1.08
};


export function calculateForroDrywall(input: ForroDrywallCalculationInput): ForroDrywallCalculationResult {
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
    region
  } = input;

  // Calculate quantities
  const plateQuantity = Math.ceil(ceilingArea / 2.88 * 1.1); // 10% waste
  const profileQuantity = ceilingArea * 2.2 * 1.05; // 5% waste
  const suspensionSetQuantity = Math.ceil(ceilingArea * 1.8);
  const perimetralFinishingQuantity = perimeterLength;
  const screwQuantity = Math.ceil(ceilingArea * 17 * 1.2);
  const massQuantity = ceilingArea * (massType === 'PVA' ? 0.35 : 0.7) * 1.1;
  const tapeQuantity = ceilingArea * 3.0 * 1.1;

  let insulationQuantity: number | undefined;
  if (insulation.enabled) {
    insulationQuantity = ceilingArea * 1.05;
  }

  // Calculate costs
  const totalMultiplier = REGIONAL_MULTIPLIERS[region];
  
  const platesCost = plateQuantity * BASE_PRICES.plates[plateType] * totalMultiplier;
  const profilesCost = profileQuantity * BASE_PRICES.profiles.steel * totalMultiplier;
  const suspensionCost = suspensionSetQuantity * BASE_PRICES.suspension.complete_set * totalMultiplier;
  const perimetralCost = perimetralFinishingQuantity * BASE_PRICES.perimetral[perimeterFinishingType] * totalMultiplier;
  const screwsCost = screwQuantity * BASE_PRICES.screws.plate;
  const massCost = massQuantity * BASE_PRICES.finishing.mass[massType];
  const tapeCost = tapeQuantity * BASE_PRICES.finishing.fiber[fiberType];
  const laborCost = ceilingArea * 25;
  
  let insulationCost = 0;
  if (insulationQuantity && insulation.type) {
    insulationCost = insulationQuantity * BASE_PRICES.insulation[insulation.type] * totalMultiplier;
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
  };
}