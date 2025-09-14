import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Home, Shield } from 'lucide-react';
import { ShingleCalculationInput } from '../../types/calculation.types';
import { LaborCostSelector, LaborCostConfig } from '../shared/LaborCostSelector';

interface ShingleCalculatorProps {
  onCalculate: (input: ShingleCalculationInput) => void;
}

export function ShingleCalculator({ onCalculate }: ShingleCalculatorProps) {
  const [input, setInput] = useState<ShingleCalculationInput>({
    roofArea: 100,
    roofSlope: 25,
    shingleType: 'oakridge',
    roofDetails: {
      perimeterLength: 40,
      ridgeLength: 10,
      valleyLength: 0,
      hipLength: 0,
      numberOfPenetrations: 2,
    },
    features: {
      gutters: false,
      underlayment: 'rhinoroof',
      ventilation: false,
      insulation: false,
    },
    laborConfig: {
      includeLabor: false, // Padrão desmarcado
    }
  });

  const handleCalculate = () => {
    onCalculate(input);
  };

  const updateRoofDetails = (field: keyof typeof input.roofDetails, value: number) => {
    setInput(prev => ({
      ...prev,
      roofDetails: {
        ...prev.roofDetails,
        [field]: value
      }
    }));
  };

  const updateFeatures = (field: keyof typeof input.features, value: boolean | string) => {
    setInput(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [field]: value
      }
    }));
  };

  const updateLaborConfig = (laborConfig: any) => {
    setInput(prev => ({
      ...prev,
      laborConfig
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Home className="mr-2 h-5 w-5 text-blue-500" />
          Calculadora Telha Shingle
        </CardTitle>
        <CardDescription>
          Configure os parâmetros para calcular o telhado shingle ideal usando apenas produtos cadastrados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="labor">Mão de Obra</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            {/* Seção Principal */}
            <div>
              <Label className="text-base font-semibold">Dados Básicos do Telhado</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                {/* Roof Area */}
                <div>
                  <Label htmlFor="roofArea">Área do Telhado (m²) *</Label>
                  <Input
                    id="roofArea"
                    type="number"
                    value={input.roofArea}
                    onChange={(e) => setInput(prev => ({
                      ...prev,
                      roofArea: Number(e.target.value)
                    }))}
                    placeholder="100"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Área total a ser coberta
                  </p>
                </div>

                {/* Roof Slope */}
                <div>
                  <Label htmlFor="roofSlope">Inclinação do Telhado (graus) *</Label>
                  <Input
                    id="roofSlope"
                    type="number"
                    value={input.roofSlope}
                    onChange={(e) => setInput(prev => ({
                      ...prev,
                      roofSlope: Number(e.target.value)
                    }))}
                    placeholder="25"
                    min="17"
                    max="80"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ângulo de inclinação em graus
                  </p>
                </div>

                {/* Shingle Type */}
                <div>
                  <Label>Tipo de Telha Shingle *</Label>
                  <Select
                    value={input.shingleType}
                    onValueChange={(value: any) => setInput(prev => ({ ...prev, shingleType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oakridge">Linha Oakridge - 30 anos garantia</SelectItem>
                      <SelectItem value="supreme">Linha Supreme - 25 anos garantia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tipo de Subcobertura</Label>
                  <Select
                    value={input.features.underlayment}
                    onValueChange={(value: any) => updateFeatures('underlayment', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rhinoroof">RhinoRoof - Manta Asfáltica (86 m²/rolo)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manta asfáltica de alta performance - Rolo 1,1x87m
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {/* Seção Elementos Lineares */}
            <div>
              <Label className="text-base font-semibold">Elementos Lineares do Telhado</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                {/* ... keep existing code (perimeter, ridge, valley inputs) ... */}
                <div>
                  <Label htmlFor="perimeterLength">Perímetro dos Beirais (m) *</Label>
                  <Input
                    id="perimeterLength"
                    type="number"
                    value={input.roofDetails.perimeterLength}
                    onChange={(e) => updateRoofDetails('perimeterLength', Number(e.target.value))}
                    placeholder="40"
                  />
                </div>

                <div>
                  <Label htmlFor="ridgeLength">Comprimento das Cumeeiras (m) *</Label>
                  <Input
                    id="ridgeLength"
                    type="number"
                    value={input.roofDetails.ridgeLength}
                    onChange={(e) => updateRoofDetails('ridgeLength', Number(e.target.value))}
                    placeholder="10"
                  />
                </div>

                <div>
                  <Label htmlFor="valleyLength">Comprimento das Águas Furtadas (m)</Label>
                  <Input
                    id="valleyLength"
                    type="number"
                    value={input.roofDetails.valleyLength}
                    onChange={(e) => updateRoofDetails('valleyLength', Number(e.target.value))}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="numberOfPenetrations">Número de Penetrações</Label>
                  <Input
                    id="numberOfPenetrations"
                    type="number"
                    value={input.roofDetails.numberOfPenetrations}
                    onChange={(e) => updateRoofDetails('numberOfPenetrations', Number(e.target.value))}
                    placeholder="2"
                  />
                </div>
              </div>
            </div>

            {/* Optional Features */}
            <div>
              <Label className="text-base font-semibold">Características Adicionais</Label>
              <div className="space-y-3 mt-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gutters"
                    checked={input.features.gutters}
                    onCheckedChange={(checked) => updateFeatures('gutters', !!checked)}
                  />
                  <Label htmlFor="gutters" className="text-sm">
                    Incluir calhas
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ventilation"
                    checked={input.features.ventilation}
                    onCheckedChange={(checked) => updateFeatures('ventilation', !!checked)}
                  />
                  <Label htmlFor="ventilation" className="text-sm">
                    Sistema de ventilação
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="insulation"
                    checked={input.features.insulation}
                    onCheckedChange={(checked) => updateFeatures('insulation', !!checked)}
                  />
                  <Label htmlFor="insulation" className="text-sm">
                    Isolamento térmico
                  </Label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="labor" className="space-y-6">
            <LaborCostSelector
              config={input.laborConfig || { includeLabor: false }}
              onChange={updateLaborConfig}
              totalArea={input.roofArea}
              productType="shingle"
            />
          </TabsContent>
        </Tabs>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="font-semibold text-blue-800">Durabilidade</p>
                  <p className="text-sm text-blue-700">50+ anos de vida útil</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Home className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="font-semibold text-green-800">Estética</p>
                  <p className="text-sm text-green-700">Beleza e valorização</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calculator className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="font-semibold text-purple-800">Garantia</p>
                  <p className="text-sm text-purple-700">20 anos contra defeitos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={handleCalculate} className="w-full mt-6">
          <Calculator className="mr-2 h-4 w-4" />
          Calcular Telhado Shingle
        </Button>
      </CardContent>
    </Card>
  );
}