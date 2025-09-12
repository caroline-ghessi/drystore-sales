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
  console.log('🎯 useProposalCalculator - productType:', productType);
  console.log('🎯 useProposalCalculator - category mapeada:', category);
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
          
          // Usar APENAS produtos cadastrados no banco de dados
          if (!products || products.length === 0) {
            throw new Error('Nenhum produto solar encontrado. Configure produtos na página de produtos.');
          }
          
          result = calculateSolarWithProducts(solarInput, products);
          break;
        case 'battery_backup':
          console.log('🔋 useProposalCalculator: Iniciando cálculo battery_backup');
          console.log('🔋 Produtos disponíveis no useProposalCalculator:', products);
          console.log('🔋 Quantidade de produtos:', products?.length || 0);
          console.log('🔋 Input recebido:', input);
          
          // Usar cálculo baseado em produtos se disponível
          if (products && products.length > 0) {
            console.log('✅ Usando calculateBatteryBackupWithProducts');
            result = calculateBatteryBackupWithProducts(input as any, products);
          } else {
            console.log('⚠️ Usando calculateBatteryBackup (fallback)');
            result = calculateBatteryBackup(input as any);
          }
          
          console.log('🔋 Resultado do cálculo:', result);
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
      console.error('❌ Erro durante cálculo:', err);
      setError(err instanceof Error ? err.message : 'Erro no cálculo');
    } finally {
      setIsCalculating(false);
    }
  }, [productType, products]);


  const generateProposalItems = useCallback((): ProposalItem[] => {
    if (!calculationResult) return [];
    
    const items: ProposalItem[] = [];
    
    switch (productType) {
      case 'solar':
        const solarResult = calculationResult as any;
        
        // Usar APENAS produtos reais cadastrados
        const availableProducts = products || [];
        
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

        // Painéis Solares - campos padronizados para edge function
        items.push({
          id: '1',
          name: selectedPanel?.name || `Painéis Solares Fotovoltaicos`,
          product: 'solar' as ProductType,
          quantity: panelQuantity,
          unit: 'unidade',
          unitPrice: selectedPanel?.base_price || 0,
          totalPrice: (selectedPanel?.base_price || 0) * panelQuantity,
          category: 'Energia Solar',
          specifications: {
            power: selectedPanel?.specifications?.power || solarResult.panelSpecs?.power || '550W',
            model: selectedPanel?.model || solarResult.panelSpecs?.model || 'Painel Solar',
            brand: selectedPanel?.brand || solarResult.panelSpecs?.brand || 'N/A',
            efficiency: selectedPanel?.specifications?.efficiency || solarResult.panelSpecs?.efficiency || 'N/A'
          }
        });

        // Inversor - campos padronizados para edge function
        items.push({
          id: '2',
          name: selectedInverter?.name || `Inversor Solar`,
          product: 'solar' as ProductType,
          quantity: inverterQuantity,
          unit: 'unidade',
          unitPrice: selectedInverter?.base_price || 0,
          totalPrice: (selectedInverter?.base_price || 0) * inverterQuantity,
          category: 'Energia Solar',
          specifications: {
            power: selectedInverter?.specifications?.power || `${solarResult.systemPower?.toFixed(1) || '0.0'} kW`,
            model: selectedInverter?.model || solarResult.inverterSpecs?.model || 'Inversor String',
            brand: selectedInverter?.brand || solarResult.inverterSpecs?.brand || 'N/A',
            efficiency: selectedInverter?.specifications?.efficiency || solarResult.inverterSpecs?.efficiency || 'N/A'
          }
        });

        // Estrutura de Fixação - campos padronizados para edge function
        items.push({
          id: '3',
          name: selectedStructure?.name || `Estrutura de Fixação`,
          product: 'solar' as ProductType,
          quantity: panelQuantity,
          unit: 'kit',
          unitPrice: selectedStructure?.base_price || 0,
          totalPrice: (selectedStructure?.base_price || 0) * panelQuantity,
          category: 'Energia Solar',
          specifications: {
            material: selectedStructure?.specifications?.material || 'Alumínio Anodizado',
            type: selectedStructure?.description || 'Estrutura para Telhado',
            panels: panelQuantity
          }
        });

        // Material Elétrico - campos padronizados para edge function
        items.push({
          id: '4',
          name: selectedElectrical?.name || `Material Elétrico`,
          product: 'solar' as ProductType,
          quantity: 1,
          unit: 'kit',
          unitPrice: selectedElectrical?.base_price || 0,
          totalPrice: selectedElectrical?.base_price || 0,
          category: 'Energia Solar',
          specifications: {
            includes: selectedElectrical?.description || 'String Box, Cabos, Conectores MC4, DPS',
            type: 'Kit Completo',
            system: `${solarResult.systemPower?.toFixed(1) || '0.0'} kWp`
          }
        });

        // Documentação e Homologação - campos padronizados para edge function
        const documentationProducts = availableProducts.filter(p => 
          p.subcategory === 'documentacao' || 
          p.subcategory === 'homologacao' || 
          p.description?.toLowerCase().includes('projeto') ||
          p.description?.toLowerCase().includes('homolog')
        );
        const selectedDocumentation = documentationProducts[0];

        items.push({
          id: '5',
          name: selectedDocumentation?.name || `Projeto e Homologação`,
          product: 'solar' as ProductType,
          quantity: 1,
          unit: 'serviço',
          unitPrice: selectedDocumentation?.base_price || 0,
          totalPrice: selectedDocumentation?.base_price || 0,
          category: 'Energia Solar',
          specifications: {
            includes: selectedDocumentation?.description || 'Projeto Executivo, ART, Homologação na Concessionária',
            project: 'Projeto Elétrico Executivo com ART',
            approval: 'Processo de Homologação na Distribuidora',
            documentation: 'Documentação Técnica Completa'
          }
        });

        break;
        
      case 'battery_backup':
        const batteryResult = calculationResult as any;
        
        // Baterias - usando produto real selecionado
        items.push({
          id: '1',
          name: batteryResult.selectedBattery?.name || `Baterias ${batteryResult.batteryConfiguration.totalCapacityKwh.toFixed(1)} kWh`,
          product: 'battery_backup' as ProductType,
          quantity: batteryResult.batteryConfiguration.batteryQuantity || 1,
          unit: 'unidade',
          unitPrice: batteryResult.itemizedCosts?.batteries ? 
            batteryResult.itemizedCosts.batteries / (batteryResult.batteryConfiguration.batteryQuantity || 1) : 0,
          totalPrice: batteryResult.itemizedCosts?.batteries || 0,
          category: 'Battery Backup',
          specifications: {
            capacity: batteryResult.selectedBattery?.specifications?.capacity || `${batteryResult.batteryConfiguration.totalCapacityKwh.toFixed(1)} kWh`,
            model: batteryResult.selectedBattery?.model || batteryResult.selectedBattery?.name || 'Bateria Litio',
            brand: batteryResult.selectedBattery?.brand || 'N/A',
            dod: batteryResult.selectedBattery?.specifications?.dod || 'N/A',
            cycles: batteryResult.selectedBattery?.specifications?.cycles || 'N/A'
          }
        });

        // Inversor Híbrido - usando produto real selecionado
        items.push({
          id: '2',
          name: batteryResult.selectedInverter?.name || `Inversor Híbrido ${batteryResult.totalPowerRequired.toFixed(2)} kW`,
          product: 'battery_backup' as ProductType,
          quantity: batteryResult.inverterQuantity || 1,
          unit: 'unidade',
          unitPrice: batteryResult.itemizedCosts?.inverters ? 
            batteryResult.itemizedCosts.inverters / (batteryResult.inverterQuantity || 1) : 0,
          totalPrice: batteryResult.itemizedCosts?.inverters || 0,
          category: 'Battery Backup',
          specifications: {
            power: batteryResult.selectedInverter?.specifications?.power || `${batteryResult.totalPowerRequired.toFixed(2)} kW`,
            model: batteryResult.selectedInverter?.model || batteryResult.selectedInverter?.name || 'Inversor Híbrido',
            brand: batteryResult.selectedInverter?.brand || 'N/A',
            efficiency: batteryResult.selectedInverter?.specifications?.efficiency || 'N/A'
          }
        });

        // Sistema de Proteção
        if (batteryResult.itemizedCosts?.protection > 0) {
          items.push({
            id: '3',
            name: `Sistema de Proteção`,
            product: 'battery_backup' as ProductType,
            quantity: 1,
            unit: 'kit',
            unitPrice: batteryResult.itemizedCosts.protection,
            totalPrice: batteryResult.itemizedCosts.protection,
            category: 'Battery Backup',
            specifications: {
              includes: 'DPS, Disjuntores, String Box DC/AC',
              type: 'Kit de Proteção Completo',
              system: `${batteryResult.totalPowerRequired.toFixed(2)} kW`
            }
          });
        }

        // Sistema de Monitoramento
        if (batteryResult.itemizedCosts?.monitoring > 0) {
          items.push({
            id: '4',
            name: `Sistema de Monitoramento`,
            product: 'battery_backup' as ProductType,
            quantity: 1,
            unit: 'sistema',
            unitPrice: batteryResult.itemizedCosts.monitoring,
            totalPrice: batteryResult.itemizedCosts.monitoring,
            category: 'Battery Backup',
            specifications: {
              features: 'Monitoramento Wi-Fi/App, Controle Remoto',
              compatibility: 'iOS/Android',
              monitoring: 'Tempo Real - Estado da Bateria, Consumo, Autonomia'
            }
          });
        }
        break;
        
      case 'shingle':
        const shingleResult = calculationResult as any;
        // Calcular área total baseada nos fardos (cada fardo cobre ~3m²)
        const estimatedArea = shingleResult.totalShingleBundles * 3;
        
        items.push({
          id: '1',
          name: `Telhado Shingle ${estimatedArea.toFixed(0)} m²`,
          product: 'shingle' as ProductType,
          quantity: estimatedArea,
          unit: 'm²',
          unitPrice: estimatedArea > 0 ? shingleResult.totalCost / estimatedArea : 0,
          totalPrice: shingleResult.totalCost,
          category: 'Telha Shingle',
          specifications: {
            area: estimatedArea,
            bundles: shingleResult.totalShingleBundles,
            osbPlates: shingleResult.osbPlates,
            underlayment: shingleResult.underlaymentRolls,
            valleys: shingleResult.valleyRolls,
            stepFlashing: shingleResult.stepFlashingPieces,
            ridges: shingleResult.ridgeBundles + shingleResult.espigaoBundles,
            sealing: shingleResult.monopolAsphalticTubes
          }
        });
        break;
        
      case 'drywall':
        const drywallResult = calculationResult as any;
        
        items.push({
          id: '1',
          name: `Drywall ${drywallResult.plateQuantity.toFixed(0)} m²`,
          product: 'drywall' as ProductType,
          quantity: drywallResult.plateQuantity,
          unit: 'm²',
          unitPrice: drywallResult.plateQuantity > 0 ? drywallResult.totalCost / drywallResult.plateQuantity : 0,
          totalPrice: drywallResult.totalCost,
          category: 'Drywall',
          specifications: {
            area: drywallResult.plateQuantity,
            profiles: drywallResult.profileQuantity,
            screws: drywallResult.screwQuantity,
            jointCompound: drywallResult.jointCompoundQuantity
          }
        });
        break;
        
        case 'forro_drywall':
          const forroDrywallResult = calculationResult as any;
          
          items.push({
            id: '1',
            name: `Forro Drywall ${forroDrywallResult.plateArea.toFixed(0)} m²`,
            product: 'forro_drywall' as ProductType,
            quantity: forroDrywallResult.plateArea,
            unit: 'm²',
            unitPrice: forroDrywallResult.plateArea > 0 ? forroDrywallResult.totalCost / forroDrywallResult.plateArea : 0,
            totalPrice: forroDrywallResult.totalCost,
            category: 'Forro Drywall',
            specifications: {
              area: forroDrywallResult.plateArea,
              plates: forroDrywallResult.plateQuantity,
              profiles: forroDrywallResult.profileBars,
              suspension: forroDrywallResult.suspensionBars,
              screws: forroDrywallResult.screwQuantity
            }
        });
        break;
        
      case 'acoustic_mineral_ceiling':
        const acousticResult = calculationResult as any;
        items.push({
          id: '1',
          name: `Forro Mineral Acústico ${acousticResult.areas.useful.toFixed(0)} m² - ${acousticResult.selectedModel.name}`,
          product: 'acoustic_mineral_ceiling' as ProductType,
          quantity: acousticResult.areas.useful,
          unit: 'm²',
          unitPrice: acousticResult.areas.useful > 0 ? acousticResult.totalCost / acousticResult.areas.useful : 0,
          totalPrice: acousticResult.totalCost,
          category: 'Forro Mineral Acústico',
          specifications: {
            area: acousticResult.areas.useful,
            plates: acousticResult.plates.totalPlates,
            boxes: acousticResult.plates.boxesNeeded,
            model: acousticResult.selectedModel.name,
            modulation: acousticResult.selectedModel.modulation,
            nrc: acousticResult.selectedModel.nrc,
            edgeType: acousticResult.selectedModel.edgeType
          }
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
          ],
          proposalItems: generateProposalItems()
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