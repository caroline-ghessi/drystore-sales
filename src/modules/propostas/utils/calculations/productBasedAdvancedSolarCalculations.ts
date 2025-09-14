import { SolarCalculationInput, SolarCalculationResult } from '../../types/calculation.types';
import { UnifiedProduct } from '../../hooks/useUnifiedProducts';
import { ProductCalculationService } from '../../services/productCalculationService';

export function calculateAdvancedSolarSystemWithProducts(
  input: SolarCalculationInput,
  products: UnifiedProduct[]
): SolarCalculationResult {
  if (!products || products.length === 0) {
    throw new Error('ERRO: Produtos não fornecidos. O sistema deve receber produtos cadastrados.');
  }

  // Buscar produtos obrigatórios
  const solarProducts = ProductCalculationService.getSolarProducts(products);
  const structureProduct = ProductCalculationService.findProductByCode(products, 'SOL-EST-KIT');
  const documentationProduct = ProductCalculationService.findProductByCode(products, 'SOL-PROJ-DOC');
  const installationProduct = ProductCalculationService.findProductByCode(products, 'SOL-INST-MO');

  // Validar produtos obrigatórios
  if (solarProducts.panels.length === 0) {
    throw new Error('ERRO: Nenhum painel solar cadastrado. Cadastre painéis solares na categoria "energia_solar".');
  }

  if (solarProducts.inverters.length === 0) {
    throw new Error('ERRO: Nenhum inversor solar cadastrado. Cadastre inversores na categoria "energia_solar".');
  }

  if (!structureProduct) {
    throw new Error('ERRO: Produto de estrutura (SOL-EST-KIT) não encontrado. Cadastre este produto obrigatório.');
  }

  if (!documentationProduct) {
    throw new Error('ERRO: Produto de documentação (SOL-PROJ-DOC) não encontrado. Cadastre este produto obrigatório.');
  }

  // Usar primeiro painel disponível (ou implementar seleção inteligente)
  const selectedPanel = solarProducts.panels[0];
  const panelSpecs = ProductCalculationService.getProductSpecs(selectedPanel);
  
  if (!panelSpecs.power) {
    throw new Error(`ERRO: Painel "${selectedPanel.name}" não possui especificação de potência. Configure as especificações.`);
  }

  // HSP padrão nacional para uniformidade
  const hsp = 4.8;
  
  // Cálculo de consumo diário
  const dailyConsumption = input.monthlyConsumption / 30;
  
  // Fator de eficiência total do sistema (perdas)
  const systemLossFactor = calculateSystemLosses(input);
  
  // Potência necessária do sistema
  const requiredPower = (dailyConsumption / hsp) / (1 - systemLossFactor); // kWp
  
  // Quantidade de módulos baseada no painel selecionado
  const panelQuantity = Math.ceil((requiredPower * 1000) / panelSpecs.power);
  const actualSystemPower = (panelQuantity * panelSpecs.power) / 1000; // kWp
  
  // Seleção do inversor baseado em produtos disponíveis
  const selectedInverter = selectInverterFromProducts(actualSystemPower, solarProducts.inverters);
  if (!selectedInverter) {
    throw new Error('ERRO: Nenhum inversor adequado encontrado para a potência do sistema. Cadastre inversores compatíveis.');
  }

  // Configuração de baterias (se aplicável)
  let batteryConfig = undefined;
  if (input.installationType === 'hybrid' || input.installationType === 'off_grid') {
    if (solarProducts.batteries.length === 0) {
      throw new Error('ERRO: Sistema híbrido/off-grid requer baterias cadastradas na categoria "battery_backup".');
    }
    batteryConfig = calculateBatteryConfigurationWithProducts(input, dailyConsumption, solarProducts.batteries);
  }
  
  // Geração e economia
  const monthlyGeneration = calculateMonthlyGeneration(actualSystemPower, hsp, input);
  const tariff = 0.85; // R$/kWh média
  const monthlySavings = calculateMonthlySavings(monthlyGeneration, input.monthlyConsumption, tariff);
  
  // Custos itemizados baseados em produtos reais
  const itemizedCosts = calculateItemizedCostsWithProducts(
    panelQuantity,
    selectedPanel,
    selectedInverter,
    batteryConfig,
    structureProduct,
    documentationProduct,
    installationProduct,
    actualSystemPower
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
    stringConfiguration: calculateStringConfiguration(panelQuantity, panelSpecs),
    batteryConfiguration: batteryConfig,
    performanceMetrics,
    itemizedCosts,
    totalCost,
    quantified_items: generateQuantifiedItems(
      panelQuantity,
      selectedPanel,
      selectedInverter,
      batteryConfig,
      structureProduct,
      documentationProduct,
      actualSystemPower
    )
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

function selectInverterFromProducts(systemPower: number, inverters: UnifiedProduct[]): UnifiedProduct | null {
  // Buscar inversores adequados à potência do sistema
  for (const inverter of inverters) {
    const specs = ProductCalculationService.getProductSpecs(inverter);
    const inverterPowerKW = (specs.power_continuous || specs.power || 0) / 1000;
    
    // Selecionar inversor que suporte a potência do sistema com margem de 20%
    if (inverterPowerKW >= systemPower * 0.8 && inverterPowerKW <= systemPower * 1.5) {
      return inverter;
    }
  }
  
  // Se não encontrar ideal, usar o mais próximo
  return inverters.sort((a, b) => {
    const specsA = ProductCalculationService.getProductSpecs(a);
    const specsB = ProductCalculationService.getProductSpecs(b);
    const powerA = (specsA.power_continuous || specsA.power || 0) / 1000;
    const powerB = (specsB.power_continuous || specsB.power || 0) / 1000;
    
    return Math.abs(powerA - systemPower) - Math.abs(powerB - systemPower);
  })[0] || null;
}

function calculateBatteryConfigurationWithProducts(
  input: SolarCalculationInput,
  dailyConsumption: number,
  batteries: UnifiedProduct[]
) {
  if (!input.batteryConfig?.enabled || batteries.length === 0) return undefined;
  
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
  
  // Usar primeira bateria disponível
  const selectedBattery = batteries[0];
  const batterySpecs = ProductCalculationService.getProductSpecs(selectedBattery);
  
  if (!batterySpecs.capacity) {
    throw new Error(`ERRO: Bateria "${selectedBattery.name}" não possui especificação de capacidade. Configure as especificações.`);
  }
  
  const batteryQuantity = Math.ceil(totalCapacityNeeded / batterySpecs.capacity);
  const maxParallel = batterySpecs.maxParallel || 5;
  const finalBatteryQuantity = Math.min(batteryQuantity, maxParallel);
  
  const totalCapacityKwh = finalBatteryQuantity * batterySpecs.capacity;
  const usefulCapacityKwh = totalCapacityKwh * dod;
  const autonomyHours = (usefulCapacityKwh / dailyConsumption) * 24;
  
  return {
    batteryQuantity: finalBatteryQuantity,
    totalCapacityKwh,
    autonomyHours,
    bankVoltage: batterySpecs.voltage || 48,
    usefulCapacityKwh,
    selectedBattery
  };
}

function calculateStringConfiguration(panelQuantity: number, panelSpecs: any) {
  // Configuração básica de strings
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
  
  const stringVoltage = panelsPerString * (panelSpecs.vmp || 40);
  const withinMPPTRange = stringVoltage >= 120 && stringVoltage <= 500;
  
  return {
    totalStrings,
    panelsPerString,
    stringVoltage,
    withinMPPTRange
  };
}

function calculateMonthlyGeneration(systemPower: number, hsp: number, input: SolarCalculationInput): number {
  const dailyGeneration = systemPower * hsp;
  const monthlyGeneration = dailyGeneration * 30;
  
  return monthlyGeneration;
}

function calculateMonthlySavings(monthlyGeneration: number, monthlyConsumption: number, tariff: number): number {
  // Sistema de compensação elétrica
  const selfConsumption = Math.min(monthlyGeneration, monthlyConsumption);
  const injection = Math.max(0, monthlyGeneration - monthlyConsumption);
  
  // Economia: autoconsumo + créditos de injeção
  const savings = selfConsumption * tariff + injection * tariff * 0.95; // 5% perdas no sistema
  
  return savings;
}

function calculateItemizedCostsWithProducts(
  panelQuantity: number,
  selectedPanel: UnifiedProduct,
  selectedInverter: UnifiedProduct,
  batteryConfig: any,
  structureProduct: UnifiedProduct,
  documentationProduct: UnifiedProduct,
  installationProduct: UnifiedProduct | null,
  systemPower: number
) {
  // Validar preços
  if (selectedPanel.base_price === 0) {
    throw new Error(`ERRO: Preço do painel "${selectedPanel.name}" está zerado. Configure o preço no cadastro.`);
  }
  
  if (selectedInverter.base_price === 0) {
    throw new Error(`ERRO: Preço do inversor "${selectedInverter.name}" está zerado. Configure o preço no cadastro.`);
  }
  
  const panelsCost = panelQuantity * selectedPanel.base_price;
  const invertersCost = selectedInverter.base_price;
  const structureCost = systemPower * structureProduct.base_price;
  const documentationCost = systemPower * documentationProduct.base_price;
  const installationCost = installationProduct ? systemPower * installationProduct.base_price : 0;
  
  // Custos de bateria
  let batteriesCost = 0;
  if (batteryConfig && batteryConfig.selectedBattery) {
    if (batteryConfig.selectedBattery.base_price === 0) {
      throw new Error(`ERRO: Preço da bateria "${batteryConfig.selectedBattery.name}" está zerado. Configure o preço no cadastro.`);
    }
    batteriesCost = batteryConfig.batteryQuantity * batteryConfig.selectedBattery.base_price;
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
  const performanceRatio = specificYield / (4.8 * 365); // PR usando HSP médio
  const selfConsumptionRate = Math.min(monthlyGeneration, monthlyConsumption) / monthlyGeneration;
  const capacityFactor = monthlyGeneration / (systemPower * 24 * 30); // CF
  
  return {
    performanceRatio: Math.min(performanceRatio, 1.0),
    selfConsumptionRate,
    specificYield,
    capacityFactor
  };
}

function generateQuantifiedItems(
  panelQuantity: number,
  selectedPanel: UnifiedProduct,
  selectedInverter: UnifiedProduct,
  batteryConfig: any,
  structureProduct: UnifiedProduct,
  documentationProduct: UnifiedProduct,
  systemPower: number
) {
  const items = [
    {
      name: selectedPanel.name,
      description: selectedPanel.description || 'Painel Solar Fotovoltaico',
      quantity: panelQuantity,
      unit: 'unidade',
      unit_price: selectedPanel.base_price,
      total_price: panelQuantity * selectedPanel.base_price,
      category: 'Painéis Solares',
      specifications: selectedPanel.specifications || {}
    },
    {
      name: selectedInverter.name,
      description: selectedInverter.description || 'Inversor Solar',
      quantity: 1,
      unit: 'unidade',
      unit_price: selectedInverter.base_price,
      total_price: selectedInverter.base_price,
      category: 'Inversores',
      specifications: selectedInverter.specifications || {}
    },
    {
      name: structureProduct.name,
      description: structureProduct.description || 'Kit de Estruturas para Fixação',
      quantity: systemPower,
      unit: 'kWp',
      unit_price: structureProduct.base_price,
      total_price: systemPower * structureProduct.base_price,
      category: 'Estruturas',
      specifications: structureProduct.specifications || {}
    },
    {
      name: documentationProduct.name,
      description: documentationProduct.description || 'Projeto e Documentação',
      quantity: systemPower,
      unit: 'kWp',
      unit_price: documentationProduct.base_price,
      total_price: systemPower * documentationProduct.base_price,
      category: 'Serviços',
      specifications: documentationProduct.specifications || {}
    }
  ];
  
  // Adicionar baterias se existirem
  if (batteryConfig && batteryConfig.selectedBattery) {
    items.push({
      name: batteryConfig.selectedBattery.name,
      description: batteryConfig.selectedBattery.description || 'Bateria para Armazenamento',
      quantity: batteryConfig.batteryQuantity,
      unit: 'unidade',
      unit_price: batteryConfig.selectedBattery.base_price,
      total_price: batteryConfig.batteryQuantity * batteryConfig.selectedBattery.base_price,
      category: 'Baterias',
      specifications: batteryConfig.selectedBattery.specifications || {}
    });
  }
  
  return items;
}