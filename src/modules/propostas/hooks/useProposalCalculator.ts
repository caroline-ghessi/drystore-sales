import { useState, useCallback, useMemo } from 'react';
import { ProductType, ProposalItem } from '../types/proposal.types';
import { CalculationInput, CalculationResult, SimpleSolarCalculationInput, SolarCalculationInput } from '../types/calculation.types';
// import { calculateSimpleSolarSystem } from '../utils/calculations/simpleSolarCalculations'; // REMOVIDO - não usar mais valores hardcoded
import { calculateBatteryBackup } from '../utils/calculations/batteryBackupCalculations';
import { calculateSolarWithProducts } from '../utils/calculations/productBasedSolarCalculations';
import { calculateBatteryBackupWithProducts } from '../utils/calculations/productBasedBatteryBackupCalculations';
import { useUnifiedProducts } from './useUnifiedProducts';
import { calculateShingleInstallation } from '../utils/calculations/shingleCalculations';
import { calculateDrywallInstallation } from '../utils/calculations/drywallCalculations';
import { calculateForroDrywall } from '../utils/calculations/forroDrywallCalculations';
import { calculateAcousticMineralCeiling } from '../utils/calculations/acousticMineralCeilingCalculations';

// Função para detectar se o input é do tipo SimpleSolarCalculationInput
function isSimpleSolarInput(input: any): input is SimpleSolarCalculationInput {
  return input && typeof input.currentTariff === 'number' && !input.roofOrientation;
}

// Função para converter SimpleSolarCalculationInput para SolarCalculationInput
function convertSimpleToAdvancedSolarInput(input: SimpleSolarCalculationInput): SolarCalculationInput {
  return {
    monthlyConsumption: input.monthlyConsumption,
    roofType: 'ceramic' as const,
    roofOrientation: 'north' as const, // Melhor orientação para o Brasil
    shadowing: 'none' as const, // Cenário otimista
    installationType: input.installationType,
    region: 'southeast' as const // Região padrão
  };
}

export function useProposalCalculator(productType: ProductType) {
  const [calculationInput, setCalculationInput] = useState<CalculationInput | null>(null);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Buscar produtos baseado no tipo
  const categoryMap: Record<string, any> = {
    'solar': 'energia_solar' as const,
    'battery_backup': 'battery_backup' as const
  };
  const category = categoryMap[productType];
  const { products } = useUnifiedProducts(category);

  const calculate = useCallback(async (input: CalculationInput) => {
    setIsCalculating(true);
    setError(null);
    
    try {
      let result: CalculationResult | any;
      
      switch (productType) {
        case 'solar':
          // SEMPRE usar calculadora baseada em produtos
          let solarInput: SolarCalculationInput;
          
          if (isSimpleSolarInput(input)) {
            solarInput = convertSimpleToAdvancedSolarInput(input);
          } else {
            solarInput = input as SolarCalculationInput;
          }
          
          // Se não há produtos cadastrados, criar produtos "vazios" com preço zero
          let solarProducts = products || [];
          if (solarProducts.length === 0) {
            solarProducts = createEmptySolarProducts();
          }
          
          result = calculateSolarWithProducts(solarInput, solarProducts);
          break;
        case 'battery_backup':
          // Usar cálculo baseado em produtos se disponível
          if (products && products.length > 0) {
            result = calculateBatteryBackupWithProducts(input as any, products);
          } else {
            result = calculateBatteryBackup(input as any);
          }
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
          result = await calculateAcousticMineralCeiling(input as any);
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
  }, [productType, products]);

  // Criar produtos "vazios" com preço zero se não há produtos cadastrados
  const createEmptySolarProducts = useCallback(() => {
    const now = new Date().toISOString();
    return [
      {
        id: 'empty-panel',
        name: 'Painel Solar',
        category: 'energia_solar' as const,
        subcategory: 'painel',
        unit: 'un',
        base_price: 0,
        specifications: { power_rating: 550, efficiency: 0.21 },
        is_active: true,
        created_at: now,
        source: 'products' as const,
        solar_category: 'panel' as const
      },
      {
        id: 'empty-inverter', 
        name: 'Inversor Solar',
        category: 'energia_solar' as const,
        subcategory: 'inversor',
        unit: 'un',
        base_price: 0,
        specifications: { power_rating: 3000, efficiency: 0.97 },
        is_active: true,
        created_at: now,
        source: 'products' as const,
        solar_category: 'inverter' as const
      },
      {
        id: 'empty-structure',
        name: 'Estrutura de Fixação',
        category: 'energia_solar' as const,
        subcategory: 'estrutura',
        unit: 'un',
        base_price: 0,
        specifications: {},
        is_active: true,
        created_at: now,
        source: 'products' as const
      },
      {
        id: 'empty-electrical',
        name: 'Material Elétrico',
        category: 'energia_solar' as const,
        subcategory: 'eletrico',
        unit: 'kit',
        base_price: 0,
        specifications: {},
        is_active: true,
        created_at: now,
        source: 'products' as const
      },
      {
        id: 'empty-documentation',
        name: 'Projeto e Homologação',
        category: 'energia_solar' as const,
        subcategory: 'documentacao',
        unit: 'serv',
        base_price: 0, 
        specifications: {},
        is_active: true,
        created_at: now,
        source: 'products' as const
      }
    ];
  }, []);

  const generateProposalItems = useCallback((): ProposalItem[] => {
    if (!calculationResult) return [];
    
    const items: ProposalItem[] = [];
    
    switch (productType) {
      case 'solar':
        const solarResult = calculationResult as any;
        
        // Buscar produtos reais cadastrados ou usar produtos vazios como fallback
        let availableProducts = products || [];
        if (availableProducts.length === 0) {
          availableProducts = createEmptySolarProducts();
        }
        
        const panelProducts = availableProducts.filter(p => p.subcategory === 'painel' || p.solar_category === 'panel');
        const inverterProducts = availableProducts.filter(p => p.subcategory === 'inversor' || p.solar_category === 'inverter');
        const structureProducts = availableProducts.filter(p => p.subcategory === 'estrutura');
        const electricalProducts = availableProducts.filter(p => p.subcategory === 'eletrico' || p.subcategory === 'material_eletrico');

        // Selecionar produtos (primeiro disponível ou usar dados do resultado)
        const selectedPanel = panelProducts[0];
        const selectedInverter = inverterProducts[0];
        const selectedStructure = structureProducts[0];
        const selectedElectrical = electricalProducts[0];

        const panelQuantity = solarResult.panelQuantity || Math.ceil((solarResult.systemPower || 0) / 0.55);
        const inverterQuantity = solarResult.inverterQuantity || 1;

        // Painéis Solares - APENAS preço do produto cadastrado
        items.push({
          id: '1',
          product: 'solar',
          description: selectedPanel?.name || `Painéis Solares Fotovoltaicos`,
          specifications: {
            power: selectedPanel?.specifications?.power || solarResult.panelSpecs?.power || '550W',
            model: selectedPanel?.model || solarResult.panelSpecs?.model || 'Painel Solar',
            brand: selectedPanel?.brand || solarResult.panelSpecs?.brand || 'N/A',
            efficiency: selectedPanel?.specifications?.efficiency || solarResult.panelSpecs?.efficiency || 'N/A'
          },
          quantity: panelQuantity,
          unitPrice: selectedPanel?.base_price || 0,
          totalPrice: (selectedPanel?.base_price || 0) * panelQuantity,
          materialCost: (selectedPanel?.base_price || 0) * panelQuantity
        });

        // Inversor - APENAS preço do produto cadastrado
        items.push({
          id: '2',
          product: 'solar',
          description: selectedInverter?.name || `Inversor Solar`,
          specifications: {
            power: selectedInverter?.specifications?.power || `${solarResult.systemPower?.toFixed(1) || '0.0'} kW`,
            model: selectedInverter?.model || solarResult.inverterSpecs?.model || 'Inversor String',
            brand: selectedInverter?.brand || solarResult.inverterSpecs?.brand || 'N/A',
            efficiency: selectedInverter?.specifications?.efficiency || solarResult.inverterSpecs?.efficiency || 'N/A'
          },
          quantity: inverterQuantity,
          unitPrice: selectedInverter?.base_price || 0,
          totalPrice: (selectedInverter?.base_price || 0) * inverterQuantity,
          materialCost: (selectedInverter?.base_price || 0) * inverterQuantity
        });

        // Estrutura de Fixação - APENAS preço do produto cadastrado
        items.push({
          id: '3',
          product: 'solar',
          description: selectedStructure?.name || `Estrutura de Fixação`,
          specifications: {
            material: selectedStructure?.specifications?.material || 'Alumínio Anodizado',
            type: selectedStructure?.description || 'Estrutura para Telhado',
            panels: panelQuantity
          },
          quantity: panelQuantity,
          unitPrice: selectedStructure?.base_price || 0,
          totalPrice: (selectedStructure?.base_price || 0) * panelQuantity,
          materialCost: (selectedStructure?.base_price || 0) * panelQuantity
        });

        // Material Elétrico - APENAS preço do produto cadastrado
        items.push({
          id: '4',
          product: 'solar',
          description: selectedElectrical?.name || `Material Elétrico`,
          specifications: {
            includes: selectedElectrical?.description || 'String Box, Cabos, Conectores MC4, DPS',
            type: 'Kit Completo',
            system: `${solarResult.systemPower?.toFixed(1) || '0.0'} kWp`
          },
          quantity: 1,
          unitPrice: selectedElectrical?.base_price || 0,
          totalPrice: selectedElectrical?.base_price || 0,
          materialCost: selectedElectrical?.base_price || 0
        });

        // Documentação e Homologação - sempre com preço zero se não houver produto específico
        const documentationProducts = availableProducts.filter(p => 
          p.subcategory === 'documentacao' || 
          p.subcategory === 'homologacao' || 
          p.description?.toLowerCase().includes('projeto') ||
          p.description?.toLowerCase().includes('homolog')
        );
        const selectedDocumentation = documentationProducts[0];

        items.push({
          id: '5',
          product: 'solar',
          description: selectedDocumentation?.name || `Projeto e Homologação`,
          specifications: {
            includes: selectedDocumentation?.description || 'Projeto Executivo, ART, Homologação na Concessionária',
            project: 'Projeto Elétrico Executivo com ART',
            approval: 'Processo de Homologação na Distribuidora',
            documentation: 'Documentação Técnica Completa'
          },
          quantity: 1,
          unitPrice: selectedDocumentation?.base_price || 0,
          totalPrice: selectedDocumentation?.base_price || 0,
          materialCost: selectedDocumentation?.base_price || 0
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
          ],
          proposalItems: generateProposalItems()
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