import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, Clock, Target, TrendingUp } from 'lucide-react';

interface VendorMetrics {
  id: string;
  name: string;
  calculationsSaved: number;
  proposalsGenerated: number;
  avgResponseTime: number;
  conversionRate: number;
  avgTicket: number;
  topProduct: string;
  isActive: boolean;
}

interface VendorPerformanceMatrixProps {
  vendors: VendorMetrics[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
};

export default function VendorPerformanceMatrix({ vendors }: VendorPerformanceMatrixProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Detalhada dos Vendedores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Cálculos</TableHead>
                <TableHead className="text-center">Propostas</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4" />
                    Tempo Resp.
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Target className="h-4 w-4" />
                    Conversão
                  </div>
                </TableHead>
                <TableHead className="text-center">Ticket Médio</TableHead>
                <TableHead className="text-center">Produto Principal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div className="font-medium">{vendor.name}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={vendor.isActive ? "default" : "secondary"}>
                      {vendor.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {vendor.calculationsSaved}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {vendor.proposalsGenerated}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-medium ${vendor.avgResponseTime <= 60 ? 'text-green-600' : vendor.avgResponseTime <= 120 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {formatTime(vendor.avgResponseTime)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className={`font-medium ${vendor.conversionRate >= 70 ? 'text-green-600' : vendor.conversionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {vendor.conversionRate.toFixed(1)}%
                      </span>
                      {vendor.conversionRate >= 60 && <TrendingUp className="h-4 w-4 text-green-600" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {formatCurrency(vendor.avgTicket)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{vendor.topProduct}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}