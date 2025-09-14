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
        key: 'coverage_per_kg',
        label: 'Rendimento por kg',
        type: 'number',
        unit: 'm²/kg',
        description: 'Área coberta por quilograma do produto',
        required: true,
        min: 1,
        max: 50
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

  // Energia Solar
  {
    category: 'energia_solar',
    title: 'Especificações de Energia Solar',
    description: 'Propriedades técnicas para equipamentos de energia solar',
    fields: [
      {
        key: 'power_rating',
        label: 'Potência Nominal',
        type: 'number',
        unit: 'W',
        description: 'Potência nominal do equipamento',
        required: true,
        min: 100,
        max: 1000000
      },
      {
        key: 'efficiency',
        label: 'Eficiência',
        type: 'number',
        unit: '%',
        description: 'Eficiência do equipamento',
        min: 10,
        max: 30
      },
      {
        key: 'voltage',
        label: 'Tensão',
        type: 'number',
        unit: 'V',
        description: 'Tensão nominal de operação',
        min: 12,
        max: 1500
      },
      {
        key: 'current',
        label: 'Corrente',
        type: 'number',
        unit: 'A',
        description: 'Corrente nominal de operação',
        min: 1,
        max: 100
      },
      {
        key: 'dimensions',
        label: 'Dimensões',
        type: 'text',
        description: 'Dimensões físicas do equipamento (LxAxP)',
        defaultValue: '0x0x0 mm'
      },
      {
        key: 'weight',
        label: 'Peso',
        type: 'number',
        unit: 'kg',
        description: 'Peso do equipamento',
        min: 0.1,
        max: 1000
      },
      {
        key: 'warranty_years',
        label: 'Garantia',
        type: 'number',
        unit: 'anos',
        description: 'Período de garantia',
        min: 1,
        max: 30,
        defaultValue: 10
      }
    ]
  },

  // Drywall
  {
    category: 'drywall_divisorias',
    title: 'Especificações de Drywall',
    description: 'Propriedades técnicas para materiais de drywall',
    fields: [
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
      }
    ]
  },

  // Forro Drywall
  {
    category: 'forro_drywall',
    title: 'Especificações de Forro Drywall',
    description: 'Propriedades técnicas para materiais de forro drywall',
    fields: [
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
        key: 'acoustic_performance',
        label: 'Performance Acústica',
        type: 'number',
        unit: 'dB',
        description: 'Redução de ruído proporcionada',
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