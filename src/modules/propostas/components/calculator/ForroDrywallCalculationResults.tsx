import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Package, Wrench, DollarSign } from 'lucide-react';
import { ForroDrywallCalculationResult } from '../../types/calculation.types';

interface ForroDrywallCalculationResultsProps {
  result: ForroDrywallCalculationResult;
}

export function ForroDrywallCalculationResults({ result }: ForroDrywallCalculationResultsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 0) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5 text-primary" />
            Resultado do Cálculo - Forro Drywall
          </CardTitle>
          <CardDescription>
            Quantidades e custos detalhados para o projeto de forro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Materiais Principais */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Package className="mr-2 h-4 w-4" />
              Materiais Principais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Placas de Drywall</p>
                <p className="text-2xl font-bold text-blue-900">{formatNumber(result.plateQuantity)}</p>
                <p className="text-xs text-blue-700">unidades</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Perfis Metálicos</p>
                <p className="text-2xl font-bold text-green-900">{formatNumber(result.profileQuantity, 1)}</p>
                <p className="text-xs text-green-700">metros</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Sistema de Suspensão</p>
                <p className="text-2xl font-bold text-purple-900">{formatNumber(result.suspensionSetQuantity)}</p>
                <p className="text-xs text-purple-700">conjuntos</p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">Parafusos</p>
                <p className="text-2xl font-bold text-orange-900">{formatNumber(result.screwQuantity)}</p>
                <p className="text-xs text-orange-700">unidades</p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium">Massa para Juntas</p>
                <p className="text-2xl font-bold text-yellow-900">{formatNumber(result.massQuantity, 1)}</p>
                <p className="text-xs text-yellow-700">kg</p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-indigo-600 font-medium">Fita para Juntas</p>
                <p className="text-2xl font-bold text-indigo-900">{formatNumber(result.tapeQuantity)}</p>
                <p className="text-xs text-indigo-700">metros</p>
              </div>
            </div>
          </div>

          {/* Isolamento - Se habilitado */}
          {result.insulationQuantity && result.insulationQuantity > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Isolamento Térmico/Acústico</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Isolamento</span>
                  <Badge variant="secondary">{formatNumber(result.insulationQuantity, 1)} m²</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Acessórios - Se houver */}
          {Object.values(result.accessoriesQuantity).some(qty => qty > 0) && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Acessórios Especiais</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {result.accessoriesQuantity.lightFixtures > 0 && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm font-medium">Spots</p>
                    <p className="text-lg font-bold">{result.accessoriesQuantity.lightFixtures}</p>
                  </div>
                )}
                {result.accessoriesQuantity.airVents > 0 && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm font-medium">Difusores AC</p>
                    <p className="text-lg font-bold">{result.accessoriesQuantity.airVents}</p>
                  </div>
                )}
                {result.accessoriesQuantity.accessPanels > 0 && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm font-medium">Alçapões</p>
                    <p className="text-lg font-bold">{result.accessoriesQuantity.accessPanels}</p>
                  </div>
                )}
                {result.accessoriesQuantity.speakers > 0 && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm font-medium">Alto-falantes</p>
                    <p className="text-lg font-bold">{result.accessoriesQuantity.speakers}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Resumo de Custos */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              Resumo de Custos
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Placas</span>
                <span className="font-medium">{formatCurrency(result.itemizedCosts.plates)}</span>
              </div>
              <div className="flex justify-between">
                <span>Perfis Metálicos</span>
                <span className="font-medium">{formatCurrency(result.itemizedCosts.profiles)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sistema de Suspensão</span>
                <span className="font-medium">{formatCurrency(result.itemizedCosts.suspension)}</span>
              </div>
              <div className="flex justify-between">
                <span>Acabamento Perimetral</span>
                <span className="font-medium">{formatCurrency(result.itemizedCosts.perimetralFinishing)}</span>
              </div>
              <div className="flex justify-between">
                <span>Parafusos</span>
                <span className="font-medium">{formatCurrency(result.itemizedCosts.screws)}</span>
              </div>
              <div className="flex justify-between">
                <span>Massa para Juntas</span>
                <span className="font-medium">{formatCurrency(result.itemizedCosts.mass)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fita para Juntas</span>
                <span className="font-medium">{formatCurrency(result.itemizedCosts.tape)}</span>
              </div>
              {result.itemizedCosts.insulation && (
                <div className="flex justify-between">
                  <span>Isolamento</span>
                  <span className="font-medium">{formatCurrency(result.itemizedCosts.insulation)}</span>
                </div>
              )}
              {result.itemizedCosts.accessories > 0 && (
                <div className="flex justify-between">
                  <span>Acessórios</span>
                  <span className="font-medium">{formatCurrency(result.itemizedCosts.accessories)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Mão de Obra</span>
                <span className="font-medium">{formatCurrency(result.itemizedCosts.labor)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total Geral</span>
                <span className="text-primary">{formatCurrency(result.totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Preço por m² */}
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Preço por m²</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(result.totalCost / (result.plateQuantity * 2.88))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}