import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calculator, Home, Shield } from 'lucide-react';
import { ShingleCalculationInput } from '../../types/calculation.types';

interface ShingleCalculatorProps {
  onCalculate: (input: ShingleCalculationInput) => void;
}

export function ShingleCalculator({ onCalculate }: ShingleCalculatorProps) {
  const [input, setInput] = useState<ShingleCalculationInput>({
    roofArea: 100,
    roofSlope: 25,
    roofComplexity: 'medium',
    shingleType: 'oakridge',
    perimeter: 40,
    ridgeLength: 10,
    espigaoLength: 0,
    valleyLength: 0,
    stepFlashingLength: 0,
    stepFlashingHeight: 0,
    ventilationRequired: false,
    rufosIncluded: false,
    rufosPerimeter: 0,
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
          <Home className="mr-2 h-5 w-5 text-blue-500" />
          Calculadora Telha Shingle
        </CardTitle>
        <CardDescription>
          Configure os parâmetros para calcular o telhado shingle ideal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
                onChange={(e) => setInput({
                  ...input,
                  roofArea: Number(e.target.value)
                })}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Área total a ser coberta
              </p>
            </div>

            {/* Roof Slope */}
            <div>
              <Label htmlFor="roofSlope">Inclinação do Telhado (%) *</Label>
              <Input
                id="roofSlope"
                type="number"
                value={input.roofSlope}
                onChange={(e) => setInput({
                  ...input,
                  roofSlope: Number(e.target.value)
                })}
                placeholder="25"
                min="17"
                max="80"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo 17% (10°). Exemplo: 25% = padrão, 45%+ = íngreme
              </p>
            </div>

            {/* Shingle Type */}
            <div>
              <Label>Tipo de Telha Shingle *</Label>
              <Select
                value={input.shingleType}
                onValueChange={(value: any) => setInput({ ...input, shingleType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oakridge">Oakridge - 30 anos garantia</SelectItem>
                  <SelectItem value="supreme">Supreme - 25 anos garantia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Roof Complexity */}
            <div>
              <Label>Complexidade do Telhado *</Label>
              <Select
                value={input.roofComplexity}
                onValueChange={(value: any) => setInput({ ...input, roofComplexity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simples - Formato retangular (+10% perdas)</SelectItem>
                  <SelectItem value="medium">Médio - Com algumas águas (+12% perdas)</SelectItem>
                  <SelectItem value="complex">Complexo - Múltiplas águas (+15% perdas)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Underlayment Type */}
            <div className="md:col-span-2">
              <Label>Tipo de Subcobertura *</Label>
              <Select
                value="rhinoroof"
                disabled
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rhinoroof">RhinoRoof - 300g/m² (padrão Drystore)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Subcobertura padrão do sistema shingle
              </p>
            </div>
          </div>
        </div>

        {/* Seção Elementos Lineares */}
        <div>
          <Label className="text-base font-semibold">Elementos Lineares do Telhado</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {/* Ridge Length */}
            <div>
              <Label htmlFor="ridgeLength">Comprimento das Cumeeiras (m) *</Label>
              <Input
                id="ridgeLength"
                type="number"
                value={input.ridgeLength}
                onChange={(e) => setInput({
                  ...input,
                  ridgeLength: Number(e.target.value)
                })}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Metros lineares de cumeeiras (não ventiladas)
              </p>
            </div>

            {/* Espigao Length */}
            <div>
              <Label htmlFor="espigaoLength">Comprimento dos Espigões (m)</Label>
              <Input
                id="espigaoLength"
                type="number"
                value={input.espigaoLength}
                onChange={(e) => setInput({
                  ...input,
                  espigaoLength: Number(e.target.value)
                })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Metros lineares de espigões (sempre Supreme recortada)
              </p>
            </div>

            {/* Valley Length */}
            <div>
              <Label htmlFor="valleyLength">Comprimento das Águas Furtadas (m)</Label>
              <Input
                id="valleyLength"
                type="number"
                value={input.valleyLength}
                onChange={(e) => setInput({
                  ...input,
                  valleyLength: Number(e.target.value)
                })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Metros lineares de encontro entre águas (valleys)
              </p>
            </div>

            {/* Perimeter */}
            <div>
              <Label htmlFor="perimeter">Perímetro dos Beirais (m) *</Label>
              <Input
                id="perimeter"
                type="number"
                value={input.perimeter}
                onChange={(e) => setInput({
                  ...input,
                  perimeter: Number(e.target.value)
                })}
                placeholder="40"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Perímetro total das bordas do telhado
              </p>
            </div>
          </div>
        </div>

        {/* Seção Step Flashing */}
        <div>
          <Label className="text-base font-semibold">Encontros com Paredes</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <Label htmlFor="stepFlashingLength">Comprimento do Encontro (m)</Label>
              <Input
                id="stepFlashingLength"
                type="number"
                value={input.stepFlashingLength}
                onChange={(e) => setInput({
                  ...input,
                  stepFlashingLength: Number(e.target.value)
                })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Metros lineares de encontro telhado-parede
              </p>
            </div>

            <div>
              <Label htmlFor="stepFlashingHeight">Altura da Água no Encontro (m)</Label>
              <Input
                id="stepFlashingHeight"
                type="number"
                step="0.1"
                value={input.stepFlashingHeight}
                onChange={(e) => setInput({
                  ...input,
                  stepFlashingHeight: Number(e.target.value)
                })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Altura da água do telhado no encontro com a parede
              </p>
            </div>
          </div>
        </div>

        {/* Seção Urgência */}
        <div>
          <Label className="text-base font-semibold">Configurações do Pedido</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <Label>Urgência do Pedido *</Label>
              <Select
                value={input.urgency}
                onValueChange={(value: any) => setInput({ ...input, urgency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal (15-20 dias)</SelectItem>
                  <SelectItem value="express">Expresso (7-10 dias) +30%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Optional Features */}
        <div>
          <Label className="text-base font-semibold">Serviços Adicionais</Label>
          <div className="space-y-3 mt-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ventilation"
                checked={input.ventilationRequired}
                onCheckedChange={(checked) => setInput({
                  ...input,
                  ventilationRequired: checked as boolean
                })}
              />
              <Label htmlFor="ventilation" className="text-sm">
                Sistema de ventilação (cumeeiras ventiladas)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="stepflashing"
                checked={input.stepFlashingLength > 0}
                onCheckedChange={(checked) => {
                  if (!checked) {
                    setInput({
                      ...input,
                      stepFlashingLength: 0,
                      stepFlashingHeight: 0
                    });
                  }
                }}
              />
              <Label htmlFor="stepflashing" className="text-sm">
                Step Flashing (encontros com paredes verticais)
              </Label>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rufos"
                  checked={input.rufosIncluded}
                  onCheckedChange={(checked) => setInput({
                    ...input,
                    rufosIncluded: checked as boolean,
                    rufosPerimeter: checked ? input.rufosPerimeter : 0
                  })}
                />
                <Label htmlFor="rufos" className="text-sm">
                  Rufos incluídos (pingadeiras)
                </Label>
              </div>

              {input.rufosIncluded && (
                <div className="ml-6">
                  <Label htmlFor="rufosPerimeter">Perímetro para Rufos (m)</Label>
                  <Input
                    id="rufosPerimeter"
                    type="number"
                    value={input.rufosPerimeter || 0}
                    onChange={(e) => setInput({
                      ...input,
                      rufosPerimeter: Number(e.target.value)
                    })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Perímetro onde serão instalados os rufos
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

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

        <Button onClick={handleCalculate} className="w-full">
          <Calculator className="mr-2 h-4 w-4" />
          Calcular Telhado Shingle
        </Button>
      </CardContent>
    </Card>
  );
}