import { DrywallCalculationInput, DrywallCalculationResult } from '../../types/calculation.types';

// Base prices
const DRYWALL_PRICES = {
  plates: {
    standard: 18,           // R$/m²
    acoustic: 35,
    moisture_resistant: 28,
    fire_resistant: 42
  },
  profiles: {
    steel: 12,             // R$/linear meter
    wood: 8
  },
  screws: 0.25,            // R$/unit
  jointCompound: 8,        // R$/kg
  tape: 2.5,              // R$/linear meter
  labor: {
    level_3: 25,           // R$/m²
    level_4: 35,
    level_5: 45
  }
};

const REGIONAL_MULTIPLIERS = {
  north: 1.25,
  northeast: 1.15,
  center_west: 1.10,
  southeast: 1.0,
  south: 1.08
};

const COMPLEXITY_MULTIPLIERS = {
  low: 1.0,
  medium: 1.25,
  high: 1.50
};

const URGENCY_MULTIPLIERS = {
  normal: 1.0,
  express: 1.35
};

export function calculateDrywallInstallation(input: DrywallCalculationInput): DrywallCalculationResult {
  const { wallArea, wallHeight, drywallType, finishType, features } = input;
  
  // Calculate material quantities
  const plateQuantity = wallArea * 1.05; // 5% waste
  
  // Profile calculation (vertical studs every 40cm + horizontal tracks)
  const verticalProfiles = Math.ceil((wallArea / wallHeight) / 0.4) * wallHeight;
  const horizontalProfiles = (wallArea / wallHeight) * 2; // top and bottom tracks
  const profileQuantity = verticalProfiles + horizontalProfiles;
  
  // Screws calculation (approximately 35 screws per m²)
  const screwsQuantity = Math.ceil(wallArea * 35);
  
  // Joint compound calculation (approximately 0.8kg per m²)
  const jointCompoundQuantity = wallArea * 0.8;
  
  // Tape calculation (approximately 3.2m per m² of wall)
  const tapeQuantity = wallArea * 3.2;
  
  // Calculate multipliers
  const regionalMultiplier = REGIONAL_MULTIPLIERS[input.region];
  const complexityMultiplier = COMPLEXITY_MULTIPLIERS[input.complexity];
  const urgencyMultiplier = URGENCY_MULTIPLIERS[input.urgency];
  
  let totalMultiplier = regionalMultiplier * complexityMultiplier * urgencyMultiplier;
  
  // Additional factors
  if (features.insulation) totalMultiplier *= 1.20;
  if (features.electricalRuns) totalMultiplier *= 1.30;
  
  // Calculate costs
  const plateCost = plateQuantity * DRYWALL_PRICES.plates[drywallType] * totalMultiplier;
  const profileCost = profileQuantity * DRYWALL_PRICES.profiles.steel * totalMultiplier;
  const screwsCost = screwsQuantity * DRYWALL_PRICES.screws;
  const jointCompoundCost = jointCompoundQuantity * DRYWALL_PRICES.jointCompound;
  const tapeCost = tapeQuantity * DRYWALL_PRICES.tape;
  
  const accessoriesCost = screwsCost + jointCompoundCost + tapeCost;
  
  // Labor calculation
  const baseHours = wallArea * 2.5; // 2.5 hours per m² base
  const finishMultiplier = {
    level_3: 1.0,
    level_4: 1.3,
    level_5: 1.6
  }[finishType];
  
  const itemizedCosts = {
    plates: plateCost,
    profiles: profileCost,
    screws: screwsCost,
    compound: jointCompoundCost,
    tape: tapeCost,
    labor: baseHours * DRYWALL_PRICES.labor[finishType] * finishMultiplier,
  };
  
  const totalCost = Object.values(itemizedCosts).reduce((sum, cost) => sum + cost, 0);
  
  return {
    plateQuantity,
    profileQuantity,
    screwQuantity: screwsQuantity,
    jointCompoundQuantity,
    tapeQuantity,
    itemizedCosts,
    totalCost,
  };
}