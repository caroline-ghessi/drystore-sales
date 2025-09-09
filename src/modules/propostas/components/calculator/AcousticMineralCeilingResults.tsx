import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Calculator, 
  Package, 
  Wrench,
  DollarSign,
  Award,
  Zap
} from 'lucide-react';
import { AcousticMineralCeilingResult } from '../../types/calculation.types';

interface AcousticMineralCeilingResultsProps {
  result: AcousticMineralCeilingResult;
}

export function AcousticMineralCeilingResults({ result }: AcousticMineralCeilingResultsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      
      {/* Validações e Alertas */}
      {result.validations.warnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {result.validations.warnings.map((warning, index) => (
                <li key={index} className="text-sm text-yellow-700 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  {warning}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Modelo Selecionado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Modelo Selecionado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Modelo</p>
              <p className="font-bold text-lg">{result.selectedModel.name}</p>
              <p className="text-sm text-muted-foreground">{result.selectedModel.manufacturer}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Modulação</p>
              <p className="font-semibold">{result.selectedModel.modulation}</p>
              <Badge variant={result.selectedModel.edgeType === 'tegular' ? 'default' : 'secondary'}>
                {result.selectedModel.edgeType === 'tegular' ? 'Tegular' : 'Lay-in'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Performance</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">NRC: {result.selectedModel.nrc}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">RH: {result.selectedModel.rh}%</Badge>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Técnico</p>
              <p className="font-semibold">{result.selectedModel.weight} kg/m²</p>
              <p className="text-sm text-muted-foreground">
                {result.selectedModel.platesPerBox} placas/caixa
              </p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4" />
                <span className="font-medium">Performance Acústica</span>
              </div>
              <Badge 
                variant={
                  result.acousticPerformance.classification === 'premium' ? 'default' :
                  result.acousticPerformance.classification === 'alta' ? 'secondary' : 'outline'
                }
              >
                {result.acousticPerformance.classification.toUpperCase()}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                NRC {result.acousticPerformance.nrc}
              </p>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Validações</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  {result.validations.minSpaceOk ? 
                    <CheckCircle className="h-3 w-3 text-green-600" /> : 
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                  }
                  Espaço mínimo
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {result.validations.modelSuitable ? 
                    <CheckCircle className="h-3 w-3 text-green-600" /> : 
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                  }
                  Modelo adequado
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4" />
                <span className="font-medium">Recomendado para</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {result.acousticPerformance.suitableFor.slice(0, 2).map((use, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {use.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Áreas de Cálculo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Áreas de Cálculo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Área Total</p>
              <p className="font-bold text-lg">{result.areas.total.toFixed(1)} m²</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Obstáculos</p>
              <p className="font-semibold text-red-600">- {result.areas.obstacles.toFixed(1)} m²</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Área Útil</p>
              <p className="font-bold text-lg text-green-600">{result.areas.useful.toFixed(1)} m²</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Perímetro</p>
              <p className="font-semibold">{result.areas.perimeter.toFixed(1)} m</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quantidades de Material */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Quantidades de Material
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            
            {/* Placas */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Placas de Forro
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
                <div className="p-3 bg-muted rounded">
                  <p className="text-muted-foreground">Base</p>
                  <p className="font-bold">{result.plates.baseQuantity}</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-muted-foreground">Perda ({result.plates.lossPercentage}%)</p>
                  <p className="font-bold text-orange-600">
                    +{result.plates.totalPlates - result.plates.baseQuantity}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-bold text-blue-600">{result.plates.totalPlates}</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-muted-foreground">Caixas</p>
                  <p className="font-bold text-purple-600">{result.plates.boxesNeeded}</p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-muted-foreground">Final (c/ lumin.)</p>
                  <p className="font-bold text-green-600">{result.plates.platesDiscountedLights}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Estrutura */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Estrutura de Sustentação
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Perfil Principal */}
                <div className="p-3 border rounded-lg">
                  <p className="font-medium mb-2">Perfil Principal</p>
                  <div className="space-y-1 text-sm">
                    <p>Metros: <span className="font-bold">{result.structure.mainProfile.meters.toFixed(1)}m</span></p>
                    <p>Barras 3,66m: <span className="font-bold">{result.structure.mainProfile.bars}</span></p>
                  </div>
                </div>

                {/* Perfis Secundários */}
                <div className="p-3 border rounded-lg">
                  <p className="font-medium mb-2">Perfis Secundários</p>
                  <div className="space-y-1 text-sm">
                    {result.structure.secondaryProfile1250 && (
                      <p>1250mm: <span className="font-bold">{result.structure.secondaryProfile1250.pieces} pçs</span></p>
                    )}
                    {result.structure.secondaryProfile625 && (
                      <p>625mm: <span className="font-bold">{result.structure.secondaryProfile625.pieces} pçs</span></p>
                    )}
                  </div>
                </div>

                {/* Cantoneira e Suspensão */}
                <div className="p-3 border rounded-lg">
                  <p className="font-medium mb-2">Cantoneira & Suspensão</p>
                  <div className="space-y-1 text-sm">
                    <p>Cantoneira: <span className="font-bold">{result.structure.perimeterEdge.bars} barras</span></p>
                    <p>Tirantes: <span className="font-bold">{result.structure.suspension.hangers} kits</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Acessórios */}
            {(result.accessories.tegularClips || result.accessories.lightSupports || result.accessories.specialAnchors) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3">Acessórios Especiais</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    {result.accessories.tegularClips > 0 && (
                      <div className="p-3 bg-muted rounded">
                        <p className="text-muted-foreground">Clips Tegular</p>
                        <p className="font-bold">{result.accessories.tegularClips}</p>
                      </div>
                    )}
                    {result.accessories.lightSupports > 0 && (
                      <div className="p-3 bg-muted rounded">
                        <p className="text-muted-foreground">Suportes Luminária</p>
                        <p className="font-bold">{result.accessories.lightSupports}</p>
                      </div>
                    )}
                    {result.accessories.specialAnchors > 0 && (
                      <div className="p-3 bg-muted rounded">
                        <p className="text-muted-foreground">Buchas Especiais</p>
                        <p className="font-bold">{result.accessories.specialAnchors}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Detalhamento de Custos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 border rounded">
                <p className="text-sm text-muted-foreground">Placas</p>
                <p className="font-bold">{formatCurrency(result.itemizedCosts.plates)}</p>
              </div>
              <div className="p-3 border rounded">
                <p className="text-sm text-muted-foreground">Estrutura</p>
                <p className="font-bold">
                  {formatCurrency(
                    result.itemizedCosts.mainProfile + 
                    result.itemizedCosts.secondaryProfiles + 
                    result.itemizedCosts.perimeterEdge
                  )}
                </p>
              </div>
              <div className="p-3 border rounded">
                <p className="text-sm text-muted-foreground">Suspensão</p>
                <p className="font-bold">{formatCurrency(result.itemizedCosts.suspension)}</p>
              </div>
              <div className="p-3 border rounded">
                <p className="text-sm text-muted-foreground">Mão de Obra</p>
                <p className="font-bold">{formatCurrency(result.itemizedCosts.labor)}</p>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
              <span className="font-bold text-lg">Total do Projeto:</span>
              <span className="font-bold text-2xl text-primary">
                {formatCurrency(result.totalCost)}
              </span>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Preços base para região {result.technicalSpecs.configuration} | 
              Complexidade: {result.technicalSpecs.installationComplexity}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Especificações Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Especificações Técnicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Configuração</p>
              <p className="font-bold">{result.technicalSpecs.configuration}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Espessura Final</p>
              <p className="font-bold">{result.technicalSpecs.finalThickness}mm</p>
            </div>
            <div>
              <p className="text-muted-foreground">Peso</p>
              <p className="font-bold">{result.technicalSpecs.weight} kg/m²</p>
            </div>
            <div>
              <p className="text-muted-foreground">Resistência Umidade</p>
              <p className="font-bold">{result.technicalSpecs.moistureResistance}% RH</p>
            </div>
            <div>
              <p className="text-muted-foreground">Instalação</p>
              <p className="font-bold capitalize">{result.technicalSpecs.installationComplexity}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Performance Acústica</p>
              <p className="font-bold capitalize">{result.acousticPerformance.classification}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}