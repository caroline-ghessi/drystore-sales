import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Battery, Zap, Shield, Calculator, ArrowLeft, Save, FileText } from 'lucide-react';
import { BatteryBackupResult } from '../../types/calculation.types';

interface BatteryBackupResultsProps {
  result: BatteryBackupResult;
  onRecalculate: () => void;
  onSave?: () => void;
  onGenerateProposal?: () => void;
}

export function BatteryBackupResults({ 
  result, 
  onRecalculate, 
  onSave, 
  onGenerateProposal 
}: BatteryBackupResultsProps) {
  const [includeInstallation, setIncludeInstallation] = useState(false);
  const [installationCost, setInstallationCost] = useState(0);

  // Calculate total with optional installation
  const totalWithInstallation = result.totalCost + (includeInstallation ? installationCost : 0);

  // Equipment details based on calculation
  const inverterModel = result.inverterPower <= 3 ? 'GF1-3K' : 'GF1-5K';
  const batteryModel = result.totalEnergyRequired > 10 ? 'BLF-B51150' : 'BLF-B51100';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Battery className="mr-2 h-5 w-5 text-blue-500" />
              <CardTitle>Sistema de Backup de Energia - Equipamentos</CardTitle>
            </div>
            <Button variant="outline" onClick={onRecalculate}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Recalcular
            </Button>
          </div>
          <CardDescription>
            Listagem completa dos equipamentos quantificados para o sistema
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Technical Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Shield className="mr-2 h-5 w-5 text-green-500" />
            Resumo Técnico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {result.totalPowerRequired.toFixed(2)} kW
              </p>
              <p className="text-sm text-muted-foreground">Potência Simultânea</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {result.batteryConfiguration.totalCapacityKwh.toFixed(1)} kWh
              </p>
              <p className="text-sm text-muted-foreground">Capacidade Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {result.batteryConfiguration.autonomyHours.toFixed(1)}h
              </p>
              <p className="text-sm text-muted-foreground">Autonomia Real</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {result.technicalSpecs.warrantyYears} anos
              </p>
              <p className="text-sm text-muted-foreground">Garantia</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5 text-orange-500" />
            Produtos Quantificados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Inverters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-orange-700">Inversores Híbridos Livoltek</h4>
              <Badge variant="secondary">Equipamento Principal</Badge>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">
                    {result.inverterQuantity}x Livoltek {inverterModel}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.inverterPower}kW contínuo / {result.inverterPower * 2}kW pico
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Eficiência: {(result.inverterEfficiency * 100).toFixed(0)}% | Tensão: 220V
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    R$ {result.itemizedCosts.inverters.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Batteries */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-green-700">Baterias Livoltek</h4>
              <Badge variant="secondary">LiFePO4</Badge>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">
                    {result.batteryConfiguration.batteryQuantity}x Livoltek {batteryModel}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(result.batteryConfiguration.totalCapacityKwh / result.batteryConfiguration.batteryQuantity).toFixed(2)}kWh cada | 
                    {result.batteryConfiguration.bankVoltage}V/{Math.round((result.batteryConfiguration.totalCapacityKwh / result.batteryConfiguration.batteryQuantity) * 1000 / result.batteryConfiguration.bankVoltage)}Ah
                  </p>
                  <p className="text-sm text-muted-foreground">
                    DoD: 90% | Ciclos: {result.technicalSpecs.expectedLifeCycles.toLocaleString()} | Garantia: {result.technicalSpecs.warrantyYears} anos
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    R$ {result.itemizedCosts.batteries.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Protection System */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-blue-700">Sistema de Proteção e Acessórios</h4>
              <Badge variant="secondary">Incluso</Badge>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">Kit Completo de Proteção</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    • Disjuntores AC/DC • Fusíveis • Cabos CC 6mm²
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • Conectores MC4 • Aterramento • DPS
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    R$ {(result.itemizedCosts.protection + result.itemizedCosts.monitoring).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Subtotal Products */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="font-semibold text-lg">SUBTOTAL PRODUTOS:</p>
              <p className="font-bold text-2xl text-slate-700">
                R$ {result.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Optional Installation */}
          <div className="border-2 border-dashed border-slate-300 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox
                id="includeInstallation"
                checked={includeInstallation}
                onCheckedChange={(checked) => setIncludeInstallation(checked as boolean)}
              />
              <Label htmlFor="includeInstallation" className="font-medium">
                ⚠️ Incluir instalação/mão de obra (Opcional)
              </Label>
            </div>
            {includeInstallation && (
              <div className="ml-6">
                <Label htmlFor="installationCost">Valor da Instalação (R$):</Label>
                <Input
                  id="installationCost"
                  type="number"
                  value={installationCost}
                  onChange={(e) => setInstallationCost(Number(e.target.value) || 0)}
                  placeholder="Digite o valor da mão de obra"
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Final Total */}
          <div className="bg-primary/10 p-6 rounded-lg border-2 border-primary/20">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-lg">VALOR TOTAL DO SISTEMA:</p>
                <p className="text-sm text-muted-foreground">
                  {includeInstallation ? 'Produtos + Instalação' : 'Apenas Produtos'}
                </p>
              </div>
              <p className="font-bold text-3xl text-primary">
                R$ {totalWithInstallation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Economic Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5 text-purple-500" />
            Métricas Econômicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-lg font-bold text-purple-700">
                R$ {result.economicMetrics.monthlySavings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-muted-foreground">Valor Mensal Protegido</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-lg font-bold text-green-700">
                {result.economicMetrics.paybackPeriod.toFixed(1)} anos
              </p>
              <p className="text-sm text-muted-foreground">Payback Estimado</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-blue-700">
                {result.economicMetrics.lifespan} anos
              </p>
              <p className="text-sm text-muted-foreground">Vida Útil Sistema</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onRecalculate} variant="outline" className="flex-1">
          <Calculator className="mr-2 h-4 w-4" />
          Recalcular Sistema
        </Button>
        {onSave && (
          <Button onClick={onSave} variant="outline" className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            Salvar Cálculo
          </Button>
        )}
        {onGenerateProposal && (
          <Button onClick={onGenerateProposal} className="flex-1">
            <FileText className="mr-2 h-4 w-4" />
            Gerar Proposta
          </Button>
        )}
      </div>
    </div>
  );
}