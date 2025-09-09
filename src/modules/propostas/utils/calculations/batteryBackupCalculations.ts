import { BatteryBackupInput, BatteryBackupResult } from '../../types/calculation.types';

// Especificações dos inversores híbridos Livoltek
const LIVOLTEK_INVERTERS = {
  'GF1-3K': {
    powerContinuous: 3000,
    powerPeak: 6000,
    efficiency: 0.97,
    price: 4500
  },
  'GF1-5K': {
    powerContinuous: 5000,
    powerPeak: 10000,
    efficiency: 0.97,
    price: 7200
  }
};

// Especificações das baterias Livoltek
const LIVOLTEK_BATTERIES = {
  'BLF-B51100': {
    capacityKwh: 5.12,
    voltage: 51.2,
    capacityAh: 100,
    dod: 0.9,
    maxParallel: 5,
    cycles: 6000,
    price: 12800
  },
  'BLF-B51150': {
    capacityKwh: 7.68,
    voltage: 51.2,
    capacityAh: 150,
    dod: 0.9,
    maxParallel: 5,
    cycles: 6000,
    price: 18500
  }
};

export function calculateBatteryBackup(input: BatteryBackupInput): BatteryBackupResult {
  // Calcular potência total das cargas essenciais
  const essentialLoads = input.essentialLoads;
  const totalPowerW = Object.values(essentialLoads).reduce((sum, power) => sum + power, 0);
  const totalPowerKW = totalPowerW / 1000;
  
  // Aplicar fator de simultaneidade (nem todas as cargas ligam ao mesmo tempo)
  const simultaneousFactor = input.usagePattern?.simultaneousFactor || 0.7;
  const simultaneousPower = totalPowerKW * simultaneousFactor;
  
  // Calcular energia necessária para autonomia desejada
  const dailyUsageHours = input.usagePattern?.dailyUsageHours || input.desiredAutonomy;
  const energyRequired = simultaneousPower * dailyUsageHours;
  
  // Selecionar tipo de bateria
  const batteryType = input.batteryType || 'lifepo4';
  const batteryModel = energyRequired > 10 ? 'BLF-B51150' : 'BLF-B51100';
  const batterySpecs = LIVOLTEK_BATTERIES[batteryModel];
  
  // Calcular quantidade de baterias necessárias
  const dod = batterySpecs.dod;
  const totalCapacityNeeded = energyRequired / dod;
  const batteryQuantity = Math.ceil(totalCapacityNeeded / batterySpecs.capacityKwh);
  const finalBatteryQuantity = Math.min(batteryQuantity, batterySpecs.maxParallel);
  
  // Capacidades finais
  const totalCapacityKwh = finalBatteryQuantity * batterySpecs.capacityKwh;
  const usefulCapacityKwh = totalCapacityKwh * dod;
  const autonomyHours = usefulCapacityKwh / simultaneousPower;
  
  // Selecionar inversor baseado na potência necessária
  const inverterModel = simultaneousPower <= 3 ? 'GF1-3K' : 'GF1-5K';
  const inverterSpecs = LIVOLTEK_INVERTERS[inverterModel];
  
  // Verificar se o inversor suporta a potência de pico
  const peakPowerW = totalPowerW * 1.5; // Fator de partida
  const canHandlePeakPower = peakPowerW <= inverterSpecs.powerPeak;
  
  if (!canHandlePeakPower) {
    // Forçar inversor maior se necessário
    const largerInverter = 'GF1-5K';
    const largerSpecs = LIVOLTEK_INVERTERS[largerInverter];
    
    if (peakPowerW > largerSpecs.powerPeak) {
      throw new Error('Potência de pico excede capacidade disponível dos inversores');
    }
  }
  
  // Calcular custos
  const batteryCost = finalBatteryQuantity * batterySpecs.price;
  const inverterCost = inverterSpecs.price;
  const installationCost = (batteryCost + inverterCost) * 0.15; // 15% do equipamento
  const accessoriesCost = totalPowerKW * 500; // Cabos, disjuntores, etc.
  
  const totalCost = batteryCost + inverterCost + installationCost + accessoriesCost;
  
  // Calcular economia/valor
  const monthlyGridCost = calculateMonthlyChargingCost(totalCapacityKwh);
  const backupValue = estimateBackupValue(simultaneousPower, input.desiredAutonomy);
  
  return {
    totalPowerRequired: simultaneousPower,
    energyRequired,
    inverterPower: inverterSpecs.powerContinuous / 1000, // kW
    
    batteryConfiguration: {
      batteryQuantity: finalBatteryQuantity,
      totalCapacityKwh,
      autonomyHours,
      usefulCapacityKwh,
      bankVoltage: batterySpecs.voltage
    },
    
    inverterSpecifications: {
      model: inverterModel,
      continuousPower: inverterSpecs.powerContinuous,
      peakPower: inverterSpecs.powerPeak,
      efficiency: inverterSpecs.efficiency
    },
    
    itemizedCosts: {
      batteries: batteryCost,
      inverter: inverterCost,
      installation: installationCost,
      accessories: accessoriesCost
    },
    
    totalCost,
    monthlyGridCost,
    backupValue
  };
}

function calculateMonthlyChargingCost(batteryCapacityKwh: number): number {
  // Estimativa de carregamento mensal
  // Assumindo 2 ciclos por semana (conservador)
  const cyclesPerMonth = 8;
  const energyPerMonth = batteryCapacityKwh * cyclesPerMonth;
  const tariff = 0.85; // R$/kWh
  const efficiency = 0.9; // Eficiência de carregamento
  
  return (energyPerMonth / efficiency) * tariff;
}

function estimateBackupValue(powerKW: number, autonomyHours: number): number {
  // Valor estimado da proteção contra quedas de energia
  // Baseado em:
  // - Evitar perdas de alimentos (geladeira/freezer)
  // - Manter comunicação e segurança
  // - Conforto durante quedas
  
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

// Função para validar configuração de cargas
export function validateEssentialLoads(loads: BatteryBackupInput['essentialLoads']): {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  const totalPower = Object.values(loads).reduce((sum, power) => sum + power, 0);
  
  // Validações básicas
  if (totalPower < 100) {
    warnings.push('Potência muito baixa. Verifique se todas as cargas foram incluídas.');
  }
  
  if (totalPower > 8000) {
    warnings.push('Potência muito alta para sistema residencial. Considere reduzir cargas.');
  }
  
  // Recomendações por categoria
  if (loads.lighting < 200) {
    recommendations.push('Considere aumentar a potência de iluminação para pelo menos 200W');
  }
  
  if (loads.refrigerator === 0) {
    recommendations.push('Geladeira é uma carga essencial. Considere incluí-la (150-300W)');
  }
  
  if (loads.communication === 0) {
    recommendations.push('Comunicação é essencial. Inclua router e celular (50-100W)');
  }
  
  const isValid = warnings.length === 0;
  
  return {
    isValid,
    warnings,
    recommendations
  };
}

// Função para calcular estimativa de consumo baseado em equipamentos
export function estimateConsumptionFromAppliances(appliances: {
  name: string;
  power: number; // W
  hoursPerDay: number;
  quantity?: number;
}[]): number {
  return appliances.reduce((total, appliance) => {
    const quantity = appliance.quantity || 1;
    return total + (appliance.power * appliance.hoursPerDay * quantity) / 1000; // kWh
  }, 0);
}