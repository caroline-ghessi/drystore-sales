import { SolarCalculationInput, SolarCalculationResult } from '../../types/calculation.types';

// Base prices per kWp (updated regularly)
const SOLAR_PRICES = {
  panels: {
    basic: 2800,    // R$/kWp
    standard: 3200,
    premium: 3800
  },
  inverters: {
    basic: 800,     // R$/kWp
    standard: 1000,
    premium: 1400
  },
  structure: 600,   // R$/kWp
  installation: 800, // R$/kWp
  documentation: 300 // R$/kWp
};

const REGIONAL_MULTIPLIERS = {
  north: 1.15,
  northeast: 1.05,
  center_west: 1.10,
  southeast: 1.0,
  south: 1.08
};

const COMPLEXITY_MULTIPLIERS = {
  low: 1.0,
  medium: 1.15,
  high: 1.35
};

const URGENCY_MULTIPLIERS = {
  normal: 1.0,
  express: 1.25
};

// Solar irradiation by region (kWh/kWp/day)
const SOLAR_IRRADIATION = {
  north: 4.8,
  northeast: 5.2,
  center_west: 5.0,
  southeast: 4.6,
  south: 4.2
};

export function calculateSolarSystem(input: SolarCalculationInput): SolarCalculationResult {
  // Calculate system power needed
  const dailyConsumption = input.monthlyConsumption / 30;
  const irradiation = SOLAR_IRRADIATION[input.region];
  const efficiencyFactor = getEfficiencyFactor(input);
  
  const systemPower = (dailyConsumption / irradiation) / efficiencyFactor;
  
  // Panel and inverter quantities (assuming 540W panels)
  const panelQuantity = Math.ceil((systemPower * 1000) / 540);
  const inverterQuantity = Math.ceil(systemPower / 3.0); // 3kW inverters
  
  // Calculate costs
  const regionalMultiplier = REGIONAL_MULTIPLIERS[input.region];
  const complexityMultiplier = COMPLEXITY_MULTIPLIERS[input.complexity];
  const urgencyMultiplier = URGENCY_MULTIPLIERS[input.urgency];
  
  const totalMultiplier = regionalMultiplier * complexityMultiplier * urgencyMultiplier;
  
  const itemizedCosts = {
    panels: SOLAR_PRICES.panels.standard * systemPower * totalMultiplier,
    inverters: SOLAR_PRICES.inverters.standard * systemPower * totalMultiplier,
    structure: SOLAR_PRICES.structure * systemPower * totalMultiplier,
    installation: SOLAR_PRICES.installation * systemPower * totalMultiplier,
    documentation: SOLAR_PRICES.documentation * systemPower
  };
  
  const totalCost = Object.values(itemizedCosts).reduce((sum, cost) => sum + cost, 0);
  
  // Calculate generation and savings
  const monthlyGeneration = systemPower * irradiation * 30 * efficiencyFactor;
  const tariff = 0.85; // Average R$/kWh
  const monthlySavings = monthlyGeneration * tariff;
  
  // Payback calculation
  const paybackPeriod = totalCost / (monthlySavings * 12);
  
  // ROI calculation (25 years)
  const totalSavings25Years = monthlySavings * 12 * 25;
  const roi25Years = ((totalSavings25Years - totalCost) / totalCost) * 100;
  
  // CO2 reduction (0.0817 kg CO2/kWh)
  const co2Reduction = monthlyGeneration * 12 * 0.0817;
  
  return {
    systemPower,
    panelQuantity,
    inverterQuantity,
    monthlyGeneration,
    monthlySavings,
    paybackPeriod,
    roi25Years,
    co2Reduction,
    stringConfiguration: {
      totalStrings: 1,
      panelsPerString: panelQuantity,
      stringVoltage: panelQuantity * 41,
      withinMPPTRange: true
    },
    performanceMetrics: {
      performanceRatio: 0.8,
      selfConsumptionRate: 0.7,
      specificYield: monthlyGeneration * 12 / systemPower,
      capacityFactor: 0.2
    },
    itemizedCosts,
    totalCost
  };
}

function getEfficiencyFactor(input: SolarCalculationInput): number {
  let factor = 0.85; // Base efficiency
  
  // Roof orientation factor
  const orientationFactors = {
    north: 1.0,
    northeast: 0.95,
    northwest: 0.95,
    east: 0.90,
    west: 0.90,
    southeast: 0.85,
    southwest: 0.85,
    south: 0.75
  };
  
  factor *= orientationFactors[input.roofOrientation];
  
  // Shadowing factor
  const shadowingFactors = {
    none: 1.0,
    partial: 0.85,
    significant: 0.65
  };
  
  factor *= shadowingFactors[input.shadowing];
  
  // Roof type factor
  const roofTypeFactors = {
    ceramic: 1.0,
    concrete: 1.0,
    metal: 0.95,
    fiber_cement: 0.98
  };
  
  factor *= roofTypeFactors[input.roofType];
  
  return factor;
}