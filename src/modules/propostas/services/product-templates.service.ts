import { ProductType } from '../types/proposal.types';
import { ProductSpecificTemplate, ProductTemplateConfig } from '../types/product-templates.types';

// Template para Telha Shingle
const createShingleTemplate = (): ProductSpecificTemplate => ({
  config: {
    productType: 'shingle',
    displayName: 'Telha Shingle',
    heroTitle: 'Sistema de Cobertura Telha Shingle',
    heroSubtitle: 'Solução completa para sua cobertura com tecnologia americana',
    primaryColor: '#8B4513',
    accentColor: '#D2691E',
    kpiSection: {
      title: 'Destaques do Projeto',
      kpis: []
    },
    warrantySection: {
      title: 'Garantias',
      warranties: [
        {
          component: 'Telhas Shingle',
          duration: '30 anos',
          details: 'Garantia contra defeitos de fabricação e resistência ao vento até 180 km/h'
        },
        {
          component: 'Manta Subcobertura',
          duration: '15 anos',
          details: 'Proteção contra infiltrações e umidade'
        },
        {
          component: 'Instalação',
          duration: '5 anos',
          details: 'Garantia de mão de obra especializada'
        }
      ]
    },
    technicalSection: {
      title: 'Especificações Técnicas',
      specs: []
    },
    benefitsSection: {
      title: 'Benefícios',
      benefits: [
        'Resistência superior a ventos e intempéries',
        'Isolamento térmico e acústico',
        'Fácil manutenção e durabilidade',
        'Design moderno e elegante',
        'Sistema de ventilação integrado'
      ]
    },
    additionalInfo: {
      certifications: ['ABNT NBR 15575', 'Certificação Internacional ASTM'],
      compliance: ['Normas brasileiras de construção', 'Padrões americanos de qualidade']
    }
  },
  generateKPIs: (calc) => [
    { label: 'Área Total Coberta', value: calc?.totalRealArea || 0, unit: 'm²', highlight: true },
    { label: 'Fardos de Telha', value: calc?.shingleBundles || 0, unit: 'unidades' },
    { label: 'Placas OSB', value: calc?.osbSheets || 0, unit: 'placas' },
    { label: 'Resistência ao Vento', value: '180', unit: 'km/h', highlight: true },
    { label: 'Vida Útil', value: '30+', unit: 'anos', highlight: true }
  ],
  generateTechnicalSpecs: (calc) => [
    {
      category: 'Cobertura',
      specifications: [
        { name: 'Tipo de Telha', value: 'Shingle Oakridge' },
        { name: 'Cobertura por Fardo', value: '3', unit: 'm²' },
        { name: 'Espessura', value: '3.2', unit: 'mm' }
      ]
    },
    {
      category: 'Estrutura',
      specifications: [
        { name: 'Deck OSB', value: '11.1', unit: 'mm' },
        { name: 'Dimensões OSB', value: '1.20 x 2.40', unit: 'm' },
        { name: 'Cobertura OSB', value: '2.88', unit: 'm²/placa' }
      ]
    }
  ],
  generateBenefits: (calc) => [
    'Resistência superior a ventos e intempéries',
    'Isolamento térmico e acústico excelente',
    'Baixa manutenção e alta durabilidade',
    'Design moderno e variadas opções de cores',
    'Sistema de ventilação natural integrado',
    'Instalação rápida e eficiente'
  ]
});

// Template Solar Inteligente - Unificado para calculadoras simples e avançadas
const createSolarTemplate = (): ProductSpecificTemplate => ({
  config: {
    productType: 'solar',
    displayName: 'Energia Solar Fotovoltaica',
    heroTitle: 'Sistema de Energia Solar',
    heroSubtitle: 'Economia garantida e sustentabilidade para sua casa ou empresa',
    primaryColor: '#FF8C00',
    accentColor: '#FFD700',
    kpiSection: {
      title: 'Retorno do Investimento',
      kpis: []
    },
    warrantySection: {
      title: 'Garantias',
      warranties: [
        {
          component: 'Painéis Solares',
          duration: '25 anos',
          details: 'Garantia de performance linear de 25 anos'
        },
        {
          component: 'Inversor',
          duration: '12 anos',
          details: 'Garantia total do fabricante'
        },
        {
          component: 'Instalação',
          duration: '5 anos',
          details: 'Garantia completa de instalação e funcionamento'
        }
      ]
    },
    technicalSection: {
      title: 'Especificações do Sistema',
      specs: []
    },
    benefitsSection: {
      title: 'Vantagens',
      benefits: [
        'Redução de até 95% na conta de energia',
        'Valorização do imóvel',
        'Contribuição para sustentabilidade',
        'Tecnologia de ponta',
        'Monitoramento em tempo real'
      ]
    },
    additionalInfo: {
      certifications: ['INMETRO', 'IEC 61215', 'IEC 61730'],
      compliance: ['Resolução Normativa ANEEL 482/2012']
    }
  },
  generateKPIs: (calc) => {
    if (!calc) return [];
    
    // Detecção inteligente do tipo de dados
    const isAdvancedCalc = calc.stringConfiguration || calc.batteryConfiguration || calc.performanceMetrics;
    const isSimpleCalc = calc.economicMetrics || calc.monthlyBillBefore !== undefined;
    
    const baseKPIs = [
      { label: 'Potência Instalada', value: calc.systemPower || 0, unit: 'kWp', highlight: true },
      { label: 'Geração Mensal', value: calc.monthlyGeneration || 0, unit: 'kWh' },
      { label: 'Economia Mensal', value: calc.monthlySavings || 0, unit: 'R$', highlight: true }
    ];

    if (isSimpleCalc) {
      return [
        ...baseKPIs,
        { label: 'Conta Antes', value: calc.monthlyBillBefore || 0, unit: 'R$' },
        { label: 'Conta Depois', value: calc.monthlyBillAfter || 0, unit: 'R$' },
        { label: 'Payback', value: calc.paybackPeriod ? (calc.paybackPeriod / 12).toFixed(1) : 0, unit: 'anos', highlight: true },
        { label: 'ROI 25 anos', value: calc.roi25Years || 0, unit: '%' }
      ];
    }

    if (isAdvancedCalc) {
      return [
        ...baseKPIs,
        { label: 'Painéis', value: calc.panelQuantity || 0, unit: 'unidades' },
        { label: 'Strings', value: calc.stringConfiguration?.totalStrings || 0, unit: 'unidades' },
        { label: 'Performance Ratio', value: calc.performanceMetrics?.performanceRatio || 0, unit: '%' },
        { label: 'Payback', value: calc.paybackPeriod ? (calc.paybackPeriod / 12).toFixed(1) : 0, unit: 'anos', highlight: true },
        { label: 'ROI 25 anos', value: calc.roi25Years || 0, unit: '%' }
      ];
    }

    // Fallback para dados básicos
    return [
      ...baseKPIs,
      { label: 'Payback', value: calc.paybackPeriod ? (calc.paybackPeriod / 12).toFixed(1) : 0, unit: 'anos', highlight: true }
    ];
  },
  generateTechnicalSpecs: (calc) => {
    if (!calc) return [];
    
    const isAdvancedCalc = calc.stringConfiguration || calc.batteryConfiguration || calc.performanceMetrics;
    
    const baseSpecs = [
      {
        category: 'Sistema Solar',
        specifications: [
          { name: 'Potência Total', value: calc.systemPower?.toFixed(2) || '0', unit: 'kWp' },
          { name: 'Painéis', value: calc.panelQuantity?.toString() || '0', unit: 'unidades' },
          { name: 'Inversores', value: calc.inverterQuantity?.toString() || '0', unit: 'unidades' }
        ]
      }
    ];

    if (isAdvancedCalc && calc.stringConfiguration) {
      baseSpecs.push({
        category: 'Configuração Avançada',
        specifications: [
          { name: 'Strings', value: calc.stringConfiguration.totalStrings.toString(), unit: 'unidades' },
          { name: 'Painéis por String', value: calc.stringConfiguration.panelsPerString.toString(), unit: 'unidades' },
          { name: 'Tensão da String', value: calc.stringConfiguration.stringVoltage.toString(), unit: 'V' }
        ]
      });
    }

    if (isAdvancedCalc && calc.batteryConfiguration) {
      baseSpecs.push({
        category: 'Sistema de Baterias',
        specifications: [
          { name: 'Capacidade', value: calc.batteryConfiguration.totalCapacityKwh.toString(), unit: 'kWh' },
          { name: 'Autonomia', value: calc.batteryConfiguration.autonomyHours.toString(), unit: 'horas' },
          { name: 'Quantidade', value: calc.batteryConfiguration.batteryQuantity.toString(), unit: 'unidades' }
        ]
      });
    }

    return baseSpecs;
  },
  generateBenefits: (calc) => {
    if (!calc) return [
      'Redução de até 95% na conta de energia',
      'Valorização do imóvel',
      'Contribuição para sustentabilidade',
      'Tecnologia de ponta',
      'Monitoramento em tempo real'
    ];

    const isAdvancedCalc = calc.stringConfiguration || calc.batteryConfiguration || calc.performanceMetrics;
    const monthlySavings = calc.monthlySavings || 0;
    const paybackYears = calc.paybackPeriod ? (calc.paybackPeriod / 12).toFixed(1) : 'N/A';

    const baseBenefits = [
      `Economia mensal de R$ ${monthlySavings.toFixed(2)}`,
      `Payback em ${paybackYears} anos`,
      'Redução significativa de emissões de CO2',
      'Valorização do imóvel em até 8%'
    ];

    if (isAdvancedCalc) {
      return [
        ...baseBenefits,
        'Sistema dimensionado com precisão avançada',
        'Configuração otimizada de strings',
        'Monitoramento detalhado de performance',
        calc.batteryConfiguration ? 'Sistema híbrido com backup de energia' : 'Sistema conectado à rede elétrica',
        'Baixíssima manutenção'
      ];
    }

    return [
      ...baseBenefits,
      'Cálculo simplificado e rápido',
      'Estimativa confiável de economia',
      'Instalação profissional',
      'Suporte técnico especializado'
    ];
  }
});

// Template para Forro Drywall
const createDrywallTemplate = (): ProductSpecificTemplate => ({
  config: {
    productType: 'forro_drywall',
    displayName: 'Forro de Drywall',
    heroTitle: 'Sistema de Forro em Drywall',
    heroSubtitle: 'Acabamento perfeito com isolamento térmico e acústico',
    primaryColor: '#708090',
    accentColor: '#B0C4DE',
    kpiSection: {
      title: 'Especificações do Projeto',
      kpis: []
    },
    warrantySection: {
      title: 'Garantias',
      warranties: [
        {
          component: 'Placas de Drywall',
          duration: '10 anos',
          details: 'Garantia contra defeitos de fabricação'
        },
        {
          component: 'Sistema de Fixação',
          duration: '5 anos',
          details: 'Perfis e parafusos certificados'
        },
        {
          component: 'Instalação',
          duration: '3 anos',
          details: 'Garantia de execução e acabamento'
        }
      ]
    },
    technicalSection: {
      title: 'Especificações Técnicas',
      specs: []
    },
    benefitsSection: {
      title: 'Vantagens',
      benefits: [
        'Isolamento acústico superior',
        'Facilidade de instalação elétrica',
        'Acabamento liso e uniforme',
        'Possibilidade de curvas e relevos',
        'Sustentabilidade ambiental'
      ]
    }
  },
  generateKPIs: (calc) => [
    { label: 'Área do Forro', value: calc?.totalArea || 0, unit: 'm²', highlight: true },
    { label: 'Placas de Drywall', value: calc?.drywallSheets || 0, unit: 'placas' },
    { label: 'Perfis Metálicos', value: calc?.metalProfiles || 0, unit: 'm' },
    { label: 'Redução Ruído', value: '45', unit: 'dB', highlight: true }
  ],
  generateTechnicalSpecs: (calc) => [
    {
      category: 'Placas',
      specifications: [
        { name: 'Tipo', value: 'Standard ou RU' },
        { name: 'Espessura', value: '12.5', unit: 'mm' },
        { name: 'Dimensões', value: '1.20 x 2.40', unit: 'm' }
      ]
    }
  ],
  generateBenefits: () => [
    'Instalação limpa e rápida',
    'Excelente isolamento acústico',
    'Facilita passagem de fiação',
    'Acabamento profissional',
    'Material sustentável e reciclável'
  ]
});

// Template genérico para produtos não mapeados
const createGenericTemplate = (productType: ProductType): ProductSpecificTemplate => ({
  config: {
    productType,
    displayName: productType.replace('_', ' ').toUpperCase(),
    heroTitle: `Sistema ${productType.replace('_', ' ')}`,
    heroSubtitle: 'Solução profissional para sua necessidade',
    primaryColor: '#2563EB',
    accentColor: '#60A5FA',
    kpiSection: {
      title: 'Informações do Projeto',
      kpis: []
    },
    warrantySection: {
      title: 'Garantias',
      warranties: [
        {
          component: 'Materiais',
          duration: '2 anos',
          details: 'Garantia contra defeitos de fabricação'
        },
        {
          component: 'Instalação',
          duration: '1 ano',
          details: 'Garantia de execução'
        }
      ]
    },
    technicalSection: {
      title: 'Especificações',
      specs: []
    },
    benefitsSection: {
      title: 'Benefícios',
      benefits: [
        'Materiais de qualidade superior',
        'Instalação profissional',
        'Suporte técnico especializado'
      ]
    }
  },
  generateKPIs: () => [],
  generateTechnicalSpecs: () => [],
  generateBenefits: () => [
    'Qualidade garantida',
    'Atendimento especializado',
    'Suporte pós-venda'
  ]
});

export class ProductTemplateService {
  private static templates = new Map<ProductType, ProductSpecificTemplate>();

  static {
    // Registrar templates específicos
    this.templates.set('shingle', createShingleTemplate());
    this.templates.set('solar', createSolarTemplate());
    this.templates.set('solar_advanced', createSolarTemplate()); // Mesmo template inteligente
    this.templates.set('forro_drywall', createDrywallTemplate());
  }

  static getTemplate(productType: ProductType): ProductSpecificTemplate {
    return this.templates.get(productType) || createGenericTemplate(productType);
  }

  static getAllTemplates(): Map<ProductType, ProductSpecificTemplate> {
    return this.templates;
  }

  static registerTemplate(productType: ProductType, template: ProductSpecificTemplate): void {
    this.templates.set(productType, template);
  }
}