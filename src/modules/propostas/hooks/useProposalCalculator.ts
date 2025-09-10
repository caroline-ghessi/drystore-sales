import { useState, useCallback, useMemo } from 'react';
import { ProductType, ProposalItem } from '../types/proposal.types';
import { CalculationInput, CalculationResult } from '../types/calculation.types';
import { calculateSimpleSolarSystem } from '../utils/calculations/simpleSolarCalculations';
import { calculateBatteryBackup } from '../utils/calculations/batteryBackupCalculations';
import { calculateShingleInstallation } from '../utils/calculations/shingleCalculations';
import { calculateDrywallInstallation } from '../utils/calculations/drywallCalculations';
import { calculateForroDrywall } from '../utils/calculations/forroDrywallCalculations';
import { calculateAcousticMineralCeiling } from '../utils/calculations/acousticMineralCeilingCalculations';

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
          result = calculateSimpleSolarSystem(input as any);
          break;
        case 'battery_backup':
          result = calculateBatteryBackup(input as any);
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
        case 'acoustic_mineral_ceiling':
          result = calculateAcousticMineralCeiling(input as any);
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
        
      case 'battery_backup':
        const batteryResult = calculationResult as any;
        items.push({
          id: '1',
          product: 'battery_backup',
          description: `Sistema de Backup ${batteryResult.totalPowerRequired.toFixed(2)} kW`,
          specifications: {
            power: batteryResult.totalPowerRequired,
            batteries: batteryResult.batteryConfiguration.batteryQuantity,
            inverters: batteryResult.inverterQuantity,
            autonomy: batteryResult.batteryConfiguration.autonomyHours
          },
          quantity: 1,
          unitPrice: batteryResult.totalCost,
          totalPrice: batteryResult.totalCost,
          materialCost: batteryResult.totalCost
        });
        break;
        
      case 'shingle':
        const shingleResult = calculationResult as any;
        // Calcular área total baseada nos fardos (cada fardo cobre ~3m²)
        const estimatedArea = shingleResult.totalShingleBundles * 3;
        
        items.push({
          id: '1',
          product: 'shingle',
          description: `Telhado Shingle ${estimatedArea.toFixed(0)} m²`,
          specifications: {
            area: estimatedArea,
            bundles: shingleResult.totalShingleBundles,
            osbPlates: shingleResult.osbPlates,
            underlayment: shingleResult.underlaymentRolls,
            valleys: shingleResult.valleyRolls,
            stepFlashing: shingleResult.stepFlashingPieces,
            ridges: shingleResult.ridgeBundles + shingleResult.espigaoBundles,
            sealing: shingleResult.monopolAsphalticTubes
          },
          quantity: estimatedArea,
          unitPrice: estimatedArea > 0 ? shingleResult.totalCost / estimatedArea : 0,
          totalPrice: shingleResult.totalCost,
          materialCost: shingleResult.totalCost
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
            profiles: drywallResult.profileQuantity,
            screws: drywallResult.screwQuantity,
            jointCompound: drywallResult.jointCompoundQuantity
          },
          quantity: drywallResult.plateQuantity,
          unitPrice: drywallResult.plateQuantity > 0 ? drywallResult.totalCost / drywallResult.plateQuantity : 0,
          totalPrice: drywallResult.totalCost,
          materialCost: drywallResult.totalCost
        });
        break;
        
        case 'forro_drywall':
          const forroDrywallResult = calculationResult as any;
          
          items.push({
            id: '1',
            product: 'forro_drywall',
            description: `Forro Drywall ${forroDrywallResult.plateArea.toFixed(0)} m²`,
            specifications: {
              area: forroDrywallResult.plateArea,
              plates: forroDrywallResult.plateQuantity,
              profiles: forroDrywallResult.profileBars,
              suspension: forroDrywallResult.suspensionBars,
              screws: forroDrywallResult.screwQuantity
            },
            quantity: forroDrywallResult.plateArea,
            unitPrice: forroDrywallResult.plateArea > 0 ? forroDrywallResult.totalCost / forroDrywallResult.plateArea : 0,
            totalPrice: forroDrywallResult.totalCost,
            materialCost: forroDrywallResult.totalCost
        });
        break;
        
      case 'acoustic_mineral_ceiling':
        const acousticResult = calculationResult as any;
        items.push({
          id: '1',
          product: 'acoustic_mineral_ceiling',
          description: `Forro Mineral Acústico ${acousticResult.areas.useful.toFixed(0)} m² - ${acousticResult.selectedModel.name}`,
          specifications: {
            area: acousticResult.areas.useful,
            plates: acousticResult.plates.totalPlates,
            boxes: acousticResult.plates.boxesNeeded,
            model: acousticResult.selectedModel.name,
            modulation: acousticResult.selectedModel.modulation,
            nrc: acousticResult.selectedModel.nrc,
            edgeType: acousticResult.selectedModel.edgeType
          },
          quantity: acousticResult.areas.useful,
          unitPrice: acousticResult.areas.useful > 0 ? acousticResult.totalCost / acousticResult.areas.useful : 0,
          totalPrice: acousticResult.totalCost,
          materialCost: acousticResult.totalCost
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
            { label: 'Payback', value: `${(solar.paybackPeriod / 12).toFixed(1)} anos` }
          ]
        };
        
      case 'battery_backup':
        const battery = calculationResult as any;
        return {
          totalCost: battery.totalCost,
          keyMetrics: [
            { label: 'Potência do Sistema', value: `${battery.totalPowerRequired.toFixed(2)} kW` },
            { label: 'Capacidade', value: `${battery.batteryConfiguration.totalCapacityKwh.toFixed(1)} kWh` },
            { label: 'Autonomia', value: `${battery.batteryConfiguration.autonomyHours.toFixed(0)} horas` },
            { label: 'Payback', value: `${(battery.economicMetrics.paybackPeriod / 12).toFixed(1)} anos` }
          ]
        };
        
      case 'shingle':
        const shingle = calculationResult as any;
        const shingleArea = shingle.totalShingleBundles * 3;
        const metrics = [
          { label: 'Área Total', value: `${shingleArea.toFixed(0)} m²` },
          { label: 'Total de Fardos', value: `${shingle.totalShingleBundles} unidades` },
          { label: 'Subcobertura', value: `${shingle.underlaymentRolls} rolos` },
          { label: 'Placas OSB', value: `${shingle.osbPlates} unidades` }
        ];
        
        // Adicionar métricas condicionais
        if (shingle.valleyRolls > 0) {
          metrics.push({ label: 'Águas Furtadas', value: `${shingle.valleyRolls} rolos` });
        }
        if (shingle.stepFlashingPieces > 0) {
          metrics.push({ label: 'Step Flashing', value: `${shingle.stepFlashingPieces} peças` });
        }
        if (shingle.rufosMeters) {
          metrics.push({ label: 'Rufos', value: `${shingle.rufosMeters.toFixed(1)} m` });
        }
        
        return {
          totalCost: shingle.totalCost,
          keyMetrics: metrics
        };
        
      case 'drywall':
        const drywall = calculationResult as any;
        const totalPlates = Math.ceil(drywall.plateQuantity / 3); // Placas de 3m²
        return {
          totalCost: drywall.totalCost,
          keyMetrics: [
            { label: 'Área Total', value: `${drywall.plateQuantity.toFixed(0)} m²` },
            { label: 'Placas Drywall', value: `${totalPlates} unidades` },
            { label: 'Perfis Metálicos', value: `${drywall.profileQuantity.toFixed(0)} ml` },
            { label: 'Parafusos', value: `${drywall.screwQuantity.toFixed(0)} unidades` }
          ]
        };
        
        case 'forro_drywall':
          const forroDrywall = calculationResult as any;
          return {
            totalCost: forroDrywall.totalCost,
            keyMetrics: [
              { label: 'Área do Forro', value: `${forroDrywall.plateArea.toFixed(0)} m²` },
              { label: 'Placas Drywall', value: `${forroDrywall.plateQuantity} unidades` },
              { label: 'Perfis Metálicos', value: `${forroDrywall.profileBars} barras` },
              { label: 'Sistema de Suspensão', value: `${forroDrywall.suspensionBars} barras` }
            ]
          };
          
        case 'acoustic_mineral_ceiling':
          const acoustic = calculationResult as any;
          return {
            totalCost: acoustic.totalCost,
            keyMetrics: [
              { label: 'Área Útil', value: `${acoustic.areas.useful.toFixed(0)} m²` },
              { label: 'Modelo Selecionado', value: `${acoustic.selectedModel.name} (${acoustic.selectedModel.manufacturer})` },
              { label: 'Placas Minerais', value: `${acoustic.plates.totalPlates} un (${acoustic.plates.boxesNeeded} caixas)` },
              { label: 'Performance Acústica', value: `NRC ${acoustic.selectedModel.nrc} (${acoustic.acousticPerformance.classification})` },
              { label: 'Modulação', value: `${acoustic.selectedModel.modulation} ${acoustic.selectedModel.edgeType}` }
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