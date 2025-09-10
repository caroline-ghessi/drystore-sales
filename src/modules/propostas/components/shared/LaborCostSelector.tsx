import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Wrench, AlertTriangle } from 'lucide-react';

export interface LaborCostConfig {
  includeLabor: boolean;
  laborCostPerM2?: number;
  customLaborCost?: number;
  laborDescription?: string;
}

interface LaborCostSelectorProps {
  config: LaborCostConfig;
  onChange: (config: LaborCostConfig) => void;
  totalArea?: number;
  productType: 'shingle' | 'solar' | 'battery' | 'drywall' | 'acoustic';
  className?: string;
}

const LABOR_DESCRIPTIONS = {
  shingle: 'Instalação do telhado shingle (estrutura, placas OSB, subcobertura e telhas)',
  solar: 'Instalação do sistema solar (estrutura, painéis, inversores e conexões)',
  battery: 'Instalação do sistema de backup (baterias, inversor e proteções)',
  drywall: 'Instalação das divisórias drywall (estrutura, placas e acabamento)',
  acoustic: 'Instalação do forro mineral acústico (estrutura e placas)'
};

const TYPICAL_LABOR_COSTS = {
  shingle: 35,
  solar: 2000, // Por kWp
  battery: 1500, // Valor fixo
  drywall: 25,
  acoustic: 30
};

export function LaborCostSelector({ 
  config, 
  onChange, 
  totalArea, 
  productType,
  className = ""
}: LaborCostSelectorProps) {
  
  const typicalCost = TYPICAL_LABOR_COSTS[productType];
  const description = LABOR_DESCRIPTIONS[productType];
  
  const handleIncludeChange = (include: boolean) => {
    onChange({
      ...config,
      includeLabor: include,
      laborCostPerM2: include ? (config.laborCostPerM2 || typicalCost) : undefined
    });
  };

  const handleCostChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onChange({
      ...config,
      laborCostPerM2: numValue
    });
  };

  const handleCustomCostChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onChange({
      ...config,
      customLaborCost: numValue
    });
  };

  const estimatedLaborCost = config.includeLabor ? 
    (config.customLaborCost || 
     (config.laborCostPerM2 && totalArea ? config.laborCostPerM2 * totalArea : 0)) : 0;

  return (
    <Card className={`border-orange-200 bg-orange-50/30 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-orange-800">
          <Wrench className="mr-2 h-5 w-5" />
          Mão de Obra (Opcional)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning Notice */}
        <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Importante:</p>
            <p>Na maioria dos casos não fornecemos serviços de instalação. Marque apenas se for incluir mão de obra na proposta.</p>
          </div>
        </div>

        {/* Include Labor Checkbox */}
        <div className="flex items-center space-x-3">
          <Checkbox
            id="includeLabor"
            checked={config.includeLabor}
            onCheckedChange={handleIncludeChange}
          />
          <Label htmlFor="includeLabor" className="text-sm font-medium">
            Incluir custos de instalação/mão de obra
          </Label>
        </div>

        {config.includeLabor && (
          <>
            <Separator />
            
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {description}
              </p>

              {(productType === 'shingle' || productType === 'drywall' || productType === 'acoustic') && totalArea && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="laborPerM2" className="text-sm">
                      Custo por m² (R$)
                    </Label>
                    <Input
                      id="laborPerM2"
                      type="number"
                      step="0.01"
                      value={config.laborCostPerM2 || ''}
                      onChange={(e) => handleCostChange(e.target.value)}
                      placeholder={`Típico: R$ ${typicalCost}/m²`}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">Área Total</Label>
                    <div className="h-10 px-3 py-2 border rounded-md bg-muted text-sm">
                      {totalArea.toFixed(2)} m²
                    </div>
                  </div>
                </div>
              )}

              {(productType === 'solar' || productType === 'battery') && (
                <div>
                  <Label htmlFor="customLaborCost" className="text-sm">
                    Custo de instalação (R$)
                  </Label>
                  <Input
                    id="customLaborCost"
                    type="number"
                    step="0.01"
                    value={config.customLaborCost || ''}
                    onChange={(e) => handleCustomCostChange(e.target.value)}
                    placeholder={`Típico: R$ ${typicalCost.toLocaleString('pt-BR')}`}
                  />
                </div>
              )}

              {estimatedLaborCost > 0 && (
                <div className="p-3 bg-orange-100 border border-orange-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-orange-800">
                      Custo estimado de mão de obra:
                    </span>
                    <span className="text-lg font-bold text-orange-900">
                      R$ {estimatedLaborCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}