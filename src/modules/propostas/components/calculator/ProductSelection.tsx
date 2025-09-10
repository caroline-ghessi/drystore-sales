import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Package, DollarSign, Info } from 'lucide-react';
import { useUnifiedProducts } from '../../hooks/useUnifiedProducts';

export interface SelectedProducts {
  // Drywall products
  placas?: string;
  massaJuntas?: string; 
  massaAcabamento?: string;
  perfisMetalicos?: string;
  parafusosDrywall?: string;
  parafusosMetal?: string;
  fita?: string;
  isolamento?: string;
  
  // Solar products  
  painelSolar?: string;
  inversor?: string;
  bateria?: string;
  
  // Outros produtos por categoria
  [key: string]: string | undefined;
}

interface ProductSelectionProps {
  category: 'drywall_divisorias' | 'energia_solar' | 'battery_backup' | 'forro_drywall' | 'telha_shingle';
  selectedProducts: SelectedProducts;
  onProductSelect: (productType: string, productId: string) => void;
  mode?: 'manual' | 'automatic';
  onModeChange?: (mode: 'manual' | 'automatic') => void;
}

export function ProductSelection({ 
  category, 
  selectedProducts, 
  onProductSelect, 
  mode = 'manual', 
  onModeChange 
}: ProductSelectionProps) {
  const { products = [] } = useUnifiedProducts(category);

  const getProductsByFunction = (functionType: string) => {
    const subcategoryMap: Record<string, string[]> = {
      placas: ['placas_drywall', 'placas_standard', 'placas_ru', 'placas_rf'],
      massaJuntas: ['massa_juntas', 'massa_po_juntas', 'massa_pronta_juntas'],
      massaAcabamento: ['massa_acabamento', 'massa_po_acabamento', 'massa_pronta_acabamento'],
      perfisMetalicos: ['perfis_metalicos', 'guias', 'montantes'],
      parafusosDrywall: ['parafusos_drywall', 'parafusos_25mm', 'parafusos_35mm'],
      parafusosMetal: ['parafusos_metal', 'parafusos_13mm'],
      fita: ['fita_juntas', 'fita_microperfurada'],
      isolamento: ['la_vidro', 'la_rocha', 'isolamento_acustico'],
      painelSolar: ['paineis_solares', 'modulos_fotovoltaicos'],
      inversor: ['inversores', 'inversores_string', 'inversores_micro'],
      bateria: ['baterias', 'baterias_lithium', 'baterias_lifepo4']
    };

    const subcategories = subcategoryMap[functionType] || [functionType];
    return products.filter(product => 
      subcategories.includes(product.subcategory || '') || 
      product.name.toLowerCase().includes(functionType.toLowerCase()) ||
      (functionType === 'massaJuntas' && product.name.toLowerCase().includes('massa') && product.name.toLowerCase().includes('junta')) ||
      (functionType === 'massaAcabamento' && product.name.toLowerCase().includes('massa') && !product.name.toLowerCase().includes('junta'))
    );
  };

  const getSelectedProduct = (productType: string) => {
    const productId = selectedProducts[productType];
    if (!productId) return null;
    return products.find(p => p.id === productId);
  };

  const renderProductSelector = (
    productType: string, 
    label: string, 
    description: string,
    required: boolean = true
  ) => {
    const availableProducts = getProductsByFunction(productType);
    const selectedProduct = getSelectedProduct(productType);
    
    if (availableProducts.length === 0 && required) {
      return (
        <div className="space-y-2">
          <Label className="text-destructive">{label} *</Label>
          <div className="text-sm text-muted-foreground bg-yellow-50 p-2 rounded border">
            ⚠️ Nenhum produto encontrado para {label.toLowerCase()}. Cadastre produtos na categoria correspondente.
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label>{label} {required && '*'}</Label>
        <Select
          value={selectedProducts[productType] || ''}
          onValueChange={(value) => onProductSelect(productType, value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Selecionar ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Automático (mais econômico)</SelectItem>
            {availableProducts.map(product => (
              <SelectItem key={product.id} value={product.id}>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    {product.description && (
                      <div className="text-xs text-muted-foreground">{product.description}</div>
                    )}
                  </div>
                  <div className="ml-2 text-right">
                    <Badge variant="outline" className="text-xs">
                      R$ {product.base_price.toFixed(2)}/{product.unit}
                    </Badge>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedProduct && (
          <div className="text-sm text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-3 w-3" />
              <span className="font-medium">{selectedProduct.name}</span>
            </div>
            {selectedProduct.description && (
              <div className="flex items-center gap-2 mb-1">
                <Info className="h-3 w-3" />
                <span>{selectedProduct.description}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <DollarSign className="h-3 w-3" />
              <span>R$ {selectedProduct.base_price.toFixed(2)} por {selectedProduct.unit}</span>
            </div>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    );
  };

  const renderDrywallProducts = () => (
    <>
      {renderProductSelector('placas', 'Placas de Drywall', 'Placas padrão, RU ou RF conforme necessidade')}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderProductSelector('massaJuntas', 'Massa para Juntas', 'Massa específica para tratamento de juntas (0,3-0,4 kg por metro linear)')}
        {renderProductSelector('massaAcabamento', 'Massa de Acabamento', 'Massa para acabamento final (0,5-0,8 kg por m²)')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderProductSelector('perfisMetalicos', 'Perfis Metálicos', 'Guias e montantes galvanizados')}
        {renderProductSelector('fita', 'Fita para Juntas', 'Fita microperfurada ou telada')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderProductSelector('parafusosDrywall', 'Parafusos para Drywall', 'Parafusos ponta agulha 25mm ou 35mm')}
        {renderProductSelector('parafusosMetal', 'Parafusos Metal-Metal', 'Parafusos ponta broca 13mm')}
      </div>

      {renderProductSelector('isolamento', 'Isolamento (Opcional)', 'Lã de vidro ou rocha para isolamento termoacústico', false)}
    </>
  );

  const renderSolarProducts = () => (
    <>
      {renderProductSelector('painelSolar', 'Painéis Solares', 'Módulos fotovoltaicos')}
      {renderProductSelector('inversor', 'Inversor', 'Inversor string ou micro inversor')}
      {renderProductSelector('bateria', 'Baterias (Opcional)', 'Baterias para sistemas híbridos ou off-grid', false)}
    </>
  );

  const renderProducts = () => {
    switch (category) {
      case 'drywall_divisorias':
        return renderDrywallProducts();
      case 'energia_solar':
      case 'battery_backup':
        return renderSolarProducts();
      default:
        return <div>Categoria não suportada ainda</div>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Seleção de Produtos
        </CardTitle>
        <CardDescription>
          Escolha os produtos específicos ou deixe no automático para usar os mais econômicos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {onModeChange && (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <Label>Modo de seleção:</Label>
            <div className="flex gap-2">
              <button
                onClick={() => onModeChange('automatic')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  mode === 'automatic' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-white border hover:bg-gray-100'
                }`}
              >
                Automático
              </button>
              <button
                onClick={() => onModeChange('manual')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  mode === 'manual' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-white border hover:bg-gray-100'
                }`}
              >
                Manual
              </button>
            </div>
          </div>
        )}

        {mode === 'automatic' && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Modo Automático:</strong> O sistema selecionará automaticamente os produtos mais econômicos 
              que atendem aos requisitos técnicos do projeto.
            </p>
          </div>
        )}

        {mode === 'manual' && (
          <div className="space-y-4">
            {renderProducts()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}