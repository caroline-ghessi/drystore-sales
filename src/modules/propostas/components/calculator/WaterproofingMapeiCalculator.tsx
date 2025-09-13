import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { WaterproofingMapeiInput, WaterproofingMapeiResult } from '../../types/calculation.types';
import { calculateWaterproofingMapei } from '../../utils/calculations/waterproofingMapeiCalculations';
import { useUnifiedProducts } from '../../hooks/useUnifiedProducts';

interface WaterproofingMapeiCalculatorProps {
  onCalculationComplete: (result: WaterproofingMapeiResult) => void;
  initialData?: Partial<WaterproofingMapeiInput>;
}

export function WaterproofingMapeiCalculator({ onCalculationComplete, initialData }: WaterproofingMapeiCalculatorProps) {
  const { products, isLoading } = useUnifiedProducts('impermeabilizacao_mapei');

  const [formData, setFormData] = useState<WaterproofingMapeiInput>({
    detailedDimensions: {
      length: 0,
      width: 0,
      ceilingHeight: 2.5,
      boxHeight: 1.8,
      boxWidth: 0.9,
      baseboard_height: 0.3,
      parapetHeight: 0.5,
      averageDepth: 1.5
    },
    applicationEnvironment: 'banheiro_residencial',
    substrateType: 'concreto_novo',
    substrateCondition: 'plano_nivelado',
    surfaceRoughness: 'rugosidade_media',
    applicationMethod: 'desempenadeira',
    climaticConditions: {
      temperature: 'normal',
      humidity: 'normal', 
      wind: 'sem_vento',
      directSun: 'sombra'
    },
    applicatorExperience: 'condicoes_ideais',
    waterExposure: 'area_banho',
    constructiveDetails: {
      commonDrains: 0,
      linearDrains: 0,
      grates: 0,
      passingPipes: 0,
      expansionJoints: 0,
      columns: 0,
      internalCorners: 0,
      externalCorners: 0,
      thresholds: 0,
      gutters: 0
    },
    systemType: 'mapelastic',
    manualProductSelection: false,
    ...initialData
  });

  // Cálculo automático de áreas para preview
  const calculatePreviewAreas = () => {
    const { length, width, boxHeight, baseboard_height, parapetHeight, averageDepth, boxWidth } = formData.detailedDimensions;
    if (!length || !width) return { floor: 0, wall: 0, total: 0 };
    
    const floorArea = length * width;
    let wallArea = 0;
    
    switch (formData.applicationEnvironment) {
      case 'banheiro_residencial':
      case 'banheiro_coletivo':
        const boxPerimeter = (boxWidth || 0.9) * 3;
        const boxWallArea = boxPerimeter * (boxHeight || 1.8);
        const remainingPerimeter = (2 * (length + width)) - (boxWidth || 0.9);
        const baseboardArea = remainingPerimeter * (baseboard_height || 0.3);
        wallArea = boxWallArea + baseboardArea;
        break;
      case 'cozinha_industrial':
        wallArea = (2 * (length + width)) * 1.0;
        break;
      case 'cozinha_residencial':
        wallArea = (2 * (length + width)) * (baseboard_height || 0.3);
        break;
      case 'terraço_descoberto':
      case 'sacada_varanda':
        wallArea = (2 * (length + width)) * (parapetHeight || 0.5);
        break;
      case 'piscina':
        wallArea = (2 * (length + width)) * (averageDepth || 1.5);
        break;
      default:
        wallArea = (2 * (length + width)) * (baseboard_height || 0.3);
    }
    
    return { floor: floorArea, wall: wallArea, total: floorArea + wallArea };
  };

  const previewAreas = calculatePreviewAreas();

  const handleCalculate = () => {
    const result = calculateWaterproofingMapei(formData);
    onCalculationComplete(result);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Impermeabilização MAPEI</CardTitle>
          <CardDescription>
            Calculadora profissional baseada no manual técnico MAPEI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Tipo de Ambiente */}
          <div className="space-y-2">
            <Label>Tipo de Aplicação</Label>
            <Select 
              value={formData.applicationEnvironment} 
              onValueChange={(value: any) => setFormData({...formData, applicationEnvironment: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="banheiro_residencial">Banheiro Residencial</SelectItem>
                <SelectItem value="banheiro_coletivo">Banheiro Coletivo</SelectItem>
                <SelectItem value="cozinha_residencial">Cozinha Residencial</SelectItem>
                <SelectItem value="cozinha_industrial">Cozinha Industrial</SelectItem>
                <SelectItem value="sacada_varanda">Sacada/Varanda</SelectItem>
                <SelectItem value="terraço_descoberto">Terraço Descoberto</SelectItem>
                <SelectItem value="piscina">Piscina</SelectItem>
                <SelectItem value="subsolo">Subsolo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dimensões Detalhadas */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Dimensões do Projeto</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Comprimento (m)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  value={formData.detailedDimensions.length}
                  onChange={(e) => setFormData({
                    ...formData, 
                    detailedDimensions: {...formData.detailedDimensions, length: Number(e.target.value)}
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Largura (m)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  value={formData.detailedDimensions.width}
                  onChange={(e) => setFormData({
                    ...formData, 
                    detailedDimensions: {...formData.detailedDimensions, width: Number(e.target.value)}
                  })}
                />
              </div>
              
              {/* Campos condicionais por ambiente */}
              {formData.applicationEnvironment.includes('banheiro') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="boxHeight">Altura Box (m)</Label>
                    <Input
                      id="boxHeight"
                      type="number"
                      step="0.1"
                      value={formData.detailedDimensions.boxHeight || 1.8}
                      onChange={(e) => setFormData({
                        ...formData, 
                        detailedDimensions: {...formData.detailedDimensions, boxHeight: Number(e.target.value)}
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="boxWidth">Largura Box (m)</Label>
                    <Input
                      id="boxWidth"
                      type="number"
                      step="0.1"
                      value={formData.detailedDimensions.boxWidth || 0.9}
                      onChange={(e) => setFormData({
                        ...formData, 
                        detailedDimensions: {...formData.detailedDimensions, boxWidth: Number(e.target.value)}
                      })}
                    />
                  </div>
                </>
              )}
              
              {(formData.applicationEnvironment === 'terraço_descoberto' || 
                formData.applicationEnvironment === 'sacada_varanda') && (
                <div className="space-y-2">
                  <Label htmlFor="parapetHeight">Altura Platibanda (m)</Label>
                  <Input
                    id="parapetHeight"
                    type="number"
                    step="0.1"
                    value={formData.detailedDimensions.parapetHeight || 0.5}
                    onChange={(e) => setFormData({
                      ...formData, 
                      detailedDimensions: {...formData.detailedDimensions, parapetHeight: Number(e.target.value)}
                    })}
                  />
                </div>
              )}
              
              {formData.applicationEnvironment === 'piscina' && (
                <div className="space-y-2">
                  <Label htmlFor="averageDepth">Profundidade Média (m)</Label>
                  <Input
                    id="averageDepth"
                    type="number"
                    step="0.1"
                    value={formData.detailedDimensions.averageDepth || 1.5}
                    onChange={(e) => setFormData({
                      ...formData, 
                      detailedDimensions: {...formData.detailedDimensions, averageDepth: Number(e.target.value)}
                    })}
                  />
                </div>
              )}
              
              {!formData.applicationEnvironment.includes('banheiro') && 
               formData.applicationEnvironment !== 'terraço_descoberto' &&
               formData.applicationEnvironment !== 'sacada_varanda' &&
               formData.applicationEnvironment !== 'piscina' &&
               formData.applicationEnvironment !== 'cozinha_industrial' && (
                <div className="space-y-2">
                  <Label htmlFor="baseboard">Altura Rodapé (m)</Label>
                  <Input
                    id="baseboard"
                    type="number"
                    step="0.1"
                    value={formData.detailedDimensions.baseboard_height || 0.3}
                    onChange={(e) => setFormData({
                      ...formData, 
                      detailedDimensions: {...formData.detailedDimensions, baseboard_height: Number(e.target.value)}
                    })}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Preview de Áreas Calculadas */}
          {(formData.detailedDimensions.length > 0 && formData.detailedDimensions.width > 0) && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <Label className="text-sm font-medium text-muted-foreground">Áreas Automáticas (Manual MAPEI)</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div className="text-center">
                  <div className="text-lg font-semibold">{previewAreas.floor.toFixed(1)} m²</div>
                  <div className="text-xs text-muted-foreground">Piso</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{previewAreas.wall.toFixed(1)} m²</div>
                  <div className="text-xs text-muted-foreground">Parede</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">{previewAreas.total.toFixed(1)} m²</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
          )}


          {/* Detalhes Construtivos */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Detalhes Construtivos</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="drains">Ralos Comuns</Label>
                <Input
                  id="drains"
                  type="number"
                  value={formData.constructiveDetails.commonDrains}
                  onChange={(e) => setFormData({
                    ...formData,
                    constructiveDetails: {...formData.constructiveDetails, commonDrains: Number(e.target.value)}
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pipes">Tubulações</Label>
                <Input
                  id="pipes"
                  type="number"
                  value={formData.constructiveDetails.passingPipes}
                  onChange={(e) => setFormData({
                    ...formData,
                    constructiveDetails: {...formData.constructiveDetails, passingPipes: Number(e.target.value)}
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="columns">Colunas/Pilares</Label>
                <Input
                  id="columns"
                  type="number"
                  value={formData.constructiveDetails.columns}
                  onChange={(e) => setFormData({
                    ...formData,
                    constructiveDetails: {...formData.constructiveDetails, columns: Number(e.target.value)}
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joints">Juntas Dilatação (m)</Label>
                <Input
                  id="joints"
                  type="number"
                  value={formData.constructiveDetails.expansionJoints}
                  onChange={(e) => setFormData({
                    ...formData,
                    constructiveDetails: {...formData.constructiveDetails, expansionJoints: Number(e.target.value)}
                  })}
                />
              </div>
            </div>
          </div>

          {/* Condições do Substrato */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Condições do Substrato</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo do Substrato</Label>
                <Select 
                  value={formData.substrateType} 
                  onValueChange={(value: any) => setFormData({...formData, substrateType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concreto_novo">Concreto Novo (&lt;28 dias)</SelectItem>
                    <SelectItem value="concreto_velho">Concreto Velho (&gt;28 dias)</SelectItem>
                    <SelectItem value="alvenaria_reboco">Alvenaria/Reboco</SelectItem>
                    <SelectItem value="ceramica_existente">Cerâmica Existente</SelectItem>
                    <SelectItem value="contrapiso_cimenticio">Contrapiso Cimentício</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rugosidade da Superfície</Label>
                <Select 
                  value={formData.surfaceRoughness} 
                  onValueChange={(value: any) => setFormData({...formData, surfaceRoughness: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="polida">Polida (0%)</SelectItem>
                    <SelectItem value="lisa">Lisa (+5%)</SelectItem>
                    <SelectItem value="rugosidade_media">Rugosidade Média (+10%)</SelectItem>
                    <SelectItem value="muito_rugosa">Muito Rugosa (+15%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Condição do Substrato</Label>
                <Select 
                  value={formData.substrateCondition} 
                  onValueChange={(value: any) => setFormData({...formData, substrateCondition: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plano_nivelado">Plano e Nivelado</SelectItem>
                    <SelectItem value="pequenos_desniveis">Pequenos Desníveis (&lt;5mm)</SelectItem>
                    <SelectItem value="desniveis_medios">Desníveis Médios (5-10mm)</SelectItem>
                    <SelectItem value="grandes_desniveis">Grandes Desníveis (&gt;10mm)</SelectItem>
                    <SelectItem value="fissuras_pequenas">Fissuras (&lt;0,5mm)</SelectItem>
                    <SelectItem value="fissuras_grandes">Fissuras (&gt;0,5mm)</SelectItem>
                    <SelectItem value="infiltracao_ativa">Infiltração Ativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Exposição à Água</Label>
                <Select 
                  value={formData.waterExposure} 
                  onValueChange={(value: any) => setFormData({...formData, waterExposure: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="area_seca">Área Seca</SelectItem>
                    <SelectItem value="respingos_eventuais">Respingos Eventuais</SelectItem>
                    <SelectItem value="umidade_frequente">Umidade Frequente</SelectItem>
                    <SelectItem value="area_banho">Área de Banho</SelectItem>
                    <SelectItem value="imersao_temporaria">Imersão Temporária</SelectItem>
                    <SelectItem value="imersao_constante">Imersão Constante</SelectItem>
                    <SelectItem value="pressao_positiva">Pressão Positiva</SelectItem>
                    <SelectItem value="pressao_negativa">Pressão Negativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Condições de Aplicação */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Condições de Aplicação</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Método de Aplicação</Label>
                <Select 
                  value={formData.applicationMethod} 
                  onValueChange={(value: any) => setFormData({...formData, applicationMethod: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desempenadeira">Desempenadeira (+5%)</SelectItem>
                    <SelectItem value="trincha">Trincha (+8%)</SelectItem>
                    <SelectItem value="rolo">Rolo (+10%)</SelectItem>
                    <SelectItem value="projecao_mecanica">Projeção Mecânica (+30%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Experiência do Aplicador</Label>
                <Select 
                  value={formData.applicatorExperience} 
                  onValueChange={(value: any) => setFormData({...formData, applicatorExperience: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="condicoes_ideais">Condições Ideais (+5%)</SelectItem>
                    <SelectItem value="prazo_apertado">Prazo Apertado (+8%)</SelectItem>
                    <SelectItem value="condicoes_adversas">Condições Adversas (+10%)</SelectItem>
                    <SelectItem value="primeira_vez">Primeira Vez/Inexperiente (+15%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Condições Climáticas */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Condições Climáticas</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Temperatura</Label>
                <Select 
                  value={formData.climaticConditions.temperature} 
                  onValueChange={(value: any) => setFormData({
                    ...formData, 
                    climaticConditions: {...formData.climaticConditions, temperature: value}
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa (&lt;10°C)</SelectItem>
                    <SelectItem value="normal">Normal (10-25°C)</SelectItem>
                    <SelectItem value="alta">Alta (&gt;30°C)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Umidade</Label>
                <Select 
                  value={formData.climaticConditions.humidity} 
                  onValueChange={(value: any) => setFormData({
                    ...formData, 
                    climaticConditions: {...formData.climaticConditions, humidity: value}
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa (&lt;40%)</SelectItem>
                    <SelectItem value="normal">Normal (40-70%)</SelectItem>
                    <SelectItem value="alta">Alta (&gt;70%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vento</Label>
                <Select 
                  value={formData.climaticConditions.wind} 
                  onValueChange={(value: any) => setFormData({
                    ...formData, 
                    climaticConditions: {...formData.climaticConditions, wind: value}
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem_vento">Sem Vento</SelectItem>
                    <SelectItem value="brisa_leve">Brisa Leve</SelectItem>
                    <SelectItem value="vento_forte">Vento Forte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sol Direto</Label>
                <Select 
                  value={formData.climaticConditions.directSun} 
                  onValueChange={(value: any) => setFormData({
                    ...formData, 
                    climaticConditions: {...formData.climaticConditions, directSun: value}
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sombra">Sombra</SelectItem>
                    <SelectItem value="sol_parcial">Sol Parcial</SelectItem>
                    <SelectItem value="sol_pleno">Sol Pleno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Seleção do Sistema */}
          <div className="space-y-2">
            <Label>Sistema MAPEI</Label>
            <Select 
              value={formData.systemType} 
              onValueChange={(value: any) => setFormData({...formData, systemType: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mapelastic">MAPELASTIC (Uso Geral)</SelectItem>
                <SelectItem value="mapelastic_smart">MAPELASTIC SMART (Com Tela)</SelectItem>
                <SelectItem value="mapelastic_foundation">MAPELASTIC FOUNDATION (Pressão Negativa)</SelectItem>
                <SelectItem value="aquadefense">AQUADEFENSE (Aplicação Rápida)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleCalculate} 
            className="w-full"
            disabled={previewAreas.total === 0}
          >
            Calcular Impermeabilização
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}