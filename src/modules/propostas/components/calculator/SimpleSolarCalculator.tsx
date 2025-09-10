import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Sun, Zap, Receipt, Camera } from 'lucide-react';
import { SimpleSolarCalculationInput } from '../../types/calculation.types';
import { useSolarProductCalculator } from '../../hooks/useSolarProductCalculator';
import { ProductWarning } from '../shared/ProductWarning';
import { useNavigate } from 'react-router-dom';

interface SimpleSolarCalculatorProps {
  onCalculate: (input: SimpleSolarCalculationInput) => void;
  clientData?: {
    name: string;
    phone: string;
  };
}

export function SimpleSolarCalculator({ onCalculate, clientData }: SimpleSolarCalculatorProps) {
  const navigate = useNavigate();
  const { hasProducts, getAvailableProducts } = useSolarProductCalculator();
  
  const [input, setInput] = useState<SimpleSolarCalculationInput>({
    monthlyConsumption: 300,
    currentTariff: 0.75,
    installationType: 'grid_tie',
    clientData: clientData || {
      name: '',
      phone: ''
    }
  });

  const [tariffError, setTariffError] = useState('');

  const validateTariff = (value: number) => {
    if (value < 0.40 || value > 1.20) {
      setTariffError('Tarifa típica está entre R$ 0,40 e R$ 1,20 por kWh');
    } else {
      setTariffError('');
    }
  };

  const handleTariffChange = (value: string) => {
    const numValue = Number(value);
    setInput({ ...input, currentTariff: numValue });
    validateTariff(numValue);
  };

  const handleCalculate = () => {
    if (tariffError) return;
    onCalculate(input);
  };

  // Verificar produtos disponíveis
  const availableProducts = getAvailableProducts();
  const missingProducts: string[] = [];
  
  if (!availableProducts.panels.length) missingProducts.push('Painéis Solares');
  if (!availableProducts.inverters.length) missingProducts.push('Inversores');

  const monthlyBill = input.monthlyConsumption * input.currentTariff;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sun className="mr-2 h-5 w-5 text-amber-500" />
          Calculadora Solar Simplificada
        </CardTitle>
        <CardDescription>
          Configure apenas os dados essenciais baseados na conta de energia do cliente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cliente Info - Apenas informativo se dados já fornecidos */}
        {clientData ? (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center text-green-800 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="font-medium">Cliente Identificado</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-green-700">Nome: </span>
                <span className="font-medium">{clientData.name}</span>
              </div>
              <div>
                <span className="text-green-700">WhatsApp: </span>
                <span className="font-medium">{clientData.phone}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input
                id="clientName"
                value={input.clientData?.name || ''}
                onChange={(e) => setInput({
                  ...input,
                  clientData: { ...input.clientData, name: e.target.value }
                })}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="clientPhone">WhatsApp</Label>
              <Input
                id="clientPhone"
                value={input.clientData?.phone || ''}
                onChange={(e) => setInput({
                  ...input,
                  clientData: { ...input.clientData, phone: e.target.value }
                })}
                placeholder="(11) 99999-9999 - WhatsApp"
              />
            </div>
          </div>
        )}

        {/* Main Calculation Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Consumption */}
          <div>
            <Label htmlFor="consumption">Consumo Mensal (kWh) *</Label>
            <Input
              id="consumption"
              type="number"
              value={input.monthlyConsumption}
              onChange={(e) => setInput({
                ...input,
                monthlyConsumption: Number(e.target.value)
              })}
              placeholder="300"
              className="text-lg font-semibold"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Valor da conta de luz (ver kWh consumidos)
            </p>
          </div>

          {/* Current Tariff - CAMPO PRINCIPAL */}
          <div>
            <Label htmlFor="tariff" className="flex items-center">
              <Receipt className="mr-1 h-4 w-4" />
              Tarifa Atual (R$/kWh) *
            </Label>
            <Input
              id="tariff"
              type="number"
              step="0.01"
              value={input.currentTariff}
              onChange={(e) => handleTariffChange(e.target.value)}
              placeholder="0.75"
              className={`text-lg font-bold ${tariffError ? 'border-red-500' : 'border-green-500 bg-green-50'}`}
            />
            {tariffError ? (
              <p className="text-sm text-red-600 mt-1">{tariffError}</p>
            ) : (
              <p className="text-sm text-green-700 mt-1">
                Valor que o cliente paga por kWh consumido
              </p>
            )}
          </div>


          {/* Installation Type */}
          <div>
            <Label>Tipo de Sistema *</Label>
            <Select
              value={input.installationType}
              onValueChange={(value: any) => setInput({ ...input, installationType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid_tie">Grid Tie (Conectado à Rede)</SelectItem>
                <SelectItem value="off_grid">Off Grid (Isolado)</SelectItem>
                <SelectItem value="hybrid">Híbrido (Com Bateria)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Current Bill Preview */}
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Conta Atual Mensal</p>
                <p className="text-2xl font-bold text-red-800">
                  R$ {monthlyBill.toFixed(2)}
                </p>
              </div>
              <div className="text-red-600">
                <Receipt className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Future OCR Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
          <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Em breve: Tire uma foto da conta de luz
          </p>
          <p className="text-xs text-gray-500">
            Sistema automático de extração de dados (em desenvolvimento)
          </p>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Sun className="h-8 w-8 text-amber-600 mr-3" />
                <div>
                  <p className="font-semibold text-amber-800">Sistema Ideal</p>
                  <p className="text-sm text-amber-700">Baseado no seu consumo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="font-semibold text-green-800">Economia Real</p>
                  <p className="text-sm text-green-700">Com sua tarifa atual</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calculator className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="font-semibold text-blue-800">Retorno</p>
                  <p className="text-sm text-blue-700">Payback personalizado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button 
          onClick={handleCalculate} 
          className="w-full" 
          disabled={!!tariffError}
          size="lg"
        >
          <Calculator className="mr-2 h-4 w-4" />
          Calcular Economia Solar
        </Button>
      </CardContent>
    </Card>
  );
}