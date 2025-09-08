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

// Knauf Ceiling
export interface KnaufCeilingCalculationInput extends BaseCalculationInput {
  ceilingArea: number; // m²
  perimeter: number; // m
  plateType: 'standard' | 'ru' | 'rf'; // ST (Standard), RU (Resistente Umidade), RF (Resistente Fogo)
  plateDimension: '1_20x2_40' | '1_20x1_80' | '1_20x2_50'; // Dimensões da placa
  tabicaType: 'tabica_40x48' | 'tabica_50x50' | 'tabica_76x50' | 'cantoneira_25x30'; // Acabamento perimetral
  massType: 'powder' | 'ready'; // Massa em pó ou pronta
  fiberType: 'telada' | 'papel'; // Fita telada ou papel
  includeInsulation: boolean; // Isolamento opcional
  insulationType?: 'glass_wool' | 'pet_wool'; // Tipo de isolamento
  includeAccessories: boolean; // Acessórios especiais (alçapão, spots)
  accessoryQuantities?: {
    trapdoor?: number; // Alçapões
    spotBoxes?: number; // Caixas para spots
    acDiffusers?: number; // Difusores de ar condicionado
  };
}

export interface KnaufCeilingCalculationResult {
  // Quantidades de materiais
  plateQuantity: number; // peças
  plateArea: number; // m² real das placas
  profileQuantity: number; // ml de perfil F530
  profileBars: number; // barras de 3m
  suspensionSets: number; // conjuntos tirante + pendural
  perimetralQuantity: number; // ml de tabica/cantoneira
  perimetralBars: number; // barras de 3m
  
  // Parafusos
  plateScews: number; // parafusos 25mm para placas
  profileScrews: number; // parafusos 13mm para perfis
  anchors: number; // buchas para laje
  
  // Acabamento
  massQuantity: number; // kg de massa
  fiberQuantity: number; // ml de fita
  
  // Isolamento (opcional)
  insulationQuantity?: number; // m² de isolamento
  
  // Acessórios
  accessories?: {
    trapdoors: number;
    spotBoxes: number;
    acDiffusers: number;
  };
  
  // Tempos e custos
  laborHours: number;
  installationTime: number; // dias
  
  itemizedCosts: {
    plates: number;
    profiles: number;
    suspension: number;
    perimetral: number;
    screws: number;
    finishing: number;
    insulation?: number;
    accessories?: number;
    labor: number;
  };
  totalCost: number;
}

export type CalculationInput = 
  | SolarCalculationInput 
  | ShingleCalculationInput 
  | DrywallCalculationInput 
  | SteelFrameCalculationInput 
  | CeilingCalculationInput
  | KnaufCeilingCalculationInput;

export type CalculationResult = 
  | SolarCalculationResult 
  | ShingleCalculationResult 
  | DrywallCalculationResult 
  | SteelFrameCalculationResult 
  | CeilingCalculationResult
  | KnaufCeilingCalculationResult;