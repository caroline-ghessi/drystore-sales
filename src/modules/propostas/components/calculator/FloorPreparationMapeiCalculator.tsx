import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FloorPreparationMapeiInput, FloorPreparationMapeiResult } from '../../types/calculation.types';
import { calculateFloorPreparationMapei } from '../../utils/calculations/floorPreparationMapeiCalculations';

interface FloorPreparationMapeiCalculatorProps {
  onCalculationComplete: (result: FloorPreparationMapeiResult) => void;
  initialData?: Partial<FloorPreparationMapeiInput>;
}

export function FloorPreparationMapeiCalculator({ onCalculationComplete, initialData }: FloorPreparationMapeiCalculatorProps) {
  const [formData, setFormData] = useState<FloorPreparationMapeiInput>({
    area: 0,
    currentCondition: 'existente_bom',
    thicknessMeasurements: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    averageThickness: 0,
    maxThickness: 0,
    minThickness: 0,
    preparationType: 'nivelamento',
    productType: 'ultraplan_eco',
    baseSubstrate: 'concreto_velho',
    primerRequired: true,
    primerType: 'primer_g',
    primerDilution: '1:3',
    applicationConditions: {
      temperature: 'normal',
      humidity: 'normal',
      applicationMethod: 'manual',
      applicatorExperience: 'experiente',
      timeConstraints: 'normal'
    },
    ...initialData
  });

  const updateThicknessMeasurement = (index: number, value: number) => {
    const newMeasurements = [...formData.thicknessMeasurements];
    newMeasurements[index] = value;
    
    const validMeasurements = newMeasurements.filter(m => m > 0);
    const average = validMeasurements.length > 0 ? 
      validMeasurements.reduce((a, b) => a + b, 0) / validMeasurements.length : 0;
    const max = validMeasurements.length > 0 ? Math.max(...validMeasurements) : 0;
    const min = validMeasurements.length > 0 ? Math.min(...validMeasurements) : 0;
    
    setFormData({
      ...formData,
      thicknessMeasurements: newMeasurements,
      averageThickness: Number(average.toFixed(1)),
      maxThickness: max,
      minThickness: min
    });
  };

  const handleCalculate = () => {
    const result = calculateFloorPreparationMapei(formData);
    onCalculationComplete(result);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preparação de Piso MAPEI</CardTitle>
          <CardDescription>
            Autonivelantes e regularização - Cálculo baseado em 9 pontos de medição
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Dados Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area">Área (m²)</Label>
              <Input
                id="area"
                type="number"
                value={formData.area}
                onChange={(e) => setFormData({...formData, area: Number(e.target.value)})}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Condição Atual</Label>
              <Select 
                value={formData.currentCondition} 
                onValueChange={(value: any) => setFormData({...formData, currentCondition: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nivelado">Nivelado</SelectItem>
                  <SelectItem value="pequenos_desniveis">Pequenos Desníveis</SelectItem>
                  <SelectItem value="grandes_desniveis">Grandes Desníveis</SelectItem>
                  <SelectItem value="muito_irregular">Muito Irregular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Medições de Espessura - Grid 3x3 */}
          <div className="space-y-4">
            <Label>Medições de Espessura (mm) - 9 Pontos</Label>
            <div className="grid grid-cols-3 gap-2 max-w-md">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="space-y-1">
                  <Label className="text-xs text-center block">
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'][i]}
                  </Label>
                  <Input
                    type="number"
                    value={formData.thicknessMeasurements[i]}
                    onChange={(e) => updateThicknessMeasurement(i, Number(e.target.value))}
                    placeholder="0"
                    className="text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Resultado das Medições */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <Label className="text-sm">Espessura Média</Label>
              <p className="text-lg font-semibold">{formData.averageThickness}mm</p>
            </div>
            <div className="text-center">
              <Label className="text-sm">Máxima</Label>
              <p className="text-lg font-semibold">{formData.maxThickness}mm</p>
            </div>
            <div className="text-center">
              <Label className="text-sm">Mínima</Label>
              <p className="text-lg font-semibold">{formData.minThickness}mm</p>
            </div>
          </div>

          {/* Seleção do Produto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Preparação</Label>
              <Select 
                value={formData.preparationType} 
                onValueChange={(value: any) => setFormData({...formData, preparationType: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="autonivelante">Autonivelante</SelectItem>
                  <SelectItem value="regularizacao_caimento">Regularização com Caimento</SelectItem>
                  <SelectItem value="nivelamento_simples">Nivelamento Simples</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Produto MAPEI</Label>
              <Select 
                value={formData.productType} 
                onValueChange={(value: any) => setFormData({...formData, productType: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ultraplan_eco">ULTRAPLAN ECO (1-10mm)</SelectItem>
                  <SelectItem value="ultraplan_eco_20">ULTRAPLAN ECO 20 (3-20mm)</SelectItem>
                  <SelectItem value="novoplan_2_plus">NOVOPLAN 2 PLUS (3-25mm)</SelectItem>
                  <SelectItem value="planitop_fast_330">PLANITOP FAST 330 (5-50mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Primer */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="primer"
                checked={formData.primerRequired}
                onCheckedChange={(checked) => setFormData({...formData, primerRequired: !!checked})}
              />
              <Label htmlFor="primer">Primer necessário</Label>
            </div>
            
            {formData.primerRequired && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label>Tipo de Primer</Label>
                  <Select 
                    value={formData.primerType} 
                    onValueChange={(value: any) => setFormData({...formData, primerType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primer_g">PRIMER G</SelectItem>
                      <SelectItem value="eco_prim_grip">ECO PRIM GRIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Diluição</Label>
                  <Select 
                    value={formData.primerDilution} 
                    onValueChange={(value: any) => setFormData({...formData, primerDilution: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1:3">1:3 (substrato absorvente)</SelectItem>
                      <SelectItem value="1:1">1:1 (substrato pouco absorvente)</SelectItem>
                      <SelectItem value="puro">Puro (cerâmica existente)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={handleCalculate} 
            className="w-full" 
            disabled={formData.area === 0 || formData.averageThickness === 0}
          >
            Calcular Preparação de Piso
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}