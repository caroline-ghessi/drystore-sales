import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DryStoreButton } from '../components/ui/DryStoreButton';
import { DryStoreBadge } from '../components/ui/DryStoreBadge';
import { NewProductModal, NewProductData } from '../components/products/NewProductModal';
import { useProducts, Product } from '../hooks/useProducts';
import { 
  Search,
  Plus,
  Sun,
  Home,
  Layers,
  Settings,
  Edit2,
  Check,
  X,
  Building2,
  Brush,
  Wrench,
  Package
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

// Apenas categorias com produtos reais - expandir conforme novas documentações forem adicionadas
const categories: { key: Database['public']['Enums']['product_category'] | 'all'; label: string; icon: any }[] = [
  { key: 'all', label: 'Todos', icon: Package },
  { key: 'forro_drywall', label: 'Forro Drywall', icon: Layers },
  // Adicionar categorias abaixo quando houver documentação técnica real:
  // { key: 'energia_solar', label: 'Solar', icon: Sun },
  // { key: 'telha_shingle', label: 'Shingle', icon: Home },
  // { key: 'drywall_divisorias', label: 'Drywall', icon: Layers },
  // { key: 'steel_frame', label: 'Steel Frame', icon: Building2 },
  // { key: 'forros', label: 'Forros', icon: Layers },
  // { key: 'ferramentas', label: 'Ferramentas', icon: Wrench },
  // { key: 'pisos', label: 'Pisos', icon: Settings },
  // { key: 'acabamentos', label: 'Acabamentos', icon: Settings },
  // { key: 'geral', label: 'Geral', icon: Settings }
];

const units: { value: Database['public']['Enums']['product_unit']; label: string }[] = [
  { value: 'm2', label: 'm²' },
  { value: 'ml', label: 'ml' },
  { value: 'peca', label: 'peça' },
  { value: 'unidade', label: 'unidade' },
  { value: 'conjunto', label: 'conjunto' },
  { value: 'pacote', label: 'pacote' },
  { value: 'kg', label: 'kg' },
  { value: 'litro', label: 'litro' }
];

interface EditingProduct {
  id: string;
  field: 'name' | 'description' | 'base_price' | 'unit';
  value: string;
}

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Database['public']['Enums']['product_category'] | 'all'>('all');
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [showNewProductModal, setShowNewProductModal] = useState(false);

  const { products, isLoading, updateProduct, isUpdating, createProduct, isCreating } = useProducts();

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getProductsByCategory = (category: Database['public']['Enums']['product_category'] | 'all') => {
    if (category === 'all') return filteredProducts;
    return filteredProducts.filter(product => product.category === category);
  };

  const handleEdit = (productId: string, field: 'name' | 'description' | 'base_price' | 'unit', currentValue: string | number) => {
    setEditingProduct({
      id: productId,
      field,
      value: String(currentValue || '')
    });
  };

  const handleSaveEdit = (productId: string) => {
    if (!editingProduct) return;

    const updates: any = {};
    
    if (editingProduct.field === 'base_price') {
      updates.base_price = parseFloat(editingProduct.value);
    } else if (editingProduct.field === 'name') {
      updates.name = editingProduct.value;
    } else if (editingProduct.field === 'description') {
      updates.description = editingProduct.value;
    } else if (editingProduct.field === 'unit') {
      updates.unit = editingProduct.value;
    }

    updateProduct({ id: productId, updates });
    setEditingProduct(null);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleCreateProduct = (data: NewProductData) => {
    createProduct(data);
    setShowNewProductModal(false);
  };

  const renderEditableField = (product: Product, field: 'name' | 'description' | 'base_price' | 'unit', currentValue: string | number) => {
    const isEditing = editingProduct?.id === product.id && editingProduct.field === field;

    if (isEditing) {
      if (field === 'unit') {
        return (
          <div className="flex items-center space-x-2">
            <Select 
              value={editingProduct.value} 
              onValueChange={(value) => setEditingProduct({...editingProduct, value})}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(product.id)}>
              <Check className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      }

      return (
        <div className="flex items-center space-x-2">
          <Input
            value={editingProduct.value}
            onChange={(e) => setEditingProduct({...editingProduct, value: e.target.value})}
            className={`h-8 ${field === 'description' ? 'text-xs' : ''}`}
            type={field === 'base_price' ? 'number' : 'text'}
            step={field === 'base_price' ? '0.01' : undefined}
          />
          <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(product.id)}>
            <Check className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 group">
        <span className={field === 'description' ? 'text-sm text-drystore-medium-gray' : 'font-semibold'}>
          {field === 'base_price' 
            ? `R$ ${Number(currentValue).toFixed(2)}` 
            : field === 'unit'
            ? units.find(u => u.value === currentValue)?.label || currentValue
            : String(currentValue || '-')
          }
        </span>
        <Button 
          size="sm" 
          variant="ghost" 
          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
          onClick={() => handleEdit(product.id, field, currentValue)}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-drystore-orange/10 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-drystore-orange" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg text-drystore-dark-gray">
                {renderEditableField(product, 'name', product.name)}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <DryStoreBadge variant={product.is_active ? "success" : "danger"}>
                  {product.is_active ? 'Ativo' : 'Inativo'}
                </DryStoreBadge>
                <span className="text-xs text-drystore-medium-gray">
                  {product.code}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          {renderEditableField(product, 'description', product.description || '')}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-drystore-medium-gray">Preço Base:</span>
            {renderEditableField(product, 'base_price', product.base_price)}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-drystore-medium-gray">Unidade:</span>
            {renderEditableField(product, 'unit', product.unit)}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-drystore-medium-gray">Categoria:</span>
            <span className="font-semibold text-drystore-dark-gray capitalize">
              {categories.find(c => c.key === product.category)?.label || product.category}
            </span>
          </div>

          {product.supplier && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-drystore-medium-gray">Fornecedor:</span>
              <span className="font-semibold text-drystore-dark-gray">
                {product.supplier}
              </span>
            </div>
          )}
        </div>

        <div className="flex space-x-2 pt-4">
          <DryStoreButton size="sm" className="flex-1">
            Usar em Proposta
          </DryStoreButton>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-drystore-light-gray min-h-full">
        <div className="text-center py-12">
          <p className="text-drystore-medium-gray">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-drystore-light-gray min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-drystore-dark-gray">Gestão de Produtos</h1>
          <p className="text-drystore-medium-gray">
            Gerencie títulos, descrições, unidades e preços dos produtos
          </p>
        </div>
        <DryStoreButton onClick={() => setShowNewProductModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </DryStoreButton>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-drystore-medium-gray" />
            <Input
              placeholder="Buscar produtos por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products by Category */}
      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as Database['public']['Enums']['product_category'] | 'all')}>
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-12">
          {categories.map((category: any) => {
            const CategoryIcon = category.icon;
            const count = getProductsByCategory(category.key).length;
            return (
              <TabsTrigger 
                key={category.key} 
                value={category.key}
                className="flex items-center space-x-1 text-xs"
              >
                <CategoryIcon className="h-3 w-3" />
                <span className="hidden sm:inline">{category.label}</span>
                <span className="text-xs">({count})</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.key} value={category.key} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getProductsByCategory(category.key).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            {getProductsByCategory(category.key).length === 0 && (
              <Card className="border-0 shadow-md">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-drystore-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-drystore-orange" />
                  </div>
                  <h3 className="text-lg font-semibold text-drystore-dark-gray mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-drystore-medium-gray">
                    {category.key === 'all' ? 'Adicione produtos para começar' : `Nenhum produto na categoria ${category.label}`}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <NewProductModal 
        isOpen={showNewProductModal}
        onClose={() => setShowNewProductModal(false)}
        onSubmit={handleCreateProduct}
        isCreating={isCreating}
      />
    </div>
  );
}