import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Battery, Zap, Shield, Clock } from 'lucide-react';
import { BatteryBackupInput, BatteryBackupResult } from '../../types/calculation.types';
import { validateEssentialLoads } from '../../utils/calculations/batteryBackupCalculations';
import { BatteryBackupResults } from './BatteryBackupResults';
import { useBatteryProductCalculator } from '../../hooks/useBatteryProductCalculator';
import { ProductWarning } from '../shared/ProductWarning';
import { useNavigate } from 'react-router-dom';

interface BatteryBackupCalculatorProps {
  onCalculate: (input: BatteryBackupInput) => void;
  calculationResult?: BatteryBackupResult;
  onSaveCalculation?: () => void;
  onGenerateProposal?: () => void;
}

export function BatteryBackupCalculator({ 
  onCalculate, 
  calculationResult, 
  onSaveCalculation, 
  onGenerateProposal 
}: BatteryBackupCalculatorProps) {
  const navigate = useNavigate();
  const { hasProducts, getAvailableProducts } = useBatteryProductCalculator();
  
  const [showResults, setShowResults] = useState(false);
  const [input, setInput] = useState<BatteryBackupInput>({
    essentialLoads: {
      lighting: 300,
      refrigerator: 150,
      freezer: 0,
      internet: 50,
      tv: 100,
      microwave: 0,
      ventilation: 120,
      waterPump: 0,
      security: 30,
      medical: 0,
      phones: 20,
      other: 0
    },
    desiredAutonomy: 12,
    batteryType: 'lifepo4',
    chargeSource: {
      solar: false,
      grid: true,
      generator: false
    },
    
    usagePattern: {
      peakUsageHours: 4,
      weeklyUsageDays: 7
    }
  });

  const validation = validateEssentialLoads(input.essentialLoads);
  const totalPower = Object.values(input.essentialLoads).reduce((sum, power) => sum + power, 0);
  
  // Debug logs para identificar problema do botão
  console.log('🔍 DEBUG - Battery Calculator:', {
    totalPower,
    validation,
    hasProducts,
    input: input.essentialLoads
  });

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
    console.log('🚀 Executando cálculo com:', { input, validation, hasProducts });
    
    try {
      onCalculate(input);
      console.log('✅ onCalculate executado, aguardando resultado...');
      setShowResults(true);
    } catch (error) {
      console.error('❌ Erro no cálculo:', error);
      // Se não há produtos, ainda assim permitir cálculo básico
      if (!hasProducts) {
        console.log('⚠️ Tentando cálculo sem produtos cadastrados...');
        onCalculate(input);
        setShowResults(true);
      }
    }
  };

  const handleRecalculate = () => {
    setShowResults(false);
  };

  // Show results if calculation is complete
  console.log('🔍 Verificando se deve mostrar resultados:', { 
    showResults, 
    hasCalculationResult: !!calculationResult,
    calculationResult 
  });
  
  if (showResults && calculationResult) {
    console.log('✅ Exibindo resultados do cálculo');
    return (
      <BatteryBackupResults
        result={calculationResult}
        onRecalculate={handleRecalculate}
        onSave={onSaveCalculation}
        onGenerateProposal={onGenerateProposal}
      />
    );
  }

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
        {/* Product Warning */}
        {(() => {
          const availableProducts = getAvailableProducts();
          const missingProducts: string[] = [];
          
          if (!availableProducts.batteries.length) missingProducts.push('Baterias');
          if (!availableProducts.inverters.length) missingProducts.push('Inversores Híbridos');
          
          return (
            <ProductWarning 
              productType="Backup de Energia"
              missingProducts={missingProducts}
              onNavigateToProducts={() => navigate('/propostas/produtos')}
            />
          );
        })()}
        
        {/* Cargas Essenciais */}
        <div>
          <Label className="text-base font-semibold">Cargas Essenciais (Watts)</Label>
          
          {/* Grupo: Cargas Críticas */}
          <div className="mt-4">
            <Label className="text-sm font-medium text-muted-foreground">CARGAS CRÍTICAS</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
              <div>
                <Label htmlFor="lighting">Iluminação</Label>
                <Input
                  id="lighting"
                  type="number"
                  value={input.essentialLoads.lighting}
                  onChange={(e) => handleLoadChange('lighting', Number(e.target.value))}
                  placeholder="300"
                />
                <p className="text-xs text-muted-foreground">200-500W típico</p>
              </div>
              
              <div>
                <Label htmlFor="refrigerator">Geladeira</Label>
                <Input
                  id="refrigerator"
                  type="number"
                  value={input.essentialLoads.refrigerator}
                  onChange={(e) => handleLoadChange('refrigerator', Number(e.target.value))}
                  placeholder="150"
                />
                <p className="text-xs text-muted-foreground">120-180W típico</p>
              </div>
              
              <div>
                <Label htmlFor="freezer">Freezer</Label>
                <Input
                  id="freezer"
                  type="number"
                  value={input.essentialLoads.freezer}
                  onChange={(e) => handleLoadChange('freezer', Number(e.target.value))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">100-200W típico</p>
              </div>
              
              <div>
                <Label htmlFor="internet">Internet</Label>
                <Input
                  id="internet"
                  type="number"
                  value={input.essentialLoads.internet}
                  onChange={(e) => handleLoadChange('internet', Number(e.target.value))}
                  placeholder="50"
                />
                <p className="text-xs text-muted-foreground">Modem/Router 30-80W</p>
              </div>
              
              <div>
                <Label htmlFor="waterPump">Bomba D'água</Label>
                <Input
                  id="waterPump"
                  type="number"
                  value={input.essentialLoads.waterPump}
                  onChange={(e) => handleLoadChange('waterPump', Number(e.target.value))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">500-1500W típico</p>
              </div>
              
              <div>
                <Label htmlFor="security">Segurança</Label>
                <Input
                  id="security"
                  type="number"
                  value={input.essentialLoads.security}
                  onChange={(e) => handleLoadChange('security', Number(e.target.value))}
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">Câmeras/Alarmes 20-100W</p>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Grupo: Cargas de Conforto */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">CARGAS DE CONFORTO</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
              <div>
                <Label htmlFor="tv">TV/Entretenimento</Label>
                <Input
                  id="tv"
                  type="number"
                  value={input.essentialLoads.tv}
                  onChange={(e) => handleLoadChange('tv', Number(e.target.value))}
                  placeholder="100"
                />
                <p className="text-xs text-muted-foreground">50-200W típico</p>
              </div>
              
              <div>
                <Label htmlFor="ventilation">Ventilação</Label>
                <Input
                  id="ventilation"
                  type="number"
                  value={input.essentialLoads.ventilation}
                  onChange={(e) => handleLoadChange('ventilation', Number(e.target.value))}
                  placeholder="120"
                />
                <p className="text-xs text-muted-foreground">60-150W por ventilador</p>
              </div>
              
              <div>
                <Label htmlFor="microwave">Microondas</Label>
                <Input
                  id="microwave"
                  type="number"
                  value={input.essentialLoads.microwave}
                  onChange={(e) => handleLoadChange('microwave', Number(e.target.value))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">800-1200W típico</p>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Grupo: Cargas Específicas */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">CARGAS ESPECÍFICAS</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
              <div>
                <Label htmlFor="medical">Equipamento Médico</Label>
                <Input
                  id="medical"
                  type="number"
                  value={input.essentialLoads.medical}
                  onChange={(e) => handleLoadChange('medical', Number(e.target.value))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">CPAP/Nebulizador 50-150W</p>
              </div>
              
              <div>
                <Label htmlFor="phones">Telefones</Label>
                <Input
                  id="phones"
                  type="number"
                  value={input.essentialLoads.phones}
                  onChange={(e) => handleLoadChange('phones', Number(e.target.value))}
                  placeholder="20"
                />
                <p className="text-xs text-muted-foreground">10-30W típico</p>
              </div>
              
              <div>
                <Label htmlFor="other">Outras Cargas</Label>
                <Input
                  id="other"
                  type="number"
                  value={input.essentialLoads.other}
                  onChange={(e) => handleLoadChange('other', Number(e.target.value))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Equipamentos específicos</p>
              </div>
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

        <Button 
          onClick={handleCalculate} 
          className="w-full" 
          disabled={totalPower === 0 || totalPower > 10000}
        >
          <Battery className="mr-2 h-4 w-4" />
          Calcular Sistema de Backup
        </Button>
      </CardContent>
    </Card>
  );
}