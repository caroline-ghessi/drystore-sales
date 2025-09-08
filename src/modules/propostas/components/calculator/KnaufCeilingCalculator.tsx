import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calculator, Layers, Square, Settings } from 'lucide-react';
import { KnaufCeilingCalculationInput } from '../../types/calculation.types';

interface KnaufCeilingCalculatorProps {
  onCalculate: (input: KnaufCeilingCalculationInput) => void;
}

export function KnaufCeilingCalculator({ onCalculate }: KnaufCeilingCalculatorProps) {
  const [input, setInput] = useState<KnaufCeilingCalculationInput>({
    ceilingArea: 20,
    perimeter: 18,
    plateType: 'standard',
    plateDimension: '1_20x2_40',
    tabicaType: 'tabica_50x50',
    massType: 'powder',
    fiberType: 'telada',
    includeInsulation: false,
    includeAccessories: false,
    complexity: 'medium',
    region: 'southeast',
    urgency: 'normal',
    accessoryQuantities: {
      trapdoor: 0,
      spotBoxes: 0,
      acDiffusers: 0,
    }
  });

  const handleCalculate = () => {
    onCalculate(input);
  };

  const plateTypeOptions = [
    { value: 'standard', label: 'Standard (ST) - Áreas Secas', color: 'bg-gray-100 text-gray-800' },
    { value: 'ru', label: 'Resistente Umidade (RU) - Verde', color: 'bg-green-100 text-green-800' },
    { value: 'rf', label: 'Resistente Fogo (RF) - Rosa', color: 'bg-pink-100 text-pink-800' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Layers className="mr-2 h-5 w-5 text-primary" />
          Calculadora Forro Knauf/Ananda
        </CardTitle>
        <CardDescription>
          Sistema completo de forro com placas Knauf e perfis Ananda Metais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Dimensões Básicas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Square className="mr-2 h-4 w-4" />
            Dimensões do Forro
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ceilingArea">Área do Forro (m²) *</Label>
              <Input
                id="ceilingArea"
                type="number"
                value={input.ceilingArea}
                onChange={(e) => setInput({
                  ...input,
                  ceilingArea: Number(e.target.value)
                })}
                placeholder="20"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Área total do ambiente
              </p>
            </div>
            
            <div>
              <Label htmlFor="perimeter">Perímetro do Ambiente (m) *</Label>
              <Input
                id="perimeter"
                type="number"
                value={input.perimeter}
                onChange={(e) => setInput({
                  ...input,
                  perimeter: Number(e.target.value)
                })}
                placeholder="18"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Para cálculo da tabica perimetral
              </p>
            </div>
          </div>
        </div>

        {/* Especificações de Material */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Especificações
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Placa */}
            <div>
              <Label>Tipo de Placa Knauf *</Label>
              <Select
                value={input.plateType}
                onValueChange={(value: any) => setInput({ ...input, plateType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plateTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <Badge className={option.color}>{option.value.toUpperCase()}</Badge>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dimensão da Placa */}
            <div>
              <Label>Dimensão da Placa *</Label>
              <Select
                value={input.plateDimension}
                onValueChange={(value: any) => setInput({ ...input, plateDimension: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_20x2_40">1,20 × 2,40m (2,88 m²)</SelectItem>
                  <SelectItem value="1_20x1_80">1,20 × 1,80m (2,16 m²)</SelectItem>
                  <SelectItem value="1_20x2_50">1,20 × 2,50m (3,00 m²)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Acabamento Perimetral */}
            <div>
              <Label>Acabamento Perimetral *</Label>
              <Select
                value={input.tabicaType}
                onValueChange={(value: any) => setInput({ ...input, tabicaType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tabica_40x48">Tabica Lisa 40×48mm</SelectItem>
                  <SelectItem value="tabica_50x50">Tabica Lisa 50×50mm</SelectItem>
                  <SelectItem value="tabica_76x50">Tabica Lisa 76×50mm</SelectItem>
                  <SelectItem value="cantoneira_25x30">Cantoneira 25×30mm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Massa */}
            <div>
              <Label>Massa para Juntas *</Label>
              <Select
                value={input.massType}
                onValueChange={(value: any) => setInput({ ...input, massType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="powder">Em Pó (0,35 kg/m²)</SelectItem>
                  <SelectItem value="ready">Pronta (0,70 kg/m²)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Fita */}
            <div>
              <Label>Fita para Juntas *</Label>
              <Select
                value={input.fiberType}
                onValueChange={(value: any) => setInput({ ...input, fiberType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="telada">Fita Telada 50mm</SelectItem>
                  <SelectItem value="papel">Fita Papel Microperfurado 50mm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Região */}
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

            {/* Complexidade */}
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
                  <SelectItem value="low">Baixa - Ambiente retangular simples</SelectItem>
                  <SelectItem value="medium">Média - Com recortes e detalhes</SelectItem>
                  <SelectItem value="high">Alta - Formas complexas e sancas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Urgência */}
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
        </div>

        {/* Opções Adicionais */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Opções Adicionais</h3>
          
          <div className="space-y-4">
            {/* Isolamento */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="insulation"
                checked={input.includeInsulation}
                onCheckedChange={(checked) => setInput({
                  ...input,
                  includeInsulation: checked as boolean
                })}
              />
              <Label htmlFor="insulation" className="text-sm">
                Incluir isolamento térmico/acústico (lã de vidro ou PET)
              </Label>
            </div>

            {input.includeInsulation && (
              <div className="ml-6">
                <Label>Tipo de Isolamento</Label>
                <Select
                  value={input.insulationType || 'glass_wool'}
                  onValueChange={(value: any) => setInput({ ...input, insulationType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="glass_wool">Lã de Vidro 50mm</SelectItem>
                    <SelectItem value="pet_wool">Lã de PET 50mm (sustentável)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Acessórios */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="accessories"
                checked={input.includeAccessories}
                onCheckedChange={(checked) => setInput({
                  ...input,
                  includeAccessories: checked as boolean
                })}
              />
              <Label htmlFor="accessories" className="text-sm">
                Incluir acessórios especiais (alçapão, spots, difusores)
              </Label>
            </div>

            {input.includeAccessories && (
              <div className="ml-6 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="trapdoor">Alçapões</Label>
                    <Input
                      id="trapdoor"
                      type="number"
                      value={input.accessoryQuantities?.trapdoor || 0}
                      onChange={(e) => setInput({
                        ...input,
                        accessoryQuantities: {
                          ...input.accessoryQuantities,
                          trapdoor: Number(e.target.value)
                        }
                      })}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="spots">Spots</Label>
                    <Input
                      id="spots"
                      type="number"
                      value={input.accessoryQuantities?.spotBoxes || 0}
                      onChange={(e) => setInput({
                        ...input,
                        accessoryQuantities: {
                          ...input.accessoryQuantities,
                          spotBoxes: Number(e.target.value)
                        }
                      })}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="diffusers">Difusores AC</Label>
                    <Input
                      id="diffusers"
                      type="number"
                      value={input.accessoryQuantities?.acDiffusers || 0}
                      onChange={(e) => setInput({
                        ...input,
                        accessoryQuantities: {
                          ...input.accessoryQuantities,
                          acDiffusers: Number(e.target.value)
                        }
                      })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informações do Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Layers className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="font-semibold text-blue-800">Sistema Knauf</p>
                  <p className="text-sm text-blue-700">Placas certificadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Square className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="font-semibold text-green-800">Perfis Ananda</p>
                  <p className="text-sm text-green-700">Aço galvanizado</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calculator className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="font-semibold text-purple-800">Precisão</p>
                  <p className="text-sm text-purple-700">Cálculo técnico</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={handleCalculate} className="w-full" size="lg">
          <Calculator className="mr-2 h-4 w-4" />
          Calcular Forro Knauf
        </Button>
      </CardContent>
    </Card>
  );
}