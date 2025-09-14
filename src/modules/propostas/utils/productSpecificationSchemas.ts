import { UnifiedProductCategory } from '../hooks/useUnifiedProducts';

export interface SpecificationField {
  key: string;
  label: string;
  type: 'number' | 'text' | 'select' | 'boolean' | 'array';
  unit?: string;
  options?: Array<{ value: string; label: string }>;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  defaultValue?: any;
}

export interface ProductSpecificationSchema {
  category: UnifiedProductCategory;
  title: string;
  description: string;
  fields: SpecificationField[];
}

// Esquemas de especificações por categoria de produto
export const PRODUCT_SPECIFICATION_SCHEMAS: ProductSpecificationSchema[] = [
  // Telha Shingle
  {
    category: 'telha_shingle',
    title: 'Especificações de Telha Shingle',
    description: 'Propriedades técnicas para telhas asfálticas tipo shingle',
    fields: [
      {
        key: 'abas',
        label: 'Número de Abas',
        type: 'number',
        description: 'Quantidade de abas da telha',
        required: true,
        min: 2,
        max: 4,
        defaultValue: 3
      },
      {
        key: 'rendimento_m2',
        label: 'Rendimento por m²',
        type: 'number',
        unit: 'pç/m²',
        description: 'Quantidade de peças necessárias por metro quadrado',
        required: true,
        min: 1,
        max: 10
      },
      {
        key: 'garantia_anos',
        label: 'Garantia',
        type: 'number',
        unit: 'anos',
        description: 'Tempo de garantia do fabricante',
        required: true,
        min: 5,
        max: 50
      },
      {
        key: 'resistencia_vento_kmh',
        label: 'Resistência ao Vento',
        type: 'number',
        unit: 'km/h',
        description: 'Velocidade máxima de vento suportada',
        min: 50,
        max: 300
      },
      {
        key: 'uso',
        label: 'Aplicação',
        type: 'select',
        description: 'Tipo de aplicação da telha',
        options: [
          { value: 'cobertura_principal', label: 'Cobertura Principal' },
          { value: 'starter_cumeeira', label: 'Starter/Cumeeira' },
          { value: 'ventilacao', label: 'Ventilação' }
        ]
      },
      {
        key: 'dimensoes',
        label: 'Dimensões',
        type: 'text',
        description: 'Dimensões da telha (ex: 45cm x 150cm)',
        required: true
      }
    ]
  },

  // Battery Backup
  {
    category: 'battery_backup',
    title: 'Especificações de Baterias e Backup',
    description: 'Propriedades técnicas para sistemas de backup e baterias',
    fields: [
      {
        key: 'capacity_kwh',
        label: 'Capacidade Energética',
        type: 'number',
        unit: 'kWh',
        description: 'Capacidade energética da bateria (campo principal)',
        required: true,
        min: 1,
        max: 100
      },
      {
        key: 'capacity_ah',
        label: 'Capacidade (Ah)',
        type: 'number',
        unit: 'Ah',
        description: 'Capacidade nominal em Ampere-hora (opcional - calculado automaticamente se não fornecido)',
        required: false,
        min: 50,
        max: 1000
      },
      {
        key: 'voltage',
        label: 'Tensão Nominal',
        type: 'number',
        unit: 'V',
        description: 'Tensão nominal da bateria',
        required: true,
        min: 12,
        max: 800
      },
      {
        key: 'cycles',
        label: 'Ciclos de Vida',
        type: 'number',
        description: 'Número de ciclos de carga/descarga',
        min: 1000,
        max: 15000
      },
      {
        key: 'dod',
        label: 'Profundidade de Descarga',
        type: 'number',
        unit: '%',
        description: 'Profundidade máxima de descarga recomendada (0-1)',
        min: 0.5,
        max: 1.0,
        defaultValue: 0.8
      },
      {
        key: 'technology',
        label: 'Tecnologia',
        type: 'select',
        description: 'Tecnologia da bateria',
        options: [
          { value: 'LiFePO4', label: 'LiFePO4 (Fosfato de Ferro)' },
          { value: 'Li-ion', label: 'Li-ion' },
          { value: 'AGM', label: 'AGM' },
          { value: 'Gel', label: 'Gel' }
        ]
      },
      {
        key: 'max_parallel',
        label: 'Máximo em Paralelo',
        type: 'number',
        description: 'Número máximo de baterias em paralelo',
        min: 1,
        max: 16,
        defaultValue: 1
      },
      {
        key: 'weight',
        label: 'Peso',
        type: 'number',
        unit: 'kg',
        description: 'Peso da bateria',
        min: 5,
        max: 200
      },
      {
        key: 'power_continuous',
        label: 'Potência Contínua',
        type: 'number',
        unit: 'W',
        description: 'Potência contínua do inversor (para inversores)',
        min: 1000,
        max: 50000
      },
      {
        key: 'power_peak',
        label: 'Potência de Pico',
        type: 'number',
        unit: 'W',
        description: 'Potência de pico do inversor (para inversores)',
        min: 2000,
        max: 100000
      },
      {
        key: 'efficiency',
        label: 'Eficiência',
        type: 'number',
        unit: '%',
        description: 'Eficiência do inversor (0-1)',
        min: 0.8,
        max: 1.0,
        defaultValue: 0.95
      }
    ]
  },

  // Energia Solar
  {
    category: 'energia_solar',
    title: 'Especificações de Energia Solar',
    description: 'Propriedades técnicas para painéis solares e inversores',
    fields: [
      {
        key: 'power',
        label: 'Potência',
        type: 'number',
        unit: 'W',
        description: 'Potência nominal do painel ou inversor',
        required: true,
        min: 100,
        max: 50000
      },
      {
        key: 'efficiency',
        label: 'Eficiência',
        type: 'number',
        unit: '%',
        description: 'Eficiência do painel ou inversor (0-1)',
        min: 0.15,
        max: 1.0
      },
      {
        key: 'vmp',
        label: 'Tensão no Ponto de Máxima Potência',
        type: 'number',
        unit: 'V',
        description: 'Tensão VMP do painel',
        min: 20,
        max: 100
      },
      {
        key: 'imp',
        label: 'Corrente no Ponto de Máxima Potência',
        type: 'number',
        unit: 'A',
        description: 'Corrente IMP do painel',
        min: 5,
        max: 20
      },
      {
        key: 'voc',
        label: 'Tensão de Circuito Aberto',
        type: 'number',
        unit: 'V',
        description: 'Tensão VOC do painel',
        min: 30,
        max: 120
      },
      {
        key: 'isc',
        label: 'Corrente de Curto-Circuito',
        type: 'number',
        unit: 'A',
        description: 'Corrente ISC do painel',
        min: 5,
        max: 25
      },
      {
        key: 'technology',
        label: 'Tecnologia',
        type: 'select',
        description: 'Tecnologia do painel solar',
        options: [
          { value: 'Monocristalino', label: 'Monocristalino' },
          { value: 'Policristalino', label: 'Policristalino' },
          { value: 'Filme Fino', label: 'Filme Fino' },
          { value: 'Half-Cell', label: 'Half-Cell' },
          { value: 'Bifacial', label: 'Bifacial' }
        ]
      },
      {
        key: 'mppt_voltage',
        label: 'Faixa MPPT',
        type: 'text',
        description: 'Faixa de tensão MPPT do inversor (ex: 120-500V)',
        defaultValue: '120-500V'
      },
      {
        key: 'phases',
        label: 'Fases',
        type: 'select',
        description: 'Número de fases do inversor',
        options: [
          { value: '1', label: 'Monofásico (1 fase)' },
          { value: '3', label: 'Trifásico (3 fases)' }
        ]
      }
    ]
  },

  // Impermeabilização MAPEI
  {
    category: 'impermeabilizacao_mapei',
    title: 'Especificações de Impermeabilização',
    description: 'Propriedades técnicas para sistemas de impermeabilização MAPEI',
    fields: [
      {
        key: 'consumption_per_m2',
        label: 'Consumo por m²',
        type: 'number',
        unit: 'kg/m²',
        description: 'Consumo de material por metro quadrado',
        required: true,
        min: 0.1,
        max: 10
      },
      {
        key: 'layers_required',
        label: 'Número de Demãos',
        type: 'number',
        description: 'Quantidade de demãos necessárias',
        required: true,
        min: 1,
        max: 5,
        defaultValue: 2
      },
      {
        key: 'drying_time',
        label: 'Tempo de Secagem',
        type: 'text',
        description: 'Tempo necessário para secagem entre demãos',
        defaultValue: '4-6 horas'
      },
      {
        key: 'application_temperature',
        label: 'Temperatura de Aplicação',
        type: 'text',
        description: 'Faixa de temperatura ideal para aplicação',
        defaultValue: '5°C a 35°C'
      },
      {
        key: 'substrate_types',
        label: 'Substratos Compatíveis',
        type: 'array',
        description: 'Tipos de superfície onde o produto pode ser aplicado'
      }
    ]
  },

  // Preparação de Piso MAPEI
  {
    category: 'preparacao_piso_mapei',
    title: 'Especificações de Preparação de Piso',
    description: 'Propriedades técnicas para produtos de preparação de piso MAPEI',
    fields: [
      {
        key: 'consumption_per_mm',
        label: 'Consumo por mm',
        type: 'number',
        unit: 'kg/m²/mm',
        description: 'Consumo por metro quadrado por milímetro de espessura',
        required: true,
        min: 0.5,
        max: 5
      },
      {
        key: 'density',
        label: 'Densidade',
        type: 'number',
        unit: 'kg/m³',
        description: 'Densidade do produto misturado',
        required: true,
        min: 800,
        max: 2500
      },
      {
        key: 'package_size',
        label: 'Tamanho da Embalagem',
        type: 'number',
        unit: 'kg',
        description: 'Peso da embalagem padrão',
        required: true,
        min: 5,
        max: 50
      },
      {
        key: 'water_ratio',
        label: 'Proporção de Água',
        type: 'text',
        description: 'Quantidade de água por embalagem',
        defaultValue: '22% (5,1L por saco)'
      },
      {
        key: 'min_thickness',
        label: 'Espessura Mínima',
        type: 'number',
        unit: 'mm',
        description: 'Espessura mínima de aplicação',
        required: true,
        min: 1,
        max: 50
      },
      {
        key: 'max_thickness',
        label: 'Espessura Máxima',
        type: 'number',
        unit: 'mm',
        description: 'Espessura máxima de aplicação',
        required: true,
        min: 5,
        max: 100
      },
      {
        key: 'pot_life',
        label: 'Tempo de Trabalho',
        type: 'text',
        description: 'Tempo útil após mistura',
        defaultValue: '30 minutos'
      },
      {
        key: 'walking_time',
        label: 'Tempo para Trânsito',
        type: 'text',
        description: 'Tempo até liberação para caminhada',
        defaultValue: '4-6 horas'
      }
    ]
  },


  // Drywall (Divisórias e Forros)
  {
    category: 'drywall_divisorias',
    title: 'Especificações de Drywall',
    description: 'Propriedades técnicas para materiais de drywall (divisórias e forros)',
    fields: [
      {
        key: 'application_type',
        label: 'Tipo de Aplicação',
        type: 'select',
        description: 'Tipo de aplicação do drywall',
        options: [
          { value: 'divisoria', label: 'Divisória' },
          { value: 'forro', label: 'Forro' }
        ],
        defaultValue: 'divisoria'
      },
      {
        key: 'coverage_area',
        label: 'Área de Cobertura',
        type: 'number',
        unit: 'm²',
        description: 'Área coberta por unidade',
        required: true,
        min: 0.1,
        max: 50
      },
      {
        key: 'length',
        label: 'Comprimento',
        type: 'number',
        unit: 'mm',
        description: 'Comprimento da peça',
        min: 100,
        max: 10000
      },
      {
        key: 'width',
        label: 'Largura',
        type: 'number',
        unit: 'mm',
        description: 'Largura da peça',
        min: 50,
        max: 5000
      },
      {
        key: 'thickness',
        label: 'Espessura',
        type: 'number',
        unit: 'mm',
        description: 'Espessura da peça',
        min: 5,
        max: 100
      },
      {
        key: 'pieces_per_package',
        label: 'Peças por Embalagem',
        type: 'number',
        description: 'Quantidade de peças por embalagem',
        min: 1,
        max: 1000,
        defaultValue: 1
      },
      {
        key: 'fire_resistance',
        label: 'Resistência ao Fogo',
        type: 'select',
        options: [
          { value: 'standard', label: 'Padrão' },
          { value: 'fire_resistant', label: 'Resistente ao Fogo' }
        ],
        defaultValue: 'standard'
      },
      {
        key: 'moisture_resistance',
        label: 'Resistência à Umidade',
        type: 'boolean',
        description: 'Produto resistente à umidade',
        defaultValue: false
      },
      {
        key: 'acoustic_performance',
        label: 'Performance Acústica',
        type: 'number',
        unit: 'dB',
        description: 'Redução de ruído proporcionada (para forros)',
        min: 0,
        max: 60
      }
    ]
  },


  // Outras categorias (valores básicos)
  {
    category: 'forro_mineral_acustico',
    title: 'Especificações de Forro Mineral Acústico',
    description: 'Propriedades técnicas para materiais de forro mineral acústico',
    fields: [
      {
        key: 'coverage_area',
        label: 'Área de Cobertura',
        type: 'number',
        unit: 'm²',
        description: 'Área coberta por unidade',
        required: true,
        min: 0.1,
        max: 100
      },
      {
        key: 'pieces_per_package',
        label: 'Peças por Embalagem',
        type: 'number',
        description: 'Quantidade de peças por embalagem',
        min: 1,
        max: 1000,
        defaultValue: 1
      },
      {
        key: 'acoustic_rating',
        label: 'Índice Acústico',
        type: 'number',
        unit: 'NRC',
        description: 'Coeficiente de redução de ruído',
        min: 0,
        max: 1,
        defaultValue: 0.65
      }
    ]
  }
];

// Função para obter o esquema de especificações para uma categoria
export function getSpecificationSchema(category: UnifiedProductCategory): ProductSpecificationSchema | null {
  return PRODUCT_SPECIFICATION_SCHEMAS.find(schema => schema.category === category) || null;
}

// Função para obter todas as categorias que possuem especificações editáveis
export function getCategoriesWithSpecifications(): UnifiedProductCategory[] {
  return PRODUCT_SPECIFICATION_SCHEMAS.map(schema => schema.category);
}

// Função para validar especificações de um produto
export function validateProductSpecifications(
  category: UnifiedProductCategory, 
  specifications: any
): { isValid: boolean; errors: string[] } {
  const schema = getSpecificationSchema(category);
  if (!schema) {
    return { isValid: true, errors: [] };
  }

  const errors: string[] = [];
  
  schema.fields.forEach(field => {
    const value = specifications?.[field.key];
    
    // Validar campos obrigatórios
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field.label} é obrigatório`);
    }
    
    // Validar tipos e ranges
    if (value !== undefined && value !== null && value !== '') {
      if (field.type === 'number') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors.push(`${field.label} deve ser um número`);
        } else {
          if (field.min !== undefined && numValue < field.min) {
            errors.push(`${field.label} deve ser maior ou igual a ${field.min}`);
          }
          if (field.max !== undefined && numValue > field.max) {
            errors.push(`${field.label} deve ser menor ou igual a ${field.max}`);
          }
        }
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to calculate coverage from consumption (for backward compatibility)
export function calculateCoverageFromConsumption(consumptionPerM2: number): number {
  if (!consumptionPerM2 || consumptionPerM2 <= 0) return 0;
  return 1 / consumptionPerM2; // m²/kg = 1 / (kg/m²)
}

// Helper function to calculate Ah from kWh and voltage (for battery backup)
export function calculateAhFromKwh(capacityKwh: number, voltage: number): number {
  if (!capacityKwh || !voltage || voltage <= 0) return 0;
  return (capacityKwh * 1000) / voltage; // Ah = (kWh × 1000) ÷ V
}