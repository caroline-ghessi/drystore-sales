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
  // ERRO: Esta função deve receber produtos cadastrados, não usar valores hardcoded
  throw new Error('ERRO: calculateBatteryBackup deve usar produtos cadastrados. Use uma versão baseada em produtos.');
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
  
  // Recomendações específicas por categoria
  if (loads.lighting < 200) {
    recommendations.push('Considere aumentar a potência de iluminação para pelo menos 200W');
  }
  
  if (loads.refrigerator === 0 && loads.freezer === 0) {
    recommendations.push('Geladeira é uma carga essencial. Considere incluí-la (120-180W)');
  }
  
  if (loads.internet === 0 && loads.phones === 0) {
    recommendations.push('Comunicação é essencial. Inclua internet/telefones (30-80W)');
  }
  
  if (loads.microwave > 0 && totalPower > 3000) {
    recommendations.push('Microondas consome muita energia. Considere se é realmente essencial durante backup');
  }
  
  if (loads.waterPump > 1500) {
    warnings.push('Bomba d\'água muito potente. Verifique especificações (típico 500-1500W)');
  }
  
  // Validação de cargas críticas
  const criticalLoads = loads.lighting + loads.refrigerator + loads.internet + loads.security;
  if (criticalLoads < 200) {
    recommendations.push('Cargas críticas muito baixas. Revise iluminação, geladeira e comunicação');
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