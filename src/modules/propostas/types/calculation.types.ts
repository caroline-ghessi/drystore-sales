export interface BaseCalculationInput {
  area?: number;
  quantity?: number;
  complexity: 'low' | 'medium' | 'high';
  region: 'north' | 'northeast' | 'center_west' | 'southeast' | 'south';
  urgency: 'normal' | 'express';
}

// Energia Solar
export interface SolarCalculationInput extends BaseCalculationInput {
  monthlyConsumption: number; // kWh
  roofType: 'ceramic' | 'concrete' | 'metal' | 'fiber_cement';
  roofOrientation: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
  shadowing: 'none' | 'partial' | 'significant';
  installationType: 'grid_tie' | 'off_grid' | 'hybrid';
}

export interface SolarCalculationResult {
  systemPower: number; // kWp
  panelQuantity: number;
  inverterQuantity: number;
  monthlyGeneration: number; // kWh
  monthlySavings: number; // R$
  paybackPeriod: number; // months
  roi25Years: number; // %
  co2Reduction: number; // kg/year
  itemizedCosts: {
    panels: number;
    inverters: number;
    structure: number;
    installation: number;
    documentation: number;
  };
  totalCost: number;
}

// Telha Shingle
export interface ShingleCalculationInput extends BaseCalculationInput {
  roofArea: number; // m²
  roofSlope: number; // degrees
  roofComplexity: 'simple' | 'medium' | 'complex';
  underlaymentType: 'standard' | 'premium';
  ventilationRequired: boolean;
  guttersIncluded: boolean;
}

export interface ShingleCalculationResult {
  shingleQuantity: number; // m²
  underlaymentQuantity: number; // m²
  accessoriesQuantity: number;
  laborHours: number;
  itemizedCosts: {
    shingles: number;
    underlayment: number;
    accessories: number;
    labor: number;
  };
  totalCost: number;
  installationTime: number; // days
}

// Drywall
export interface DrywallCalculationInput extends BaseCalculationInput {
  wallArea: number; // m²
  wallHeight: number; // m
  wallType: 'standard' | 'acoustic' | 'moisture_resistant' | 'fire_resistant';
  finishType: 'level_3' | 'level_4' | 'level_5';
  insulationRequired: boolean;
  electricalInstallation: boolean;
}

export interface DrywallCalculationResult {
  plateQuantity: number;
  profileQuantity: number; // linear meters
  screwsQuantity: number;
  jointCompoundQuantity: number; // kg
  tapeQuantity: number; // linear meters
  laborHours: number;
  itemizedCosts: {
    plates: number;
    profiles: number;
    accessories: number;
    labor: number;
  };
  totalCost: number;
  installationTime: number; // days
}

// Steel Frame
export interface SteelFrameCalculationInput extends BaseCalculationInput {
  builtArea: number; // m²
  floors: number;
  structureType: 'residential' | 'commercial' | 'industrial';
  foundationType: 'slab' | 'footings' | 'piles';
  roofType: 'ceramic' | 'metal' | 'concrete';
  finishLevel: 'basic' | 'standard' | 'premium';
}

export interface SteelFrameCalculationResult {
  structuralSteel: number; // kg
  plateQuantity: number; // m²
  insulationQuantity: number; // m²
  laborHours: number;
  itemizedCosts: {
    structure: number;
    plates: number;
    insulation: number;
    foundation: number;
    roof: number;
    finishes: number;
    labor: number;
  };
  totalCost: number;
  constructionTime: number; // days
}

// Forros
export interface CeilingCalculationInput extends BaseCalculationInput {
  ceilingArea: number; // m²
  ceilingHeight: number; // m
  ceilingType: 'gypsum' | 'pvc' | 'mineral_fiber' | 'metal';
  lightingIntegration: boolean;
  airConditioningIntegration: boolean;
  accessPanels: number;
}

export interface CeilingCalculationResult {
  plateQuantity: number; // m²
  profileQuantity: number; // linear meters
  accessoriesQuantity: number;
  laborHours: number;
  itemizedCosts: {
    plates: number;
    structure: number;
    accessories: number;
    labor: number;
  };
  totalCost: number;
  installationTime: number; // days
}

export type CalculationInput = 
  | SolarCalculationInput 
  | ShingleCalculationInput 
  | DrywallCalculationInput 
  | SteelFrameCalculationInput 
  | CeilingCalculationInput;

export type CalculationResult = 
  | SolarCalculationResult 
  | ShingleCalculationResult 
  | DrywallCalculationResult 
  | SteelFrameCalculationResult 
  | CeilingCalculationResult;