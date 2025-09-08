import { ShingleCalculationInput, ShingleCalculationResult } from '../../types/calculation.types';

// Base prices per m²
const SHINGLE_PRICES = {
  shingles: {
    basic: 85,      // R$/m²
    standard: 120,
    premium: 180
  },
  underlayment: {
    standard: 25,   // R$/m²
    premium: 45
  },
  accessories: 15,  // R$/m² (average)
  labor: {
    simple: 35,     // R$/m²
    medium: 45,
    complex: 65
  }
};

const REGIONAL_MULTIPLIERS = {
  north: 1.20,
  northeast: 1.10,
  center_west: 1.15,
  southeast: 1.0,
  south: 1.05
};

const COMPLEXITY_MULTIPLIERS = {
  low: 1.0,
  medium: 1.20,
  high: 1.45
};

const URGENCY_MULTIPLIERS = {
  normal: 1.0,
  express: 1.30
};

// Slope adjustment factors
const SLOPE_FACTORS = {
  0: 1.0,    // 0-15 degrees
  15: 1.05,  // 15-30 degrees
  30: 1.15,  // 30-45 degrees
  45: 1.30   // >45 degrees
};

export function calculateShingleInstallation(input: ShingleCalculationInput): ShingleCalculationResult {
  const { roofArea, roofSlope, roofComplexity, underlaymentType, ventilationRequired, guttersIncluded } = input;
  
  // Calculate material quantities
  const slopeFactor = getSlopeFactor(roofSlope);
  const adjustedArea = roofArea * slopeFactor;
  
  // Add 10% waste factor
  const shingleQuantity = adjustedArea * 1.10;
  const underlaymentQuantity = adjustedArea * 1.05;
  
  // Accessories calculation
  let accessoriesQuantity = adjustedArea;
  if (ventilationRequired) accessoriesQuantity *= 1.15;
  if (guttersIncluded) accessoriesQuantity *= 1.25;
  
  // Calculate multipliers
  const regionalMultiplier = REGIONAL_MULTIPLIERS[input.region];
  const complexityMultiplier = COMPLEXITY_MULTIPLIERS[input.complexity];
  const urgencyMultiplier = URGENCY_MULTIPLIERS[input.urgency];
  
  const totalMultiplier = regionalMultiplier * complexityMultiplier * urgencyMultiplier;
  
  // Calculate costs
  const shingleCost = shingleQuantity * SHINGLE_PRICES.shingles.standard * totalMultiplier;
  const underlaymentCost = underlaymentQuantity * SHINGLE_PRICES.underlayment[underlaymentType] * totalMultiplier;
  const accessoriesCost = accessoriesQuantity * SHINGLE_PRICES.accessories * totalMultiplier;
  
  // Labor calculation
  const complexityFactor = {
    simple: 1.0,
    medium: 1.3,
    complex: 1.7
  }[roofComplexity];
  
  const laborHours = (adjustedArea * 0.8 * complexityFactor) * totalMultiplier;
  const laborCost = adjustedArea * SHINGLE_PRICES.labor[roofComplexity] * totalMultiplier;
  
  const itemizedCosts = {
    shingles: shingleCost,
    underlayment: underlaymentCost,
    accessories: accessoriesCost,
    labor: laborCost
  };
  
  const totalCost = Object.values(itemizedCosts).reduce((sum, cost) => sum + cost, 0);
  
  // Installation time calculation (days)
  const baseInstallationTime = Math.ceil(adjustedArea / 40); // 40m² per day base
  const installationTime = Math.max(1, baseInstallationTime * complexityFactor);
  
  return {
    shingleQuantity,
    underlaymentQuantity,
    accessoriesQuantity,
    laborHours,
    itemizedCosts,
    totalCost,
    installationTime
  };
}

function getSlopeFactor(slope: number): number {
  if (slope <= 15) return SLOPE_FACTORS[0];
  if (slope <= 30) return SLOPE_FACTORS[15];
  if (slope <= 45) return SLOPE_FACTORS[30];
  return SLOPE_FACTORS[45];
}