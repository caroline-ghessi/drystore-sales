import { ProductType } from '../types/proposal.types';
import { ProductSpecificTemplate, ProductTemplateConfig } from '../types/product-templates.types';

// Template Premium para Telha Shingle
const createShingleTemplate = (): ProductSpecificTemplate => ({
  config: {
    productType: 'shingle',
    displayName: 'Telha Shingle Premium Owens Corning',
    heroTitle: 'Telhas Shingle Premium Owens Corning',
    heroSubtitle: 'A telha que valoriza seu imóvel - Importada dos EUA com garantia real de 50 anos',
    primaryColor: '#FF6B00',
    accentColor: '#D4AF37',
    kpiSection: {
      title: 'Destaques do Sistema',
      kpis: []
    },
    warrantySection: {
      title: 'Garantias Premium',
      warranties: [
        {
          component: 'Telha Shingle Owens Corning Duration®',
          duration: '50 anos',
          details: 'Garantia limitada oficial do fabricante nos EUA. Resistência a ventos de 130mph, tecnologia SureNail® exclusiva'
        },
        {
          component: 'Cumeeira ProEdge® Hip & Ridge',
          duration: '25 anos',
          details: 'Sistema de ventilação e acabamento com proteção contra infiltração em pontos críticos'
        },
        {
          component: 'Manta Asfáltica WeatherLock®',
          duration: '15 anos',
          details: 'Barreira 100% impermeável, auto-adesiva e auto-selante ao redor dos pregos'
        },
        {
          component: 'Deck OSB Estrutural',
          duration: '10 anos',
          details: 'Base sólida de 18mm para fixação uniforme e distribuição de cargas'
        },
        {
          component: 'Instalação Certificada',
          duration: '5 anos',
          details: 'Garantia de execução por instaladores especializados em telhas shingle'
        }
      ]
    },
    technicalSection: {
      title: 'Sistema Completo de Camadas',
      specs: []
    },
    benefitsSection: {
      title: 'Por que Owens Corning é Superior?',
      benefits: [
        'Tecnologia SureNail® - Resistência extra na fixação (+18% vs concorrentes)',
        '130 mph vs 110 mph da IKO - Resistência superior aos ventos',
        'Garantia real de 50 anos com documento oficial americano',
        'Valorização comprovada de até R$ 100.000 no imóvel',
        'Cores que não desbotam - Grânulos cerâmicos especiais',
        'Sistema de ventilação integrado previne condensação',
        'Instalação mais rápida com tecnologia SureNail®',
        'Material sustentável e reciclável'
      ]
    },
    additionalInfo: {
      certifications: ['ASTM D3462', 'UL 2218 Classe 4', 'ICC-ES ESR-1637', 'ENERGY STAR®'],
      compliance: ['Normas ABNT NBR 15575', 'Código de Obras Municipal', 'Padrões internacionais ASTM'],
      recommendations: [
        'Mais de 250 telhados fornecidos pela Drystore',
        'Parceira exclusiva Owens Corning no Sul do Brasil há 22 anos',
        'Instaladores certificados disponíveis em sua região'
      ]
    }
  },
  generateKPIs: (calc) => [
    { label: 'Área Total Coberta', value: calc?.totalRealArea || 0, unit: 'm²', highlight: true, icon: '🏠' },
    { label: 'Telhas Shingle', value: calc?.shingleBundles || 0, unit: 'fardos', icon: '📦' },
    { label: 'Placas OSB 18mm', value: calc?.osbSheets || 0, unit: 'placas', icon: '🪵' },
    { label: 'Manta Asfáltica', value: calc?.rhinoroofRolls || 0, unit: 'rolos', icon: '🛡️' },
    { label: 'Cumeeira Ventilada', value: calc?.ridgeCapBundles || 0, unit: 'fardos', icon: '🌬️' },
    { label: 'Resistência ao Vento', value: '130', unit: 'mph', highlight: true, icon: '💨' },
    { label: 'Garantia Premium', value: '50', unit: 'anos', highlight: true, icon: '⏱️' },
    { label: 'Valorização Imóvel', value: 'A+', unit: 'categoria', highlight: true, icon: '🏆' }
  ],
  generateTechnicalSpecs: (calc) => [
    {
      category: '1. Telha Shingle Premium',
      specifications: [
        { name: 'Modelo', value: 'Owens Corning TruDefinition® Duration®' },
        { name: 'Origem', value: 'Fabricada nos EUA' },
        { name: 'Tecnologia', value: 'SureNail® Exclusiva' },
        { name: 'Cobertura por Fardo', value: '3', unit: 'm²' },
        { name: 'Resistência ao Vento', value: '130', unit: 'mph' },
        { name: 'Classificação Granizo', value: 'UL 2218 Classe 4' },
        { name: 'Garantia', value: '50', unit: 'anos' }
      ]
    },
    {
      category: '2. Cumeeira e Ventilação',
      specifications: [
        { name: 'Modelo', value: 'ProEdge® Hip & Ridge' },
        { name: 'Função', value: 'Ventilação + Proteção' },
        { name: 'Cobertura Linear', value: '10', unit: 'm por fardo' },
        { name: 'Proteção UV', value: 'Garantida 25 anos' }
      ]
    },
    {
      category: '3. Manta Impermeabilizante',
      specifications: [
        { name: 'Modelo', value: 'WeatherLock® Owens Corning' },
        { name: 'Tipo', value: 'Auto-adesiva e auto-selante' },
        { name: 'Cobertura', value: '86', unit: 'm² por rolo' },
        { name: 'Impermeabilização', value: '100% à prova d\'água' },
        { name: 'Aplicação', value: 'Vales, beirais e pontos críticos' }
      ]
    },
    {
      category: '4. Deck Estrutural',
      specifications: [
        { name: 'Material', value: 'OSB Estrutural' },
        { name: 'Espessura', value: '18', unit: 'mm' },
        { name: 'Dimensões', value: '1.20 x 2.40', unit: 'm' },
        { name: 'Cobertura', value: '2.88', unit: 'm²/placa' },
        { name: 'Resistência', value: 'Classe estrutural' }
      ]
    },
    {
      category: '5. Sistema de Fixação',
      specifications: [
        { name: 'Pregos', value: 'Galvanizado especial para shingle' },
        { name: 'Comprimento', value: '25', unit: 'mm mínimo' },
        { name: 'Consumo', value: calc?.nailsKg ? `${calc.nailsKg} kg` : 'Calculado por área' },
        { name: 'Vedação', value: 'Monopol sealant para pontos críticos' }
      ]
    }
  ],
  generateBenefits: (calc) => {
    const areaTotal = calc?.totalRealArea || 0;
    const valorização = areaTotal > 200 ? 'R$ 80.000 - R$ 120.000' : 
                       areaTotal > 100 ? 'R$ 40.000 - R$ 80.000' : 
                       'R$ 20.000 - R$ 50.000';
    
    return [
      `Valorização imediata do imóvel: ${valorização}`,
      'Tecnologia SureNail® única no mercado - 18% mais resistente que IKO',
      'Garantia real de 50 anos - não é marketing, é documento oficial',
      'Resistência comprovada: 130 mph vs 110 mph dos concorrentes',
      'Cores que não desbotam - tecnologia de grânulos cerâmicos',
      'Sistema completo importado dos EUA - padrão americano',
      'Instalação mais rápida - tecnologia facilita fixação',
      'Economia em manutenção - durabilidade superior',
      'Ventilação natural integrada - evita condensação',
      'Sustentabilidade - material 100% reciclável'
    ];
  },
  customSections: [
    {
      title: 'Anatomia do Sistema Shingle Premium',
      content: `
        <div class="sistema-camadas">
          <h3>🏗️ SISTEMA COMPLETO DE 5 CAMADAS</h3>
          
          <div class="camadas-visual">
            <div class="camada-item" data-layer="1">
              <div class="camada-numero">1</div>
              <div class="camada-info">
                <h4>Telha Shingle Owens Corning Duration®</h4>
                <p>PROTEÇÃO PRINCIPAL: Resistência a ventos de 130mph, granizo e raios UV. Tecnologia SureNail® exclusiva com faixa de fixação reforçada.</p>
              </div>
            </div>
            
            <div class="camada-item" data-layer="2">
              <div class="camada-numero">2</div>
              <div class="camada-info">
                <h4>Cumeeira ProEdge® Hip & Ridge</h4>
                <p>VENTILAÇÃO E ACABAMENTO: Permite saída do ar quente, evitando condensação. Protege pontos críticos contra infiltração.</p>
              </div>
            </div>
            
            <div class="camada-item" data-layer="3">
              <div class="camada-numero">3</div>
              <div class="camada-info">
                <h4>Manta Asfáltica WeatherLock®</h4>
                <p>IMPERMEABILIZAÇÃO: Barreira 100% impermeável. Auto-adesiva e auto-selante ao redor dos pregos.</p>
              </div>
            </div>
            
            <div class="camada-item" data-layer="4">
              <div class="camada-numero">4</div>
              <div class="camada-info">
                <h4>Deck OSB Estrutural 18mm</h4>
                <p>BASE SÓLIDA: Superfície uniforme para fixação. Distribuição de cargas. Isolamento térmico adicional.</p>
              </div>
            </div>
            
            <div class="camada-item" data-layer="5">
              <div class="camada-numero">5</div>
              <div class="camada-info">
                <h4>Estrutura de Suporte</h4>
                <p>SUSTENTAÇÃO: Caibros e ripas dimensionados. Inclinação mínima de 15° para escoamento perfeito.</p>
              </div>
            </div>
          </div>
        </div>
      `,
      order: 1
    },
    {
      title: 'Comparativo Real: IKO vs Owens Corning',
      content: `
        <div class="comparativo-qualidade">
          <div class="comparativo-grid">
            <div class="marca-coluna iko">
              <h4>IKO (após 5 anos)</h4>
              <ul class="problemas-lista">
                <li>❌ Desbotamento visível das cores</li>
                <li>❌ Grânulos soltos nas calhas</li>
                <li>❌ Bordas começando a levantar</li>
                <li>❌ Apenas 110 mph de resistência</li>
                <li>❌ Garantia limitada e burocrática</li>
              </ul>
              <div class="preco-comparativo">R$ 75/m²</div>
            </div>
            
            <div class="marca-coluna owens">
              <h4>Owens Corning (após 10+ anos)</h4>
              <ul class="beneficios-lista">
                <li>✅ Cor ainda vibrante e original</li>
                <li>✅ Grânulos cerâmicos firmes</li>
                <li>✅ SureNail® mantém fixação perfeita</li>
                <li>✅ 130 mph - 18% mais resistente</li>
                <li>✅ Garantia real de 50 anos</li>
              </ul>
              <div class="preco-comparativo premium">R$ 110/m²</div>
              <div class="diferenca">47% mais valor, durabilidade infinita</div>
            </div>
          </div>
        </div>
      `,
      order: 2
    }
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