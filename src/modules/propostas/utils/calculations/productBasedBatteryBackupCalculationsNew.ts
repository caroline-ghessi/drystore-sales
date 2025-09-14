import { BatteryBackupInput, BatteryBackupResult } from '../../types/calculation.types';
import { UnifiedProduct } from '../../hooks/useUnifiedProducts';
import { ProductCalculationService } from '../../services/productCalculationService';

export function calculateBatteryBackupWithProducts(
  input: BatteryBackupInput,
  products: UnifiedProduct[]
): BatteryBackupResult {
  if (!products || products.length === 0) {
    throw new Error('ERRO: Produtos não fornecidos. O sistema deve receber produtos cadastrados.');
  }

  // Buscar produtos obrigatórios
  const batteryProducts = ProductCalculationService.getBatteryProducts(products);
  const accessoriesProduct = ProductCalculationService.findProductByCode(products, 'BAT-ACESS-SEG');

  // Validar produtos obrigatórios
  if (batteryProducts.batteries.length === 0) {
    throw new Error('ERRO: Nenhuma bateria cadastrada. Cadastre baterias na categoria "battery_backup".');
  }

  if (batteryProducts.inverters.length === 0) {
    throw new Error('ERRO: Nenhum inversor híbrido cadastrado. Cadastre inversores híbridos na categoria "energia_solar".');
  }

  if (!accessoriesProduct) {
    throw new Error('ERRO: Produto de acessórios (BAT-ACESS-SEG) não encontrado. Cadastre este produto obrigatório.');
  }

  // Calcular potência total das cargas essenciais
  const essentialLoads = input.essentialLoads;
  const totalPowerW = Object.values(essentialLoads).reduce((sum, power) => sum + power, 0);
  const totalPowerKW = totalPowerW / 1000;
  
  // Aplicar fator de simultaneidade
  const simultaneousFactor = 0.7;
  const simultaneousPower = totalPowerKW * simultaneousFactor;
  
  // Calcular energia necessária para autonomia desejada
  const energyRequired = simultaneousPower * input.desiredAutonomy;
  
  // Selecionar bateria baseada em produtos disponíveis
  const selectedBattery = selectBatteryFromProducts(energyRequired, batteryProducts.batteries);
  if (!selectedBattery) {
    throw new Error('ERRO: Nenhuma bateria adequada encontrada. Cadastre baterias compatíveis.');
  }

  const batterySpecs = ProductCalculationService.getProductSpecs(selectedBattery);
  
  if (!batterySpecs.capacity || !batterySpecs.dod) {
    throw new Error(`ERRO: Bateria "${selectedBattery.name}" não possui especificações de capacidade/dod. Configure as especificações.`);
  }

  // Calcular quantidade de baterias necessárias
  const dod = batterySpecs.dod;
  const totalCapacityNeeded = energyRequired / dod;
  const batteryQuantity = Math.ceil(totalCapacityNeeded / batterySpecs.capacity);
  const maxParallel = batterySpecs.maxParallel || 5;
  const finalBatteryQuantity = Math.min(batteryQuantity, maxParallel);
  
  // Capacidades finais
  const totalCapacityKwh = finalBatteryQuantity * batterySpecs.capacity;
  const usefulCapacityKwh = totalCapacityKwh * dod;
  const autonomyHours = usefulCapacityKwh / simultaneousPower;
  
  // Selecionar inversor baseado na potência necessária
  const selectedInverter = selectInverterFromProducts(simultaneousPower, batteryProducts.inverters);
  if (!selectedInverter) {
    throw new Error('ERRO: Nenhum inversor adequado encontrado. Cadastre inversores compatíveis.');
  }

  const inverterSpecs = ProductCalculationService.getProductSpecs(selectedInverter);
  
  if (!inverterSpecs.power_continuous || !inverterSpecs.power_peak) {
    throw new Error(`ERRO: Inversor "${selectedInverter.name}" não possui especificações de potência. Configure as especificações.`);
  }

  // Verificar se o inversor suporta a potência de pico
  const peakPowerW = totalPowerW * 1.5; // Fator de partida
  const canHandlePeakPower = peakPowerW <= inverterSpecs.power_peak;
  
  if (!canHandlePeakPower) {
    throw new Error('ERRO: Potência de pico excede capacidade do inversor selecionado. Cadastre inversor com maior capacidade.');
  }

  // Validar preços dos produtos
  if (selectedBattery.base_price === 0) {
    throw new Error(`ERRO: Preço da bateria "${selectedBattery.name}" está zerado. Configure o preço no cadastro.`);
  }

  if (selectedInverter.base_price === 0) {
    throw new Error(`ERRO: Preço do inversor "${selectedInverter.name}" está zerado. Configure o preço no cadastro.`);
  }

  if (accessoriesProduct.base_price === 0) {
    throw new Error(`ERRO: Preço dos acessórios "${accessoriesProduct.name}" está zerado. Configure o preço no cadastro.`);
  }

  // Calcular custos baseados em produtos reais
  const batteryCost = finalBatteryQuantity * selectedBattery.base_price;
  const inverterCost = selectedInverter.base_price;
  const accessoriesCost = totalPowerKW * accessoriesProduct.base_price;
  
  const totalCost = batteryCost + inverterCost + accessoriesCost;
  
  // Calcular economia/valor
  const monthlyGridCost = calculateMonthlyChargingCost(totalCapacityKwh);
  const backupValue = estimateBackupValue(simultaneousPower, input.desiredAutonomy);
  
  return {
    totalPowerRequired: simultaneousPower,
    peakPowerRequired: simultaneousPower * 1.5,
    totalEnergyRequired: energyRequired,
    dailyEnergyConsumption: energyRequired / input.desiredAutonomy,
    inverterPower: inverterSpecs.power_continuous / 1000,
    inverterQuantity: 1,
    inverterEfficiency: inverterSpecs.efficiency || 0.95,
    
    batteryConfiguration: {
      batteryQuantity: finalBatteryQuantity,
      totalCapacityKwh,
      autonomyHours,
      usefulCapacityKwh,
      bankVoltage: batterySpecs.voltage || 48,
      maxDischargeRate: simultaneousPower * 1.2 // 20% margin
    },
    
    itemizedCosts: {
      batteries: batteryCost,
      inverters: inverterCost,
      installation: 0, // Não incluído automaticamente
      monitoring: accessoriesCost * 0.3,
      protection: accessoriesCost * 0.7
    },
    totalCost: totalCost,
    
    economicMetrics: {
      monthlySavings: backupValue,
      paybackPeriod: totalCost / (backupValue * 12),
      lifespan: 15,
      maintenanceCostPerYear: totalCost * 0.02
    },
    technicalSpecs: {
      chargeTime: 4,
      dischargeTime: autonomyHours,
      cyclesPerYear: 100,
      expectedLifeCycles: batterySpecs.cycles || 6000,
      warrantyYears: 10
    }
  };
}

function selectBatteryFromProducts(energyRequired: number, batteries: UnifiedProduct[]): UnifiedProduct | null {
  // Buscar bateria adequada à energia necessária
  for (const battery of batteries) {
    const specs = ProductCalculationService.getProductSpecs(battery);
    const batteryCapacity = specs.capacity || 0;
    const dod = specs.dod || 0.9;
    const usefulCapacity = batteryCapacity * dod;
    
    // Verificar se uma única bateria atende pelo menos 50% da necessidade
    if (usefulCapacity >= energyRequired * 0.5) {
      return battery;
    }
  }
  
  // Se não encontrar ideal, usar a primeira disponível
  return batteries[0] || null;
}

function selectInverterFromProducts(powerKW: number, inverters: UnifiedProduct[]): UnifiedProduct | null {
  // Buscar inversor adequado à potência necessária
  for (const inverter of inverters) {
    const specs = ProductCalculationService.getProductSpecs(inverter);
    const inverterPowerKW = (specs.power_continuous || specs.power || 0) / 1000;
    
    // Selecionar inversor que suporte a potência com margem
    if (inverterPowerKW >= powerKW && inverterPowerKW <= powerKW * 2) {
      return inverter;
    }
  }
  
  // Se não encontrar ideal, usar o mais próximo
  return inverters.sort((a, b) => {
    const specsA = ProductCalculationService.getProductSpecs(a);
    const specsB = ProductCalculationService.getProductSpecs(b);
    const powerA = (specsA.power_continuous || specsA.power || 0) / 1000;
    const powerB = (specsB.power_continuous || specsB.power || 0) / 1000;
    
    return Math.abs(powerA - powerKW) - Math.abs(powerB - powerKW);
  })[0] || null;
}

function calculateMonthlyChargingCost(batteryCapacityKwh: number): number {
  // Estimativa de carregamento mensal
  const cyclesPerMonth = 8;
  const energyPerMonth = batteryCapacityKwh * cyclesPerMonth;
  const tariff = 0.85; // R$/kWh
  const efficiency = 0.9; // Eficiência de carregamento
  
  return (energyPerMonth / efficiency) * tariff;
}

function estimateBackupValue(powerKW: number, autonomyHours: number): number {
  // Valor estimado da proteção contra quedas de energia
  const dailyLossAvoidance = {
    food: 50, // R$/dia (geladeira/freezer)
    security: 30, // R$/dia (alarmes, câmeras)
    communication: 20, // R$/dia (internet, telefone)
    comfort: 40 // R$/dia (iluminação, ventilação)
  };
  
  const totalDailyValue = Object.values(dailyLossAvoidance).reduce((sum, value) => sum + value, 0);
  const hourlyValue = totalDailyValue / 24;
  
  return hourlyValue * autonomyHours;
}