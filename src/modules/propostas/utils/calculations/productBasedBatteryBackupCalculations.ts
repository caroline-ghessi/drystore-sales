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
  
  // VALIDAÇÃO: Verificar se há produtos necessários cadastrados
  if (!batteryProducts.batteries || batteryProducts.batteries.length === 0) {
    throw new Error('Nenhuma bateria cadastrada encontrada. Cadastre baterias em /propostas/produtos');
  }
  
  if (!batteryProducts.inverters || batteryProducts.inverters.length === 0) {
    throw new Error('Nenhum inversor cadastrado encontrado. Cadastre inversores em /propostas/produtos');
  }
  
  // Selecionar bateria baseada na capacidade necessária
  const selectedBattery = selectBatteryFromProducts(energyRequired, batteryProducts.batteries);
  if (!selectedBattery) {
    throw new Error('Nenhuma bateria adequada encontrada nos produtos cadastrados');
  }
  
  const specs = ProductCalculationService.getProductSpecs(selectedBattery);
  const batterySpecs = {
    voltage: specs.voltage || FALLBACK_SPECS.battery.voltage,
    dod: specs.efficiency || FALLBACK_SPECS.battery.dod,
    cycles: specs.capacity || FALLBACK_SPECS.battery.cycles,
    max_parallel: specs.compatibility?.length || FALLBACK_SPECS.battery.max_parallel
  };
  const capacityKwh = specs.capacity;
  if (!capacityKwh) {
    throw new Error(`Bateria ${selectedBattery.name} não possui capacidade especificada`);
  }
  const batteryPrice = selectedBattery.base_price;
  
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
  if (!selectedInverter) {
    throw new Error('Nenhum inversor adequado encontrado nos produtos cadastrados');
  }
  
  const inverterSpecs = {
    efficiency: ProductCalculationService.getProductSpecs(selectedInverter).efficiency || FALLBACK_SPECS.inverter.efficiency,
    peak_factor: 2.0 // Inversores suportam até 100% acima da capacidade (2x)
  };
  const inverterPrice = selectedInverter.base_price;
  
  // Calcular custos usando preços reais dos produtos
  const batteryCost = finalBatteryQuantity * batteryPrice;
  const inverterCost = inverterPrice;
  
  // Proteção e monitoramento - usar apenas produtos cadastrados
  let protectionCost = 0;
  let monitoringCost = 0;
  
  if (batteryProducts.protection && batteryProducts.protection.length > 0) {
    protectionCost = batteryProducts.protection[0].base_price * finalBatteryQuantity;
  }
  
  if (batteryProducts.monitoring && batteryProducts.monitoring.length > 0) {
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
    const capacity = specs.capacity;
    const dod = specs.efficiency;
    
    // Verificar se há especificações válidas
    if (!capacity || !dod) return false;
    
    // Bateria deve ter capacidade útil suficiente
    return (capacity * dod) >= (energyRequired * 0.8); // Margem de 20%
  });
  
  // Se não encontrar adequada, usar a primeira disponível que tenha specs válidas
  return suitableBattery || batteries.find(battery => {
    const specs = ProductCalculationService.getProductSpecs(battery);
    return specs.capacity && specs.efficiency;
  });
}

function selectInverterFromProducts(powerKW: number, inverters: UnifiedProduct[]) {
  // Buscar inversor híbrido adequado para a potência
  const suitableInverter = inverters.find(inverter => {
    const specs = ProductCalculationService.getProductSpecs(inverter);
    const inverterPower = specs.power_rating ? specs.power_rating / 1000 : 0;
    
    // Inversor deve suportar a potência contínua + margem
    return inverterPower >= powerKW && inverterPower <= powerKW * 2;
  });
  
  // Se não encontrar adequado, usar primeiro disponível que tenha power_rating válido
  return suitableInverter || inverters.find(inverter => {
    const specs = ProductCalculationService.getProductSpecs(inverter);
    return specs.power_rating && specs.power_rating > 0;
  });
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