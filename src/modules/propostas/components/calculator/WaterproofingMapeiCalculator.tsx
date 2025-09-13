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
    areas: { piso: 0, parede: 0, total: 0 },
    perimeter: 0,
    applicationEnvironment: 'banheiro_residencial',
    substrateType: 'concreto_novo',
    substrateCondition: 'plano_nivelado',
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

  const handleAreaChange = (field: 'piso' | 'parede', value: number) => {
    const newAreas = { ...formData.areas, [field]: value };
    newAreas.total = newAreas.piso + newAreas.parede;
    setFormData({ ...formData, areas: newAreas });
  };

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

          {/* Medições */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area-piso">Área Piso (m²)</Label>
              <Input
                id="area-piso"
                type="number"
                value={formData.areas.piso}
                onChange={(e) => handleAreaChange('piso', Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area-parede">Área Parede (m²)</Label>
              <Input
                id="area-parede"
                type="number"
                value={formData.areas.parede}
                onChange={(e) => handleAreaChange('parede', Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Área Total</Label>
              <Input value={`${formData.areas.total} m²`} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="perimeter">Perímetro (m)</Label>
            <Input
              id="perimeter"
              type="number"
              value={formData.perimeter}
              onChange={(e) => setFormData({...formData, perimeter: Number(e.target.value)})}
              placeholder="0"
            />
          </div>

          {/* Condições do Substrato */}
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
              <Label>Exposição à Água</Label>
              <Select 
                value={formData.waterExposure} 
                onValueChange={(value: any) => setFormData({...formData, waterExposure: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="respingos_eventuais">Respingos Eventuais</SelectItem>
                  <SelectItem value="umidade_frequente">Umidade Frequente</SelectItem>
                  <SelectItem value="area_banho">Área de Banho</SelectItem>
                  <SelectItem value="imersao_temporaria">Imersão Temporária</SelectItem>
                  <SelectItem value="imersao_constante">Imersão Constante</SelectItem>
                </SelectContent>
              </Select>
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
            disabled={formData.areas.total === 0}
          >
            Calcular Impermeabilização
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}