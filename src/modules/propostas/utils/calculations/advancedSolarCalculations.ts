import { SolarCalculationInput, SolarCalculationResult } from '../../types/calculation.types';

// HSP (Horas de Sol Pleno) por região - valores conforme documentação
const SOLAR_IRRADIATION_RANGES = {
  north: { min: 4.5, max: 5.0, default: 4.8 },
  northeast: { min: 5.5, max: 6.0, default: 5.7 },
  center_west: { min: 5.0, max: 5.5, default: 5.2 },
  southeast: { min: 4.5, max: 5.5, default: 5.0 },
  south: { min: 4.0, max: 5.0, default: 4.5 }
};

// Especificações Amerisolar 550W
const AMERISOLAR_550W = {
  power: 550, // W
  vmp: 41.0, // V
  imp: 13.4, // A
  voc: 49.0, // V
  isc: 14.2, // A
  dimensions: { width: 1.13, height: 2.28 }, // metros
  tempCoefPower: -0.0035, // %/°C
  efficiency: 0.21
};

// Especificações Inversores Livoltek
const LIVOLTEK_INVERTERS = {
  'GF1-3K': {
    powerContinuous: 3000,
    powerPeak: 6000,
    mpptMin: 120,
    mpptMax: 500,
    efficiency: 0.97,
    batteryVoltage: 48
  },
  'GF1-5K': {
    powerContinuous: 5000,
    powerPeak: 10000,
    mpptMin: 120,
    mpptMax: 500,
    efficiency: 0.97,
    batteryVoltage: 48
  }
};

// Especificações Baterias Livoltek
const LIVOLTEK_BATTERIES = {
  'BLF-B51100': {
    capacityKwh: 5.12,
    voltage: 51.2,
    capacityAh: 100,
    dod: 0.9,
    maxParallel: 5,
    cycles: 6000
  },
  'BLF-B51150': {
    capacityKwh: 7.68,
    voltage: 51.2,
    capacityAh: 150,
    dod: 0.9,
    maxParallel: 5,
    cycles: 6000
  }
};

export function calculateAdvancedSolarSystem(input: SolarCalculationInput): SolarCalculationResult {
  // Usar HSP padrão nacional para uniformidade
  const hsp = 4.8; // HSP médio nacional fixo
  
  // Cálculo de consumo diário
  const dailyConsumption = input.monthlyConsumption / 30;
  
  // Fator de eficiência total do sistema (perdas)
  const systemLossFactor = calculateSystemLosses(input);
  
  // Potência necessária do sistema
  const requiredPower = (dailyConsumption / hsp) / (1 - systemLossFactor); // kWp
  
  // Quantidade de módulos Amerisolar 550W
  const panelQuantity = Math.ceil((requiredPower * 1000) / AMERISOLAR_550W.power);
  const actualSystemPower = (panelQuantity * AMERISOLAR_550W.power) / 1000; // kWp
  
  // Configuração de strings
  const stringConfig = calculateStringConfiguration(panelQuantity);
  
  // Seleção do inversor
  const inverterModel = selectInverter(actualSystemPower);
  const inverterSpecs = LIVOLTEK_INVERTERS[inverterModel];
  
  // Configuração de baterias (se aplicável)
  let batteryConfig = undefined;
  if (input.installationType === 'hybrid' || input.installationType === 'off_grid') {
    batteryConfig = calculateBatteryConfiguration(input, dailyConsumption);
  }
  
  // Geração e economia
  const monthlyGeneration = calculateMonthlyGeneration(actualSystemPower, hsp, input);
  const tariff = 0.85; // R$/kWh média
  const monthlySavings = calculateMonthlySavings(monthlyGeneration, input.monthlyConsumption, tariff);
  
  // Custos itemizados
  const itemizedCosts = calculateItemizedCosts(
    panelQuantity,
    inverterModel,
    batteryConfig,
    input
  );
  
  const totalCost = Object.values(itemizedCosts).reduce((sum, cost) => sum + (cost || 0), 0);
  
  // Métricas de performance
  const performanceMetrics = calculatePerformanceMetrics(
    monthlyGeneration,
    actualSystemPower,
    input.monthlyConsumption
  );
  
  // ROI e payback
  const paybackPeriod = totalCost / (monthlySavings * 12);
  const totalSavings25Years = monthlySavings * 12 * 25;
  const roi25Years = ((totalSavings25Years - totalCost) / totalCost) * 100;
  
  // CO2 reduction
  const co2Reduction = monthlyGeneration * 12 * 0.0817; // kg/ano
  
  return {
    systemPower: actualSystemPower,
    panelQuantity,
    inverterQuantity: 1,
    monthlyGeneration,
    monthlySavings,
    paybackPeriod,
    roi25Years,
    co2Reduction,
    stringConfiguration: stringConfig,
    batteryConfiguration: batteryConfig,
    performanceMetrics,
    itemizedCosts,
    totalCost,
    quantified_items: [] // Lista vazia - será preenchida por calculadoras baseadas em produtos
  };
}

function calculateSystemLosses(input: SolarCalculationInput): number {
  let totalLosses = 0;
  
  // Perdas básicas do sistema
  totalLosses += 0.03; // Sujeira nos módulos (3%)
  totalLosses += 0.02; // Cabeamento CC (2%)
  totalLosses += 0.01; // Cabeamento CA (1%)
  totalLosses += 0.03; // Inversor (3%)
  
  // Perdas por temperatura fixadas (uniformidade nacional)
  const tempLosses = 0.08; // Valor médio nacional
  totalLosses += tempLosses;
  
  // Perdas por orientação
  const orientationLosses = {
    north: 0,
    northeast: 0.05,
    northwest: 0.05,
    east: 0.10,
    west: 0.10,
    southeast: 0.15,
    southwest: 0.15,
    south: 0.25
  };
  totalLosses += orientationLosses[input.roofOrientation];
  
  // Perdas por sombreamento
  const shadowingLosses = {
    none: 0,
    partial: 0.15,
    significant: 0.35
  };
  totalLosses += shadowingLosses[input.shadowing];
  
  return Math.min(totalLosses, 0.35); // Máximo 35% de perdas
}

function calculateStringConfiguration(panelQuantity: number) {
  // Configuração conforme documentação
  let totalStrings: number;
  let panelsPerString: number;
  
  if (panelQuantity <= 10) {
    totalStrings = 1;
    panelsPerString = panelQuantity;
  } else if (panelQuantity <= 12) {
    totalStrings = 2;
    panelsPerString = Math.ceil(panelQuantity / 2);
  } else if (panelQuantity <= 15) {
    totalStrings = 3;
    panelsPerString = Math.ceil(panelQuantity / 3);
  } else {
    totalStrings = Math.ceil(panelQuantity / 8);
    panelsPerString = Math.ceil(panelQuantity / totalStrings);
  }
  
  const stringVoltage = panelsPerString * AMERISOLAR_550W.vmp;
  const withinMPPTRange = stringVoltage >= 120 && stringVoltage <= 500;
  
  return {
    totalStrings,
    panelsPerString,
    stringVoltage,
    withinMPPTRange
  };
}

function selectInverter(systemPower: number): keyof typeof LIVOLTEK_INVERTERS {
  // Conforme documentação: até 3,3kWp -> 3kW, acima -> 5kW
  if (systemPower <= 3.3) {
    return 'GF1-3K';
  } else {
    return 'GF1-5K';
  }
}

function calculateBatteryConfiguration(input: SolarCalculationInput, dailyConsumption: number) {
  if (!input.batteryConfig?.enabled) return undefined;
  
  const batteryType = input.batteryConfig.batteryType || 'lifepo4';
  const desiredAutonomy = input.batteryConfig.desiredAutonomy || 24; // horas
  const dod = input.batteryConfig.dod || 0.9;
  
  let energyNeeded: number;
  
  if (input.installationType === 'off_grid') {
    // Sistema off-grid: autonomia completa
    energyNeeded = (dailyConsumption * desiredAutonomy / 24);
  } else {
    // Sistema híbrido: consumo noturno + margem
    const nocturnalConsumption = dailyConsumption * 0.4; // 40% à noite
    energyNeeded = nocturnalConsumption * 1.1; // 10% margem
  }
  
  const totalCapacityNeeded = energyNeeded / dod;
  
  // Usar baterias BLF-B51100 por padrão
  const batteryModel = 'BLF-B51100';
  const batterySpecs = LIVOLTEK_BATTERIES[batteryModel];
  
  const batteryQuantity = Math.ceil(totalCapacityNeeded / batterySpecs.capacityKwh);
  const totalCapacityKwh = batteryQuantity * batterySpecs.capacityKwh;
  const usefulCapacityKwh = totalCapacityKwh * dod;
  const autonomyHours = (usefulCapacityKwh / dailyConsumption) * 24;
  
  return {
    batteryQuantity: Math.min(batteryQuantity, batterySpecs.maxParallel),
    totalCapacityKwh,
    autonomyHours,
    bankVoltage: batterySpecs.voltage,
    usefulCapacityKwh
  };
}

function calculateMonthlyGeneration(systemPower: number, hsp: number, input: SolarCalculationInput): number {
  const dailyGeneration = systemPower * hsp;
  const monthlyGeneration = dailyGeneration * 30;
  
  // Aplicar fatores de correção
  let correctionFactor = 1.0;
  
  // Correção por orientação já aplicada nas perdas
  // Correção por inclinação (assumindo ótima)
  
  return monthlyGeneration * correctionFactor;
}

function calculateMonthlySavings(monthlyGeneration: number, monthlyConsumption: number, tariff: number): number {
  // Sistema de compensação elétrica
  const selfConsumption = Math.min(monthlyGeneration, monthlyConsumption);
  const injection = Math.max(0, monthlyGeneration - monthlyConsumption);
  
  // Economia: autoconsumo + créditos de injeção
  const savings = selfConsumption * tariff + injection * tariff * 0.95; // 5% perdas no sistema
  
  return savings;
}

function calculateItemizedCosts(
  panelQuantity: number,
  inverterModel: keyof typeof LIVOLTEK_INVERTERS,
  batteryConfig: any,
  input: SolarCalculationInput,
  products?: any[] // Products must be passed to this function
) {
  if (!products || products.length === 0) {
    throw new Error('ERRO: Produtos não fornecidos para cálculo. O sistema deve buscar produtos cadastrados no banco de dados.');
  }

  const systemPower = (panelQuantity * 550) / 1000; // kWp
  
  // Buscar produtos obrigatórios no banco de dados
  const structureProduct = products.find(p => p.code === 'SOL-EST-KIT');
  const documentationProduct = products.find(p => p.code === 'SOL-PROJ-DOC');
  const installationProduct = products.find(p => p.code === 'SOL-INST-MO');
  
  // Validar produtos obrigatórios
  if (!structureProduct) {
    throw new Error('ERRO: Produto de estrutura solar (SOL-EST-KIT) não encontrado. Cadastre este produto obrigatório.');
  }
  
  if (!documentationProduct) {
    throw new Error('ERRO: Produto de projeto/documentação (SOL-PROJ-DOC) não encontrado. Cadastre este produto obrigatório.');
  }
  
  // Buscar painéis e inversores nos produtos solares
  const solarPanels = products.filter(p => p.category === 'energia_solar' && p.solar_category === 'panel');
  const solarInverters = products.filter(p => p.category === 'energia_solar' && p.solar_category === 'inverter');
  const solarBatteries = products.filter(p => p.category === 'battery_backup' && p.solar_category === 'battery');
  
  if (solarPanels.length === 0) {
    throw new Error('ERRO: Nenhum painel solar cadastrado. Produtos de energia solar são obrigatórios.');
  }
  
  if (solarInverters.length === 0) {
    throw new Error('ERRO: Nenhum inversor solar cadastrado. Produtos de energia solar são obrigatórios.');
  }
  
  // Usar preços reais dos produtos cadastrados
  const panelPrice = solarPanels[0]?.base_price || 0;
  const inverterPrice = solarInverters[0]?.base_price || 0;
  
  if (panelPrice === 0) {
    throw new Error('ERRO: Preço do painel solar está zerado. Configure o preço no cadastro de produtos.');
  }
  
  if (inverterPrice === 0) {
    throw new Error('ERRO: Preço do inversor está zerado. Configure o preço no cadastro de produtos.');
  }
  
  // Calcular custos baseados em produtos reais
  const panelsCost = panelQuantity * panelPrice;
  const invertersCost = inverterPrice;
  const structureCost = systemPower * structureProduct.base_price;
  const installationCost = installationProduct ? systemPower * installationProduct.base_price : 0;
  const documentationCost = systemPower * documentationProduct.base_price;
  
  // Custos de bateria baseados em produtos reais
  let batteriesCost = 0;
  if (batteryConfig && batteryConfig.batteryQuantity > 0) {
    if (solarBatteries.length === 0) {
      throw new Error('ERRO: Sistema com baterias requer produtos de bateria cadastrados.');
    }
    
    const batteryPrice = solarBatteries[0]?.base_price || 0;
    if (batteryPrice === 0) {
      throw new Error('ERRO: Preço da bateria está zerado. Configure o preço no cadastro de produtos.');
    }
    
    batteriesCost = batteryConfig.batteryQuantity * batteryPrice;
  }
  
  return {
    panels: panelsCost,
    inverters: invertersCost,
    batteries: batteriesCost > 0 ? batteriesCost : undefined,
    structure: structureCost,
    installation: installationCost,
    documentation: documentationCost
  };
}

function calculatePerformanceMetrics(monthlyGeneration: number, systemPower: number, monthlyConsumption: number) {
  const specificYield = (monthlyGeneration * 12) / systemPower; // kWh/kWp/ano
  const performanceRatio = specificYield / (SOLAR_IRRADIATION_RANGES.southeast.default * 365); // PR
  const selfConsumptionRate = Math.min(monthlyGeneration, monthlyConsumption) / monthlyGeneration;
  const capacityFactor = monthlyGeneration / (systemPower * 24 * 30); // CF
  
  return {
    performanceRatio: Math.min(performanceRatio, 1.0),
    selfConsumptionRate,
    specificYield,
    capacityFactor
  };
}