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
    roofSlope: 25, // Now in percentage instead of degrees
    roofComplexity: 'medium',
    shingleType: 'oakridge',
    perimeter: 40,
    ridgeLength: 10,
    ventilationRequired: false,
    guttersIncluded: false,
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
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              max="50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo 17% (10°). 25% = padrão, 45%+ = íngreme
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

          {/* Ridge Length */}
          <div>
            <Label htmlFor="ridgeLength">Comprimento da Cumeeira (m) *</Label>
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
              Comprimento total das cumeeiras e espigões
            </p>
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
                <SelectItem value="simple">Simples - Formato retangular</SelectItem>
                <SelectItem value="medium">Médio - Com algumas águas</SelectItem>
                <SelectItem value="complex">Complexo - Múltiplas águas e detalhes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Underlayment Type */}
          <div>
            <Label>Tipo de Manta Asfáltica *</Label>
            <Select
              value="rhinoroof"
              disabled
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rhinoroof">RhinoRoof - 300g/m² (padrão)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Manta de subcobertura padrão do sistema
            </p>
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
                <SelectItem value="low">Baixa - Casa térrea, fácil acesso</SelectItem>
                <SelectItem value="medium">Média - Sobrado padrão</SelectItem>
                <SelectItem value="high">Alta - Acesso difícil, altura elevada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Urgency */}
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
                <SelectItem value="express">Expresso (7-10 dias)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Optional Features */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Serviços Adicionais</Label>
          
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
              id="gutters"
              checked={input.guttersIncluded}
              onCheckedChange={(checked) => setInput({
                ...input,
                guttersIncluded: checked as boolean
              })}
            />
            <Label htmlFor="gutters" className="text-sm">
              Calhas e condutores incluídos
            </Label>
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