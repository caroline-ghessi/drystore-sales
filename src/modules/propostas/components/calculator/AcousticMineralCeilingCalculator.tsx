import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calculator, Info, CheckCircle, AlertTriangle, Plus, Minus } from 'lucide-react';
import { AcousticMineralCeilingInput, RoomFormat, RoomNeed, AcousticMineralCeilingModel, CeilingModulation, EdgeType } from '../../types/calculation.types';
import { CEILING_MODELS } from '../../utils/calculations/acousticMineralCeilingCalculations';
import { LaborCostSelector, LaborCostConfig } from '../../components/shared/LaborCostSelector';

interface AcousticMineralCeilingCalculatorProps {
  onCalculate: (input: AcousticMineralCeilingInput) => void;
}

export function AcousticMineralCeilingCalculator({ onCalculate }: AcousticMineralCeilingCalculatorProps) {
  const [input, setInput] = useState<AcousticMineralCeilingInput>({
    roomLength: 0,
    roomWidth: 0,
    roomPerimeter: undefined,
    roomFormat: 'rectangular',
    ceilingHeight: 2.6,
    availableSpace: 20,
    obstacles: {
      columns: 0,
      columnDimensions: [],
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
  const [laborConfig, setLaborConfig] = useState<LaborCostConfig>({
    includeLabor: false
  });

  const handleInputChange = (field: keyof AcousticMineralCeilingInput, value: any) => {
    setInput(prev => ({ ...prev, [field]: value }));
  };

  const handleObstacleChange = (field: keyof typeof input.obstacles, value: any) => {
    setInput(prev => ({
      ...prev,
      obstacles: { ...prev.obstacles, [field]: value }
    }));
  };

  const handleColumnsChange = (count: number) => {
    const newDimensions = Array.from({ length: count }, (_, index) => 
      input.obstacles.columnDimensions?.[index] || { type: 'rectangular' as const, width: 0.4, depth: 0.4 }
    );
    
    setInput(prev => ({
      ...prev,
      obstacles: {
        ...prev.obstacles,
        columns: count,
        columnDimensions: newDimensions
      }
    }));
  };

  const handleColumnDimensionChange = (index: number, field: 'width' | 'depth' | 'diameter', value: number) => {
    setInput(prev => ({
      ...prev,
      obstacles: {
        ...prev.obstacles,
        columnDimensions: prev.obstacles.columnDimensions?.map((col, i) => 
          i === index ? { ...col, [field]: value } : col
        ) || []
      }
    }));
  };

  const handleColumnTypeChange = (index: number, type: 'rectangular' | 'circular') => {
    setInput(prev => ({
      ...prev,
      obstacles: {
        ...prev.obstacles,
        columnDimensions: prev.obstacles.columnDimensions?.map((col, i) => 
          i === index 
            ? { type, ...(type === 'rectangular' ? { width: 0.4, depth: 0.4 } : { diameter: 0.4 }) }
            : col
        ) || []
      }
    }));
  };

  const applyDimensionsToAll = () => {
    if (!input.obstacles.columnDimensions?.[0]) return;
    
    const firstDimension = input.obstacles.columnDimensions[0];
    setInput(prev => ({
      ...prev,
      obstacles: {
        ...prev.obstacles,
        columnDimensions: Array(input.obstacles.columns).fill(null).map(() => ({ ...firstDimension }))
      }
    }));
  };

  const handleInstallationChange = (field: keyof typeof input.installations, value: any) => {
    setInput(prev => ({
      ...prev,
      installations: { ...prev.installations, [field]: value }
    }));
  };

  const handleCalculate = () => {
    const usefulArea = totalArea - totalObstacleArea - (input.cutoutArea || 0);
    const calculationInput: AcousticMineralCeilingInput = {
      ...input,
      manualModel: selectedModel || undefined,
      laborConfig: laborConfig
    };
    onCalculate(calculationInput);
  };

  const isValid = input.roomLength > 0 && input.roomWidth > 0 && input.ceilingHeight > 0;
  const totalArea = input.roomLength * input.roomWidth;
  
  // Calcular área total de obstáculos (colunas)
  const totalObstacleArea = input.obstacles.columnDimensions?.reduce((total, col) => {
    if (col.type === 'circular') {
      const radius = (col.diameter || 0) / 2;
      return total + (Math.PI * radius * radius);
    } else {
      return total + ((col.width || 0) * (col.depth || 0));
    }
  }, 0) || 0;

  // Calcular perímetro total das colunas para perfis de acabamento
  const totalColumnPerimeter = input.obstacles.columnDimensions?.reduce((total, col) => {
    if (col.type === 'circular') {
      return total + (Math.PI * (col.diameter || 0));
    } else {
      return total + (2 * ((col.width || 0) + (col.depth || 0)));
    }
  }, 0) || 0;
  
  const usefulArea = totalArea - totalObstacleArea - (input.cutoutArea || 0);
  
  // Calcular perímetro automaticamente para ambientes retangulares
  const calculatedPerimeter = input.roomFormat === 'rectangular' 
    ? 2 * (input.roomLength + input.roomWidth)
    : input.roomPerimeter || 0;
  
  // Validar se perímetro é obrigatório para formatos não retangulares
  const perimeterRequired = input.roomFormat !== 'rectangular' && !input.roomPerimeter;
  
  // Validar se todas as colunas têm dimensões preenchidas
  const columnsValid = input.obstacles.columns === 0 || 
    (input.obstacles.columnDimensions?.length === input.obstacles.columns &&
     input.obstacles.columnDimensions.every(col => 
       col.type === 'circular' 
         ? (col.diameter && col.diameter > 0)
         : (col.width && col.width > 0 && col.depth && col.depth > 0)
     ));
  
  const isFormValid = isValid && !perimeterRequired && columnsValid && usefulArea >= 0;

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
            <div className="flex items-center justify-between">
              <Badge variant="outline">4. OBSTÁCULOS NO AMBIENTE</Badge>
                 {totalColumnPerimeter > 0 && (
                   <Badge variant="secondary" className="text-xs">
                     Perímetro total colunas: {totalColumnPerimeter.toFixed(2)}m
                   </Badge>
                 )}
            </div>
            
            <div className="grid gap-4">
              <div>
                <Label htmlFor="columns">Número de Colunas</Label>
                <Input
                  id="columns"
                  type="number"
                  min="0"
                  max="20"
                  value={input.obstacles.columns}
                  onChange={(e) => handleColumnsChange(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Conforme manual técnico, é necessário informar as dimensões de cada coluna
                </p>
              </div>

              {/* Dimensões das Colunas */}
              {input.obstacles.columns > 0 && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Dimensões das Colunas</Label>
                    {input.obstacles.columns > 1 && input.obstacles.columnDimensions?.[0] && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={applyDimensionsToAll}
                        className="text-xs"
                      >
                        Aplicar a todas
                      </Button>
                    )}
                  </div>
                  
                   <div className="grid gap-3">
                     {Array.from({ length: input.obstacles.columns }, (_, index) => (
                       <div key={index} className="space-y-3 p-3 border rounded-lg">
                         <div className="flex items-center justify-between">
                           <Label className="text-sm font-medium">Coluna {index + 1}</Label>
                           <Select
                             value={input.obstacles.columnDimensions?.[index]?.type || 'rectangular'}
                             onValueChange={(value: 'rectangular' | 'circular') => handleColumnTypeChange(index, value)}
                           >
                             <SelectTrigger className="w-28 h-7 text-xs">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="rectangular">Retangular</SelectItem>
                               <SelectItem value="circular">Cilíndrica</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                         
                         {input.obstacles.columnDimensions?.[index]?.type === 'circular' ? (
                           <div>
                             <Label className="text-xs">Diâmetro (m)</Label>
                             <Input
                               type="number"
                               step="0.1"
                               min="0.1"
                               max="5"
                               value={input.obstacles.columnDimensions?.[index]?.diameter || ''}
                               onChange={(e) => handleColumnDimensionChange(index, 'diameter', parseFloat(e.target.value) || 0)}
                               placeholder="0.4"
                               className="h-8"
                             />
                           </div>
                         ) : (
                           <div className="grid grid-cols-2 gap-2">
                             <div>
                               <Label className="text-xs">Largura (m)</Label>
                               <Input
                                 type="number"
                                 step="0.1"
                                 min="0.1"
                                 max="5"
                                 value={input.obstacles.columnDimensions?.[index]?.width || ''}
                                 onChange={(e) => handleColumnDimensionChange(index, 'width', parseFloat(e.target.value) || 0)}
                                 placeholder="0.4"
                                 className="h-8"
                               />
                             </div>
                             <div>
                               <Label className="text-xs">Profundidade (m)</Label>
                               <Input
                                 type="number"
                                 step="0.1"
                                 min="0.1"
                                 max="5"
                                 value={input.obstacles.columnDimensions?.[index]?.depth || ''}
                                 onChange={(e) => handleColumnDimensionChange(index, 'depth', parseFloat(e.target.value) || 0)}
                                 placeholder="0.4"
                                 className="h-8"
                               />
                             </div>
                           </div>
                         )}
                         
                         <div className="text-xs text-muted-foreground">
                           Área: {input.obstacles.columnDimensions?.[index]?.type === 'circular' 
                             ? (Math.PI * Math.pow((input.obstacles.columnDimensions[index]?.diameter || 0) / 2, 2)).toFixed(2)
                             : ((input.obstacles.columnDimensions[index]?.width || 0) * (input.obstacles.columnDimensions[index]?.depth || 0)).toFixed(2)
                           }m² | 
                           Perímetro: {input.obstacles.columnDimensions?.[index]?.type === 'circular'
                             ? (Math.PI * (input.obstacles.columnDimensions[index]?.diameter || 0)).toFixed(2)
                             : (2 * ((input.obstacles.columnDimensions[index]?.width || 0) + (input.obstacles.columnDimensions[index]?.depth || 0))).toFixed(2)
                           }m
                         </div>
                       </div>
                     ))}
                   </div>
                  
                  <div className="text-xs text-muted-foreground">
                    💡 Dica: Coluna típica de escritório = 40cm x 40cm (0,16m²)
                  </div>
                </div>
              )}

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

            {/* Preview da Área Útil */}
            {totalArea > 0 && (
              <div className="p-3 bg-background border rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Área Total:</span>
                    <div className="font-medium">{totalArea.toFixed(1)}m²</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Obstáculos:</span>
                    <div className="font-medium text-destructive">-{(totalObstacleArea + (input.cutoutArea || 0)).toFixed(1)}m²</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Área Útil:</span>
                    <div className="font-medium text-primary">{usefulArea.toFixed(1)}m²</div>
                  </div>
                </div>
                
                {usefulArea < 0 && (
                  <div className="mt-2 p-2 bg-destructive/10 text-destructive text-xs rounded flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Área de obstáculos maior que área total do ambiente
                  </div>
                )}
              </div>
            )}
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
          
          {/* 7. MÃO DE OBRA OPCIONAL */}
          <LaborCostSelector
            config={laborConfig}
            onChange={setLaborConfig}
            totalArea={usefulArea}
            productType="acoustic"
          />

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
                  : !columnsValid
                  ? 'Preencha as dimensões de todas as colunas'
                  : usefulArea < 0
                  ? 'Área de obstáculos não pode ser maior que a área total'
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