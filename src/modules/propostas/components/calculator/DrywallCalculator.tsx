import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calculator, Square, Layers } from 'lucide-react';
import { DrywallCalculationInput } from '../../types/calculation.types';

interface DrywallCalculatorProps {
  onCalculate: (input: DrywallCalculationInput) => void;
}

export function DrywallCalculator({ onCalculate }: DrywallCalculatorProps) {
  const [input, setInput] = useState<DrywallCalculationInput>({
    wallArea: 50,
    wallHeight: 2.8,
    wallType: 'standard',
    finishType: 'level_4',
    insulationRequired: false,
    electricalInstallation: false,
    complexity: 'medium',
    region: 'southeast',
    urgency: 'normal'
  });

  const handleCalculate = () => {
    onCalculate(input);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Square className="mr-2 h-5 w-5 text-gray-500" />
          Calculadora Drywall
        </CardTitle>
        <CardDescription>
          Configure os parâmetros para calcular a instalação de drywall
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Wall Area */}
          <div>
            <Label htmlFor="wallArea">Área da Parede (m²) *</Label>
            <Input
              id="wallArea"
              type="number"
              value={input.wallArea}
              onChange={(e) => setInput({
                ...input,
                wallArea: Number(e.target.value)
              })}
              placeholder="50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Área total das paredes (ambos os lados)
            </p>
          </div>

          {/* Wall Height */}
          <div>
            <Label htmlFor="wallHeight">Altura da Parede (m) *</Label>
            <Input
              id="wallHeight"
              type="number"
              step="0.1"
              value={input.wallHeight}
              onChange={(e) => setInput({
                ...input,
                wallHeight: Number(e.target.value)
              })}
              placeholder="2.8"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Altura padrão: 2,80m
            </p>
          </div>

          {/* Wall Type */}
          <div>
            <Label>Tipo de Placa *</Label>
            <Select
              value={input.wallType}
              onValueChange={(value: any) => setInput({ ...input, wallType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Padrão - Ambientes secos</SelectItem>
                <SelectItem value="acoustic">Acústica - Isolamento sonoro</SelectItem>
                <SelectItem value="moisture_resistant">Resistente à Umidade (RU)</SelectItem>
                <SelectItem value="fire_resistant">Resistente ao Fogo (RF)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Finish Type */}
          <div>
            <Label>Nível de Acabamento *</Label>
            <Select
              value={input.finishType}
              onValueChange={(value: any) => setInput({ ...input, finishType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="level_3">Nível 3 - Texturizado</SelectItem>
                <SelectItem value="level_4">Nível 4 - Tinta fosca</SelectItem>
                <SelectItem value="level_5">Nível 5 - Tinta brilhante</SelectItem>
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

          {/* Complexity */}
          <div>
            <Label>Complexidade da Instalação *</Label>
            <Select
              value={input.complexity}
              onValueChange={(value: any) => setInput({ ...input, complexity: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa - Paredes retas simples</SelectItem>
                <SelectItem value="medium">Média - Com algumas aberturas</SelectItem>
                <SelectItem value="high">Alta - Curvas e detalhes especiais</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Urgency */}
          <div>
            <Label>Prazo de Instalação *</Label>
            <Select
              value={input.urgency}
              onValueChange={(value: any) => setInput({ ...input, urgency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal (10-15 dias)</SelectItem>
                <SelectItem value="express">Expresso (5-7 dias)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Optional Features */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Serviços Adicionais</Label>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="insulation"
              checked={input.insulationRequired}
              onCheckedChange={(checked) => setInput({
                ...input,
                insulationRequired: checked as boolean
              })}
            />
            <Label htmlFor="insulation" className="text-sm">
              Isolamento térmico/acústico (lã de vidro)
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="electrical"
              checked={input.electricalInstallation}
              onCheckedChange={(checked) => setInput({
                ...input,
                electricalInstallation: checked as boolean
              })}
            />
            <Label htmlFor="electrical" className="text-sm">
              Instalação elétrica incluída (tomadas e interruptores)
            </Label>
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Layers className="h-8 w-8 text-gray-600 mr-3" />
                <div>
                  <p className="font-semibold text-gray-800">Rapidez</p>
                  <p className="text-sm text-gray-700">Instalação até 5x mais rápida</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Square className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="font-semibold text-blue-800">Limpeza</p>
                  <p className="text-sm text-blue-700">Obra limpa e organizada</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calculator className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="font-semibold text-green-800">Economia</p>
                  <p className="text-sm text-green-700">Menos desperdício</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={handleCalculate} className="w-full">
          <Calculator className="mr-2 h-4 w-4" />
          Calcular Drywall
        </Button>
      </CardContent>
    </Card>
  );
}