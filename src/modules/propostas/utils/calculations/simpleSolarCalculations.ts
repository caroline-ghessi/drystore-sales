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
  
  // 9. Lista quantificada para propostas
  const quantified_items = [
    {
      name: `Painéis Solares Fotovoltaicos 550W`,
      description: `Kit com ${panelQuantity} painéis solares monocristalinos de 550W cada, alta eficiência com garantia de 25 anos de potência`,
      quantity: panelQuantity,
      unit: 'unidade' as const,
      unit_price: itemizedCosts.panels / panelQuantity,
      total_price: itemizedCosts.panels,
      category: 'Painéis Solares',
      specifications: {
        power_per_panel: '550W',
        technology: 'Monocristalino',
        efficiency: '21%+',
        warranty: '25 anos',
        total_power: `${(panelQuantity * 0.55).toFixed(2)} kWp`
      }
    },
    {
      name: `Inversor String Trifásico`,
      description: `Kit com ${inverterQuantity} inversor(es) string trifásico(s) de alta eficiência para conexão à rede elétrica`,
      quantity: inverterQuantity,
      unit: 'unidade' as const,
      unit_price: itemizedCosts.inverters / inverterQuantity,
      total_price: itemizedCosts.inverters,
      category: 'Inversores',
      specifications: {
        power_rating: `${Math.ceil(systemPower / inverterQuantity)} kW`,
        type: 'String Grid-Tie',
        phases: '3',
        efficiency: '97%+',
        warranty: '10 anos'
      }
    },
    {
      name: `Estrutura de Fixação`,
      description: `Sistema completo de fixação em alumínio para telhado cerâmico/concreto, incluindo trilhos, ganchos e fixadores`,
      quantity: 1,
      unit: 'conjunto' as const,
      unit_price: itemizedCosts.structure,
      total_price: itemizedCosts.structure,
      category: 'Estrutura',
      specifications: {
        material: 'Alumínio anodizado',
        roof_type: 'Cerâmico/Concreto',
        wind_load: '150 km/h',
        panels_supported: panelQuantity
      }
    },
    {
      name: `Instalação e Comissionamento`,
      description: `Serviço completo de instalação, cabeamento, configuração e comissionamento do sistema solar fotovoltaico`,
      quantity: 1,
      unit: 'serviço' as const,
      unit_price: itemizedCosts.installation,
      total_price: itemizedCosts.installation,
      category: 'Serviços',
      specifications: {
        service_type: 'Instalação completa',
        includes: 'Montagem, cabeamento, configuração',
        warranty_service: '5 anos',
        system_power: `${systemPower.toFixed(2)} kWp`
      }
    },
    {
      name: `Documentação e Legalização`,
      description: `Projeto elétrico, ART, solicitação de acesso junto à distribuidora e homologação do sistema`,
      quantity: 1,
      unit: 'conjunto' as const,
      unit_price: itemizedCosts.documentation,
      total_price: itemizedCosts.documentation,
      category: 'Documentação',
      specifications: {
        includes: 'Projeto, ART, Solicitação de acesso',
        engineering: 'Engenheiro responsável',
        compliance: 'ANEEL/Distribuidora',
        delivery: '30-45 dias'
      }
    }
  ];

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
    },
    quantified_items
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