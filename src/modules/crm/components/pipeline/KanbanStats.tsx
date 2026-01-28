import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Percent, Clock, Users } from 'lucide-react';
import { usePipelineStats, formatCurrency } from '../../hooks/usePipelineStats';
import { cn } from '@/lib/utils';

const stats = [
  {
    key: 'totalPipelineValue',
    title: 'Total Pipeline',
    icon: TrendingUp,
    format: (value: number) => formatCurrency(value),
    suffix: '',
    trend: '+12%',
    trendPositive: true,
  },
  {
    key: 'conversionRate',
    title: 'Taxa de Conversão',
    icon: Percent,
    format: (value: number) => `${value}%`,
    suffix: '',
    trend: '+2.1%',
    trendPositive: true,
  },
  {
    key: 'avgCycleTime',
    title: 'Tempo Médio Ciclo',
    icon: Clock,
    format: (value: number) => `${value} dias`,
    suffix: '',
    trend: '-3 dias',
    trendPositive: true,
  },
  {
    key: 'activeLeads',
    title: 'Leads Ativos',
    icon: Users,
    format: (value: number) => value.toString(),
    suffix: (data: any) => data?.newOpportunitiesToday > 0 ? `+${data.newOpportunitiesToday} novos hoje` : '',
    trend: '',
    trendPositive: true,
  },
] as const;

export function KanbanStats() {
  const { data, isLoading } = usePipelineStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const value = data?.[stat.key as keyof typeof data] ?? 0;
        const suffix = typeof stat.suffix === 'function' ? stat.suffix(data) : stat.suffix;
        
        return (
          <Card key={stat.key} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stat.format(value as number)}
              </div>
              {(stat.trend || suffix) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.trend && (
                    <span className={cn(
                      stat.trendPositive ? 'text-primary' : 'text-destructive'
                    )}>
                      {stat.trend}
                    </span>
                  )}
                  {stat.trend && suffix && ' '}
                  {suffix && <span>{suffix}</span>}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
