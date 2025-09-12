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
  console.log('🔋 calculateBatteryBackupWithProducts iniciado');
  console.log('🔋 Input recebido:', input);
  console.log('🔋 Total de produtos recebidos:', products.length);

  // Calcular potência total das cargas essenciais
  const essentialLoads = input.essentialLoads;
  const totalPowerW = Object.values(essentialLoads).reduce((sum, power) => sum + power, 0);
  const totalPowerKW = totalPowerW / 1000;
  
  console.log('🔋 Cargas essenciais:', essentialLoads);
  console.log('🔋 Potência total:', totalPowerKW, 'kW');
  
  // Aplicar fator de simultaneidade
  const simultaneousFactor = 0.7;
  const simultaneousPower = totalPowerKW * simultaneousFactor;
  
  // Calcular energia necessária para autonomia desejada
  const energyRequired = simultaneousPower * input.desiredAutonomy;
  
  console.log('🔋 Energia necessária:', energyRequired, 'kWh para', input.desiredAutonomy, 'horas');
  
  // BUSCAR PRODUTOS REAIS DO CADASTRO
  const batteryProducts = ProductCalculationService.getBatteryProducts(products);
  
  console.log('🔋 Produtos encontrados após filtragem:', {
    baterias: batteryProducts.batteries.length,
    inversores: batteryProducts.inverters.length,
    protecao: batteryProducts.protection.length,
    monitoramento: batteryProducts.monitoring.length
  });
  
  // VALIDAÇÃO: Verificar se há produtos necessários cadastrados
  if (!batteryProducts.batteries || batteryProducts.batteries.length === 0) {
    console.error('❌ Nenhuma bateria encontrada');
    throw new Error('Nenhuma bateria cadastrada encontrada. Cadastre baterias em /propostas/produtos');
  }
  
  if (!batteryProducts.inverters || batteryProducts.inverters.length === 0) {
    console.error('❌ Nenhum inversor encontrado');
    throw new Error('Nenhum inversor cadastrado encontrado. Cadastre inversores em /propostas/produtos');
  }
  
  // Selecionar bateria baseada na capacidade necessária
  console.log('🔋 Selecionando bateria para energia necessária:', energyRequired, 'kWh');
  const selectedBattery = selectBatteryFromProducts(energyRequired, batteryProducts.batteries);
  if (!selectedBattery) {
    console.error('❌ Nenhuma bateria adequada encontrada');
    throw new Error('Nenhuma bateria adequada encontrada nos produtos cadastrados');
  }
  console.log('✅ Bateria selecionada:', {
    name: selectedBattery.name,
    id: selectedBattery.id,
    specifications: selectedBattery.specifications
  });
  
  // Selecionar inversor baseado na potência necessária
  console.log('🔋 Selecionando inversor para potência:', totalPowerKW, 'kW');
  const selectedInverter = selectInverterFromProducts(totalPowerKW, batteryProducts.inverters);
  if (!selectedInverter) {
    console.error('❌ Nenhum inversor adequado encontrado');
    throw new Error('Nenhum inversor adequado encontrado nos produtos cadastrados');
  }
  console.log('✅ Inversor selecionado:', {
    name: selectedInverter.name,
    id: selectedInverter.id,
    specifications: selectedInverter.specifications
  });
  
  const specs = ProductCalculationService.getProductSpecs(selectedBattery);
  const batterySpecs = {
    voltage: specs.voltage || FALLBACK_SPECS.battery.voltage,
    dod: specs.dod || FALLBACK_SPECS.battery.dod,
    cycles: specs.cycles || FALLBACK_SPECS.battery.cycles,
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
  
  // Usar o inversor já selecionado anteriormente
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

    // Produtos selecionados incluídos no retorno
    selectedBattery: selectedBattery,
    selectedInverter: selectedInverter,
    
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
  console.log('🔋 selectBatteryFromProducts - Energia necessária:', energyRequired, 'kWh');
  console.log('🔋 selectBatteryFromProducts - Baterias disponíveis:', batteries.length);
  
  batteries.forEach(battery => {
    const specs = ProductCalculationService.getProductSpecs(battery);
    console.log(`🔋 Bateria: ${battery.name}`, {
      capacity: specs.capacity,
      dod: specs.dod,
      cycles: specs.cycles,
      specifications: specs
    });
  });
  
  // Buscar bateria com capacidade adequada
  const suitableBattery = batteries.find(battery => {
    const specs = ProductCalculationService.getProductSpecs(battery);
    const capacity = specs.capacity;
    const dod = specs.dod;
    
    console.log(`🔋 Verificando ${battery.name}:`, { capacity, dod, valid: !!(capacity && dod) });
    
    // Verificar se há especificações válidas
    if (!capacity || !dod) return false;
    
    // Bateria deve ter capacidade útil suficiente
    const usableCapacity = capacity * dod;
    const isAdequate = usableCapacity >= (energyRequired * 0.8); // Margem de 20%
    console.log(`🔋 ${battery.name} - Capacidade útil: ${usableCapacity} kWh, adequada: ${isAdequate}`);
    
    return isAdequate;
  });
  
  console.log('🔋 Bateria adequada encontrada:', suitableBattery?.name || 'nenhuma');
  
  // Se não encontrar adequada, usar a primeira disponível que tenha specs válidas
  const fallbackBattery = batteries.find(battery => {
    const specs = ProductCalculationService.getProductSpecs(battery);
    const hasValidSpecs = specs.capacity && specs.dod;
    console.log(`🔋 Fallback check ${battery.name}:`, { capacity: specs.capacity, dod: specs.dod, hasValidSpecs });
    return hasValidSpecs;
  });
  
  const result = suitableBattery || fallbackBattery;
  console.log('🔋 Bateria final selecionada:', result?.name || 'nenhuma');
  
  return result;
}

function selectInverterFromProducts(powerKW: number, inverters: UnifiedProduct[]) {
  console.log('🔋 selectInverterFromProducts - Potência necessária:', powerKW, 'kW');
  console.log('🔋 selectInverterFromProducts - Inversores disponíveis:', inverters.length);
  
  inverters.forEach(inverter => {
    const specs = ProductCalculationService.getProductSpecs(inverter);
    const power = (specs.power_continuous || specs.power_peak || specs.power_rating || 0) / 1000;
    console.log(`🔋 Inversor: ${inverter.name}`, {
      power_continuous: specs.power_continuous,
      power_peak: specs.power_peak,
      power_rating: specs.power_rating,
      final_power: power,
      specifications: specs
    });
  });
  
  // Buscar inversor híbrido adequado para a potência
  const suitableInverter = inverters.find(inverter => {
    const specs = ProductCalculationService.getProductSpecs(inverter);
    // Usar power_continuous primeiro, depois power_peak como fallback
    const inverterPower = (specs.power_continuous || specs.power_peak || specs.power_rating || 0) / 1000;
    
    const isAdequate = inverterPower >= powerKW && inverterPower <= powerKW * 2;
    console.log(`🔋 ${inverter.name} - Potência: ${inverterPower} kW, adequada: ${isAdequate}`);
    
    // Inversor deve suportar a potência contínua + margem
    return isAdequate;
  });
  
  console.log('🔋 Inversor adequado encontrado:', suitableInverter?.name || 'nenhum');
  
  // Se não encontrar adequado, usar primeiro disponível que tenha potência válida
  const fallbackInverter = inverters.find(inverter => {
    const specs = ProductCalculationService.getProductSpecs(inverter);
    const power = specs.power_continuous || specs.power_peak || specs.power_rating || 0;
    const hasValidPower = power > 0;
    console.log(`🔋 Fallback check ${inverter.name}:`, { power, hasValidPower });
    return hasValidPower;
  });
  
  const result = suitableInverter || fallbackInverter;
  console.log('🔋 Inversor final selecionado:', result?.name || 'nenhum');
  
  return result;
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