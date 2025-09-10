import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calculator, Layers, Square, Settings } from 'lucide-react';
import { ForroDrywallCalculationInput } from '../../types/calculation.types';

interface ForroDrywallCalculatorProps {
  onCalculate: (input: ForroDrywallCalculationInput) => void;
}

export function ForroDrywallCalculator({ onCalculate }: ForroDrywallCalculatorProps) {
  const [input, setInput] = useState<ForroDrywallCalculationInput>({
    ceilingArea: 20,
    perimeterLength: 18,
    plateType: 'standard',
    plateThickness: 12.5,
    plateDimensions: '1200x2400',
    perimeterFinishingType: 'L_profile',
    massType: 'PVA',
    fiberType: 'fiberglass',
    
    insulation: {
      enabled: false,
    },
    accessories: {
      lightFixtures: 0,
      airVents: 0,
      accessPanels: 0,
      speakers: 0,
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
          Calculadora Forro Drywall
        </CardTitle>
        <CardDescription>
          Sistema completo de forro drywall com placas e perfis
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
              <Label htmlFor="perimeterLength">Perímetro do Ambiente (m) *</Label>
              <Input
                id="perimeterLength"
                type="number"
                value={input.perimeterLength}
                onChange={(e) => setInput({
                  ...input,
                  perimeterLength: Number(e.target.value)
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
              <Label>Tipo de Placa Drywall *</Label>
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
                value={input.plateDimensions}
                onValueChange={(value: any) => setInput({ ...input, plateDimensions: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1200x2400">1,20 × 2,40m (2,88 m²)</SelectItem>
                  <SelectItem value="1200x1800">1,20 × 1,80m (2,16 m²)</SelectItem>
                  <SelectItem value="1200x3000">1,20 × 3,00m (3,60 m²)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Acabamento Perimetral */}
            <div>
              <Label>Acabamento Perimetral *</Label>
              <Select
                value={input.perimeterFinishingType}
                onValueChange={(value: any) => setInput({ ...input, perimeterFinishingType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L_profile">Perfil L</SelectItem>
                  <SelectItem value="shadow_gap">Shadow Gap</SelectItem>
                  <SelectItem value="decorative_molding">Moldura Decorativa</SelectItem>
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
                  <SelectItem value="PVA">PVA (0,35 kg/m²)</SelectItem>
                  <SelectItem value="acrylic">Acrílica (0,70 kg/m²)</SelectItem>
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
                  <SelectItem value="fiberglass">Fita Fibra de Vidro 50mm</SelectItem>
                  <SelectItem value="paper">Fita Papel Microperfurado 50mm</SelectItem>
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
                checked={input.insulation.enabled}
                onCheckedChange={(checked) => setInput({
                  ...input,
                  insulation: { ...input.insulation, enabled: checked as boolean }
                })}
              />
              <Label htmlFor="insulation" className="text-sm">
                Incluir isolamento térmico/acústico (lã de vidro ou PET)
              </Label>
            </div>

            {input.insulation.enabled && (
              <div className="ml-6">
                <Label>Tipo de Isolamento</Label>
                <Select
                  value={input.insulation.type || 'rockwool'}
                  onValueChange={(value: any) => setInput({ 
                    ...input, 
                    insulation: { ...input.insulation, type: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rockwool">Lã de Rocha 50mm</SelectItem>
                    <SelectItem value="fiberglass">Lã de Vidro 50mm</SelectItem>
                    <SelectItem value="polyurethane">Poliuretano 50mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Acessórios */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="accessories"
                checked={input.accessories.lightFixtures > 0 || input.accessories.airVents > 0}
                onCheckedChange={(checked) => setInput({
                  ...input,
                  accessories: {
                    ...input.accessories,
                    lightFixtures: checked ? 1 : 0,
                    airVents: checked ? 1 : 0
                  }
                })}
              />
              <Label htmlFor="accessories" className="text-sm">
                Incluir acessórios especiais (alçapão, spots, difusores)
              </Label>
            </div>

            {(input.accessories.lightFixtures > 0 || input.accessories.airVents > 0) && (
              <div className="ml-6 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="accessPanels">Alçapões</Label>
                    <Input
                      id="accessPanels"
                      type="number"
                      value={input.accessories.accessPanels || 0}
                      onChange={(e) => setInput({
                        ...input,
                        accessories: {
                          ...input.accessories,
                          accessPanels: Number(e.target.value)
                        }
                      })}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lightFixtures">Spots</Label>
                    <Input
                      id="lightFixtures"
                      type="number"
                      value={input.accessories.lightFixtures || 0}
                      onChange={(e) => setInput({
                        ...input,
                        accessories: {
                          ...input.accessories,
                          lightFixtures: Number(e.target.value)
                        }
                      })}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="airVents">Difusores AC</Label>
                    <Input
                      id="airVents"
                      type="number"
                      value={input.accessories.airVents || 0}
                      onChange={(e) => setInput({
                        ...input,
                        accessories: {
                          ...input.accessories,
                          airVents: Number(e.target.value)
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
                  <p className="font-semibold text-blue-800">Sistema Drywall</p>
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
                  <p className="font-semibold text-green-800">Perfis Metálicos</p>
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
          Calcular Forro Drywall
        </Button>
      </CardContent>
    </Card>
  );
}