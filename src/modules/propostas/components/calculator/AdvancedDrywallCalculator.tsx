import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Layers, Info, Wrench } from 'lucide-react';
import { DrywallCalculationInput } from '../../types/calculation.types';

interface AdvancedDrywallCalculatorProps {
  onCalculate: (input: DrywallCalculationInput) => void;
}

export function AdvancedDrywallCalculator({ onCalculate }: AdvancedDrywallCalculatorProps) {
  const [input, setInput] = useState<DrywallCalculationInput>({
    area: 0,
    quantity: 1,
    region: 'southeast',
    wallArea: 10,
    wallHeight: 2.8,
    configMode: 'predefined',
    preDefinedConfig: 'divisoria_escritorio',
    wallConfiguration: 'W111',
    face1Type: 'knauf_st',
    face2Type: 'knauf_st',
    profileType: 'M70',
    finishType: 'level_4',
    openings: {
      doors: 0,
      windows: 0
    },
    features: {
      insulation: false,
      acousticBand: false,
      electricalRuns: false
    },
    laborIncluded: {
      structure: true,
      installation: true,
      finishing: true,
      insulation: false
    }
  });

  const configurations = {
    W111: {
      name: 'W111 - Parede Simples',
      description: '1 placa cada lado - Divisórias comuns',
      thickness: '73-115mm'
    },
    W112: {
      name: 'W112 - Parede Dupla',
      description: '2 placas cada lado - Isolamento acústico',
      thickness: '98-140mm'
    },
    W115: {
      name: 'W115 - Parede Reforçada', 
      description: '1 placa + OSB cada lado - Cargas pesadas',
      thickness: '85-127mm'
    },
    mixed: {
      name: 'Configuração Mista',
      description: 'Diferentes faces - Acabamentos especiais',
      thickness: 'Variável'
    }
  };

  const plateTypes = {
    knauf_st: { name: 'Knauf ST (Branca)', use: 'Áreas secas' },
    knauf_ru: { name: 'Knauf RU (Verde)', use: 'Áreas úmidas' },
    knauf_rf: { name: 'Knauf RF (Rosa)', use: 'Proteção ao fogo' },
    placo_performa: { name: 'Placo Performa (Amarela)', use: 'Alta performance - 50kg' },
    placo_performa_ru: { name: 'Placo Performa RU', use: 'Performance + umidade' }
  };

  const profileTypes = {
    M48: { name: 'M48 - 48mm', use: 'Paredes simples' },
    M70: { name: 'M70 - 70mm', use: 'Paredes médias' },
    M90: { name: 'M90 - 90mm', use: 'Paredes reforçadas' }
  };

  const handleCalculate = () => {
    onCalculate(input);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Layers className="mr-2 h-5 w-5" />
          Calculadora Avançada Drywall
        </CardTitle>
        <CardDescription>
          Sistema profissional seguindo normas técnicas Knauf/Placo + Ananda Metais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="configuration">Configuração</TabsTrigger>
            <TabsTrigger value="materials">Materiais</TabsTrigger>
            <TabsTrigger value="labor">Mão de Obra</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="wallArea">Área Total da Parede (m²) *</Label>
                <Input
                  id="wallArea"
                  type="number"
                  value={input.wallArea}
                  onChange={(e) => setInput({ ...input, wallArea: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Área bruta - aberturas serão descontadas automaticamente
                </p>
              </div>

              <div>
                <Label htmlFor="wallHeight">Altura (Pé-direito) *</Label>
                <Input
                  id="wallHeight"
                  type="number"
                  step="0.1"
                  value={input.wallHeight}
                  onChange={(e) => setInput({ ...input, wallHeight: Number(e.target.value) })}
                />
              </div>

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
                    <SelectItem value="north">Norte (+25%)</SelectItem>
                    <SelectItem value="northeast">Nordeste (+15%)</SelectItem>
                    <SelectItem value="center_west">Centro-Oeste (+10%)</SelectItem>
                    <SelectItem value="southeast">Sudeste (Base)</SelectItem>
                    <SelectItem value="south">Sul (+8%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Aberturas */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Aberturas</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="doors">Número de Portas</Label>
                  <Input
                    id="doors"
                    type="number"
                    min="0"
                    value={input.openings.doors}
                    onChange={(e) => setInput({ 
                      ...input, 
                      openings: { ...input.openings, doors: Number(e.target.value) }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">Padrão: 0,80m × 2,10m</p>
                </div>
                <div>
                  <Label htmlFor="windows">Número de Janelas</Label>
                  <Input
                    id="windows"
                    type="number"
                    min="0"
                    value={input.openings.windows}
                    onChange={(e) => setInput({ 
                      ...input, 
                      openings: { ...input.openings, windows: Number(e.target.value) }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">Padrão: 1,20m × 1,00m</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Tipo de Parede</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {Object.entries(configurations).map(([key, config]) => (
                  <Card 
                    key={key}
                    className={`cursor-pointer transition-colors ${
                      input.wallConfiguration === key ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setInput({ ...input, wallConfiguration: key as any })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{config.name}</h4>
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                          <Badge variant="outline" className="mt-1">{config.thickness}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Tipo de Placa</Label>
                <Select
                  value={input.plateType}
                  onValueChange={(value: any) => setInput({ ...input, plateType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(plateTypes).map(([key, plate]) => (
                      <SelectItem key={key} value={key}>
                        {plate.name} - {plate.use}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Perfil Estrutural</Label>
                <Select
                  value={input.profileType}
                  onValueChange={(value: any) => setInput({ ...input, profileType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(profileTypes).map(([key, profile]) => (
                      <SelectItem key={key} value={key}>
                        {profile.name} - {profile.use}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Nível de Acabamento</Label>
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

              {/* Features */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Opcionais</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="insulation"
                    checked={input.features.insulation}
                    onCheckedChange={(checked) => setInput({
                      ...input,
                      features: { ...input.features, insulation: checked as boolean }
                    })}
                  />
                  <Label htmlFor="insulation">Isolamento térmico/acústico</Label>
                </div>

                {input.features.insulation && (
                  <div className="ml-6">
                    <Label>Tipo de Isolamento</Label>
                    <Select
                      value={input.features.insulationType || 'la_vidro_50'}
                      onValueChange={(value: any) => setInput({
                        ...input,
                        features: { ...input.features, insulationType: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="la_vidro_50">Lã de Vidro 50mm</SelectItem>
                        <SelectItem value="la_vidro_100">Lã de Vidro 100mm</SelectItem>
                        <SelectItem value="la_rocha_50">Lã de Rocha 50mm</SelectItem>
                        <SelectItem value="la_rocha_100">Lã de Rocha 100mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acousticBand"
                    checked={input.features.acousticBand}
                    onCheckedChange={(checked) => setInput({
                      ...input,
                      features: { ...input.features, acousticBand: checked as boolean }
                    })}
                  />
                  <Label htmlFor="acousticBand">Banda acústica nas guias</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="electrical"
                    checked={input.features.electricalRuns}
                    onCheckedChange={(checked) => setInput({
                      ...input,
                      features: { ...input.features, electricalRuns: checked as boolean }
                    })}
                  />
                  <Label htmlFor="electrical">Instalação elétrica incluída</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="labor" className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Serviços Incluídos</Label>
              <div className="space-y-3 mt-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="laborStructure"
                    checked={input.laborIncluded.structure}
                    onCheckedChange={(checked) => setInput({
                      ...input,
                      laborIncluded: { ...input.laborIncluded, structure: checked as boolean }
                    })}
                  />
                  <Label htmlFor="laborStructure">Montagem da estrutura (perfis)</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="laborInstallation"
                    checked={input.laborIncluded.installation}
                    onCheckedChange={(checked) => setInput({
                      ...input,
                      laborIncluded: { ...input.laborIncluded, installation: checked as boolean }
                    })}
                  />
                  <Label htmlFor="laborInstallation">Instalação das placas</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="laborFinishing"
                    checked={input.laborIncluded.finishing}
                    onCheckedChange={(checked) => setInput({
                      ...input,
                      laborIncluded: { ...input.laborIncluded, finishing: checked as boolean }
                    })}
                  />
                  <Label htmlFor="laborFinishing">Tratamento de juntas e acabamento</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="laborInsulation"
                    checked={input.laborIncluded.insulation}
                    onCheckedChange={(checked) => setInput({
                      ...input,
                      laborIncluded: { ...input.laborIncluded, insulation: checked as boolean }
                    })}
                  />
                  <Label htmlFor="laborInsulation">Aplicação do isolamento</Label>
                </div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Wrench className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="font-semibold text-blue-800">Produtividade</p>
                      <p className="text-sm text-blue-700">30-50 m²/dia (dupla)</p>
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

              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Info className="h-8 w-8 text-gray-600 mr-3" />
                    <div>
                      <p className="font-semibold text-gray-800">Qualidade</p>
                      <p className="text-sm text-gray-700">Normas técnicas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Button onClick={handleCalculate} className="w-full mt-6" size="lg">
          <Calculator className="mr-2 h-4 w-4" />
          Calcular Sistema Drywall
        </Button>
      </CardContent>
    </Card>
  );
}