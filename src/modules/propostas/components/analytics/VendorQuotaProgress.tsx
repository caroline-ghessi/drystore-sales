import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar, TrendingUp, Award } from 'lucide-react';

interface VendorQuota {
  id: string;
  name: string;
  monthlyTarget: number;
  achieved: number;
  percentage: number;
  projectedClose: number;
  daysToTarget: number;
  trend: 'up' | 'down' | 'stable';
  isTopPerformer: boolean;
}

interface VendorQuotaProgressProps {
  vendors: VendorQuota[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function VendorQuotaProgress({ vendors }: VendorQuotaProgressProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {vendors.map((vendor) => (
        <Card key={vendor.id} className="relative">
          {vendor.isTopPerformer && (
            <div className="absolute -top-2 -right-2">
              <Badge className="bg-yellow-500 text-yellow-900 hover:bg-yellow-500">
                <Award className="h-3 w-3 mr-1" />
                Top
              </Badge>
            </div>
          )}
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{vendor.name}</span>
              <div className="flex items-center gap-1 text-sm">
                {vendor.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                <span className={`font-medium ${vendor.percentage >= 80 ? 'text-green-600' : vendor.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {vendor.percentage.toFixed(0)}%
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress 
                value={Math.min(vendor.percentage, 100)} 
                className="h-3"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatCurrency(vendor.achieved)}</span>
                <span>{formatCurrency(vendor.monthlyTarget)}</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Target className="h-3 w-3" />
                  Projeção
                </div>
                <div className="font-medium">
                  {formatCurrency(vendor.projectedClose)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Para Meta
                </div>
                <div className="font-medium">
                  {vendor.daysToTarget > 0 ? `${vendor.daysToTarget} dias` : 'Meta atingida!'}
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge 
                variant={vendor.percentage >= 100 ? "default" : vendor.percentage >= 80 ? "secondary" : "outline"}
                className={vendor.percentage >= 100 ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
              >
                {vendor.percentage >= 100 ? "Meta Atingida" : 
                 vendor.percentage >= 80 ? "No Caminho" : 
                 vendor.percentage >= 60 ? "Atenção" : "Crítico"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}