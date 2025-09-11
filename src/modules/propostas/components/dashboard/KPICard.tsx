import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MiniChart } from './MiniChart';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: number | string;
    type: 'positive' | 'negative' | 'neutral';
    label?: string;
  };
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  children?: React.ReactNode;
  className?: string;
  chartData?: number[];
}

export function KPICard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  variant = 'default',
  children,
  className,
  chartData
}: KPICardProps) {
  const getChangeIcon = () => {
    switch (change?.type) {
      case 'positive':
        return TrendingUp;
      case 'negative':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const getChangeColor = () => {
    switch (change?.type) {
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-drystore-medium-gray bg-drystore-light-gray';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'danger':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-drystore-orange bg-drystore-orange/10';
    }
  };

  const ChangeIcon = change ? getChangeIcon() : null;

  return (
    <Card className={cn(
      "border-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-card",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            getIconColor()
          )}>
            <Icon className="h-5 w-5" />
          </div>
          {change && (
            <Badge 
              variant="secondary"
              className={cn(
                "text-xs font-medium",
                getChangeColor()
              )}
            >
              {ChangeIcon && <ChangeIcon className="w-3 h-3 mr-1" />}
              {change.value}
              {typeof change.value === 'number' && change.value > 0 && change.type === 'positive' && '+'}
              {typeof change.value === 'number' && '%'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-3xl font-bold text-foreground">
            {typeof value === 'number' 
              ? value.toLocaleString('pt-BR')
              : value
            }
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {title}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
            {change?.label && (
              <p className="text-xs text-muted-foreground">
                {change.label}
              </p>
            )}
          </div>
          
          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}

          {chartData && chartData.length > 0 && (
            <div className="mt-4">
              <MiniChart
                data={chartData}
                color="hsl(var(--drystore-orange))"
                height={30}
                className="opacity-60"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}