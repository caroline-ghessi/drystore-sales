import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Search, Edit, Save } from 'lucide-react';
import { useProducts, Product } from '../../hooks/useProducts';
import { Database } from '@/integrations/supabase/types';

export default function ProdutosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});

  const { products: allProducts, updateProduct, isLoading } = useProducts();
  const { products: knaufProducts } = useProducts('forro_knauf');

  const filteredProducts = allProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (product: Product) => {
    setEditingProduct(product.id);
    setEditForm({
      name: product.name,
      description: product.description,
      base_price: product.base_price,
      unit: product.unit
    });
  };

  const handleSave = () => {
    if (editingProduct) {
      updateProduct({ id: editingProduct, updates: editForm });
      setEditingProduct(null);
      setEditForm({});
    }
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card key={product.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{product.code}</Badge>
              <Badge className="bg-blue-100 text-blue-800">{product.category}</Badge>
            </div>
            
            {editingProduct === product.id ? (
              <div className="space-y-3">
                <div>
                  <Label>Nome do Produto</Label>
                  <Input
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <div>
                    <Label>Preço (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editForm.base_price || 0}
                      onChange={(e) => setEditForm({ ...editForm, base_price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <Input
                      value={editForm.unit || ''}
                      onChange={(e) => setEditForm({ 
                        ...editForm, 
                        unit: e.target.value as Database['public']['Enums']['product_unit']
                      })}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-muted-foreground text-sm mb-2">{product.description}</p>
                <div className="flex items-center gap-4">
                  <span className="font-medium">R$ {product.base_price.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">por {product.unit}</span>
                </div>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            {editingProduct === product.id ? (
              <Button onClick={handleSave} size="sm">
                <Save className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => handleEdit(product)} variant="outline" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Gestão de Produtos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          <Tabs defaultValue="knauf" className="w-full">
            <TabsList>
              <TabsTrigger value="knauf">Produtos Knauf ({knaufProducts.length})</TabsTrigger>
              <TabsTrigger value="all">Todos os Produtos ({allProducts.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="knauf">
              <div className="mt-4">
                {knaufProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="all">
              <div className="mt-4">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}