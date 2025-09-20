// Constantes centralizadas para tipos de assets e categorias de produtos
// IMPORTANTE: Sempre adicionar novos tipos aqui para manter sincronização entre componentes

export interface AssetType {
  value: string;
  label: string;
}

export interface ProductCategory {
  value: string;
  label: string;
}

// Tipos de assets disponíveis para upload e filtros
export const ASSET_TYPES: AssetType[] = [
  { value: 'hero', label: 'Imagem Hero' },
  { value: 'product', label: 'Imagem de Produto' },
  { value: 'logo', label: 'Logo/Marca' },
  { value: 'diagram', label: 'Diagrama/Esquema' },
  { value: 'certification', label: 'Certificação' },
  { value: 'case_studies', label: 'Cases de Obra' },
  { value: 'background', label: 'Fundo' },
];

// Tipos de assets com opção 'all' para filtros
export const ASSET_TYPES_WITH_ALL: AssetType[] = [
  { value: 'all', label: 'Todos os Tipos' },
  ...ASSET_TYPES,
];

// Categorias de produtos disponíveis
export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { value: 'energia_solar', label: 'Energia Solar' },
  { value: 'drywall_divisorias', label: 'Drywall' },
  { value: 'steel_frame', label: 'Steel Frame' },
  { value: 'forros', label: 'Forro/Teto' },
  { value: 'ferramentas', label: 'Ferramentas' },
  { value: 'impermeabilizacao_mapei', label: 'Impermeabilização' },
  { value: 'preparacao_piso_mapei', label: 'Preparação de Piso' },
  { value: 'telha_shingle', label: 'Telhas' },
  { value: 'pisos', label: 'Pisos' },
  { value: 'acabamentos', label: 'Acabamentos' },
  { value: 'indefinido', label: 'Geral' },
];

// Categorias de produtos com opção 'all' para filtros
export const PRODUCT_CATEGORIES_WITH_ALL: ProductCategory[] = [
  { value: 'all', label: 'Todas as Categorias' },
  ...PRODUCT_CATEGORIES,
];

// Funções utilitárias para buscar labels
export const getAssetTypeLabel = (value: string): string => {
  return ASSET_TYPES.find(type => type.value === value)?.label || value;
};

export const getCategoryLabel = (value: string): string => {
  return PRODUCT_CATEGORIES.find(cat => cat.value === value)?.label || value;
};