import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  Calendar,
  User,
  DollarSign,
  Edit2,
  Trash2
} from 'lucide-react';
import { DryStoreButton } from '@/modules/propostas/components/ui/DryStoreButton';

interface SalesQuota {
  id: string;
  vendorName: string;
  vendorEmail: string;
  period: string;
  quota: number;
  achieved: number;
  percentage: number;
  status: 'on-track' | 'behind' | 'exceeded';
}

export default function MetasPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - would come from database
  const salesQuotas: SalesQuota[] = [
    {
      id: '1',
      vendorName: 'João Silva',
      vendorEmail: 'joao@empresa.com',
      period: 'Janeiro 2024',
      quota: 50000,
      achieved: 39000,
      percentage: 78,
      status: 'on-track'
    },
    {
      id: '2',
      vendorName: 'Maria Santos',
      vendorEmail: 'maria@empresa.com',
      period: 'Janeiro 2024',
      quota: 45000,
      achieved: 52000,
      percentage: 115,
      status: 'exceeded'
    },
    {
      id: '3',
      vendorName: 'Pedro Costa',
      vendorEmail: 'pedro@empresa.com',
      period: 'Janeiro 2024',
      quota: 40000,
      achieved: 22000,
      percentage: 55,
      status: 'behind'
    }
  ];

  const filteredQuotas = salesQuotas.filter(quota =>
    quota.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quota.vendorEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: SalesQuota['status']) => {
    switch (status) {
      case 'exceeded':
        return <Badge className="bg-green-100 text-green-800">Superou Meta</Badge>;
      case 'on-track':
        return <Badge className="bg-blue-100 text-blue-800">No Caminho</Badge>;
      case 'behind':
        return <Badge className="bg-red-100 text-red-800">Abaixo da Meta</Badge>;
      default:
        return <Badge variant="secondary">Indefinido</Badge>;
    }
  };

  const getTotalQuota = () => salesQuotas.reduce((sum, quota) => sum + quota.quota, 0);
  const getTotalAchieved = () => salesQuotas.reduce((sum, quota) => sum + quota.achieved, 0);
  const getAveragePercentage = () => Math.round(salesQuotas.reduce((sum, quota) => sum + quota.percentage, 0) / salesQuotas.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-drystore-dark-gray">Metas de Vendas</h2>
          <p className="text-drystore-medium-gray">
            Configure e acompanhe as metas dos vendedores
          </p>
        </div>
        <DryStoreButton>
          <Plus className="mr-2 h-4 w-4" />
          Nova Meta
        </DryStoreButton>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-drystore-medium-gray flex items-center">
              <Target className="mr-2 h-4 w-4" />
              Meta Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-drystore-dark-gray">
              R$ {getTotalQuota().toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-drystore-medium-gray flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              Realizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-drystore-dark-gray">
              R$ {getTotalAchieved().toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-drystore-medium-gray flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Atingimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-drystore-dark-gray">
              {getAveragePercentage()}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-drystore-medium-gray flex items-center">
              <User className="mr-2 h-4 w-4" />
              Vendedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-drystore-dark-gray">
              {salesQuotas.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por vendedor ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Button variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          Janeiro 2024
        </Button>
      </div>

      {/* Quotas List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-drystore-dark-gray">Metas por Vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredQuotas.map((quota) => (
              <div key={quota.id} className="flex items-center justify-between p-4 border border-drystore-light-gray rounded-lg hover:bg-drystore-light-orange/5 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-drystore-light-orange rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-drystore-orange" />
                  </div>
                  <div>
                    <h3 className="font-medium text-drystore-dark-gray">{quota.vendorName}</h3>
                    <p className="text-sm text-drystore-medium-gray">{quota.vendorEmail}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-3 w-3 text-drystore-medium-gray" />
                      <span className="text-xs text-drystore-medium-gray">{quota.period}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-sm text-drystore-medium-gray">Meta</div>
                    <div className="font-medium text-drystore-dark-gray">
                      R$ {quota.quota.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-drystore-medium-gray">Realizado</div>
                    <div className="font-medium text-drystore-dark-gray">
                      R$ {quota.achieved.toLocaleString()}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-drystore-medium-gray">Atingimento</div>
                    <div className="font-bold text-lg text-drystore-dark-gray">
                      {quota.percentage}%
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusBadge(quota.status)}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-drystore-orange hover:bg-drystore-light-orange/10">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}