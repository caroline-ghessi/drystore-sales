import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Users,
  Target,
  Award,
  Activity
} from 'lucide-react';
import { usePropostasAnalytics } from '@/modules/propostas/hooks/usePropostasAnalytics';

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}

function KPICard({ title, value, change, icon, trend = 'up' }: KPICardProps) {
  const isPositive = change > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? formatCurrency(value) : value}
        </div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <TrendIcon className={`mr-1 h-4 w-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          <span className="ml-1">vs. mês anterior</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface VendorRankingProps {
  vendors: Array<{
    id: string;
    name: string;
    revenue: number;
    proposals: number;
    conversionRate: number;
    quota: number;
    quotaAchieved: number;
  }>;
}

function VendorRanking({ vendors }: VendorRankingProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Ranking de Vendedores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vendors.map((vendor, index) => (
            <div key={vendor.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">{vendor.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {vendor.proposals} propostas • {vendor.conversionRate}% conversão
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatCurrency(vendor.revenue)}</div>
                <div className="text-sm text-muted-foreground">
                  {Math.round((vendor.quotaAchieved / vendor.quota) * 100)}% da meta
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ProductPerformanceProps {
  products: Array<{
    name: string;
    revenue: number;
    proposals: number;
    conversionRate: number;
    percentage: number;
  }>;
}

function ProductPerformance({ products }: ProductPerformanceProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance por Produto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {product.proposals} propostas • {product.conversionRate}% conversão
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(product.revenue)}</div>
                  <Badge variant="secondary">{product.percentage}%</Badge>
                </div>
              </div>
              <Progress value={product.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PropostasAnalytics() {
  const { data: analytics, isLoading } = usePropostasAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Erro ao carregar analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics de Propostas</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral da performance e métricas da operação
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Atualizado em tempo real
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Receita Total"
          value={analytics.totalRevenue.value}
          change={analytics.totalRevenue.growth}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPICard
          title="Propostas Ativas"
          value={analytics.activeProposals.count}
          change={analytics.activeProposals.growth}
          icon={<FileText className="h-4 w-4" />}
        />
        <KPICard
          title="Taxa de Conversão"
          value={`${analytics.conversionRate.percentage}%`}
          change={analytics.conversionRate.growth}
          icon={<Target className="h-4 w-4" />}
        />
        <KPICard
          title="Clientes Ativos"
          value={analytics.activeClients.count}
          change={analytics.activeClients.growth}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        <VendorRanking vendors={analytics.vendorRanking} />
        <ProductPerformance products={analytics.productPerformance} />
      </div>

      {/* Meta Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Progresso das Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Meta Mensal</span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(analytics.monthlyQuota.achieved)} / {formatCurrency(analytics.monthlyQuota.target)}
                </span>
              </div>
              <Progress value={analytics.monthlyQuota.percentage} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>{analytics.monthlyQuota.percentage}% concluído</span>
                <span>{analytics.monthlyQuota.daysRemaining} dias restantes</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}