import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DryStoreButton } from '../components/ui/DryStoreButton';
import { DryStoreBadge } from '../components/ui/DryStoreBadge';
import { 
  Search,
  Plus,
  Sun,
  Home,
  Layers,
  Settings,
  Zap,
  Shield,
  Truck,
  Award
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: 'solar' | 'shingle' | 'drywall' | 'steel_frame' | 'ceiling';
  description: string;
  priceRange: string;
  status: 'disponivel' | 'limitado' | 'indisponivel';
  warranty: string;
  installation: boolean;
  rating: number;
}

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const products: Product[] = [
    {
      id: '1',
      name: 'Sistema Solar Residencial 5kWp',
      category: 'solar',
      description: 'Kit completo para energia solar residencial com painéis monocristalinos de alta eficiência',
      priceRange: 'R$ 18.000 - R$ 25.000',
      status: 'disponivel',
      warranty: '25 anos',
      installation: true,
      rating: 4.9
    },
    {
      id: '2',
      name: 'Telha Shingle Premium',
      category: 'shingle',
      description: 'Telhas asfálticas importadas com proteção UV e resistência superior',
      priceRange: 'R$ 35 - R$ 55 /m²',
      status: 'disponivel',
      warranty: '30 anos',
      installation: true,
      rating: 4.7
    },
    {
      id: '3',
      name: 'Sistema Drywall Knauf',
      category: 'drywall',
      description: 'Placas de gesso para divisórias e forros com excelente acabamento',
      priceRange: 'R$ 45 - R$ 65 /m²',
      status: 'limitado',
      warranty: '10 anos',
      installation: true,
      rating: 4.6
    },
    {
      id: '4',
      name: 'Estrutura Steel Frame',
      category: 'steel_frame',
      description: 'Sistema construtivo em aço galvanizado para construções rápidas',
      priceRange: 'R$ 180 - R$ 250 /m²',
      status: 'disponivel',
      warranty: '50 anos',
      installation: true,
      rating: 4.8
    },
    {
      id: '5',
      name: 'Forro Acústico Mineral',
      category: 'ceiling',
      description: 'Forros minerais com propriedades acústicas para ambientes comerciais',
      priceRange: 'R$ 25 - R$ 40 /m²',
      status: 'indisponivel',
      warranty: '5 anos',
      installation: false,
      rating: 4.4
    }
  ];

  const categories = [
    { key: 'all', label: 'Todos os Produtos', icon: Settings },
    { key: 'solar', label: 'Energia Solar', icon: Sun },
    { key: 'shingle', label: 'Telhas Shingle', icon: Home },
    { key: 'drywall', label: 'Drywall', icon: Layers },
    { key: 'steel_frame', label: 'Steel Frame', icon: Settings },
    { key: 'ceiling', label: 'Forros', icon: Layers }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: Product['status']) => {
    switch (status) {
      case 'disponivel':
        return <DryStoreBadge variant="success">Disponível</DryStoreBadge>;
      case 'limitado':
        return <DryStoreBadge variant="warning">Limitado</DryStoreBadge>;
      case 'indisponivel':
        return <DryStoreBadge variant="danger">Indisponível</DryStoreBadge>;
      default:
        return <DryStoreBadge variant="info">Desconhecido</DryStoreBadge>;
    }
  };

  const getCategoryIcon = (category: Product['category']) => {
    switch (category) {
      case 'solar':
        return <Sun className="h-5 w-5 text-yellow-600" />;
      case 'shingle':
        return <Home className="h-5 w-5 text-red-600" />;
      case 'drywall':
        return <Layers className="h-5 w-5 text-gray-600" />;
      case 'steel_frame':
        return <Settings className="h-5 w-5 text-blue-600" />;
      case 'ceiling':
        return <Layers className="h-5 w-5 text-green-600" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">☆</span>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">★</span>);
    }

    return stars;
  };

  return (
    <div className="p-6 space-y-6 bg-drystore-light-gray min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-drystore-dark-gray">Catálogo de Produtos</h1>
          <p className="text-drystore-medium-gray">
            Explore nossa linha completa de produtos para construção
          </p>
        </div>
        <DryStoreButton>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </DryStoreButton>
      </div>

      {/* Categories Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category.key}
            variant={selectedCategory === category.key ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.key)}
            className={`flex items-center whitespace-nowrap ${
              selectedCategory === category.key
                ? 'bg-drystore-orange text-drystore-white hover:bg-drystore-orange-hover'
                : 'text-drystore-dark-gray hover:bg-drystore-orange/10 hover:text-drystore-orange'
            }`}
          >
            <category.icon className="mr-2 h-4 w-4" />
            {category.label}
          </Button>
        ))}
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

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-drystore-orange/10 rounded-lg flex items-center justify-center">
                    {getCategoryIcon(product.category)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg text-drystore-dark-gray">
                      {product.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusBadge(product.status)}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-drystore-medium-gray">
                {product.description}
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-drystore-medium-gray">Faixa de Preço:</span>
                  <span className="font-semibold text-drystore-dark-gray">
                    {product.priceRange}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-drystore-medium-gray">Garantia:</span>
                  <span className="font-semibold text-drystore-dark-gray">
                    {product.warranty}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-drystore-medium-gray">Avaliação:</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {renderStars(product.rating)}
                    </div>
                    <span className="font-semibold text-drystore-dark-gray">
                      {product.rating}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4 text-drystore-orange" />
                  <span className="text-drystore-medium-gray">Garantia</span>
                </div>
                
                {product.installation && (
                  <div className="flex items-center space-x-1">
                    <Truck className="h-4 w-4 text-drystore-orange" />
                    <span className="text-drystore-medium-gray">Instalação</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  <Award className="h-4 w-4 text-drystore-orange" />
                  <span className="text-drystore-medium-gray">Qualidade</span>
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <DryStoreButton size="sm" className="flex-1">
                  <Zap className="mr-2 h-4 w-4" />
                  Criar Proposta
                </DryStoreButton>
                <Button variant="outline" size="sm" className="text-drystore-medium-gray hover:text-drystore-orange">
                  Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No results */}
      {filteredProducts.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-drystore-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-drystore-orange" />
            </div>
            <h3 className="text-lg font-semibold text-drystore-dark-gray mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-drystore-medium-gray">
              Tente ajustar os filtros ou termo de busca
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}