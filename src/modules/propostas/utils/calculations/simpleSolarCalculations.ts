import { SimpleSolarCalculationInput, SimpleSolarCalculationResult } from '../../types/calculation.types';

// HSP médio por região (kWh/kWp/day) - valores médios anuais
const SOLAR_IRRADIATION = {
  north: 4.8,
  northeast: 5.2,
  center_west: 5.0,
  southeast: 4.6,
  south: 4.2
};

// Fator de perda padrão do sistema (20% é típico da indústria)
const SYSTEM_EFFICIENCY = 0.80;

// Preços básicos por kWp (valores simplificados)
const SOLAR_PRICES = {
  panels: 3000,      // R$/kWp - painéis
  inverters: 1200,   // R$/kWp - inversores
  structure: 800,    // R$/kWp - estrutura
  installation: 1000, // R$/kWp - instalação
  documentation: 400  // R$/kWp - documentação
};

// Multiplicador regional (custo de instalação por região)
const REGIONAL_COST_MULTIPLIERS = {
  north: 1.15,
  northeast: 1.05,
  center_west: 1.10,
  southeast: 1.0,
  south: 1.08
};

// Taxa de inflação energética anual (para projeções)
const ANNUAL_TARIFF_INCREASE = 0.05; // 5% ao ano

export function calculateSimpleSolarSystem(input: SimpleSolarCalculationInput): SimpleSolarCalculationResult {
  // 1. Cálculo da potência necessária do sistema (usando HSP padrão nacional)
  const dailyConsumption = input.monthlyConsumption / 30;
  const hsp = 4.8; // HSP médio nacional fixo para uniformidade
  const systemPower = dailyConsumption / (hsp * SYSTEM_EFFICIENCY);
  
  // 2. Quantidades de equipamentos (baseado em painéis de 550W)
  const panelPower = 0.55; // kW por painel
  const panelQuantity = Math.ceil(systemPower / panelPower);
  const inverterQuantity = Math.ceil(systemPower / 3.0); // Inversores de 3kW
  
  // 3. Geração mensal do sistema
  const monthlyGeneration = systemPower * hsp * 30 * SYSTEM_EFFICIENCY;
  
  // 4. Cálculos econômicos com tarifa real do cliente
  const monthlyBillBefore = input.monthlyConsumption * input.currentTariff;
  
  // Sistema grid-tie: conta mínima de disponibilidade (geralmente 30kWh)
  const minimumBill = input.installationType === 'grid_tie' ? 30 * input.currentTariff : 0;
  const monthlyBillAfter = Math.max(0, (input.monthlyConsumption - monthlyGeneration) * input.currentTariff) + minimumBill;
  
  const monthlySavings = monthlyBillBefore - monthlyBillAfter;
  const annualSavings = monthlySavings * 12;
  
  // 5. Custos do sistema (sem variação regional)
  const regionalMultiplier = 1.0; // Fixado para uniformidade nacional
  
  const itemizedCosts = {
    panels: SOLAR_PRICES.panels * systemPower * regionalMultiplier,
    inverters: SOLAR_PRICES.inverters * systemPower * regionalMultiplier,
    structure: SOLAR_PRICES.structure * systemPower * regionalMultiplier,
    installation: SOLAR_PRICES.installation * systemPower * regionalMultiplier,
    documentation: SOLAR_PRICES.documentation * systemPower
  };
  
  const totalCost = Object.values(itemizedCosts).reduce((sum, cost) => sum + cost, 0);
  
  // 6. Payback e ROI
  const paybackPeriod = totalCost / monthlySavings; // em meses
  
  // Cálculo de economia com reajustes anuais da tarifa
  let totalSavings25Years = 0;
  let currentTariff = input.currentTariff;
  
  for (let year = 1; year <= 25; year++) {
    if (year > 1) {
      currentTariff *= (1 + ANNUAL_TARIFF_INCREASE);
    }
    const yearlyGeneration = monthlyGeneration * 12;
    const yearlySavings = (yearlyGeneration - (input.installationType === 'grid_tie' ? 360 : 0)) * currentTariff;
    totalSavings25Years += yearlySavings;
  }
  
  const netProfit25Years = totalSavings25Years - totalCost;
  const roi25Years = (netProfit25Years / totalCost) * 100;
  
  // 7. CO2 reduction (0.0817 kg CO2/kWh evitado)
  const co2Reduction = monthlyGeneration * 12 * 0.0817;
  
  // 8. Métricas econômicas detalhadas
  const monthlyROI = (monthlySavings / totalCost) * 100;
  const breakEvenMonth = Math.ceil(paybackPeriod);
  
  return {
    systemPower,
    panelQuantity,
    inverterQuantity,
    monthlyGeneration,
    monthlyBillBefore,
    monthlyBillAfter,
    monthlySavings,
    annualSavings,
    paybackPeriod,
    roi25Years,
    co2Reduction,
    itemizedCosts,
    totalCost,
    economicMetrics: {
      totalSavings25Years,
      netProfit25Years,
      monthlyROI,
      breakEvenMonth
    }
  };
}

// Função para validar tarifa de energia
export function validateEnergyTariff(tariff: number): {
  isValid: boolean;
  message: string;
  suggestion?: number;
} {
  if (tariff < 0.30) {
    return {
      isValid: false,
      message: 'Tarifa muito baixa. Verifique se está em R$/kWh.',
      suggestion: 0.70
    };
  }
  
  if (tariff > 1.50) {
    return {
      isValid: false,
      message: 'Tarifa muito alta. Verifique os valores na conta.',
      suggestion: 0.80
    };
  }
  
  return {
    isValid: true,
    message: 'Tarifa dentro da faixa esperada.'
  };
}

// Função para extrair dados típicos de uma conta de luz (preparação para OCR)
export interface BillOCRData {
  monthlyConsumption?: number;
  currentTariff?: number;
  clientName?: string;
  clientAddress?: string;
  distributorName?: string;
  dueDate?: string;
  billValue?: number;
  referenceMonth?: string;
}

export function parseBillData(ocrData: any): BillOCRData {
  // Esta função será expandida quando implementarmos o OCR
  // Por enquanto, estrutura básica para dados extraídos
  return {
    monthlyConsumption: ocrData.consumption || 0,
    currentTariff: ocrData.tariff || 0,
    clientName: ocrData.clientName || '',
    clientAddress: ocrData.address || '',
    distributorName: ocrData.distributor || '',
    dueDate: ocrData.dueDate || '',
    billValue: ocrData.billValue || 0,
    referenceMonth: ocrData.month || ''
  };
}