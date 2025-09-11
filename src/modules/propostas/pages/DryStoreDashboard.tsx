import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DryStoreButton } from '../components/ui/DryStoreButton';
import { DryStoreBadge } from '../components/ui/DryStoreBadge';
import { KPICard } from '../components/dashboard/KPICard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { ProgressBar } from '../components/dashboard/ProgressBar';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatPercentage, getGreeting, getProgressMessage } from '../utils/dashboardUtils';
import { cn } from '@/lib/utils';
import { 
  Building,
  Sun, 
  Wrench,
  TrendingUp,
  FileText,
  Target,
  Users,
  ArrowRight,
  BarChart3,
  DollarSign,
  ClipboardList,
  Award,
  ShoppingCart
} from 'lucide-react';

export default function DryStoreDashboard() {
  const { data: metrics, isLoading } = useDashboardMetrics();
  const { isAdmin, isVendor } = useUserPermissions();
  const { user } = useAuth();

  const userName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Usuário';
  const greeting = getGreeting();

  const getSubtitle = () => {
    if (isAdmin) return 'Visão geral do desempenho comercial';
    if (isVendor) return `${greeting} ${userName}, acompanhe suas métricas e performance`;
    return 'Acompanhe o desempenho das propostas';
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-drystore-light-gray min-h-full">
        <div className="animate-pulse space-y-6">
          <div className="bg-gradient-to-r from-drystore-orange to-drystore-dark-gray rounded-2xl h-32"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card h-40 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-drystore-light-gray min-h-full">
      {/* Dynamic Header */}
      <div className="bg-gradient-to-r from-drystore-orange to-drystore-dark-gray rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard de Propostas</h1>
            <p className="text-lg opacity-90">{getSubtitle()}</p>
          </div>
          <div className="hidden md:block">
            <DryStoreButton 
              variant="drystore-secondary"
              className="bg-white text-drystore-orange hover:bg-white/90"
            >
              <FileText className="mr-2 h-5 w-5" />
              Nova Proposta
            </DryStoreButton>
          </div>
        </div>
      </div>

      {/* KPIs Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          {isAdmin ? 'Métricas Gerais' : 'Sua Performance'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isAdmin ? (
            <>
              {/* Admin KPIs */}
              <KPICard
                title="Faturamento Total"
                value={formatCurrency(metrics?.totalRevenue.value || 0)}
                subtitle="Receita consolidada"
                change={{
                  value: metrics?.totalRevenue.monthlyGrowth || 0,
                  type: (metrics?.totalRevenue.monthlyGrowth || 0) > 0 ? 'positive' : 'negative',
                  label: 'vs mês anterior'
                }}
                icon={DollarSign}
                variant="success"
              />
              
              <KPICard
                title="Meta da Empresa"
                value={formatPercentage(metrics?.companyQuota.percentage || 0)}
                subtitle={`${formatCurrency(metrics?.companyQuota.achieved || 0)} de ${formatCurrency(metrics?.companyQuota.target || 0)}`}
                change={{
                  value: `${metrics?.companyQuota.daysRemaining || 0} dias restantes`,
                  type: 'neutral'
                }}
                icon={Target}
                variant="warning"
              >
                <ProgressBar
                  value={metrics?.companyQuota.percentage || 0}
                  size="sm"
                  className="mt-2"
                />
              </KPICard>
              
              <KPICard
                title="Total de Vendedores"
                value={metrics?.vendorRanking.length || 0}
                subtitle={`${metrics?.companyQuota.teamBreakdown.filter(t => t.hasMetGoal).length || 0} bateram a meta`}
                change={{
                  value: `${metrics?.companyQuota.teamBreakdown.filter(t => t.percentage < 50).length || 0} precisam atenção`,
                  type: metrics?.companyQuota.teamBreakdown.filter(t => t.percentage < 50).length === 0 ? 'positive' : 'negative'
                }}
                icon={Users}
              />
              
              <KPICard
                title="Taxa de Conversão Média"
                value={formatPercentage(metrics?.vendorRanking.reduce((sum, v) => sum + v.conversionRate, 0) / (metrics?.vendorRanking.length || 1) || 0)}
                subtitle="Performance da equipe"
                change={{
                  value: `Top: ${Math.max(...(metrics?.vendorRanking.map(v => v.conversionRate) || [0]))}%`,
                  type: 'positive'
                }}
                icon={TrendingUp}
                variant="success"
              />
            </>
          ) : (
            <>
              {/* Vendor KPIs */}
              <KPICard
                title="Minhas Vendas do Mês"
                value={formatCurrency(metrics?.personalSales.value || 0)}
                subtitle="Valor total vendido"
                change={{
                  value: metrics?.personalSales.growth || 0,
                  type: (metrics?.personalSales.growth || 0) > 0 ? 'positive' : 'negative',
                  label: 'vs mês anterior'
                }}
                icon={DollarSign}
                variant="success"
                chartData={metrics?.personalSales.lastWeekData}
              />
              
              <KPICard
                title="Meta Pessoal"
                value={formatPercentage(metrics?.personalQuota.percentage || 0)}
                subtitle={getProgressMessage(metrics?.personalQuota.percentage || 0, metrics?.personalQuota.remaining || 0)}
                change={{
                  value: formatCurrency(metrics?.personalQuota.remaining || 0),
                  type: 'neutral',
                  label: 'faltam para a meta'
                }}
                icon={Target}
                variant="warning"
              >
                <ProgressBar
                  value={metrics?.personalQuota.percentage || 0}
                  size="sm"
                  className="mt-2"
                />
              </KPICard>
              
              <KPICard
                title="Propostas em Aberto"
                value={metrics?.openProposals.total || 0}
                subtitle={`${metrics?.openProposals.recent.length || 0} atualizadas recentemente`}
                change={{
                  value: formatCurrency(metrics?.openProposals.recent.reduce((sum, p) => sum + p.value, 0) || 0),
                  type: 'neutral',
                  label: 'valor em negociação'
                }}
                icon={ClipboardList}
              />
              
              <KPICard
                title="Taxa de Conversão"
                value={formatPercentage(metrics?.conversionRate.percentage || 0)}
                subtitle={`Média da equipe: ${formatPercentage(metrics?.conversionRate.teamAverage || 0)}`}
                change={{
                  value: metrics?.conversionRate.trend === 'up' ? '+' : metrics?.conversionRate.trend === 'down' ? '-' : '=',
                  type: metrics?.conversionRate.trend === 'up' ? 'positive' : metrics?.conversionRate.trend === 'down' ? 'negative' : 'neutral',
                  label: 'tendência'
                }}
                icon={TrendingUp}
                variant={(metrics?.conversionRate.percentage || 0) > (metrics?.conversionRate.teamAverage || 0) ? 'success' : 'warning'}
              />
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Additional Insights for Admins */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vendor Ranking */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-foreground flex items-center">
                <Award className="mr-2 h-5 w-5 text-drystore-orange" />
                Ranking de Vendedores
              </CardTitle>
              <CardDescription>Top performers do mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.vendorRanking.slice(0, 5).map((vendor, index) => (
                  <div key={vendor.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-drystore-orange text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{vendor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(vendor.sales)} • {formatPercentage(vendor.conversionRate)} conversão
                        </p>
                      </div>
                    </div>
                    {vendor.hasMetGoal && (
                      <DryStoreBadge variant="success" className="text-xs">
                        Meta atingida!
                      </DryStoreBadge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Product Performance */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-foreground flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5 text-drystore-orange" />
                Performance por Produto
              </CardTitle>
              <CardDescription>Produtos mais vendidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.productPerformance.map((product, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">{product.name}</span>
                      <span className="text-sm font-medium text-muted-foreground">
                        {formatCurrency(product.sales)}
                      </span>
                    </div>
                    <ProgressBar
                      value={product.percentage}
                      max={100}
                      size="sm"
                      showValue={false}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatPercentage(product.percentage)} do total</span>
                      <span>{formatPercentage(product.conversionRate)} conversão</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Proposals for Vendors */}
      {isVendor && metrics?.openProposals.recent.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-foreground flex items-center">
              <ClipboardList className="mr-2 h-5 w-5 text-drystore-orange" />
              Propostas Recentes
            </CardTitle>
            <CardDescription>Suas últimas propostas em andamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.openProposals.recent.map((proposal) => (
                <div key={proposal.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{proposal.client}</p>
                    <p className="text-sm text-muted-foreground">{proposal.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{formatCurrency(proposal.value)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(proposal.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <DryStoreButton variant="drystore-outline" size="sm">
                Ver todas as propostas
                <ArrowRight className="ml-2 h-4 w-4" />
              </DryStoreButton>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}