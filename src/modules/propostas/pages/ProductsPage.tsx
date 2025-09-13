import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DryStoreButton } from '../components/ui/DryStoreButton';
import { DryStoreBadge } from '../components/ui/DryStoreBadge';
import { NewProductModal, NewProductData } from '../components/products/NewProductModal';
import { useUnifiedProducts, UnifiedProduct } from '../hooks/useUnifiedProducts';
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
  Package,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Trash2
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

import { UnifiedProductCategory } from '../hooks/useUnifiedProducts';

const categories: { key: UnifiedProductCategory | 'all'; label: string; icon: any }[] = [
  { key: 'all', label: 'Todos', icon: Package },
  { key: 'energia_solar', label: 'Solar', icon: Sun },
  { key: 'battery_backup', label: 'Baterias', icon: Settings },
  { key: 'telha_shingle', label: 'Telha Shingle', icon: Home },
  { key: 'forro_drywall', label: 'Forro Drywall', icon: Layers },
  { key: 'drywall_divisorias', label: 'Divisórias Drywall', icon: Layers },
  { key: 'forro_mineral_acustico', label: 'Forro Mineral Acústico', icon: Layers },
  { key: 'impermeabilizacao_mapei', label: 'Impermeabilização MAPEI', icon: Droplets },
  { key: 'preparacao_piso_mapei', label: 'Preparação Piso MAPEI', icon: Hammer },
];

const units: { value: Database['public']['Enums']['product_unit']; label: string }[] = [
  { value: 'm2', label: 'm²' },
  { value: 'ml', label: 'ml' },
  { value: 'peca', label: 'peça' },
  { value: 'unidade', label: 'unidade' },
  { value: 'conjunto', label: 'conjunto' },
  { value: 'pacote', label: 'pacote' },
  { value: 'kg', label: 'kg' },
  { value: 'litro', label: 'litro' },
  { value: 'kit', label: 'kit' },
  { value: 'balde', label: 'balde' },
  { value: 'galao', label: 'galão' },
  { value: 'rolo', label: 'rolo' },
  { value: 'saco', label: 'saco' }
];

interface EditingProduct {
  id: string;
  fields: {
    name?: string;
    description?: string;
    base_price?: string;
    unit?: string;
    brand?: string;
    model?: string;
  };
}

type SortField = 'name' | 'base_price' | 'category' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<UnifiedProductCategory | 'all'>('all');
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { products, isLoading, updateProduct, isUpdating, createProduct, isCreating } = useUnifiedProducts();

  const filteredAndSortedProducts = React.useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'base_price':
          aValue = a.base_price;
          bValue = b.base_price;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, sortField, sortDirection]);

  const getProductsByCategory = (category: UnifiedProductCategory | 'all') => {
    if (category === 'all') return filteredAndSortedProducts;
    return filteredAndSortedProducts.filter(product => product.category === category);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const startEditing = useCallback((productId: string, currentValues: UnifiedProduct) => {
    setEditingProduct({
      id: productId,
      fields: {
        name: currentValues.name,
        description: currentValues.description || '',
        base_price: String(currentValues.base_price),
        unit: currentValues.unit,
        brand: currentValues.brand || '',
        model: currentValues.model || ''
      }
    });
  }, []);

  const handleFieldChange = useCallback((field: keyof EditingProduct['fields'], value: string) => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      fields: {
        ...editingProduct.fields,
        [field]: value
      }
    });
  }, [editingProduct]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingProduct) return;

    const updates: any = {};
    
    if (editingProduct.fields.name) updates.name = editingProduct.fields.name;
    if (editingProduct.fields.description !== undefined) updates.description = editingProduct.fields.description;
    if (editingProduct.fields.base_price) updates.base_price = parseFloat(editingProduct.fields.base_price);
    if (editingProduct.fields.unit) updates.unit = editingProduct.fields.unit;
    if (editingProduct.fields.brand) updates.brand = editingProduct.fields.brand;
    if (editingProduct.fields.model) updates.model = editingProduct.fields.model;

    updateProduct({ id: editingProduct.id, updates });
    setEditingProduct(null);
  }, [editingProduct, updateProduct]);

  const handleCancelEdit = useCallback(() => {
    setEditingProduct(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editingProduct) {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [editingProduct, handleSaveEdit, handleCancelEdit]);

  const handleCreateProduct = (data: NewProductData) => {
    const unifiedData = {
      ...data,
      source: 'products' as const,
      specifications: {},
      is_active: data.is_active
    };
    createProduct(unifiedData);
    setShowNewProductModal(false);
  };

  const EditableCell = ({ 
    product, 
    field, 
    value, 
    type = 'text' 
  }: { 
    product: UnifiedProduct; 
    field: keyof EditingProduct['fields']; 
    value: string | number; 
    type?: 'text' | 'number' | 'select';
  }) => {
    const isEditing = editingProduct?.id === product.id;
    const fieldValue = isEditing ? editingProduct.fields[field] || '' : value;

    if (isEditing) {
      if (type === 'select' && field === 'unit') {
        return (
          <Select 
            value={String(fieldValue)} 
            onValueChange={(value) => handleFieldChange(field, value)}
          >
            <SelectTrigger className="h-8 min-w-[100px]">
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
        );
      }

      return (
        <Input
          value={String(fieldValue)}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 min-w-[120px]"
          type={type}
          step={type === 'number' ? '0.01' : undefined}
          autoFocus={editingProduct.fields[field] === undefined}
        />
      );
    }

    const displayValue = field === 'base_price' 
      ? `R$ ${Number(value).toFixed(2)}` 
      : field === 'unit'
        ? units.find(u => u.value === value)?.label || value
        : String(value || '-');

    return (
      <div 
        className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[32px] flex items-center"
        onDoubleClick={() => startEditing(product.id, product)}
      >
        <span className={field === 'description' ? 'text-sm text-muted-foreground' : ''}>
          {displayValue}
        </span>
      </div>
    );
  };

  const ProductTableRow = ({ product }: { product: UnifiedProduct }) => {
    const isEditing = editingProduct?.id === product.id;
    
    return (
      <TableRow className={`hover:bg-muted/50 ${isEditing ? 'bg-muted/30 border-primary' : ''}`}>
        <TableCell className="font-medium">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <EditableCell product={product} field="name" value={product.name} />
              <div className="text-xs text-muted-foreground mt-1">
                {product.source === 'solar_equipment' ? `${product.brand} - ${product.model}` : product.code}
              </div>
            </div>
          </div>
        </TableCell>
        
        <TableCell>
          <EditableCell 
            product={product} 
            field="description" 
            value={product.description || ''} 
          />
        </TableCell>
        
        <TableCell>
          <DryStoreBadge variant={
            product.category === 'forro_drywall' ? "drystore" : 
            product.category === 'drywall_divisorias' ? "drystore" : 
            product.category === 'forro_mineral_acustico' ? "drystore" : 
            product.category === 'energia_solar' ? "success" :
            product.category === 'battery_backup' ? "warning" : "info"
          }>
            {categories.find(c => c.key === product.category)?.label || product.category}
          </DryStoreBadge>
        </TableCell>
        
        <TableCell>
          <EditableCell 
            product={product} 
            field="unit" 
            value={product.unit} 
            type="select"
          />
        </TableCell>
        
        <TableCell>
          <EditableCell 
            product={product} 
            field="base_price" 
            value={product.base_price} 
            type="number"
          />
        </TableCell>
        
        <TableCell>
          <DryStoreBadge variant={product.is_active ? "success" : "warning"}>
            {product.is_active ? 'Ativo' : 'Inativo'}
          </DryStoreBadge>
        </TableCell>
        
        <TableCell>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button 
                  size="sm" 
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                  className="h-8"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  className="h-8"
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => startEditing(product.id, product)}
                  className="h-8"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <DryStoreButton size="sm" className="h-8">
                  <Eye className="h-3 w-3 mr-1" />
                  Usar
                </DryStoreButton>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

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
      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as UnifiedProductCategory | 'all')}>
        <TabsList className="grid w-full grid-cols-7 lg:grid-cols-7">
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
            {getProductsByCategory(category.key).length > 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-0">
                  <div className="rounded-md border">
                    <div className="bg-muted/20 px-4 py-2 border-b">
                      <p className="text-sm text-muted-foreground">
                        Duplo clique em qualquer célula para editar • Enter para salvar • Esc para cancelar
                      </p>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">
                            <Button 
                              variant="ghost" 
                              className="h-auto p-0 font-semibold hover:text-primary"
                              onClick={() => handleSort('name')}
                            >
                              Produto
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>
                            <Button 
                              variant="ghost" 
                              className="h-auto p-0 font-semibold hover:text-primary"
                              onClick={() => handleSort('category')}
                            >
                              Categoria
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead>
                            <Button 
                              variant="ghost" 
                              className="h-auto p-0 font-semibold hover:text-primary"
                              onClick={() => handleSort('base_price')}
                            >
                              Preço Base
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[140px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getProductsByCategory(category.key).map((product) => (
                          <ProductTableRow key={product.id} product={product} />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-md">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-muted-foreground">
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