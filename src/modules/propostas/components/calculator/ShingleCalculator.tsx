import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calculator, Home, Shield, Plus, Trash2, Info } from 'lucide-react';
import { ShingleCalculationInput, RoofSection, RoofComplexity } from '../../types/calculation.types';

interface DrystoreShingleCalculatorProps {
  onCalculate: (input: ShingleCalculationInput) => void;
}

export function DrystoreShingleCalculator({ onCalculate }: DrystoreShingleCalculatorProps) {
  const [input, setInput] = useState<ShingleCalculationInput>({
    // Inicializar com uma água padrão
    roofSections: [
      {
        id: 'agua-1',
        name: 'Água Principal',
        area: 100,
        slope: 30, // 30%
        isProjectedArea: true
      }
    ],
    shingleType: 'oakridge',
    linearElements: {
      ridgeLength: 10,
      hipLength: 0,
      valleyLength: 0,
      stepFlashingLength: 0,
      stepFlashingHeight: 3.0,
      dripEdgePerimeter: 40
    },
    complexity: 'simple',
    ridgeVentilated: false,
    includeDripEdge: false
  });

  const handleCalculate = () => {
    onCalculate(input);
  };

  // Função para adicionar nova água
  const addRoofSection = () => {
    const newId = `agua-${input.roofSections.length + 1}`;
    const newSection: RoofSection = {
      id: newId,
      name: `Água ${input.roofSections.length + 1}`,
      area: 50,
      slope: 30,
      isProjectedArea: true
    };
    
    setInput(prev => ({
      ...prev,
      roofSections: [...prev.roofSections, newSection]
    }));
  };

  // Função para remover água
  const removeRoofSection = (sectionId: string) => {
    if (input.roofSections.length <= 1) return; // Manter pelo menos uma água
    
    setInput(prev => ({
      ...prev,
      roofSections: prev.roofSections.filter(section => section.id !== sectionId)
    }));
  };

  // Função para atualizar água específica
  const updateRoofSection = (sectionId: string, field: keyof RoofSection, value: any) => {
    setInput(prev => ({
      ...prev,
      roofSections: prev.roofSections.map(section =>
        section.id === sectionId ? { ...section, [field]: value } : section
      )
    }));
  };

  // Função para atualizar elementos lineares
  const updateLinearElements = (field: keyof typeof input.linearElements, value: number) => {
    setInput(prev => ({
      ...prev,
      linearElements: {
        ...prev.linearElements,
        [field]: value
      }
    }));
  };

  // Calcular área total projetada para preview
  const totalProjectedArea = input.roofSections.reduce((sum, section) => sum + section.area, 0);
  
  // Calcular área real estimada para preview
  const estimatedRealArea = input.roofSections.reduce((sum, section) => {
    const factor = section.isProjectedArea ? Math.sqrt(1 + Math.pow(section.slope / 100, 2)) : 1.0;
    return sum + (section.area * factor);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Home className="mr-2 h-5 w-5 text-blue-500" />
          Calculadora Telha Shingle Drystore
        </CardTitle>
        <CardDescription>
          Calculadora conforme Manual Técnico Owens Corning/Drystore. Suporte para múltiplas águas e cálculos precisos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="roof-sections" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="roof-sections">Águas do Telhado</TabsTrigger>
            <TabsTrigger value="linear-elements">Elementos Lineares</TabsTrigger>
            <TabsTrigger value="configuration">Configuração</TabsTrigger>
            <TabsTrigger value="summary">Resumo</TabsTrigger>
          </TabsList>

          {/* ABA 1: Águas do Telhado */}
          <TabsContent value="roof-sections" className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Águas do Telhado</Label>
              <Button onClick={addRoofSection} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Água
              </Button>
            </div>

            {input.roofSections.map((section, index) => (
              <Card key={section.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium flex items-center">
                    {section.name}
                    <Badge variant="secondary" className="ml-2">#{index + 1}</Badge>
                  </h4>
                  {input.roofSections.length > 1 && (
                    <Button 
                      onClick={() => removeRoofSection(section.id)}
                      variant="ghost" 
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Nome da água */}
                  <div>
                    <Label>Nome da Água</Label>
                    <Input
                      value={section.name}
                      onChange={(e) => updateRoofSection(section.id, 'name', e.target.value)}
                      placeholder="Ex: Água Principal"
                    />
                  </div>

                  {/* Área */}
                  <div>
                    <Label>Área (m²)</Label>
                    <Input
                      type="number"
                      value={section.area}
                      onChange={(e) => updateRoofSection(section.id, 'area', Number(e.target.value))}
                      placeholder="100"
                    />
                  </div>

                  {/* Inclinação */}
                  <div>
                    <Label>Inclinação (%)</Label>
                    <Input
                      type="number"
                      value={section.slope}
                      onChange={(e) => updateRoofSection(section.id, 'slope', Number(e.target.value))}
                      placeholder="30"
                      min="17"
                      max="80"
                    />
                    {section.slope < 17 && (
                      <p className="text-xs text-red-600 mt-1">
                        Mínimo 17% para telhas shingle
                      </p>
                    )}
                  </div>

                  {/* Tipo de área */}
                  <div>
                    <Label>Tipo de Área</Label>
                    <Select
                      value={section.isProjectedArea ? 'projected' : 'real'}
                      onValueChange={(value) => updateRoofSection(section.id, 'isProjectedArea', value === 'projected')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="projected">Área Projetada</SelectItem>
                        <SelectItem value="real">Área Real (Inclinada)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            ))}

            {/* Informações sobre correção de inclinação */}
            <Card className="bg-blue-50 border-blue-200 p-4">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 mb-1">Correção de Inclinação</p>
                  <p className="text-blue-700">
                    Se você informou área projetada, será aplicado fator de correção automático conforme a inclinação.
                    Fórmula: √(1 + (Inclinação/100)²)
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* ABA 2: Elementos Lineares */}
          <TabsContent value="linear-elements" className="space-y-6">
            <Label className="text-base font-semibold">Elementos Lineares (em metros)</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cumeeira */}
              <div>
                <Label htmlFor="ridgeLength">Cumeeiras (m)</Label>
                <Input
                  id="ridgeLength"
                  type="number"
                  value={input.linearElements.ridgeLength}
                  onChange={(e) => updateLinearElements('ridgeLength', Number(e.target.value))}
                  placeholder="10"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Sempre executada com Supreme recortada (padrão Drystore)
                </p>
              </div>

              {/* Espigões */}
              <div>
                <Label htmlFor="hipLength">Espigões (m)</Label>
                <Input
                  id="hipLength"
                  type="number"
                  value={input.linearElements.hipLength}
                  onChange={(e) => updateLinearElements('hipLength', Number(e.target.value))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Sempre executado com Supreme recortada (padrão Drystore)
                </p>
              </div>

              {/* Águas furtadas */}
              <div>
                <Label htmlFor="valleyLength">Águas Furtadas (m)</Label>
                <Input
                  id="valleyLength"
                  type="number"
                  value={input.linearElements.valleyLength}
                  onChange={(e) => updateLinearElements('valleyLength', Number(e.target.value))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Fita autoadesiva 0,91x10m por rolo
                </p>
              </div>

              {/* Step flashing - comprimento */}
              <div>
                <Label htmlFor="stepFlashingLength">Encontros com Parede - Comprimento (m)</Label>
                <Input
                  id="stepFlashingLength"
                  type="number"
                  value={input.linearElements.stepFlashingLength}
                  onChange={(e) => updateLinearElements('stepFlashingLength', Number(e.target.value))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Perímetro onde telhado encontra paredes
                </p>
              </div>

              {/* Step flashing - altura */}
              <div>
                <Label htmlFor="stepFlashingHeight">Encontros com Parede - Altura (m)</Label>
                <Input
                  id="stepFlashingHeight"
                  type="number"
                  step="0.1"
                  value={input.linearElements.stepFlashingHeight}
                  onChange={(e) => updateLinearElements('stepFlashingHeight', Number(e.target.value))}
                  placeholder="3.0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Altura da água no encontro com a parede
                </p>
              </div>

              {/* Rufos - perímetro */}
              <div>
                <Label htmlFor="dripEdgePerimeter">Perímetro para Rufos (m)</Label>
                <Input
                  id="dripEdgePerimeter"
                  type="number"
                  value={input.linearElements.dripEdgePerimeter || 0}
                  onChange={(e) => updateLinearElements('dripEdgePerimeter', Number(e.target.value))}
                  placeholder="40"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Beirais + empenas (opcional)
                </p>
              </div>
            </div>
          </TabsContent>

          {/* ABA 3: Configuração */}
          <TabsContent value="configuration" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo de telha */}
              <div>
                <Label className="text-base font-semibold">Sistema de Telhas</Label>
                <Select
                  value={input.shingleType}
                  onValueChange={(value: any) => setInput(prev => ({ ...prev, shingleType: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oakridge">Oakridge - 30 anos garantia, 209 km/h vento</SelectItem>
                    <SelectItem value="supreme">Supreme - 25 anos garantia, 100 km/h vento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Complexidade do telhado */}
              <div>
                <Label className="text-base font-semibold">Complexidade do Telhado</Label>
                <Select
                  value={input.complexity}
                  onValueChange={(value: RoofComplexity) => setInput(prev => ({ ...prev, complexity: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simples - 10% perdas</SelectItem>
                    <SelectItem value="complex">Complexo - 15% perdas</SelectItem>
                    <SelectItem value="very_complex">Muito Complexo - 20% perdas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {/* Cumeeira ventilada */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ridgeVentilated"
                  checked={input.ridgeVentilated}
                  onCheckedChange={(checked) => setInput(prev => ({ 
                    ...prev, 
                    ridgeVentilated: !!checked 
                  }))}
                />
                <Label htmlFor="ridgeVentilated" className="text-sm">
                  Cumeeira Ventilada
                </Label>
                <Badge variant="secondary">Padrão: Supreme Recortada</Badge>
              </div>

              {/* Incluir rufos */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDripEdge"
                  checked={input.includeDripEdge}
                  onCheckedChange={(checked) => setInput(prev => ({ 
                    ...prev, 
                    includeDripEdge: !!checked 
                  }))}
                />
                <Label htmlFor="includeDripEdge" className="text-sm">
                  Incluir Rufos (Drip Edge)
                </Label>
                <Badge variant="outline">Opcional</Badge>
              </div>
            </div>

            {/* Informações técnicas */}
            <Card className="bg-green-50 border-green-200 p-4">
              <div className="text-sm">
                <p className="font-medium text-green-800 mb-2">Padrões Drystore</p>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Todas as cumeeiras: Supreme recortada (não ventilada)</li>
                  <li>Todos os espigões: Supreme recortada</li>
                  <li>Subcobertura: RhinoRoof 1,1x87m (86m² úteis)</li>
                  <li>Águas furtadas: Fita autoadesiva 0,91x10m</li>
                  <li>Step flashing: Bobina alumínio (peças 25x18cm)</li>
                  <li>Vedação: Monopol Asfáltico PT 310ML</li>
                </ul>
              </div>
            </Card>
          </TabsContent>

          {/* ABA 4: Resumo */}
          <TabsContent value="summary" className="space-y-6">
            <Label className="text-base font-semibold">Resumo do Projeto</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resumo das águas */}
              <Card className="p-4">
                <h4 className="font-medium mb-3">Águas do Telhado</h4>
                <div className="space-y-2 text-sm">
                  {input.roofSections.map((section, index) => (
                    <div key={section.id} className="flex justify-between">
                      <span>{section.name}:</span>
                      <span>{section.area}m² ({section.slope}%)</span>
                    </div>
                  ))}
                  <hr className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Total Projetado:</span>
                    <span>{totalProjectedArea.toFixed(1)}m²</span>
                  </div>
                  <div className="flex justify-between font-medium text-blue-600">
                    <span>Total Real Est.:</span>
                    <span>{estimatedRealArea.toFixed(1)}m²</span>
                  </div>
                </div>
              </Card>

              {/* Resumo dos elementos */}
              <Card className="p-4">
                <h4 className="font-medium mb-3">Elementos Lineares</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Cumeeiras:</span>
                    <span>{input.linearElements.ridgeLength}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Espigões:</span>
                    <span>{input.linearElements.hipLength}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Águas Furtadas:</span>
                    <span>{input.linearElements.valleyLength}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Step Flashing:</span>
                    <span>{input.linearElements.stepFlashingLength}m</span>
                  </div>
                  {input.includeDripEdge && (
                    <div className="flex justify-between">
                      <span>Rufos:</span>
                      <span>{input.linearElements.dripEdgePerimeter}m</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Configuração escolhida */}
            <Card className="p-4">
              <h4 className="font-medium mb-3">Configuração</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Sistema:</span> {input.shingleType === 'oakridge' ? 'Oakridge' : 'Supreme'}
                </div>
                <div>
                  <span className="font-medium">Complexidade:</span> {
                    input.complexity === 'simple' ? 'Simples (10%)' :
                    input.complexity === 'complex' ? 'Complexo (15%)' : 'Muito Complexo (20%)'
                  }
                </div>
                <div>
                  <span className="font-medium">Cumeeira:</span> {input.ridgeVentilated ? 'Ventilada' : 'Supreme Recortada'}
                </div>
                <div>
                  <span className="font-medium">Rufos:</span> {input.includeDripEdge ? 'Incluído' : 'Não incluído'}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Informational Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="font-semibold text-blue-800">Durabilidade</p>
                  <p className="text-sm text-blue-700">50+ anos vida útil</p>
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
                  <p className="text-sm text-purple-700">25-30 anos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={handleCalculate} className="w-full mt-6">
          <Calculator className="mr-2 h-4 w-4" />
          Calcular Telhado Shingle Drystore
        </Button>
      </CardContent>
    </Card>
  );
}