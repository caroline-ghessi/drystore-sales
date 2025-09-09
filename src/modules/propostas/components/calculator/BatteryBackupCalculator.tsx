import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Battery, Zap, Shield, Clock } from 'lucide-react';
import { BatteryBackupInput } from '../../types/calculation.types';
import { validateEssentialLoads } from '../../utils/calculations/batteryBackupCalculations';

interface BatteryBackupCalculatorProps {
  onCalculate: (input: BatteryBackupInput) => void;
}

export function BatteryBackupCalculator({ onCalculate }: BatteryBackupCalculatorProps) {
  const [input, setInput] = useState<BatteryBackupInput>({
    essentialLoads: {
      lighting: 300,
      refrigeration: 150,
      communications: 80,
      security: 50,
      medical: 0,
      other: 0
    },
    desiredAutonomy: 12,
    batteryType: 'lifepo4',
    chargeSource: {
      solar: false,
      grid: true,
      generator: false
    },
    region: 'southeast',
    usagePattern: {
      dailyUsageHours: 12,
      peakUsageHours: 4,
      weeklyUsageDays: 7
    }
  });

  const validation = validateEssentialLoads(input.essentialLoads);
  const totalPower = Object.values(input.essentialLoads).reduce((sum, power) => sum + power, 0);

  const handleLoadChange = (loadType: keyof typeof input.essentialLoads, value: number) => {
    setInput(prev => ({
      ...prev,
      essentialLoads: {
        ...prev.essentialLoads,
        [loadType]: value
      }
    }));
  };

  const handleCalculate = () => {
    onCalculate(input);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Battery className="mr-2 h-5 w-5 text-blue-500" />
          Sistema de Backup de Energia
        </CardTitle>
        <CardDescription>
          Configure as cargas essenciais e tempo de autonomia desejado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cargas Essenciais */}
        <div>
          <Label className="text-base font-semibold">Cargas Essenciais (Watts)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
            <div>
              <Label htmlFor="lighting">Iluminação</Label>
              <Input
                id="lighting"
                type="number"
                value={input.essentialLoads.lighting}
                onChange={(e) => handleLoadChange('lighting', Number(e.target.value))}
                placeholder="300"
              />
            </div>
            
            <div>
              <Label htmlFor="refrigeration">Geladeira/Freezer</Label>
              <Input
                id="refrigeration"
                type="number"
                value={input.essentialLoads.refrigeration}
                onChange={(e) => handleLoadChange('refrigeration', Number(e.target.value))}
                placeholder="150"
              />
              <p className="text-xs text-muted-foreground">Inclui geladeira e freezer</p>
            </div>
            
            <div>
              <Label htmlFor="communications">Comunicação</Label>
              <Input
                id="communications"
                type="number"
                value={input.essentialLoads.communications}
                onChange={(e) => handleLoadChange('communications', Number(e.target.value))}
                placeholder="80"
              />
              <p className="text-xs text-muted-foreground">Router, telefone</p>
            </div>
            
            <div>
              <Label htmlFor="security">Segurança</Label>
              <Input
                id="security"
                type="number"
                value={input.essentialLoads.security}
                onChange={(e) => handleLoadChange('security', Number(e.target.value))}
                placeholder="50"
              />
              <p className="text-xs text-muted-foreground">Alarmes, câmeras</p>
            </div>
            
            <div>
              <Label htmlFor="medical">Médico</Label>
              <Input
                id="medical"
                type="number"
                value={input.essentialLoads.medical || 0}
                onChange={(e) => handleLoadChange('medical', Number(e.target.value))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">CPAP, nebulizador</p>
            </div>
            
            <div className="md:col-span-3">
              <Label htmlFor="other">Outras Cargas</Label>
              <Input
                id="other"
                type="number"
                value={input.essentialLoads.other}
                onChange={(e) => handleLoadChange('other', Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <p className="font-medium">Total de Cargas: {totalPower}W</p>
            <p className="text-sm text-muted-foreground">
              Com fator de simultaneidade (70%): {Math.round(totalPower * 0.7)}W
            </p>
          </div>
        </div>

        <Separator />

        {/* Configurações do Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="autonomy">Autonomia Desejada (horas)</Label>
            <Input
              id="autonomy"
              type="number"
              value={input.desiredAutonomy}
              onChange={(e) => setInput({ ...input, desiredAutonomy: Number(e.target.value) })}
              placeholder="12"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tempo de funcionamento sem rede elétrica
            </p>
          </div>

          <div>
            <Label>Tipo de Bateria</Label>
            <Select
              value={input.batteryType}
              onValueChange={(value: any) => setInput({ ...input, batteryType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lifepo4">LiFePO4 (Recomendado)</SelectItem>
                <SelectItem value="lithium">Lítio Ion</SelectItem>
                <SelectItem value="lead_acid">Chumbo Ácido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Fonte de Carregamento</Label>
            <Select
              value={input.chargeSource.grid ? 'grid' : input.chargeSource.solar ? 'solar' : 'generator'}
              onValueChange={(value: any) => setInput({ 
                ...input, 
                chargeSource: {
                  grid: value === 'grid',
                  solar: value === 'solar', 
                  generator: value === 'generator'
                }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Apenas Rede Elétrica</SelectItem>
                <SelectItem value="solar">Apenas Energia Solar</SelectItem>
                <SelectItem value="generator">Gerador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Horas de Uso Diário</Label>
            <Input
              type="number"
              min="1"
              max="24"
              value={input.usagePattern.dailyUsageHours}
              onChange={(e) => setInput({
                ...input,
                usagePattern: {
                  ...input.usagePattern,
                  dailyUsageHours: Number(e.target.value)
                }
              })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Horas de funcionamento por dia
            </p>
          </div>

          <div>
            <Label>Região</Label>
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

        </div>

        {/* Validações e Alertas */}
        {validation.warnings.length > 0 && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Cards Informativos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Battery className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="font-semibold text-blue-800">Autonomia</p>
                  <p className="text-sm text-blue-700">{input.desiredAutonomy}h de backup</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="font-semibold text-green-800">Potência</p>
                  <p className="text-sm text-green-700">{Math.round(totalPower * 0.7)}W ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="font-semibold text-yellow-800">Proteção</p>
                  <p className="text-sm text-yellow-700">24h/dia disponível</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={handleCalculate} className="w-full" disabled={!validation.isValid}>
          <Battery className="mr-2 h-4 w-4" />
          Calcular Sistema de Backup
        </Button>
      </CardContent>
    </Card>
  );
}