import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Wrench, Calculator, Info, Clock, Layers } from 'lucide-react';
import { DrywallCalculationResult } from '../../types/calculation.types';

interface DrywallCalculatorResultsProps {
  result: DrywallCalculationResult;
}

export function DrywallCalculatorResults({ result }: DrywallCalculatorResultsProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const MaterialCard = ({ title, quantity, unit, cost, icon: Icon }: any) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="text-right">
            <div className="font-semibold">{quantity} {unit}</div>
            <div className="text-sm text-muted-foreground">{formatCurrency(cost)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const LaborCard = ({ title, hours, cost }: any) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="text-right">
            <div className="font-semibold">{hours.toFixed(1)}h</div>
            <div className="text-sm text-muted-foreground">{formatCurrency(cost)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            Resultado do Cálculo
          </CardTitle>
          <CardDescription>
            Sistema drywall calculado conforme normas técnicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{formatCurrency(result.totalMaterialCost)}</div>
              <div className="text-sm text-muted-foreground">Materiais</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{formatCurrency(result.totalLaborCost)}</div>
              <div className="text-sm text-muted-foreground">Mão de Obra</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{formatCurrency(result.totalCost)}</div>
              <div className="text-sm text-muted-foreground">Total Geral</div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Dados Técnicos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <Badge variant="outline" className="mb-1">Espessura Final</Badge>
              <div className="font-semibold">{result.technicalData.finalThickness}mm</div>
            </div>
            <div>
              <Badge variant="outline" className="mb-1">Peso</Badge>
              <div className="font-semibold">{result.technicalData.weightPerM2}kg/m²</div>
            </div>
            {result.technicalData.acousticPerformance && (
              <div>
                <Badge variant="outline" className="mb-1">Acústica</Badge>
                <div className="font-semibold">{result.technicalData.acousticPerformance}</div>
              </div>
            )}
            {result.technicalData.fireResistance && (
              <div>
                <Badge variant="outline" className="mb-1">Fogo</Badge>
                <div className="font-semibold">{result.technicalData.fireResistance}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detalhamento */}
      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="materials">Materiais</TabsTrigger>
          <TabsTrigger value="labor">Mão de Obra</TabsTrigger>
          <TabsTrigger value="technical">Técnico</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MaterialCard
              title="Placas de Drywall"
              quantity={result.plateQuantity}
              unit="peças"
              cost={result.itemizedCosts.materials.plates}
              icon={Layers}
            />
            
            <MaterialCard
              title="Montantes"
              quantity={result.montanteQuantity}
              unit="barras"
              cost={result.itemizedCosts.materials.profiles}
              icon={Package}
            />
            
            <MaterialCard
              title="Guias"
              quantity={result.guiaQuantity}
              unit="barras"
              cost={result.itemizedCosts.materials.profiles}
              icon={Package}
            />
            
            <MaterialCard
              title="Parafusos 25mm"
              quantity={result.screw25mmQuantity}
              unit="unidades"
              cost={result.itemizedCosts.materials.screws}
              icon={Package}
            />

            {result.screw35mmQuantity && (
              <MaterialCard
                title="Parafusos 35mm"
                quantity={result.screw35mmQuantity}
                unit="unidades"
                cost={0}
                icon={Package}
              />
            )}
            
            <MaterialCard
              title="Parafusos Metal-Metal"
              quantity={result.screw13mmQuantity}
              unit="unidades"
              cost={0}
              icon={Package}
            />
            
             <MaterialCard
               title="Massa para Juntas"
               quantity={result.jointMassQuantity ? result.jointMassQuantity.toFixed(1) : (result.massQuantity * 0.4).toFixed(1)}
               unit="kg"
               cost={result.itemizedCosts.materials.mass ? result.itemizedCosts.materials.mass * 0.4 : 0}
               icon={Package}
             />

             <MaterialCard
               title="Massa de Acabamento"
               quantity={result.finishMassQuantity ? result.finishMassQuantity.toFixed(1) : (result.massQuantity * 0.6).toFixed(1)}
               unit="kg"
               cost={result.itemizedCosts.materials.mass ? result.itemizedCosts.materials.mass * 0.6 : 0}
               icon={Package}
             />
            
            <MaterialCard
              title="Fita para Juntas"
              quantity={result.tapeQuantity.toFixed(1)}
              unit="metros"
              cost={result.itemizedCosts.materials.tape}
              icon={Package}
            />

            {result.insulationQuantity && (
              <MaterialCard
                title="Isolamento"
                quantity={result.insulationQuantity}
                unit="rolos"
                cost={result.itemizedCosts.materials.insulation || 0}
                icon={Package}
              />
            )}

            {result.acousticBandQuantity && (
              <MaterialCard
                title="Banda Acústica"
                quantity={result.acousticBandQuantity.toFixed(1)}
                unit="metros"
                cost={result.itemizedCosts.materials.acousticBand || 0}
                icon={Package}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="labor" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.laborHours.structure > 0 && (
              <LaborCard
                title="Montagem da Estrutura"
                hours={result.laborHours.structure}
                cost={result.itemizedCosts.labor.structure}
              />
            )}
            
            {result.laborHours.installation > 0 && (
              <LaborCard
                title="Instalação das Placas"
                hours={result.laborHours.installation}
                cost={result.itemizedCosts.labor.installation}
              />
            )}
            
            {result.laborHours.finishing > 0 && (
              <LaborCard
                title="Tratamento e Acabamento"
                hours={result.laborHours.finishing}
                cost={result.itemizedCosts.labor.finishing}
              />
            )}
            
            {result.laborHours.insulation && result.laborHours.insulation > 0 && (
              <LaborCard
                title="Aplicação do Isolamento"
                hours={result.laborHours.insulation}
                cost={result.itemizedCosts.labor.insulation || 0}
              />
            )}
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Info className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-blue-900">Produtividade Estimada</h4>
                  <p className="text-sm text-blue-700">
                    Total: {Object.values(result.laborHours).reduce((sum, hours) => sum + hours, 0).toFixed(1)} horas
                    • Equipe de 2 pessoas: {(Object.values(result.laborHours).reduce((sum, hours) => sum + hours, 0) / 8 / 2).toFixed(1)} dias
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Especificações Técnicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Espessura Final:</span>
                  <span className="font-semibold">{result.technicalData.finalThickness}mm</span>
                </div>
                <div className="flex justify-between">
                  <span>Peso por m²:</span>
                  <span className="font-semibold">{result.technicalData.weightPerM2}kg/m²</span>
                </div>
                {result.technicalData.acousticPerformance && (
                  <div className="flex justify-between">
                    <span>Performance Acústica:</span>
                    <span className="font-semibold">{result.technicalData.acousticPerformance}</span>
                  </div>
                )}
                {result.technicalData.fireResistance && (
                  <div className="flex justify-between">
                    <span>Resistência ao Fogo:</span>
                    <span className="font-semibold">{result.technicalData.fireResistance}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Normas e Certificações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <Badge variant="secondary" className="mr-2">NBR 15.217:2018</Badge>
                  <span>Perfis metálicos</span>
                </div>
                <div className="text-sm">
                  <Badge variant="secondary" className="mr-2">NBR 14.715:2010</Badge>
                  <span>Chapas de gesso</span>
                </div>
                <div className="text-sm">
                  <Badge variant="secondary" className="mr-2">NBR 15.758:2009</Badge>
                  <span>Sistemas construtivos</span>
                </div>
                <div className="text-sm text-muted-foreground mt-3">
                  Cálculo baseado na documentação técnica oficial Knauf/Placo e Ananda Metais.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}