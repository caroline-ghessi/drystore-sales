export interface BaseCalculationInput {
  area?: number;
  quantity?: number;
  region?: 'north' | 'northeast' | 'center_west' | 'southeast' | 'south';
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
    lighting: number; // W (200-500W)
    refrigerator: number; // W (120-180W)
    freezer: number; // W (100-200W)
    internet: number; // W (30-80W) - modem/router
    tv: number; // W (50-200W) - TV/entertainment
    microwave: number; // W (800-1200W) - microwave/kitchen
    ventilation: number; // W (60-150W per fan)
    waterPump: number; // W (500-1500W)
    security: number; // W (20-100W) - cameras/alarms
    medical: number; // W (50-150W) - CPAP/nebulizer
    phones: number; // W (10-30W) - phones
    other: number; // W - custom loads
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
  shingleType: 'oakridge' | 'supreme';
  
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
    underlayment: 'standard' | 'premium' | 'rhinoroof';
    ventilation: boolean;
    insulation: boolean;
  };
  
  // Labor configuration
  laborConfig?: {
    includeLabor: boolean;
    laborCostPerM2?: number;
    customLaborCost?: number;
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

// Drywall types - Sistema expandido com configurações por face
export type FaceMaterialType = 
  | 'knauf_st' 
  | 'knauf_ru' 
  | 'knauf_rf' 
  | 'placo_performa' 
  | 'placo_performa_ru'
  | 'osb_11mm' 
  | 'osb_15mm' 
  | 'cimenticia_6mm' 
  | 'cimenticia_8mm'
  | 'none'; // Para paredes de face única

export type WallConfigurationType = 
  | 'W111' | 'W112' | 'W115' // Configurações padrão
  | 'W111_OSB' | 'W111_MIXED' | 'W111_CEMENT' // Variações W111
  | 'W112_OSB' | 'W112_MIXED' | 'W112_CEMENT' // Variações W112
  | 'ACOUSTIC' | 'HUMID' | 'FIRE' // Configurações especializadas
  | 'CUSTOM'; // Configuração personalizada

export type PreDefinedConfig = 
  | 'divisoria_escritorio' 
  | 'parede_banheiro' 
  | 'parede_tv' 
  | 'parede_rustica' 
  | 'parede_industrial' 
  | 'parede_acustica'
  | 'custom';

export interface DrywallCalculationInput extends BaseCalculationInput {
  wallArea: number;
  wallHeight: number;
  
  // Sistema de configuração expandido
  configMode: 'predefined' | 'custom';
  preDefinedConfig?: PreDefinedConfig;
  wallConfiguration: WallConfigurationType;
  
  // Configuração por face (para modo custom)
  face1Type: FaceMaterialType;
  face2Type: FaceMaterialType;
  
  // Materiais tradicionais (mantidos para compatibilidade)
  plateType?: 'knauf_st' | 'knauf_ru' | 'knauf_rf' | 'placo_performa' | 'placo_performa_ru';
  profileType: 'M48' | 'M70' | 'M90';
  finishType: 'level_3' | 'level_4' | 'level_5' | 'no_finish';
  
  // Produtos específicos selecionados
  selectedProducts?: {
    placas?: string;
    massaJuntas?: string;
    massaAcabamento?: string;
    perfisMetalicos?: string;
    parafusosDrywall?: string;
    parafusosMetal?: string;
    fita?: string;
    isolamento?: string;
  };
  
  openings: {
    doors: number;
    windows: number;
  };
  
  features: {
    insulation: boolean;
    insulationType?: 'la_vidro_50' | 'la_vidro_100' | 'la_rocha_50' | 'la_rocha_100';
    acousticBand: boolean;
    electricalRuns: boolean;
    plumbingRuns?: boolean;
    waterproofing?: boolean; // Para áreas úmidas
    osbFinish?: 'natural' | 'verniz' | 'tinta'; // Acabamento OSB
  };
  
  laborIncluded: {
    structure: boolean;
    installation: boolean;
    finishing: boolean;
    insulation: boolean;
    waterproofing?: boolean;
    osbFinishing?: boolean;
  };
}

export interface DrywallCalculationResult {
  // Quantidades de materiais por tipo
  plateQuantity: number;
  plateArea: number; // Alias para plateQuantity 
  osbQuantity?: number;
  cementiciousQuantity?: number;
  montanteQuantity: number;
  guiaQuantity: number;
  
  // Parafusos específicos por material
  screw25mmQuantity: number; // Drywall padrão
  screw35mmQuantity?: number; // Drywall dupla camada
  screw13mmQuantity: number; // Metal-metal
  screwWoodQuantity?: number; // Para OSB
  screwCementQuantity?: number; // Para cimentícia
  
  // Materiais de acabamento separados
  jointMassQuantity: number; // Massa para juntas (kg)
  finishMassQuantity: number; // Massa de acabamento (kg)
  tapeQuantity: number; // Fita para juntas (metros)
  
  // Campo legado para compatibilidade
  massQuantity: number;
  
  // Campos de compatibilidade com useProposalCalculator
  profileQuantity?: number; // montanteQuantity + guiaQuantity
  screwQuantity?: number; // screw25mmQuantity + screw13mmQuantity  
  jointCompoundQuantity?: number; // jointMassQuantity + finishMassQuantity
  
  // Materiais especiais
  insulationQuantity?: number;
  acousticBandQuantity?: number;
  waterproofingQuantity?: number;
  osbFinishQuantity?: number; // Verniz/tinta para OSB
  specialAnchorsQuantity?: number; // Buchas especiais
  
  // Quantidades de mão de obra (horas)
  laborHours: {
    structure: number;
    installation: number;
    finishing: number;
    insulation?: number;
    waterproofing?: number;
    osbFinishing?: number;
  };
  
  // Custos detalhados expandidos
  itemizedCosts: {
    materials: {
      plates: number;
      osb?: number;
      cementicious?: number;
      profiles: number;
      screws: number;
      mass: number;
      tape: number;
      insulation?: number;
      acousticBand?: number;
      waterproofing?: number;
      osbFinish?: number;
      specialAnchors?: number;
      extraMaterials?: number; // Materiais extras por nível de acabamento
    };
    labor: {
      structure: number;
      installation: number;
      finishing: number;
      insulation?: number;
      waterproofing?: number;
      osbFinishing?: number;
    };
  };
  
  // Totais
  totalMaterialCost: number;
  totalLaborCost: number;
  totalCost: number;
  
  // Dados técnicos expandidos
  technicalData: {
    finalThickness: number;
    acousticPerformance?: string;
    fireResistance?: string;
    weightPerM2: number;
    configuration: string;
    face1Material: string;
    face2Material: string;
    recommendedUse: string[];
    
    // Sistema Inteligente de Acabamento
    finishLevel?: 'level_3' | 'level_4' | 'level_5' | 'no_finish';
    finishDescription?: string;
    extraMaterials?: {
      primer: number;
      sandpaper: number;
      extraCoats: number;
      specialTools: number;
      description: string;
    };
    timelineMultiplier?: number;
    estimatedDays?: number;
  };
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

// ============= Acoustic Mineral Ceiling =============

// Tipos de modelos baseados no manual
export type AcousticMineralCeilingModel = 
  | 'ALCOR' | 'APUS' | 'LUCIDA' | 'NAVI' | 'ADHARA' 
  | 'KYROS' | 'LYRA' | 'ECOMIN' | 'THERMATEX' | 'TOPIQ_PRIME';

// Tipos de modulação
export type CeilingModulation = 
  | '625x625' | '625x1250' | '600x600' | '600x1200';

// Tipos de borda
export type EdgeType = 'lay_in' | 'tegular';

// Formato do ambiente
export type RoomFormat = 'rectangular' | 'l_shape' | 'irregular' | 'multiple_rooms';

// Necessidades do ambiente
export type RoomNeed = 'acoustic' | 'humidity' | 'premium' | 'economy';

export interface AcousticMineralCeilingInput extends BaseCalculationInput {
  // Dimensões básicas
  roomLength: number; // m
  roomWidth: number; // m
  roomPerimeter?: number; // m - calculado automaticamente para retangulares
  roomFormat: RoomFormat;
  ceilingHeight: number; // m desejada do forro
  availableSpace: number; // cm espaço disponível acima (mín 15cm)
  
  // Obstáculos
  obstacles: {
    columns: number;
    columnDimensions?: Array<{
      type: 'rectangular' | 'circular';
      width?: number; // m - para retangular
      depth?: number; // m - para retangular
      diameter?: number; // m - para circular
    }>;
    beams: boolean;
    ducts: boolean;
    pipes: boolean;
  };
  
  // Necessidade principal (para árvore de decisão)
  primaryNeed: RoomNeed;
  humidityLevel?: number; // % RH se necessidade for umidade
  nrcRequired?: number; // NRC se necessidade for acústica
  
  // Instalações integradas
  installations: {
    lightFixtures: number;
    airConditioning: boolean;
    sprinklers: boolean;
    smokeDetectors: boolean;
    cameras: boolean;
  };
  
  // Tipo de laje/cobertura
  slabType: 'massive' | 'ribbed' | 'steel_deck' | 'metallic' | 'wood';
  
  // Tipo de borda preferencial
  edgeType?: EdgeType;
  
  // Área de recortes/aberturas
  cutoutArea?: number; // m²
  
  // Seleção manual (opcional)
  manualModel?: AcousticMineralCeilingModel;
  manualModulation?: CeilingModulation;
  manualEdgeType?: EdgeType;
}

export interface AcousticMineralCeilingResult {
  // Modelo selecionado
  selectedModel: {
    name: AcousticMineralCeilingModel;
    manufacturer: string;
    modulation: CeilingModulation;
    edgeType: EdgeType;
    nrc: number;
    rh: number;
    weight: number; // kg/m²
    platesPerBox: number;
  };
  
  // Áreas de cálculo
  areas: {
    total: number; // m²
    obstacles: number; // m² descontada por obstáculos
    cutouts: number; // m² descontada por recortes/aberturas
    useful: number; // m² útil
    perimeter: number; // m linear
  };
  
  // Quantidades de placas
  plates: {
    baseQuantity: number;
    lossPercentage: number;
    totalPlates: number;
    boxesNeeded: number;
    platesDiscountedLights: number; // descontadas luminárias
  };
  
  // Estrutura de sustentação
  structure: {
    mainProfile: {
      meters: number;
      bars: number; // barras de 3,66m
    };
    secondaryProfile1250?: {
      meters: number;
      pieces: number;
    };
    secondaryProfile625?: {
      meters: number;
      pieces: number;
    };
    perimeterEdge: {
      meters: number;
      bars: number; // barras de 3m
    };
    suspension: {
      hangers: number;
      regulators: number;
      anchors: number;
    };
  };
  
  // Acessórios especiais
  accessories: {
    tegularClips?: number; // para borda tegular
    lightSupports: number; // 4 por luminária
    columnEdgeProfiles?: {
      meters: number; // metros lineares de perfil
      pieces: number; // peças necessárias
    };
    specialAnchors?: number;
  };
  
  // Custos detalhados
  itemizedCosts: {
    plates: number;
    mainProfile: number;
    secondaryProfiles: number;
    perimeterEdge: number;
    suspension: number;
    accessories: number;
    columnEdgeProfiles: number;
    labor: number;
  };
  totalCost: number;
  
  // Performance acústica
  acousticPerformance: {
    nrc: number; // coeficiente de redução de ruído
    classification: 'baixa' | 'média' | 'alta' | 'premium';
    suitableFor: string[]; // ambientes recomendados
  };
  
  // Dados técnicos
  technicalSpecs: {
    configuration: string;
    finalThickness: number; // mm
    weight: number; // kg/m²
    fireResistance?: string;
    moistureResistance: number; // % RH
    installationComplexity: 'simples' | 'média' | 'complexa';
  };
  
  // Validações automáticas
  validations: {
    minSpaceOk: boolean;
    structureCompatible: boolean;
    modelSuitable: boolean;
    warnings: string[];
  };
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
  | ForroDrywallCalculationInput
  | AcousticMineralCeilingInput;

export type CalculationResult = 
  | SolarCalculationResult 
  | SimpleSolarCalculationResult
  | BatteryBackupResult
  | ShingleCalculationResult 
  | DrywallCalculationResult 
  | SteelFrameCalculationResult 
  | CeilingCalculationResult
  | ForroDrywallCalculationResult
  | AcousticMineralCeilingResult;