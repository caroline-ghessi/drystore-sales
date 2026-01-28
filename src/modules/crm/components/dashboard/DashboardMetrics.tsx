import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Target, Brain, TrendingUp } from 'lucide-react';
import { usePipelineStats, formatCurrency } from '../../hooks/usePipelineStats';
import { useOpportunitiesCount } from '../../hooks/useOpportunities';

interface MetricCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  isLoading?: boolean;
}

function MetricCard({ icon, value, label, change, changeType = 'positive', isLoading }: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-8 w-24 mb-1" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  const changeColorClass = changeType === 'positive' 
    ? 'text-green-600 bg-green-100' 
    : changeType === 'negative' 
    ? 'text-red-600 bg-red-100' 
    : 'text-muted-foreground bg-muted';

  return (
    <Card className="bg-card border-border hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          {change && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${changeColorClass}`}>
              {change}
            </span>
          )}
        </div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

export function DashboardMetrics() {
  const { data: stats, isLoading: statsLoading } = usePipelineStats();
  const { data: aiLeadsCount, isLoading: aiLoading } = useOpportunitiesCount();

  const isLoading = statsLoading || aiLoading;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        icon={<DollarSign className="h-5 w-5" />}
        value={stats ? formatCurrency(stats.totalPipelineValue) : 'R$ 0'}
        label="Receita do Mês"
        change="+12%"
        changeType="positive"
        isLoading={isLoading}
      />
      <MetricCard
        icon={<Target className="h-5 w-5" />}
        value={stats?.activeLeads || 0}
        label="Deals Ativos"
        change={`+${stats?.newOpportunitiesToday || 0}`}
        changeType="positive"
        isLoading={isLoading}
      />
      <MetricCard
        icon={<Brain className="h-5 w-5" />}
        value={aiLeadsCount || 0}
        label="Leads (IA)"
        change="Novo"
        changeType="positive"
        isLoading={isLoading}
      />
      <MetricCard
        icon={<TrendingUp className="h-5 w-5" />}
        value={stats ? `${stats.conversionRate}%` : '0%'}
        label="Taxa de Conversão"
        change="+3%"
        changeType="positive"
        isLoading={isLoading}
      />
    </div>
  );
}
