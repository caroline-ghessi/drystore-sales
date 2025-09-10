import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calculator, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { AcousticMineralCeilingInput, RoomFormat, RoomNeed, AcousticMineralCeilingModel, CeilingModulation, EdgeType } from '../../types/calculation.types';
import { CEILING_MODELS } from '../../utils/calculations/acousticMineralCeilingCalculations';

interface AcousticMineralCeilingCalculatorProps {
  onCalculate: (input: AcousticMineralCeilingInput) => void;
}

export function AcousticMineralCeilingCalculator({ onCalculate }: AcousticMineralCeilingCalculatorProps) {
  const [input, setInput] = useState<AcousticMineralCeilingInput>({
    region: 'southeast',
    roomLength: 0,
    roomWidth: 0,
    roomPerimeter: undefined,
    roomFormat: 'rectangular',
    ceilingHeight: 2.6,
    availableSpace: 20,
    obstacles: {
      columns: 0,
      beams: false,
      ducts: false,
      pipes: false
    },
    primaryNeed: 'acoustic',
    installations: {
      lightFixtures: 0,
      airConditioning: false,
      sprinklers: false,
      smokeDetectors: false,
      cameras: false
    },
    slabType: 'massive',
    edgeType: 'lay_in',
    cutoutArea: 0
  });

  const [selectedModel, setSelectedModel] = useState<AcousticMineralCeilingModel | ''>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (field: keyof AcousticMineralCeilingInput, value: any) => {
    setInput(prev => ({ ...prev, [field]: value }));
  };

  const handleObstacleChange = (field: keyof typeof input.obstacles, value: any) => {
    setInput(prev => ({
      ...prev,
      obstacles: { ...prev.obstacles, [field]: value }
    }));
  };

  const handleInstallationChange = (field: keyof typeof input.installations, value: any) => {
    setInput(prev => ({
      ...prev,
      installations: { ...prev.installations, [field]: value }
    }));
  };

  const handleCalculate = () => {
    const calculationInput: AcousticMineralCeilingInput = {
      ...input,
      manualModel: selectedModel || undefined
    };
    onCalculate(calculationInput);
  };

  const isValid = input.roomLength > 0 && input.roomWidth > 0 && input.ceilingHeight > 0;
  const totalArea = input.roomLength * input.roomWidth;
  
  // Calcular perímetro automaticamente para ambientes retangulares
  const calculatedPerimeter = input.roomFormat === 'rectangular' 
    ? 2 * (input.roomLength + input.roomWidth)
    : input.roomPerimeter || 0;
  
  // Validar se perímetro é obrigatório para formatos não retangulares
  const perimeterRequired = input.roomFormat !== 'rectangular' && !input.roomPerimeter;
  const isFormValid = isValid && !perimeterRequired;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Forros Minerais Acústicos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Dimensões Básicas */}
          <div className="grid gap-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">1. DIMENSÕES DO AMBIENTE</Badge>
              {totalArea > 0 && (
                <span className="text-sm text-muted-foreground">
                  Área total: {totalArea.toFixed(1)}m²
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="roomLength">Comprimento (m) *</Label>
                <Input
                  id="roomLength"
                  type="number"
                  step="0.1"
                  min="0"
                  value={input.roomLength || ''}
                  onChange={(e) => handleInputChange('roomLength', parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 12.0"
                />
              </div>
              <div>
                <Label htmlFor="roomWidth">Largura (m) *</Label>
                <Input
                  id="roomWidth"
                  type="number"
                  step="0.1"
                  min="0"
                  value={input.roomWidth || ''}
                  onChange={(e) => handleInputChange('roomWidth', parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 8.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="roomPerimeter">
                  Perímetro do Forro (m) {input.roomFormat !== 'rectangular' ? '*' : ''}
                </Label>
                <Input
                  id="roomPerimeter"
                  type="number"
                  step="0.1"
                  min="0"
                  value={input.roomFormat === 'rectangular' ? calculatedPerimeter.toFixed(1) : (input.roomPerimeter || '')}
                  onChange={(e) => handleInputChange('roomPerimeter', parseFloat(e.target.value) || 0)}
                  placeholder={input.roomFormat === 'rectangular' ? 'Calculado automaticamente' : 'Ex: 45.5'}
                  disabled={input.roomFormat === 'rectangular'}
                />
                {input.roomFormat === 'rectangular' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculado automaticamente: 2 × (comprimento + largura)
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="cutoutArea">Área de Recortes/Aberturas (m²)</Label>
                <Input
                  id="cutoutArea"
                  type="number"
                  step="0.1"
                  min="0"
                  value={input.cutoutArea || ''}
                  onChange={(e) => handleInputChange('cutoutArea', parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 2.5 (portas, janelas, etc.)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Além das luminárias embutidas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="roomFormat">Formato do Ambiente</Label>
                <Select 
                  value={input.roomFormat} 
                  onValueChange={(value: RoomFormat) => handleInputChange('roomFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rectangular">Retangular Simples</SelectItem>
                    <SelectItem value="l_shape">Formato em "L"</SelectItem>
                    <SelectItem value="irregular">Formato Irregular</SelectItem>
                    <SelectItem value="multiple_rooms">Múltiplos Ambientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="region">Região</Label>
                <Select 
                  value={input.region} 
                  onValueChange={(value) => handleInputChange('region', value)}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ceilingHeight">Altura Desejada do Forro (m)</Label>
                <Input
                  id="ceilingHeight"
                  type="number"
                  step="0.1"
                  min="2"
                  max="5"
                  value={input.ceilingHeight}
                  onChange={(e) => handleInputChange('ceilingHeight', parseFloat(e.target.value) || 2.6)}
                />
              </div>
              <div>
                <Label htmlFor="availableSpace">Espaço Disponível Acima (cm)</Label>
                <Input
                  id="availableSpace"
                  type="number"
                  min="15"
                  value={input.availableSpace}
                  onChange={(e) => handleInputChange('availableSpace', parseInt(e.target.value) || 20)}
                />
                {input.availableSpace < 15 && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Mínimo 15cm necessário
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tipo de Borda */}
          <div className="grid gap-4">
            <Badge variant="outline">2. TIPO DE BORDA</Badge>
            
            <div>
              <Label>Tipo de Borda das Placas</Label>
              <Select 
                value={input.edgeType} 
                onValueChange={(value: EdgeType) => handleInputChange('edgeType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lay_in">Lay-in (Reta) - Mais simples</SelectItem>
                  <SelectItem value="tegular">Tegular (Rebaixada) - Premium</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {input.edgeType === 'lay_in' 
                  ? 'Borda reta, assentamento simples sobre perfis'
                  : 'Borda rebaixada, encaixe sofisticado, efeito visual superior'
                }
              </p>
            </div>
          </div>

          {/* Necessidade Principal */}
          <div className="grid gap-4">
            <Badge variant="outline">3. NECESSIDADE PRINCIPAL</Badge>
            
            <div>
              <Label>Qual a necessidade principal?</Label>
              <Select 
                value={input.primaryNeed} 
                onValueChange={(value: RoomNeed) => handleInputChange('primaryNeed', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acoustic">Isolamento Acústico</SelectItem>
                  <SelectItem value="humidity">Resistência à Umidade</SelectItem>
                  <SelectItem value="premium">Estética Premium</SelectItem>
                  <SelectItem value="economy">Economia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {input.primaryNeed === 'acoustic' && (
              <div>
                <Label htmlFor="nrcRequired">NRC Requerido (0.0 - 1.0)</Label>
                <Input
                  id="nrcRequired"
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={input.nrcRequired || ''}
                  onChange={(e) => handleInputChange('nrcRequired', parseFloat(e.target.value))}
                  placeholder="Ex: 0.70 para escritórios"
                />
              </div>
            )}

            {input.primaryNeed === 'humidity' && (
              <div>
                <Label htmlFor="humidityLevel">Nível de Umidade (%)</Label>
                <Input
                  id="humidityLevel"
                  type="number"
                  min="0"
                  max="100"
                  value={input.humidityLevel || ''}
                  onChange={(e) => handleInputChange('humidityLevel', parseInt(e.target.value))}
                  placeholder="Ex: 85 para banheiros"
                />
              </div>
            )}
          </div>

          {/* Obstáculos */}
          <div className="grid gap-4">
            <Badge variant="outline">4. OBSTÁCULOS NO AMBIENTE</Badge>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="columns">Número de Colunas</Label>
                <Input
                  id="columns"
                  type="number"
                  min="0"
                  value={input.obstacles.columns}
                  onChange={(e) => handleObstacleChange('columns', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Outros Obstáculos</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <Checkbox 
                      checked={input.obstacles.beams}
                      onCheckedChange={(checked) => handleObstacleChange('beams', checked)}
                    />
                    <span className="text-sm">Vigas aparentes</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox 
                      checked={input.obstacles.ducts}
                      onCheckedChange={(checked) => handleObstacleChange('ducts', checked)}
                    />
                    <span className="text-sm">Dutos de ar-condicionado</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox 
                      checked={input.obstacles.pipes}
                      onCheckedChange={(checked) => handleObstacleChange('pipes', checked)}
                    />
                    <span className="text-sm">Tubulações existentes</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Instalações */}
          <div className="grid gap-4">
            <Badge variant="outline">5. INSTALAÇÕES INTEGRADAS</Badge>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lightFixtures">Luminárias Embutidas</Label>
                <Input
                  id="lightFixtures"
                  type="number"
                  min="0"
                  value={input.installations.lightFixtures}
                  onChange={(e) => handleInstallationChange('lightFixtures', parseInt(e.target.value) || 0)}
                  placeholder="Quantidade de luminárias"
                />
              </div>
              <div className="space-y-2">
                <Label>Outros Equipamentos</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <Checkbox 
                      checked={input.installations.airConditioning}
                      onCheckedChange={(checked) => handleInstallationChange('airConditioning', checked)}
                    />
                    <span className="text-sm">Ar-condicionado central</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox 
                      checked={input.installations.sprinklers}
                      onCheckedChange={(checked) => handleInstallationChange('sprinklers', checked)}
                    />
                    <span className="text-sm">Sprinklers</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox 
                      checked={input.installations.smokeDetectors}
                      onCheckedChange={(checked) => handleInstallationChange('smokeDetectors', checked)}
                    />
                    <span className="text-sm">Detectores de fumaça</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Seleção Manual (Avançado) */}
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">6. CONFIGURAÇÕES AVANÇADAS (OPCIONAL)</Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Ocultar' : 'Mostrar'} Avançado
              </Button>
            </div>

            {showAdvanced && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="manualModel">Modelo Específico</Label>
                  <Select 
                    value={selectedModel} 
                    onValueChange={(value: AcousticMineralCeilingModel | '') => setSelectedModel(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleção automática baseada na necessidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CEILING_MODELS).map(([key, model]) => (
                        <SelectItem key={key} value={key}>
                          {key} - {model.manufacturer} (NRC: {model.nrc})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedModel && (
                    <div className="mt-2 p-2 bg-background rounded border">
                      <p className="text-sm">
                        <strong>{selectedModel}</strong> - {CEILING_MODELS[selectedModel as AcousticMineralCeilingModel].manufacturer}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        NRC: {CEILING_MODELS[selectedModel as AcousticMineralCeilingModel].nrc} | 
                        RH: {CEILING_MODELS[selectedModel as AcousticMineralCeilingModel].rh}% | 
                        {CEILING_MODELS[selectedModel as AcousticMineralCeilingModel].weight} kg/m²
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="slabType">Tipo de Laje</Label>
                  <Select 
                    value={input.slabType} 
                    onValueChange={(value) => handleInputChange('slabType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="massive">Laje Maciça</SelectItem>
                      <SelectItem value="ribbed">Laje Nervurada</SelectItem>
                      <SelectItem value="steel_deck">Steel Deck</SelectItem>
                      <SelectItem value="metallic">Estrutura Metálica</SelectItem>
                      <SelectItem value="wood">Madeira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Botão Calcular */}
          <div className="flex gap-2">
            <Button 
              onClick={handleCalculate} 
              disabled={!isFormValid}
              className="flex-1"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calcular Quantitativos
            </Button>
            {isFormValid && (
              <Badge variant="secondary" className="px-3">
                <CheckCircle className="h-3 w-3 mr-1" />
                Pronto
              </Badge>
            )}
          </div>

          {!isFormValid && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                {perimeterRequired 
                  ? 'Preencha o perímetro para ambientes não retangulares'
                  : 'Preencha as dimensões básicas para continuar'
                }
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}