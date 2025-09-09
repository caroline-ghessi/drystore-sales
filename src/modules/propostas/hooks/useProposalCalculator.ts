import { useState, useCallback, useMemo } from 'react';
import { ProductType, ProposalItem } from '../types/proposal.types';
import { CalculationInput, CalculationResult } from '../types/calculation.types';
import { calculateSolarSystem } from '../utils/calculations/solarCalculations';
import { calculateShingleInstallation } from '../utils/calculations/shingleCalculations';
import { calculateDrywallInstallation } from '../utils/calculations/drywallCalculations';
import { calculateForroDrywall } from '../utils/calculations/forroDrywallCalculations';

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
        case 'forro_drywall':
          result = calculateForroDrywall(input as any);
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
          materialCost: solarResult.totalCost
        });
        break;
        
      case 'shingle':
        const shingleResult = calculationResult as any;
        // Calcular área total baseada nos fardos (cada fardo cobre ~3m²)
        const estimatedArea = shingleResult.totalShingleBundles * 3;
        // Calcular tempo de instalação baseado na área (1 dia para cada 50m²)
        const estimatedInstallationTime = Math.ceil(estimatedArea / 50);
        
        items.push({
          id: '1',
          product: 'shingle',
          description: `Telhado Shingle ${estimatedArea.toFixed(0)} m²`,
          specifications: {
            area: estimatedArea,
            bundles: shingleResult.totalShingleBundles,
            osbPlates: shingleResult.osbPlates,
            installationTime: estimatedInstallationTime
          },
          quantity: estimatedArea,
          unitPrice: estimatedArea > 0 ? shingleResult.totalCost / estimatedArea : 0,
          totalPrice: shingleResult.totalCost,
          materialCost: shingleResult.totalCost
        });
        break;
        
      case 'drywall':
        const drywallResult = calculationResult as any;
        // Calcular tempo de instalação baseado na área (1 dia para cada 30m²)
        const drywallInstallationTime = Math.ceil(drywallResult.plateQuantity / 30);
        
        items.push({
          id: '1',
          product: 'drywall',
          description: `Drywall ${drywallResult.plateQuantity.toFixed(0)} m²`,
          specifications: {
            area: drywallResult.plateQuantity,
            profiles: drywallResult.profileQuantity,
            installationTime: drywallInstallationTime
          },
          quantity: drywallResult.plateQuantity,
          unitPrice: drywallResult.plateQuantity > 0 ? drywallResult.totalCost / drywallResult.plateQuantity : 0,
          totalPrice: drywallResult.totalCost,
          materialCost: drywallResult.totalCost
        });
        break;
        
        case 'forro_drywall':
          const forroDrywallResult = calculationResult as any;
          // Calcular tempo de instalação baseado na área (1 dia para cada 40m²)
          const forroInstallationTime = Math.ceil(forroDrywallResult.plateArea / 40);
          
          items.push({
            id: '1',
            product: 'forro_drywall',
            description: `Forro Drywall ${forroDrywallResult.plateArea.toFixed(0)} m²`,
            specifications: {
              area: forroDrywallResult.plateArea,
              plates: forroDrywallResult.plateQuantity,
              profiles: forroDrywallResult.profileBars,
              installationTime: forroInstallationTime
            },
            quantity: forroDrywallResult.plateArea,
            unitPrice: forroDrywallResult.plateArea > 0 ? forroDrywallResult.totalCost / forroDrywallResult.plateArea : 0,
            totalPrice: forroDrywallResult.totalCost,
            materialCost: forroDrywallResult.totalCost
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
        const shingleArea = shingle.totalShingleBundles * 3;
        const shingleTime = Math.ceil(shingleArea / 50);
        return {
          totalCost: shingle.totalCost,
          keyMetrics: [
            { label: 'Área Total', value: `${shingleArea.toFixed(0)} m²` },
            { label: 'Total de Fardos', value: `${shingle.totalShingleBundles} unidades` },
            { label: 'Placas OSB', value: `${shingle.osbPlates} unidades` },
            { label: 'Prazo de Instalação', value: `${shingleTime} dias` }
          ]
        };
        
      case 'drywall':
        const drywall = calculationResult as any;
        const drywallTime = Math.ceil(drywall.plateQuantity / 30);
        return {
          totalCost: drywall.totalCost,
          keyMetrics: [
            { label: 'Área Total', value: `${drywall.plateQuantity.toFixed(0)} m²` },
            { label: 'Perfis Metálicos', value: `${drywall.profileQuantity.toFixed(0)} ml` },
            { label: 'Prazo de Instalação', value: `${drywallTime} dias` }
          ]
        };
        
        case 'forro_drywall':
          const forroDrywall = calculationResult as any;
          const forroTime = Math.ceil(forroDrywall.plateArea / 40);
          return {
            totalCost: forroDrywall.totalCost,
            keyMetrics: [
              { label: 'Área do Forro', value: `${forroDrywall.plateArea.toFixed(0)} m²` },
              { label: 'Placas Drywall', value: `${forroDrywall.plateQuantity} unidades` },
              { label: 'Perfis Metálicos', value: `${forroDrywall.profileBars} barras` },
              { label: 'Prazo de Instalação', value: `${forroTime} dias` }
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