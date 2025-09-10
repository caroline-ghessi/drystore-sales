import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, Info, Calculator } from 'lucide-react';
import { AcousticMineralCeilingResult } from '../../types/calculation.types';

interface AcousticMineralCeilingResultsProps {
  result: AcousticMineralCeilingResult;
}

export function AcousticMineralCeilingResults({ result }: AcousticMineralCeilingResultsProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);

  const formatArea = (value: number) => `${value.toFixed(1)} m²`;
  const formatPerimeter = (value: number) => `${value.toFixed(1)} m`;
  
  return (
    <div className="space-y-6">
      {/* Header com modelo selecionado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Resultado do Cálculo - Forro Mineral Acústico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <h3 className="font-semibold text-lg">{result.selectedModel.name}</h3>
              <p className="text-sm text-muted-foreground">{result.selectedModel.manufacturer}</p>
              <Badge className="mt-2">{result.selectedModel.modulation} {result.selectedModel.edgeType}</Badge>
            </div>
            
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <h3 className="font-semibold text-lg">Performance Acústica</h3>
              <p className="text-xl font-bold text-primary">NRC {result.selectedModel.nrc}</p>
              <Badge variant="outline">{result.acousticPerformance.classification}</Badge>
            </div>
            
            <div className="text-center p-4 bg-success/10 rounded-lg">
              <h3 className="font-semibold text-lg">Custo Total</h3>
              <p className="text-xl font-bold">{formatCurrency(result.totalCost)}</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(result.totalCost / result.areas.useful)}/m²
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Áreas e quantidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Áreas de Cálculo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Área Total:</span>
              <span className="font-mono">{formatArea(result.areas.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Obstáculos:</span>
              <span className="font-mono">-{formatArea(result.areas.obstacles)}</span>
            </div>
            <div className="flex justify-between">
              <span>Recortes/Aberturas:</span>
              <span className="font-mono">-{formatArea(result.areas.cutouts)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Área Útil:</span>
              <span className="font-mono">{formatArea(result.areas.useful)}</span>
            </div>
            <div className="flex justify-between">
              <span>Perímetro:</span>
              <span className="font-mono">{formatPerimeter(result.areas.perimeter)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quantidades de Material</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Placas necessárias:</span>
              <span className="font-mono">{result.plates.baseQuantity} un</span>
            </div>
            <div className="flex justify-between">
              <span>Percentual de perda:</span>
              <span className="font-mono">{result.plates.lossPercentage}%</span>
            </div>
            <div className="flex justify-between">
              <span>Total com perdas:</span>
              <span className="font-mono font-semibold">{result.plates.totalPlates} un</span>
            </div>
            <div className="flex justify-between">
              <span>Caixas necessárias:</span>
              <span className="font-mono">{result.plates.boxesNeeded} cx</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Após descontar luminárias:</span>
              <span className="font-mono">{result.plates.platesDiscountedLights} un</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sistema de sustentação */}
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Sustentação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded">
              <h4 className="font-semibold text-sm">Perfil Principal</h4>
              <p className="text-lg font-mono">{result.structure.mainProfile.meters.toFixed(1)} m</p>
              <p className="text-xs text-muted-foreground">{result.structure.mainProfile.bars} barras</p>
            </div>
            
            {result.structure.secondaryProfile1250 && (
              <div className="p-3 bg-muted/50 rounded">
                <h4 className="font-semibold text-sm">Perfil Sec. 1250mm</h4>
                <p className="text-lg font-mono">{result.structure.secondaryProfile1250.meters.toFixed(1)} m</p>
                <p className="text-xs text-muted-foreground">{result.structure.secondaryProfile1250.pieces} peças</p>
              </div>
            )}
            
            {result.structure.secondaryProfile625 && (
              <div className="p-3 bg-muted/50 rounded">
                <h4 className="font-semibold text-sm">Perfil Sec. 625mm</h4>
                <p className="text-lg font-mono">{result.structure.secondaryProfile625.meters.toFixed(1)} m</p>
                <p className="text-xs text-muted-foreground">{result.structure.secondaryProfile625.pieces} peças</p>
              </div>
            )}
            
            <div className="p-3 bg-muted/50 rounded">
              <h4 className="font-semibold text-sm">Cantoneira Perimetral</h4>
              <p className="text-lg font-mono">{result.structure.perimeterEdge.meters.toFixed(1)} m</p>
              <p className="text-xs text-muted-foreground">{result.structure.perimeterEdge.bars} barras</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-primary/5 rounded">
            <h4 className="font-semibold text-sm mb-2">Sistema de Suspensão</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-mono">{result.structure.suspension.hangers}</p>
                <p className="text-xs text-muted-foreground">Tirantes</p>
              </div>
              <div>
                <p className="text-lg font-mono">{result.structure.suspension.regulators}</p>
                <p className="text-xs text-muted-foreground">Reguladores</p>
              </div>
              <div>
                <p className="text-lg font-mono">{result.structure.suspension.anchors}</p>
                <p className="text-xs text-muted-foreground">Buchas/Chumbadores</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custos detalhados */}
      <Card>
        <CardHeader>
          <CardTitle>Custos Detalhados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Placas minerais:</span>
            <span className="font-mono">{formatCurrency(result.itemizedCosts.plates)}</span>
          </div>
          <div className="flex justify-between">
            <span>Perfis principais:</span>
            <span className="font-mono">{formatCurrency(result.itemizedCosts.mainProfile)}</span>
          </div>
          <div className="flex justify-between">
            <span>Perfis secundários:</span>
            <span className="font-mono">{formatCurrency(result.itemizedCosts.secondaryProfiles)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cantoneira perimetral:</span>
            <span className="font-mono">{formatCurrency(result.itemizedCosts.perimeterEdge)}</span>
          </div>
          <div className="flex justify-between">
            <span>Sistema suspensão:</span>
            <span className="font-mono">{formatCurrency(result.itemizedCosts.suspension)}</span>
          </div>
          <div className="flex justify-between">
            <span>Acessórios:</span>
            <span className="font-mono">{formatCurrency(result.itemizedCosts.accessories)}</span>
          </div>
          {result.itemizedCosts.labor > 0 && (
            <div className="flex justify-between">
              <span>Mão de obra:</span>
              <span className="font-mono">{formatCurrency(result.itemizedCosts.labor)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span className="font-mono">{formatCurrency(result.totalCost)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Validações e avisos */}
      {(result.validations.warnings.length > 0 || !result.validations.minSpaceOk || !result.validations.modelSuitable) && (
        <Card>
          <CardHeader>
            <CardTitle>Validações Técnicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className={`flex items-center gap-2 p-3 rounded ${
                result.validations.minSpaceOk ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {result.validations.minSpaceOk ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <span className="text-sm">Espaço Mínimo</span>
              </div>
              
              <div className={`flex items-center gap-2 p-3 rounded ${
                result.validations.structureCompatible ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {result.validations.structureCompatible ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <span className="text-sm">Estrutura Compatível</span>
              </div>
              
              <div className={`flex items-center gap-2 p-3 rounded ${
                result.validations.modelSuitable ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {result.validations.modelSuitable ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <span className="text-sm">Modelo Adequado</span>
              </div>
            </div>

            {result.validations.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Avisos Importantes:
                </h4>
                <ul className="space-y-1">
                  {result.validations.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-orange-700">
                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}