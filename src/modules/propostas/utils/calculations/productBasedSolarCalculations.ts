import { SolarCalculationInput, SolarCalculationResult } from '../../types/calculation.types';
import { UnifiedProduct } from '../../hooks/useUnifiedProducts';
import { ProductCalculationService, ProductCalculationSpecs } from '../../services/productCalculationService';

// HSP (Horas de Sol Pleno) por região - valores técnicos mantidos
const SOLAR_IRRADIATION_RANGES = {
  north: { min: 4.5, max: 5.0, default: 4.8 },
  northeast: { min: 5.5, max: 6.0, default: 5.7 },
  center_west: { min: 5.0, max: 5.5, default: 5.2 },
  southeast: { min: 4.5, max: 5.5, default: 5.0 },
  south: { min: 4.0, max: 5.0, default: 4.5 }
};

// Fallbacks apenas para especificações técnicas (não preços)
const FALLBACK_SPECS = {
  panel: { 
    power_rating: 550, 
    efficiency: 0.21, 
    dimensions: { width: 1.13, height: 2.28 },
    voltage: 41.0,
    current: 13.4 
  },
  inverter: {
    efficiency: 0.97,
    mppt_min: 120,
    mppt_max: 500
  },
  battery: {
    voltage: 51.2,
    dod: 0.9,
    cycles: 6000
  }
};

export function calculateSolarWithProducts(
  input: SolarCalculationInput,
  products: UnifiedProduct[]
): SolarCalculationResult {
  // Usar HSP padrão nacional para uniformidade
  const hsp = 4.8;
  
  // Cálculo de consumo diário
  const dailyConsumption = input.monthlyConsumption / 30;
  
  // Fator de eficiência total do sistema (perdas)
  const systemLossFactor = calculateSystemLosses(input);
  
  // Potência necessária do sistema
  const requiredPower = (dailyConsumption / hsp) / (1 - systemLossFactor); // kWp
  
  // BUSCAR PRODUTOS REAIS DO CADASTRO
  const solarProducts = ProductCalculationService.getSolarProducts(products);
  
  // Selecionar painel solar - SEMPRE usar produto cadastrado (mesmo se preço = 0)
  const selectedPanel = solarProducts.panels[0];
  let panelSpecs = FALLBACK_SPECS.panel;
  let panelPrice = 0; // Sempre começar com zero
  
  if (selectedPanel) {
    const specs = ProductCalculationService.getProductSpecs(selectedPanel);
    panelSpecs = {
      power_rating: specs.power || specs.power_rating || FALLBACK_SPECS.panel.power_rating,
      efficiency: specs.efficiency || FALLBACK_SPECS.panel.efficiency,
      dimensions: specs.dimensions?.width && specs.dimensions?.height ? 
        { width: specs.dimensions.width, height: specs.dimensions.height } : 
        FALLBACK_SPECS.panel.dimensions,
      voltage: specs.voltage || FALLBACK_SPECS.panel.voltage,
      current: specs.voltage ? (specs.power || specs.power_rating || FALLBACK_SPECS.panel.power_rating) / specs.voltage : FALLBACK_SPECS.panel.current
    };
    // SEMPRE usar o preço do produto cadastrado (pode ser zero)
    panelPrice = selectedPanel.base_price || 0;
  }
  
  // Quantidade de módulos
  const panelQuantity = Math.ceil((requiredPower * 1000) / panelSpecs.power_rating);
  const actualSystemPower = (panelQuantity * panelSpecs.power_rating) / 1000; // kWp
  
  // Configuração de strings
  const stringConfig = calculateStringConfiguration(panelQuantity, panelSpecs);
  
  // Selecionar inversor baseado na potência - SEMPRE usar produto cadastrado
  const selectedInverter = selectInverterFromProducts(actualSystemPower, solarProducts.inverters);
  let inverterPrice = 0; // Sempre começar com zero
  let inverterSpecs = { efficiency: FALLBACK_SPECS.inverter.efficiency };
  
  if (selectedInverter) {
    const specs = ProductCalculationService.getProductSpecs(selectedInverter);
    inverterSpecs = {
      efficiency: specs.efficiency || FALLBACK_SPECS.inverter.efficiency
    };
    // SEMPRE usar o preço do produto cadastrado (pode ser zero)
    inverterPrice = selectedInverter.base_price || 0;
  }
  
  // Configuração de baterias (se aplicável)
  let batteryConfig = undefined;
  if (input.installationType === 'hybrid' || input.installationType === 'off_grid') {
    batteryConfig = calculateBatteryConfigurationWithProducts(input, dailyConsumption, solarProducts.batteries || []);
  }
  
  // Geração e economia
  const monthlyGeneration = calculateMonthlyGeneration(actualSystemPower, hsp, input, inverterSpecs.efficiency);
  const tariff = 0.85; // R$/kWh média
  const monthlySavings = calculateMonthlySavings(monthlyGeneration, input.monthlyConsumption, tariff);
  
  // Custos itemizados usando preços reais dos produtos
  const itemizedCosts = calculateItemizedCostsWithProducts(
    panelQuantity,
    panelPrice,
    inverterPrice,
    batteryConfig,
    actualSystemPower,
    solarProducts.structure,
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
  totalLosses += 0.08; // Temperatura média nacional
  
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

function calculateStringConfiguration(panelQuantity: number, panelSpecs: any) {
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
  
  const stringVoltage = panelsPerString * panelSpecs.voltage;
  const withinMPPTRange = stringVoltage >= FALLBACK_SPECS.inverter.mppt_min && stringVoltage <= FALLBACK_SPECS.inverter.mppt_max;
  
  return {
    totalStrings,
    panelsPerString,
    stringVoltage,
    withinMPPTRange
  };
}

function selectInverterFromProducts(systemPower: number, inverters: UnifiedProduct[]) {
  // Buscar inversor adequado para a potência
  const suitableInverter = inverters.find(inverter => {
    const specs = ProductCalculationService.getProductSpecs(inverter);
    const inverterPower = (specs.power || specs.power_rating) ? (specs.power || specs.power_rating)! / 1000 : 0;
    
    // Inversor deve suportar pelo menos a potência do sistema
    return inverterPower >= systemPower && inverterPower <= systemPower * 1.3;
  });
  
  // Se não encontrar, pegar o menor disponível
  return suitableInverter || inverters[0];
}

function calculateBatteryConfigurationWithProducts(
  input: SolarCalculationInput, 
  dailyConsumption: number,
  batteries: UnifiedProduct[]
) {
  if (!input.batteryConfig?.enabled) return undefined;
  
  const desiredAutonomy = input.batteryConfig.desiredAutonomy || 24;
  
  let energyNeeded: number;
  if (input.installationType === 'off_grid') {
    energyNeeded = (dailyConsumption * desiredAutonomy / 24);
  } else {
    const nocturnalConsumption = dailyConsumption * 0.4;
    energyNeeded = nocturnalConsumption * 1.1;
  }
  
  // Selecionar bateria (preferir primeira disponível) - SEMPRE usar produto cadastrado
  const selectedBattery = batteries[0];
  let batterySpecs = FALLBACK_SPECS.battery;
  let batteryPrice = 0; // Sempre começar com zero
  let capacityKwh = 5.12;
  
  if (selectedBattery) {
    const specs = ProductCalculationService.getProductSpecs(selectedBattery);
    batterySpecs = {
      voltage: specs.voltage || FALLBACK_SPECS.battery.voltage,
      dod: specs.efficiency || FALLBACK_SPECS.battery.dod,
      cycles: specs.capacity || FALLBACK_SPECS.battery.cycles
    };
    capacityKwh = specs.capacity || capacityKwh;
    // SEMPRE usar o preço do produto cadastrado (pode ser zero)
    batteryPrice = selectedBattery.base_price || 0;
  }
  
  const totalCapacityNeeded = energyNeeded / batterySpecs.dod;
  const batteryQuantity = Math.ceil(totalCapacityNeeded / capacityKwh);
  const totalCapacityKwh = batteryQuantity * capacityKwh;
  const usefulCapacityKwh = totalCapacityKwh * batterySpecs.dod;
  const autonomyHours = (usefulCapacityKwh / dailyConsumption) * 24;
  
  return {
    batteryQuantity: Math.min(batteryQuantity, 5), // Máximo 5 em paralelo
    totalCapacityKwh,
    autonomyHours,
    bankVoltage: batterySpecs.voltage,
    usefulCapacityKwh,
    batteryPrice
  };
}

function calculateMonthlyGeneration(systemPower: number, hsp: number, input: SolarCalculationInput, efficiency: number): number {
  const dailyGeneration = systemPower * hsp * efficiency;
  return dailyGeneration * 30;
}

function calculateMonthlySavings(monthlyGeneration: number, monthlyConsumption: number, tariff: number): number {
  const selfConsumption = Math.min(monthlyGeneration, monthlyConsumption);
  const injection = Math.max(0, monthlyGeneration - monthlyConsumption);
  
  return selfConsumption * tariff + injection * tariff * 0.95;
}

function calculateItemizedCostsWithProducts(
  panelQuantity: number,
  panelPrice: number,
  inverterPrice: number,
  batteryConfig: any,
  systemPower: number,
  structureProducts: UnifiedProduct[],
  input: SolarCalculationInput
) {
  // Custos base usando preços reais
  const panelsCost = panelQuantity * panelPrice;
  const invertersCost = inverterPrice;
  
  // Estrutura - SEMPRE usar produto cadastrado (pode ser zero)
  let structureCostPerKwp = 0; // Sempre começar com zero
  if (structureProducts && structureProducts[0]) {
    const structureProduct = structureProducts[0];
    const specs = ProductCalculationService.getProductSpecs(structureProduct);
    structureCostPerKwp = specs.yield_per_unit || structureProduct.base_price || 0;
  }
  
  const structureCost = systemPower * structureCostPerKwp;
  const installationCost = 0; // Mão de obra removida por padrão
  const documentationCost = 0; // Documentação será item separado com preço próprio
  
  // Custos de bateria usando preço real
  let batteriesCost = 0;
  if (batteryConfig && batteryConfig.batteryPrice) {
    batteriesCost = batteryConfig.batteryQuantity * batteryConfig.batteryPrice;
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
  const specificYield = (monthlyGeneration * 12) / systemPower;
  const performanceRatio = specificYield / (SOLAR_IRRADIATION_RANGES.southeast.default * 365);
  const selfConsumptionRate = Math.min(monthlyGeneration, monthlyConsumption) / monthlyGeneration;
  const capacityFactor = monthlyGeneration / (systemPower * 24 * 30);
  
  return {
    performanceRatio: Math.min(performanceRatio, 1.0),
    selfConsumptionRate,
    specificYield,
    capacityFactor
  };
}