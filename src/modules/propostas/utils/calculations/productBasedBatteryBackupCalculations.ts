import { BatteryBackupInput, BatteryBackupResult } from '../../types/calculation.types';
import { UnifiedProduct } from '../../hooks/useUnifiedProducts';
import { ProductCalculationService } from '../../services/productCalculationService';

// Fallbacks apenas para especificações técnicas (não preços)
const FALLBACK_SPECS = {
  inverter: {
    efficiency: 0.97,
    peak_factor: 2.0
  },
  battery: {
    voltage: 51.2,
    dod: 0.9,
    cycles: 6000,
    max_parallel: 5
  }
};

export function calculateBatteryBackupWithProducts(
  input: BatteryBackupInput,
  products: UnifiedProduct[]
): BatteryBackupResult {
  // Calcular potência total das cargas essenciais
  const essentialLoads = input.essentialLoads;
  const totalPowerW = Object.values(essentialLoads).reduce((sum, power) => sum + power, 0);
  const totalPowerKW = totalPowerW / 1000;
  
  // Aplicar fator de simultaneidade
  const simultaneousFactor = 0.7;
  const simultaneousPower = totalPowerKW * simultaneousFactor;
  
  // Calcular energia necessária para autonomia desejada
  const energyRequired = simultaneousPower * input.desiredAutonomy;
  
  // BUSCAR PRODUTOS REAIS DO CADASTRO
  const batteryProducts = ProductCalculationService.getBatteryProducts(products);
  
  // Selecionar bateria baseada na capacidade necessária
  const selectedBattery = selectBatteryFromProducts(energyRequired, batteryProducts.batteries);
  let batterySpecs = FALLBACK_SPECS.battery;
  let batteryPrice = 12800; // Fallback
  let capacityKwh = 5.12;
  
  if (selectedBattery) {
    const specs = ProductCalculationService.getProductSpecs(selectedBattery);
    batterySpecs = {
      voltage: specs.voltage || FALLBACK_SPECS.battery.voltage,
      dod: specs.efficiency || FALLBACK_SPECS.battery.dod,
      cycles: specs.capacity || FALLBACK_SPECS.battery.cycles,
      max_parallel: specs.compatibility?.length || FALLBACK_SPECS.battery.max_parallel
    };
    capacityKwh = specs.capacity || capacityKwh;
    batteryPrice = selectedBattery.base_price;
  }
  
  // Calcular quantidade de baterias necessárias
  const totalCapacityNeeded = energyRequired / batterySpecs.dod;
  const batteryQuantity = Math.ceil(totalCapacityNeeded / capacityKwh);
  const finalBatteryQuantity = Math.min(batteryQuantity, batterySpecs.max_parallel);
  
  // Capacidades finais
  const totalCapacityKwh = finalBatteryQuantity * capacityKwh;
  const usefulCapacityKwh = totalCapacityKwh * batterySpecs.dod;
  const autonomyHours = usefulCapacityKwh / simultaneousPower;
  
  // Selecionar inversor híbrido baseado na potência
  const selectedInverter = selectInverterFromProducts(simultaneousPower, batteryProducts.inverters);
  let inverterSpecs = FALLBACK_SPECS.inverter;
  let inverterPrice = simultaneousPower <= 3 ? 4500 : 7200; // Fallback
  
  if (selectedInverter) {
    const specs = ProductCalculationService.getProductSpecs(selectedInverter);
    inverterSpecs = {
      efficiency: specs.efficiency || FALLBACK_SPECS.inverter.efficiency,
      peak_factor: specs.power_rating ? (specs.power_rating * 1.5) / specs.power_rating : FALLBACK_SPECS.inverter.peak_factor
    };
    inverterPrice = selectedInverter.base_price;
  }
  
  // Verificar potência de pico
  const peakPowerW = totalPowerW * 1.5;
  const inverterPowerW = simultaneousPower * 1000;
  const canHandlePeakPower = peakPowerW <= (inverterPowerW * inverterSpecs.peak_factor);
  
  if (!canHandlePeakPower) {
    throw new Error('Potência de pico excede capacidade disponível dos inversores');
  }
  
  // Calcular custos usando preços reais dos produtos
  const batteryCost = finalBatteryQuantity * batteryPrice;
  const inverterCost = inverterPrice;
  
  // Proteção e monitoramento - buscar produtos se disponíveis
  let protectionCost = totalPowerKW * 350; // Fallback
  let monitoringCost = totalPowerKW * 150; // Fallback
  
  if (batteryProducts.protection && batteryProducts.protection[0]) {
    protectionCost = batteryProducts.protection[0].base_price * finalBatteryQuantity;
  }
  
  if (batteryProducts.monitoring && batteryProducts.monitoring[0]) {
    monitoringCost = batteryProducts.monitoring[0].base_price;
  }
  
  const totalCost = batteryCost + inverterCost + protectionCost + monitoringCost;
  
  // Calcular economia/valor
  const monthlyGridCost = calculateMonthlyChargingCost(totalCapacityKwh);
  const backupValue = estimateBackupValue(simultaneousPower, input.desiredAutonomy);
  
  return {
    totalPowerRequired: simultaneousPower,
    peakPowerRequired: simultaneousPower * 1.5,
    totalEnergyRequired: energyRequired,
    dailyEnergyConsumption: energyRequired / input.desiredAutonomy,
    inverterPower: simultaneousPower,
    inverterQuantity: 1,
    inverterEfficiency: inverterSpecs.efficiency,
    
    batteryConfiguration: {
      batteryQuantity: finalBatteryQuantity,
      totalCapacityKwh,
      autonomyHours,
      usefulCapacityKwh,
      bankVoltage: batterySpecs.voltage,
      maxDischargeRate: simultaneousPower * 1.2
    },
    
    itemizedCosts: {
      batteries: batteryCost,
      inverters: inverterCost,
      installation: 0, // Não incluído automaticamente
      monitoring: monitoringCost,
      protection: protectionCost
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
      expectedLifeCycles: batterySpecs.cycles,
      warrantyYears: 10
    }
  };
}

function selectBatteryFromProducts(energyRequired: number, batteries: UnifiedProduct[]) {
  // Buscar bateria com capacidade adequada
  const suitableBattery = batteries.find(battery => {
    const specs = ProductCalculationService.getProductSpecs(battery);
    const capacity = specs.capacity || 5.12;
    const dod = specs.efficiency || 0.9;
    
    // Bateria deve ter capacidade útil suficiente
    return (capacity * dod) >= (energyRequired * 0.8); // Margem de 20%
  });
  
  // Se não encontrar adequada, usar a primeira disponível
  return suitableBattery || batteries[0];
}

function selectInverterFromProducts(powerKW: number, inverters: UnifiedProduct[]) {
  // Buscar inversor híbrido adequado para a potência
  const suitableInverter = inverters.find(inverter => {
    const specs = ProductCalculationService.getProductSpecs(inverter);
    const inverterPower = specs.power_rating ? specs.power_rating / 1000 : 0;
    
    // Inversor deve suportar a potência contínua + margem
    return inverterPower >= powerKW && inverterPower <= powerKW * 2;
  });
  
  // Se não encontrar, pegar o primeiro disponível
  return suitableInverter || inverters[0];
}

function calculateMonthlyChargingCost(batteryCapacityKwh: number): number {
  const cyclesPerMonth = 8;
  const energyPerMonth = batteryCapacityKwh * cyclesPerMonth;
  const tariff = 0.85; // R$/kWh
  const efficiency = 0.9;
  
  return (energyPerMonth / efficiency) * tariff;
}

function estimateBackupValue(powerKW: number, autonomyHours: number): number {
  const dailyLossAvoidance = {
    food: 50,
    security: 30,
    communication: 20,
    comfort: 40
  };
  
  const totalDailyValue = Object.values(dailyLossAvoidance).reduce((sum, value) => sum + value, 0);
  const hourlyValue = totalDailyValue / 24;
  
  return hourlyValue * autonomyHours;
}