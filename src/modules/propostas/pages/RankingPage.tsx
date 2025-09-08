import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DryStoreBadge } from '../components/ui/DryStoreBadge';
import { 
  Trophy,
  Medal,
  Award,
  TrendingUp,
  DollarSign,
  Target,
  Users,
  Star
} from 'lucide-react';

interface RankingItem {
  position: number;
  name: string;
  sales: number;
  revenue: number;
  conversion: number;
  clients: number;
  badge?: 'gold' | 'silver' | 'bronze';
}

export default function RankingPage() {
  const ranking: RankingItem[] = [
    {
      position: 1,
      name: 'João Silva',
      sales: 45,
      revenue: 2250000,
      conversion: 85,
      clients: 32,
      badge: 'gold'
    },
    {
      position: 2,
      name: 'Maria Santos',
      sales: 38,
      revenue: 1890000,
      conversion: 78,
      clients: 28,
      badge: 'silver'
    },
    {
      position: 3,
      name: 'Pedro Costa',
      sales: 32,
      revenue: 1560000,
      conversion: 72,
      clients: 24,
      badge: 'bronze'
    },
    {
      position: 4,
      name: 'Ana Oliveira',
      sales: 29,
      revenue: 1345000,
      conversion: 68,
      clients: 22
    },
    {
      position: 5,
      name: 'Carlos Ferreira',
      sales: 25,
      revenue: 1125000,
      conversion: 65,
      clients: 19
    }
  ];

  const getBadgeIcon = (badge?: string) => {
    switch (badge) {
      case 'gold':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'silver':
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 'bronze':
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return 'text-yellow-500 bg-yellow-50';
    if (position === 2) return 'text-gray-500 bg-gray-50';
    if (position === 3) return 'text-amber-600 bg-amber-50';
    return 'text-drystore-medium-gray bg-drystore-light-gray';
  };

  return (
    <div className="p-6 space-y-6 bg-drystore-light-gray min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-drystore-dark-gray">Ranking de Performance</h1>
          <p className="text-drystore-medium-gray">
            Acompanhe o desempenho da equipe de vendas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <DryStoreBadge variant="drystore">Janeiro 2024</DryStoreBadge>
        </div>
      </div>

      {/* Top Performers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ranking.slice(0, 3).map((item, index) => (
          <Card key={item.position} className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getPositionColor(item.position)}`}>
                  {item.position}
                </div>
                {getBadgeIcon(item.badge)}
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-drystore-dark-gray mb-2">
                  {item.name}
                </h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-drystore-dark-gray">{item.sales}</p>
                    <p className="text-drystore-medium-gray">Vendas</p>
                  </div>
                  <div>
                    <p className="font-semibold text-drystore-dark-gray">{item.conversion}%</p>
                    <p className="text-drystore-medium-gray">Conversão</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <p className="text-lg font-bold text-drystore-orange">
                    R$ {(item.revenue / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-drystore-medium-gray text-sm">Faturamento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Ranking Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-drystore-dark-gray flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-drystore-orange" />
            Ranking Completo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ranking.map((item) => (
              <div 
                key={item.position} 
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-white"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getPositionColor(item.position)}`}>
                    {item.position}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getBadgeIcon(item.badge)}
                    <div>
                      <h3 className="font-semibold text-drystore-dark-gray">
                        {item.name}
                      </h3>
                      <p className="text-sm text-drystore-medium-gray">
                        {item.clients} clientes ativos
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-8 text-sm">
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <Target className="h-4 w-4 text-drystore-orange" />
                      <span className="font-semibold text-drystore-dark-gray">
                        {item.sales}
                      </span>
                    </div>
                    <p className="text-drystore-medium-gray">Vendas</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-drystore-orange" />
                      <span className="font-semibold text-drystore-dark-gray">
                        R$ {(item.revenue / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <p className="text-drystore-medium-gray">Faturamento</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-4 w-4 text-drystore-orange" />
                      <span className="font-semibold text-drystore-dark-gray">
                        {item.conversion}%
                      </span>
                    </div>
                    <p className="text-drystore-medium-gray">Conversão</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-drystore-orange" />
                      <span className="font-semibold text-drystore-dark-gray">
                        {item.clients}
                      </span>
                    </div>
                    <p className="text-drystore-medium-gray">Clientes</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <DryStoreBadge 
                    variant={item.position <= 3 ? 'success' : 'drystore-outline'}
                    className="text-xs"
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Top {item.position <= 3 ? '3' : '5'}
                  </DryStoreBadge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-drystore-medium-gray">Média de Vendas</p>
                <p className="text-2xl font-bold text-drystore-dark-gray">
                  {Math.round(ranking.reduce((acc, item) => acc + item.sales, 0) / ranking.length)}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-drystore-medium-gray">Faturamento Total</p>
                <p className="text-2xl font-bold text-drystore-dark-gray">
                  R$ {(ranking.reduce((acc, item) => acc + item.revenue, 0) / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-drystore-medium-gray">Conversão Média</p>
                <p className="text-2xl font-bold text-drystore-dark-gray">
                  {Math.round(ranking.reduce((acc, item) => acc + item.conversion, 0) / ranking.length)}%
                </p>
              </div>
              <div className="w-10 h-10 bg-drystore-orange/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-drystore-orange" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-drystore-medium-gray">Clientes Totais</p>
                <p className="text-2xl font-bold text-drystore-dark-gray">
                  {ranking.reduce((acc, item) => acc + item.clients, 0)}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}