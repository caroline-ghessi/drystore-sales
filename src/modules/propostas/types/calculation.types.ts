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

// Sistema Solar Simplificado - Para propostas iniciais
export interface SimpleSolarCalculationInput {
  monthlyConsumption: number; // kWh
  currentTariff: number; // R$/kWh - Campo principal para cálculo de economia
  region: 'north' | 'northeast' | 'center_west' | 'southeast' | 'south';
  installationType: 'grid_tie' | 'off_grid' | 'hybrid';
  
  // Dados do cliente (preparação para OCR)
  clientData?: {
    name?: string;
    phone?: string;
    address?: string;
    distributorName?: string; // Ex: CPFL, Enel, etc.
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

// Resultado do Sistema Solar Simplificado
export interface SimpleSolarCalculationResult {
  systemPower: number; // kWp
  panelQuantity: number;
  inverterQuantity: number;
  monthlyGeneration: number; // kWh
  monthlyBillBefore: number; // R$ - conta atual
  monthlyBillAfter: number; // R$ - conta após instalação
  monthlySavings: number; // R$ - economia mensal
  annualSavings: number; // R$ - economia anual
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
  
  economicMetrics: {
    totalSavings25Years: number;
    netProfit25Years: number;
    monthlyROI: number;
    breakEvenMonth: number;
  };
}

// ============= Battery Backup System =============

// Battery backup system input
export interface BatteryBackupInput extends BaseCalculationInput {
  // Essential loads that need backup power
  essentialLoads: {
    lighting: number; // kW
    refrigeration: number; // kW
    communications: number; // kW (internet, phones)
    security: number; // kW (cameras, alarms)
    medical: number; // kW (medical equipment)
    other: number; // kW
  };
  
  // Desired autonomy in hours
  desiredAutonomy: number; // hours
  
  // Battery specifications
  batteryType: 'lifepo4' | 'lithium' | 'lead_acid';
  
  // Charge source configuration
  chargeSource: {
    solar: boolean;
    grid: boolean;
    generator: boolean;
  };
  
  // Usage patterns
  usagePattern: {
    dailyUsageHours: number;
    peakUsageHours: number;
    weeklyUsageDays: number;
  };
}

// Battery backup system result
export interface BatteryBackupResult {
  // Power requirements
  totalPowerRequired: number; // kW
  peakPowerRequired: number; // kW
  
  // Energy requirements
  totalEnergyRequired: number; // kWh
  dailyEnergyConsumption: number; // kWh
  
  // Inverter specifications
  inverterPower: number; // kW
  inverterQuantity: number;
  inverterEfficiency: number; // %
  
  // Battery configuration
  batteryConfiguration: {
    batteryQuantity: number;
    totalCapacityKwh: number;
    usefulCapacityKwh: number;
    autonomyHours: number;
    bankVoltage: number; // V
    maxDischargeRate: number; // kW
  };
  
  // Cost breakdown
  itemizedCosts: {
    batteries: number;
    inverters: number;
    installation: number;
    monitoring: number;
    protection: number;
  };
  totalCost: number;
  
  // Economic metrics
  economicMetrics: {
    monthlySavings: number; // R$ (avoiding outages)
    paybackPeriod: number; // months
    lifespan: number; // years
    maintenanceCostPerYear: number; // R$
  };
  
  // Technical specifications
  technicalSpecs: {
    chargeTime: number; // hours
    dischargeTime: number; // hours
    cyclesPerYear: number;
    expectedLifeCycles: number;
    warrantyYears: number;
  };
}

// ============= Shingle Roofing =============

export interface ShingleCalculationInput extends BaseCalculationInput {
  roofArea: number; // m²
  roofSlope: number; // degrees
  roofComplexity: 'simple' | 'medium' | 'complex';
  shingleType: 'asphalt' | 'ceramic' | 'concrete' | 'metal';
  
  // Roof details
  roofDetails: {
    perimeterLength: number; // m
    ridgeLength: number; // m
    valleyLength: number; // m
    hipLength: number; // m
    numberOfPenetrations: number; // vents, chimneys, etc.
  };
  
  // Additional features
  features: {
    gutters: boolean;
    underlayment: 'standard' | 'premium';
    ventilation: boolean;
    insulation: boolean;
  };
}

export interface ShingleCalculationResult {
  // Material quantities
  shingleQuantity: number; // m²
  osbQuantity: number; // m²
  underlaymentQuantity: number; // m²
  ridgeCapQuantity: number; // m
  startingStripQuantity: number; // m
  flashingQuantity: number; // m
  nailsQuantity: number; // kg
  sealantQuantity: number; // tubes
  
  // Optional materials
  gutterQuantity?: number; // m
  insulationQuantity?: number; // m²
  ventilationUnits?: number;
  
  // Cost breakdown
  itemizedCosts: {
    shingles: number;
    osb: number;
    underlayment: number;
    accessories: number;
    labor: number;
    equipment: number;
  };
  totalCost: number;
}

// ============= Drywall =============

export interface DrywallCalculationInput extends BaseCalculationInput {
  wallArea: number; // m²
  wallHeight: number; // m
  drywallType: 'standard' | 'moisture_resistant' | 'fire_resistant';
  finishType: 'level_1' | 'level_2' | 'level_3' | 'level_4' | 'level_5';
  
  // Additional requirements
  features: {
    insulation: boolean;
    electricalRuns: boolean;
    plumbingRuns: boolean;
    soundproofing: boolean;
  };
}

export interface DrywallCalculationResult {
  // Material quantities
  plateQuantity: number; // sheets
  profileQuantity: number; // m
  screwQuantity: number; // units
  jointCompoundQuantity: number; // kg
  tapeQuantity: number; // m
  
  // Optional materials
  insulationQuantity?: number; // m²
  soundproofingQuantity?: number; // m²
  
  // Cost breakdown
  itemizedCosts: {
    plates: number;
    profiles: number;
    screws: number;
    compound: number;
    tape: number;
    labor: number;
  };
  totalCost: number;
}

// ============= Steel Frame =============

export interface SteelFrameCalculationInput extends BaseCalculationInput {
  builtArea: number; // m²
  numberOfFloors: number;
  structureType: 'residential' | 'commercial' | 'industrial';
  foundationType: 'slab' | 'strip' | 'pile';
  roofType: 'gable' | 'hip' | 'flat' | 'shed';
  finishLevel: 'basic' | 'standard' | 'premium';
}

export interface SteelFrameCalculationResult {
  // Material quantities
  structuralSteelQuantity: number; // tons
  plateQuantity: number; // m²
  insulationQuantity: number; // m²
  
  // Cost breakdown
  itemizedCosts: {
    steel: number;
    plates: number;
    insulation: number;
    fasteners: number;
    labor: number;
    equipment: number;
  };
  totalCost: number;
}

// ============= General Ceiling =============

export interface CeilingCalculationInput extends BaseCalculationInput {
  ceilingArea: number; // m²
  ceilingHeight: number; // m
  ceilingType: 'suspended' | 'attached' | 'coffered';
  
  // Integration requirements
  features: {
    lighting: boolean;
    airConditioning: boolean;
    accessPanels: boolean;
  };
}

export interface CeilingCalculationResult {
  // Material quantities
  plateQuantity: number; // m²
  profileQuantity: number; // m
  accessoriesQuantity: number; // units
  
  // Cost breakdown
  itemizedCosts: {
    plates: number;
    profiles: number;
    accessories: number;
    labor: number;
  };
  totalCost: number;
}

// ============= Drywall Ceiling (Forro) =============

export interface ForroDrywallCalculationInput extends BaseCalculationInput {
  ceilingArea: number; // m²
  perimeterLength: number; // m
  
  // Plate specifications
  plateType: 'standard' | 'moisture_resistant' | 'acoustic';
  plateThickness: 9.5 | 12.5 | 15.0; // mm
  plateDimensions: '1200x1800' | '1200x2400' | '1200x3000'; // mm
  
  // Perimetral finishing
  perimeterFinishingType: 'L_profile' | 'shadow_gap' | 'decorative_molding';
  
  // Mass and fiber
  massType: 'PVA' | 'acrylic';
  fiberType: 'fiberglass' | 'paper';
  
  // Insulation (optional)
  insulation: {
    enabled: boolean;
    type?: 'rockwool' | 'fiberglass' | 'polyurethane';
    thickness?: number; // mm
  };
  
  // Accessories
  accessories: {
    lightFixtures: number;
    airVents: number;
    accessPanels: number;
    speakers: number;
  };
}

export interface ForroDrywallCalculationResult {
  // Material quantities
  plateQuantity: number; // sheets
  profileQuantity: number; // m (main and cross tees)
  suspensionSetQuantity: number; // sets (hangers + clips)
  perimetralFinishingQuantity: number; // m
  screwQuantity: number; // units
  massQuantity: number; // kg
  tapeQuantity: number; // m
  
  // Optional materials
  insulationQuantity?: number; // m²
  accessoriesQuantity: {
    lightFixtures: number;
    airVents: number;
    accessPanels: number;
    speakers: number;
  };
  
  // Cost breakdown
  itemizedCosts: {
    plates: number;
    profiles: number;
    suspension: number;
    perimetralFinishing: number;
    screws: number;
    mass: number;
    tape: number;
    insulation?: number;
    accessories: number;
    labor: number;
  };
  totalCost: number;
}

// ============= Union Types =============

export type CalculationInput = 
  | SolarCalculationInput 
  | SimpleSolarCalculationInput
  | BatteryBackupInput
  | ShingleCalculationInput 
  | DrywallCalculationInput 
  | SteelFrameCalculationInput 
  | CeilingCalculationInput
  | ForroDrywallCalculationInput;

export type CalculationResult = 
  | SolarCalculationResult 
  | SimpleSolarCalculationResult
  | BatteryBackupResult
  | ShingleCalculationResult 
  | DrywallCalculationResult 
  | SteelFrameCalculationResult 
  | CeilingCalculationResult
  | ForroDrywallCalculationResult;