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
  
  // Configurações avançadas de consumo
  dailyConsumptionPattern?: {
    diurnal: number; // kWh (6h-18h)
    nocturnal: number; // kWh (18h-6h)  
    peak: number; // kWh (18h-21h)
  };
  
  // Configurações de bateria (para sistemas híbridos e off-grid)
  batteryConfig?: {
    enabled: boolean;
    desiredAutonomy: number; // horas
    batteryType: 'lifepo4' | 'lithium' | 'lead_acid';
    dod: number; // depth of discharge (0.9 para LiFePO4)
    essentialLoads?: number; // kW para sistemas de backup
  };
  
  // Configurações específicas de equipamentos
  equipmentPreference?: {
    panelModel?: string; // 'AS-6M-550W'
    inverterModel?: string; // 'GF1-3K' ou 'GF1-5K'
    batteryModel?: string; // 'BLF-B51100' ou 'BLF-B51150'
  };
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
  
  // Configuração de strings
  stringConfiguration: {
    totalStrings: number;
    panelsPerString: number;
    stringVoltage: number;
    withinMPPTRange: boolean;
  };
  
  // Configuração de baterias (se aplicável)
  batteryConfiguration?: {
    batteryQuantity: number;
    totalCapacityKwh: number;
    autonomyHours: number;
    bankVoltage: number;
    usefulCapacityKwh: number;
  };
  
  // Performance metrics
  performanceMetrics: {
    performanceRatio: number; // PR
    selfConsumptionRate: number;
    specificYield: number; // kWh/kWp/ano
    capacityFactor: number;
  };
  
  itemizedCosts: {
    panels: number;
    inverters: number;
    batteries?: number;
    structure: number;
    installation: number;
    documentation: number;
  };
  totalCost: number;
}

// Sistema de Backup de Energia (apenas baterias)
export interface BatteryBackupInput extends BaseCalculationInput {
  essentialLoads: {
    lighting: number; // W
    refrigerator: number; // W  
    freezer: number; // W
    communication: number; // W (router, celular)
    security: number; // W (alarmes, cameras)
    medical?: number; // W (equipamentos médicos)
    other: number; // W
  };
  
  desiredAutonomy: number; // horas de backup
  batteryType: 'lifepo4' | 'lithium' | 'lead_acid';
  chargeSource: 'grid' | 'solar' | 'both';
  
  // Configurações avançadas
  usagePattern?: {
    simultaneousFactor: number; // 0.7 = 70% das cargas simultâneas
    dailyUsageHours: number; // horas de uso por dia
  };
}

export interface BatteryBackupResult {
  totalPowerRequired: number; // kW
  energyRequired: number; // kWh para autonomia desejada
  inverterPower: number; // kW necessário
  
  batteryConfiguration: {
    batteryQuantity: number;
    totalCapacityKwh: number;
    autonomyHours: number;
    usefulCapacityKwh: number;
    bankVoltage: number;
  };
  
  inverterSpecifications: {
    model: string;
    continuousPower: number; // W
    peakPower: number; // W
    efficiency: number;
  };
  
  itemizedCosts: {
    batteries: number;
    inverter: number;
    installation: number;
    accessories: number; // cabos, disjuntores, etc.
  };
  
  totalCost: number;
  
  // Métricas de economia
  monthlyGridCost: number; // custo mensal de carregamento via rede
  backupValue: number; // valor estimado da proteção contra quedas
}

// Telha Shingle
export interface ShingleCalculationInput extends BaseCalculationInput {
  roofArea: number; // m²
  roofSlope: number; // % (inclinação em porcentagem)
  roofComplexity: 'simple' | 'medium' | 'complex';
  shingleType: 'oakridge' | 'supreme';
  perimeter: number; // m (perímetro para beirais)
  ridgeLength: number; // m (comprimento da cumeeira)
  espigaoLength: number; // m (comprimento dos espigões - separado de cumeeiras)
  valleyLength: number; // m (comprimento das águas furtadas)
  stepFlashingLength: number; // m (metros lineares de encontro com paredes)
  stepFlashingHeight: number; // m (altura da água no encontro)
  ventilationRequired: boolean;
  rufosIncluded: boolean; // checkbox para incluir rufos
  rufosPerimeter?: number; // m (perímetro para rufos - opcional)
}

export interface ShingleCalculationResult {
  // Quantidades de materiais
  shingleBundles: number; // fardos principais
  starterBundles: number; // fardos Supreme para starter
  ridgeBundles: number; // fardos para cumeeiras (separado de espigões)
  espigaoBundles: number; // fardos Supreme para espigões
  totalShingleBundles: number; // total de fardos
  osbPlates: number; // placas OSB
  underlaymentRolls: number; // rolos de subcobertura
  valleyRolls: number; // rolos de fita autoadesiva para águas furtadas
  stepFlashingPieces: number; // peças de step flashing
  rufosMeters?: number; // metros de bobina para rufos (opcional)
  nailsForShingles: number; // pregos para telhas
  nailsForOsb: number; // pregos para OSB
  underlaymentClamps: number; // grampos para subcobertura
  monopolAsphalticTubes: number; // tubos de monopol asfáltico
  ventilationAerators: number; // aeradores (se solicitado)
  ventilatedRidgeMeters: number; // metros de cumeeira ventilada (se solicitado)
  
  itemizedCosts: {
    shingles: number;
    osb: number;
    underlayment: number;
    valleys: number;
    stepFlashing: number;
    rufos?: number;
    nails: number;
    sealing: number;
    ventilation?: number;
  };
  totalCost: number;
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
  itemizedCosts: {
    plates: number;
    profiles: number;
    accessories: number;
  };
  totalCost: number;
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
  itemizedCosts: {
    structure: number;
    plates: number;
    insulation: number;
    foundation: number;
    roof: number;
    finishes: number;
  };
  totalCost: number;
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
  itemizedCosts: {
    plates: number;
    structure: number;
    accessories: number;
  };
  totalCost: number;
}

// Forro Drywall
export interface ForroDrywallCalculationInput extends BaseCalculationInput {
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

export interface ForroDrywallCalculationResult {
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
  
  itemizedCosts: {
    plates: number;
    profiles: number;
    suspension: number;
    perimetral: number;
    screws: number;
    finishing: number;
    insulation?: number;
    accessories?: number;
  };
  totalCost: number;
}

export type CalculationInput = 
  | SolarCalculationInput 
  | BatteryBackupInput
  | ShingleCalculationInput 
  | DrywallCalculationInput 
  | SteelFrameCalculationInput 
  | CeilingCalculationInput
  | ForroDrywallCalculationInput;

export type CalculationResult = 
  | SolarCalculationResult 
  | BatteryBackupResult
  | ShingleCalculationResult 
  | DrywallCalculationResult 
  | SteelFrameCalculationResult 
  | CeilingCalculationResult
  | ForroDrywallCalculationResult;