import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sun, Battery, Zap, Calculator } from 'lucide-react';
import { SolarCalculationInput } from '../../types/calculation.types';

interface AdvancedSolarCalculatorProps {
  onCalculate: (input: SolarCalculationInput) => void;
}

export function AdvancedSolarCalculator({ onCalculate }: AdvancedSolarCalculatorProps) {
  const [input, setInput] = useState<SolarCalculationInput>({
    monthlyConsumption: 600,
    roofType: 'ceramic',
    roofOrientation: 'north',
    shadowing: 'none',
    installationType: 'grid_tie',
    dailyConsumptionPattern: {
      diurnal: 360,  // 60% diurno
      nocturnal: 240, // 40% noturno
      peak: 120      // 20% no horário de pico
    },
    batteryConfig: {
      enabled: false,
      desiredAutonomy: 12,
      batteryType: 'lifepo4',
      dod: 0.9,
      essentialLoads: 1.5
    },
    equipmentPreference: {
      panelModel: 'AS-6M-550W',
      inverterModel: 'auto',
      batteryModel: 'BLF-B51100'
    }
  });

  const handleInstallationTypeChange = (value: string) => {
    setInput(prev => ({
      ...prev,
      installationType: value as any,
      batteryConfig: {
        ...prev.batteryConfig!,
        enabled: value === 'hybrid' || value === 'off_grid'
      }
    }));
  };

  const handleBatteryToggle = (enabled: boolean) => {
    setInput(prev => ({
      ...prev,
      batteryConfig: {
        ...prev.batteryConfig!,
        enabled
      }
    }));
  };

  const handleCalculate = () => {
    onCalculate(input);
  };

  const isBatteryEnabled = input.installationType === 'hybrid' || input.installationType === 'off_grid' || input.batteryConfig?.enabled;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sun className="mr-2 h-5 w-5 text-yellow-500" />
          Sistema Solar Fotovoltaico Avançado
        </CardTitle>
        <CardDescription>
          Configuração detalhada com especificações Amerisolar 550W e Livoltek
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Consumo e Perfil */}
        <div>
          <Label className="text-base font-semibold">Consumo Energético</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <Label htmlFor="consumption">Consumo Mensal (kWh) *</Label>
              <Input
                id="consumption"
                type="number"
                value={input.monthlyConsumption}
                onChange={(e) => setInput({
                  ...input,
                  monthlyConsumption: Number(e.target.value),
                  dailyConsumptionPattern: {
                    diurnal: Number(e.target.value) * 0.6,
                    nocturnal: Number(e.target.value) * 0.4,
                    peak: Number(e.target.value) * 0.2
                  }
                })}
                placeholder="600"
              />
            </div>

            <div>
              <Label htmlFor="diurnal">Consumo Diurno (kWh)</Label>
              <Input
                id="diurnal"
                type="number"
                value={input.dailyConsumptionPattern?.diurnal || 0}
                onChange={(e) => setInput({
                  ...input,
                  dailyConsumptionPattern: {
                    ...input.dailyConsumptionPattern!,
                    diurnal: Number(e.target.value)
                  }
                })}
                placeholder="360"
              />
              <p className="text-xs text-muted-foreground mt-1">6h às 18h</p>
            </div>

            <div>
              <Label htmlFor="nocturnal">Consumo Noturno (kWh)</Label>
              <Input
                id="nocturnal"
                type="number"
                value={input.dailyConsumptionPattern?.nocturnal || 0}
                onChange={(e) => setInput({
                  ...input,
                  dailyConsumptionPattern: {
                    ...input.dailyConsumptionPattern!,
                    nocturnal: Number(e.target.value)
                  }
                })}
                placeholder="240"
              />
              <p className="text-xs text-muted-foreground mt-1">18h às 6h</p>
            </div>

            <div>
              <Label htmlFor="peak">Consumo Pico (kWh)</Label>
              <Input
                id="peak"
                type="number"
                value={input.dailyConsumptionPattern?.peak || 0}
                onChange={(e) => setInput({
                  ...input,
                  dailyConsumptionPattern: {
                    ...input.dailyConsumptionPattern!,
                    peak: Number(e.target.value)
                  }
                })}
                placeholder="120"
              />
              <p className="text-xs text-muted-foreground mt-1">18h às 21h (tarifa pico)</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Características do Local */}
        <div>
          <Label className="text-base font-semibold">Características do Local</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <Label>Tipo de Telhado</Label>
              <Select
                value={input.roofType}
                onValueChange={(value: any) => setInput({ ...input, roofType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ceramic">Cerâmico</SelectItem>
                  <SelectItem value="concrete">Concreto</SelectItem>
                  <SelectItem value="metal">Metálico</SelectItem>
                  <SelectItem value="fiber_cement">Fibrocimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Orientação do Telhado</Label>
              <Select
                value={input.roofOrientation}
                onValueChange={(value: any) => setInput({ ...input, roofOrientation: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="north">Norte (Ideal - 0% perdas)</SelectItem>
                  <SelectItem value="northeast">Nordeste (-5% perdas)</SelectItem>
                  <SelectItem value="northwest">Noroeste (-5% perdas)</SelectItem>
                  <SelectItem value="east">Leste (-10% perdas)</SelectItem>
                  <SelectItem value="west">Oeste (-10% perdas)</SelectItem>
                  <SelectItem value="southeast">Sudeste (-15% perdas)</SelectItem>
                  <SelectItem value="southwest">Sudoeste (-15% perdas)</SelectItem>
                  <SelectItem value="south">Sul (-25% perdas)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sombreamento</Label>
              <Select
                value={input.shadowing}
                onValueChange={(value: any) => setInput({ ...input, shadowing: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem Sombra (0% perdas)</SelectItem>
                  <SelectItem value="partial">Sombra Parcial (-15% perdas)</SelectItem>
                  <SelectItem value="significant">Sombra Significativa (-35% perdas)</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </div>

        <Separator />

        {/* Tipo de Sistema */}
        <div>
          <Label className="text-base font-semibold">Tipo de Sistema</Label>
          <div className="space-y-4 mt-3">
            <Select
              value={input.installationType}
              onValueChange={handleInstallationTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid_tie">ON-GRID (Conectado à Rede)</SelectItem>
                <SelectItem value="off_grid">OFF-GRID (Isolado)</SelectItem>
                <SelectItem value="hybrid">HÍBRIDO (Rede + Baterias)</SelectItem>
              </SelectContent>
            </Select>

            {input.installationType === 'grid_tie' && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="battery-backup"
                  checked={input.batteryConfig?.enabled || false}
                  onCheckedChange={handleBatteryToggle}
                />
                <Label htmlFor="battery-backup">Adicionar Backup de Bateria</Label>
              </div>
            )}
          </div>
        </div>

        {/* Configuração de Baterias */}
        {isBatteryEnabled && (
          <>
            <Separator />
            <div>
              <Label className="text-base font-semibold flex items-center">
                <Battery className="mr-2 h-4 w-4" />
                Configuração de Baterias
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <Label htmlFor="autonomy">Autonomia Desejada (horas)</Label>
                  <Input
                    id="autonomy"
                    type="number"
                    value={input.batteryConfig?.desiredAutonomy || 12}
                    onChange={(e) => setInput({
                      ...input,
                      batteryConfig: {
                        ...input.batteryConfig!,
                        desiredAutonomy: Number(e.target.value)
                      }
                    })}
                    placeholder="12"
                  />
                </div>

                <div>
                  <Label htmlFor="essential-loads">Cargas Essenciais (kW)</Label>
                  <Input
                    id="essential-loads"
                    type="number"
                    step="0.1"
                    value={input.batteryConfig?.essentialLoads || 1.5}
                    onChange={(e) => setInput({
                      ...input,
                      batteryConfig: {
                        ...input.batteryConfig!,
                        essentialLoads: Number(e.target.value)
                      }
                    })}
                    placeholder="1.5"
                  />
                </div>

                <div>
                  <Label>Tipo de Bateria</Label>
                  <Select
                    value={input.batteryConfig?.batteryType || 'lifepo4'}
                    onValueChange={(value: any) => setInput({
                      ...input,
                      batteryConfig: {
                        ...input.batteryConfig!,
                        batteryType: value
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lifepo4">LiFePO4 - Livoltek (Recomendado)</SelectItem>
                      <SelectItem value="lithium">Lítio Ion</SelectItem>
                      <SelectItem value="lead_acid">Chumbo Ácido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Profundidade de Descarga</Label>
                  <Select
                    value={input.batteryConfig?.dod?.toString() || '0.9'}
                    onValueChange={(value) => setInput({
                      ...input,
                      batteryConfig: {
                        ...input.batteryConfig!,
                        dod: Number(value)
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.9">90% - LiFePO4</SelectItem>
                      <SelectItem value="0.8">80% - Lítio Ion</SelectItem>
                      <SelectItem value="0.5">50% - Chumbo Ácido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {input.installationType === 'off_grid' && (
                <Alert className="mt-4">
                  <Battery className="h-4 w-4" />
                  <AlertDescription>
                    Sistema OFF-GRID: Dimensionamento para autonomia completa. Considere dias consecutivos sem sol.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}

        <Separator />


        {/* Cards Informativos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Sun className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="font-semibold text-yellow-800">Amerisolar</p>
                  <p className="text-sm text-yellow-700">550W Monocristalino</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="font-semibold text-blue-800">Livoltek</p>
                  <p className="text-sm text-blue-700">Inversor Híbrido</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Battery className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="font-semibold text-green-800">LiFePO4</p>
                  <p className="text-sm text-green-700">6.000+ ciclos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={handleCalculate} className="w-full">
          <Calculator className="mr-2 h-4 w-4" />
          Calcular Sistema Solar Avançado
        </Button>
      </CardContent>
    </Card>
  );
}