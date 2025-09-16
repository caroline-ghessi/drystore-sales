import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Star, TrendingUp } from 'lucide-react';

interface ProductSpecialization {
  productName: string;
  salesCount: number;
  revenue: number;
  successRate: number;
  avgValue: number;
  percentage: number;
}

interface VendorSpecialization {
  id: string;
  name: string;
  specializations: ProductSpecialization[];
  topSpecialty: string;
  diversityScore: number;
}

interface VendorProductSpecializationProps {
  vendors: VendorSpecialization[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function VendorProductSpecialization({ vendors }: VendorProductSpecializationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Especialização por Produto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{vendor.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>Especialista em: <strong>{vendor.topSpecialty}</strong></span>
                    <Badge variant="outline">
                      Diversidade: {vendor.diversityScore.toFixed(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {vendor.specializations.map((spec) => (
                  <div key={spec.productName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{spec.productName}</span>
                        {spec.successRate >= 70 && (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium">{formatCurrency(spec.revenue)}</div>
                        <div className="text-muted-foreground">
                          {spec.salesCount} vendas • {spec.successRate.toFixed(0)}% sucesso
                        </div>
                      </div>
                    </div>
                    
                    <Progress value={spec.percentage} className="h-2" />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Ticket médio: {formatCurrency(spec.avgValue)}</span>
                      <span>{spec.percentage.toFixed(1)}% do faturamento</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}