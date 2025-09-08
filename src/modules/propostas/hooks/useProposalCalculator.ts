import { useState, useCallback, useMemo } from 'react';
import { ProductType, ProposalItem } from '../types/proposal.types';
import { CalculationInput, CalculationResult } from '../types/calculation.types';
import { calculateSolarSystem } from '../utils/calculations/solarCalculations';
import { calculateShingleInstallation } from '../utils/calculations/shingleCalculations';
import { calculateDrywallInstallation } from '../utils/calculations/drywallCalculations';
import { calculateKnaufCeiling } from '../utils/calculations/knaufCeilingCalculations';

export function useProposalCalculator(productType: ProductType) {
  const [calculationInput, setCalculationInput] = useState<CalculationInput | null>(null);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (input: CalculationInput) => {
    setIsCalculating(true);
    setError(null);
    
    try {
      let result: CalculationResult;
      
      switch (productType) {
        case 'solar':
          result = calculateSolarSystem(input as any);
          break;
        case 'shingle':
          result = calculateShingleInstallation(input as any);
          break;
        case 'drywall':
          result = calculateDrywallInstallation(input as any);
          break;
        case 'knauf_ceiling':
          result = calculateKnaufCeiling(input as any);
          break;
        default:
          throw new Error(`Cálculo não implementado para o produto: ${productType}`);
      }
      
      setCalculationInput(input);
      setCalculationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no cálculo');
    } finally {
      setIsCalculating(false);
    }
  }, [productType]);

  const generateProposalItems = useCallback((): ProposalItem[] => {
    if (!calculationResult) return [];
    
    const items: ProposalItem[] = [];
    
    switch (productType) {
      case 'solar':
        const solarResult = calculationResult as any;
        items.push({
          id: '1',
          product: 'solar',
          description: `Sistema Fotovoltaico ${solarResult.systemPower.toFixed(2)} kWp`,
          specifications: {
            power: solarResult.systemPower,
            panels: solarResult.panelQuantity,
            inverters: solarResult.inverterQuantity,
            monthlyGeneration: solarResult.monthlyGeneration
          },
          quantity: 1,
          unitPrice: solarResult.totalCost,
          totalPrice: solarResult.totalCost,
          materialCost: solarResult.itemizedCosts.panels + solarResult.itemizedCosts.inverters + solarResult.itemizedCosts.structure,
          laborCost: solarResult.itemizedCosts.installation
        });
        break;
        
      case 'shingle':
        const shingleResult = calculationResult as any;
        items.push({
          id: '1',
          product: 'shingle',
          description: `Telhado Shingle ${shingleResult.shingleQuantity.toFixed(0)} m²`,
          specifications: {
            area: shingleResult.shingleQuantity,
            installationTime: shingleResult.installationTime
          },
          quantity: shingleResult.shingleQuantity,
          unitPrice: shingleResult.totalCost / shingleResult.shingleQuantity,
          totalPrice: shingleResult.totalCost,
          materialCost: shingleResult.itemizedCosts.shingles + shingleResult.itemizedCosts.underlayment + shingleResult.itemizedCosts.accessories,
          laborCost: shingleResult.itemizedCosts.labor
        });
        break;
        
      case 'drywall':
        const drywallResult = calculationResult as any;
        items.push({
          id: '1',
          product: 'drywall',
          description: `Drywall ${drywallResult.plateQuantity.toFixed(0)} m²`,
          specifications: {
            area: drywallResult.plateQuantity,
            installationTime: drywallResult.installationTime
          },
          quantity: drywallResult.plateQuantity,
          unitPrice: drywallResult.totalCost / drywallResult.plateQuantity,
          totalPrice: drywallResult.totalCost,
          materialCost: drywallResult.itemizedCosts.plates + drywallResult.itemizedCosts.profiles + drywallResult.itemizedCosts.accessories,
          laborCost: drywallResult.itemizedCosts.labor
        });
        break;
        
      case 'knauf_ceiling':
        const knaufResult = calculationResult as any;
        items.push({
          id: '1',
          product: 'knauf_ceiling',
          description: `Forro Knauf ${knaufResult.plateArea.toFixed(0)} m²`,
          specifications: {
            area: knaufResult.plateArea,
            plates: knaufResult.plateQuantity,
            installationTime: knaufResult.installationTime
          },
          quantity: knaufResult.plateArea,
          unitPrice: knaufResult.totalCost / knaufResult.plateArea,
          totalPrice: knaufResult.totalCost,
          materialCost: knaufResult.itemizedCosts.plates + knaufResult.itemizedCosts.profiles + 
                       knaufResult.itemizedCosts.suspension + knaufResult.itemizedCosts.perimetral +
                       knaufResult.itemizedCosts.screws + knaufResult.itemizedCosts.finishing +
                       (knaufResult.itemizedCosts.insulation || 0) + (knaufResult.itemizedCosts.accessories || 0),
          laborCost: knaufResult.itemizedCosts.labor
        });
        break;
    }
    
    return items;
  }, [calculationResult, productType]);

  const calculationSummary = useMemo(() => {
    if (!calculationResult) return null;
    
    switch (productType) {
      case 'solar':
        const solar = calculationResult as any;
        return {
          totalCost: solar.totalCost,
          keyMetrics: [
            { label: 'Potência do Sistema', value: `${solar.systemPower.toFixed(2)} kWp` },
            { label: 'Geração Mensal', value: `${solar.monthlyGeneration.toFixed(0)} kWh` },
            { label: 'Economia Mensal', value: `R$ ${solar.monthlySavings.toFixed(2)}` },
            { label: 'Payback', value: `${solar.paybackPeriod.toFixed(1)} anos` }
          ]
        };
        
      case 'shingle':
        const shingle = calculationResult as any;
        return {
          totalCost: shingle.totalCost,
          keyMetrics: [
            { label: 'Área Total', value: `${shingle.shingleQuantity.toFixed(0)} m²` },
            { label: 'Prazo de Instalação', value: `${shingle.installationTime} dias` }
          ]
        };
        
      case 'drywall':
        const drywall = calculationResult as any;
        return {
          totalCost: drywall.totalCost,
          keyMetrics: [
            { label: 'Área Total', value: `${drywall.plateQuantity.toFixed(0)} m²` },
            { label: 'Prazo de Instalação', value: `${drywall.installationTime} dias` }
          ]
        };
        
      case 'knauf_ceiling':
        const knauf = calculationResult as any;
        return {
          totalCost: knauf.totalCost,
          keyMetrics: [
            { label: 'Área do Forro', value: `${knauf.plateArea.toFixed(0)} m²` },
            { label: 'Placas Knauf', value: `${knauf.plateQuantity} unidades` },
            { label: 'Prazo de Instalação', value: `${knauf.installationTime} dias` },
            { label: 'Perfis F530', value: `${knauf.profileBars} barras` }
          ]
        };
        
      default:
        return null;
    }
  }, [calculationResult, productType]);

  return {
    calculationInput,
    calculationResult,
    calculationSummary,
    isCalculating,
    error,
    calculate,
    generateProposalItems
  };
}