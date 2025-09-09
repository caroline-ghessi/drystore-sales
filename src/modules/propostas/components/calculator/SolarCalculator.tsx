import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Sun, Zap } from 'lucide-react';
import { SolarCalculationInput } from '../../types/calculation.types';

interface SolarCalculatorProps {
  onCalculate: (input: SolarCalculationInput) => void;
}

export function SolarCalculator({ onCalculate }: SolarCalculatorProps) {
  const [input, setInput] = useState<SolarCalculationInput>({
    monthlyConsumption: 300,
    roofType: 'ceramic',
    roofOrientation: 'north',
    shadowing: 'none',
    installationType: 'grid_tie',
    region: 'southeast'
  });

  const handleCalculate = () => {
    onCalculate(input);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sun className="mr-2 h-5 w-5 text-yellow-500" />
          Calculadora Energia Solar
        </CardTitle>
        <CardDescription>
          Configure os parâmetros para calcular o sistema fotovoltaico ideal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Monthly Consumption */}
          <div>
            <Label htmlFor="consumption">Consumo Mensal (kWh) *</Label>
            <Input
              id="consumption"
              type="number"
              value={input.monthlyConsumption}
              onChange={(e) => setInput({
                ...input,
                monthlyConsumption: Number(e.target.value)
              })}
              placeholder="300"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Valor médio da conta de energia
            </p>
          </div>

          {/* Roof Type */}
          <div>
            <Label>Tipo de Telhado *</Label>
            <Select
              value={input.roofType}
              onValueChange={(value: any) => setInput({ ...input, roofType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ceramic">Cerâmico</SelectItem>
                <SelectItem value="concrete">Concreto</SelectItem>
                <SelectItem value="metal">Metálico</SelectItem>
                <SelectItem value="fiber_cement">Fibrocimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Roof Orientation */}
          <div>
            <Label>Orientação do Telhado *</Label>
            <Select
              value={input.roofOrientation}
              onValueChange={(value: any) => setInput({ ...input, roofOrientation: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="north">Norte (Ideal)</SelectItem>
                <SelectItem value="northeast">Nordeste</SelectItem>
                <SelectItem value="northwest">Noroeste</SelectItem>
                <SelectItem value="east">Leste</SelectItem>
                <SelectItem value="west">Oeste</SelectItem>
                <SelectItem value="southeast">Sudeste</SelectItem>
                <SelectItem value="southwest">Sudoeste</SelectItem>
                <SelectItem value="south">Sul</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shadowing */}
          <div>
            <Label>Sombreamento *</Label>
            <Select
              value={input.shadowing}
              onValueChange={(value: any) => setInput({ ...input, shadowing: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem Sombra</SelectItem>
                <SelectItem value="partial">Sombra Parcial</SelectItem>
                <SelectItem value="significant">Sombra Significativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Installation Type */}
          <div>
            <Label>Tipo de Instalação *</Label>
            <Select
              value={input.installationType}
              onValueChange={(value: any) => setInput({ ...input, installationType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid_tie">Grid Tie (Conectado à Rede)</SelectItem>
                <SelectItem value="off_grid">Off Grid (Isolado)</SelectItem>
                <SelectItem value="hybrid">Híbrido (Com Bateria)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Region */}
          <div>
            <Label>Região *</Label>
            <Select
              value={input.region}
              onValueChange={(value: any) => setInput({ ...input, region: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="north">Norte</SelectItem>
                <SelectItem value="northeast">Nordeste</SelectItem>
                <SelectItem value="center_west">Centro-Oeste</SelectItem>
                <SelectItem value="southeast">Sudeste</SelectItem>
                <SelectItem value="south">Sul</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Sun className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="font-semibold text-yellow-800">Orientação Ideal</p>
                  <p className="text-sm text-yellow-700">Norte = máxima geração</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="font-semibold text-green-800">Economia</p>
                  <p className="text-sm text-green-700">Até 95% na conta de luz</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calculator className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="font-semibold text-blue-800">ROI</p>
                  <p className="text-sm text-blue-700">Payback em 3-6 anos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={handleCalculate} className="w-full">
          <Calculator className="mr-2 h-4 w-4" />
          Calcular Sistema Solar
        </Button>
      </CardContent>
    </Card>
  );
}