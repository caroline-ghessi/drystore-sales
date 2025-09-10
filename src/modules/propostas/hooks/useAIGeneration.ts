import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AIGenerationRequest, AIGenerationResult, ContextAnalysis } from '../types/generation.types';
import { ProductType } from '../types/proposal.types';

export function useAIGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState<AIGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeContext = useCallback(async (projectContextId: string): Promise<ContextAnalysis | null> => {
    try {
      const { data, error } = await supabase
        .from('project_contexts')
        .select('*')
        .eq('id', projectContextId)
        .single();

      if (error || !data) {
        throw new Error('Contexto do projeto não encontrado');
      }

      // Extract information from the context using actual database fields
      const extractedData = data;
      const summary = data.timeline || data.notes || '';

      // Analyze client needs from extracted data and summary
      const clientNeeds = extractClientNeeds(summary, extractedData);
      const productRequirements = extractProductRequirements(data.desired_product, extractedData);
      const urgencyLevel = extractUrgencyLevel(summary, extractedData);
      const budgetIndications = extractBudgetIndications(extractedData);
      const timelineRequirements = extractTimelineRequirements(extractedData);
      const specialRequirements = extractSpecialRequirements(summary, extractedData);

      return {
        clientNeeds,
        productRequirements,
        urgencyLevel,
        budgetIndications,
        timelineRequirements,
        specialRequirements
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao analisar contexto');
      return null;
    }
  }, []);

  const generateProposal = useCallback(async (request: AIGenerationRequest): Promise<AIGenerationResult | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Call the edge function for AI generation
      const { data, error } = await supabase.functions.invoke('generate-proposal', {
        body: request
      });

      if (error) {
        throw error;
      }

      const result: AIGenerationResult = {
        proposalData: data.proposal,
        generatedContent: {
          executiveSummary: 'Proposta personalizada gerada com base nos seus cálculos e necessidades específicas.',
          technicalDescription: 'Especificações técnicas detalhadas incluídas na proposta.',
          benefitsHighlights: [
            'Solução personalizada para suas necessidades',
            'Materiais de alta qualidade',
            'Garantia completa incluída',
            'Suporte técnico especializado'
          ],
          recommendedPaymentTerms: data.pricing?.paymentTerms || 'À vista ou parcelado',
          deliverySchedule: data.pricing?.deliveryTime || '30 dias',
          warrantyTerms: 'Garantia de 12 meses para produtos e serviços'
        },
        calculations: {
          // Create a simple solar calculation result as base
          systemPower: 0,
          panelQuantity: 0,
          inverterQuantity: 0,
          monthlyGeneration: 0,
          monthlyBillBefore: 0,
          monthlyBillAfter: 0,
          monthlySavings: 0,
          annualSavings: 0,
          paybackPeriod: 0,
          roi25Years: 0,
          co2Reduction: 0,
          itemizedCosts: {
            panels: 0,
            inverters: 0,
            structure: 0,
            installation: 0,
            documentation: 0
          },
          totalCost: data.proposal?.total_value || 0,
          economicMetrics: {
            totalSavings25Years: 0,
            netProfit25Years: 0,
            monthlyROI: 0,
            breakEvenMonth: 0
          }
        },
        confidence: 85,
        suggestions: ['Considere manutenção preventiva', 'Aproveite condições especiais de pagamento'],
        // Include the generated link and unique ID from the edge function
        acceptanceLink: data.acceptanceLink,
        proposalId: data.proposal.id,
        uniqueId: data.proposal.uniqueId
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na geração da proposta');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateFromContext = useCallback(async (projectContextId: string): Promise<AIGenerationResult | null> => {
    try {
      // Get project context
      const { data: context, error: contextError } = await supabase
        .from('project_contexts')
        .select('*')
        .eq('id', projectContextId)
        .single();

      if (contextError || !context) {
        throw new Error('Contexto do projeto não encontrado');
      }

      // Analyze context
      const analysis = await analyzeContext(projectContextId);
      if (!analysis) {
        throw new Error('Falha ao analisar contexto');
      }

      // Build generation request using actual database fields
      const request: AIGenerationRequest = {
        projectContextId,
        clientData: {
          name: 'Cliente', // Will be filled by Edge Function from conversation data
          phone: '', // Will be filled by Edge Function from conversation data
          email: '', // Not available in project_contexts
        },
        productType: mapProductType(context.desired_product),
        calculationInput: buildCalculationInputFromContext(context.desired_product, context),
        customRequirements: analysis.specialRequirements,
        templatePreferences: {
          tone: 'friendly',
          includeWarranty: true,
          includeTestimonials: false,
          includeTechnicalSpecs: true
        }
      };

      return await generateProposal(request);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na geração da proposta');
      return null;
    }
  }, [analyzeContext, generateProposal]);

  return {
    isGenerating,
    generatedProposal,
    error,
    analyzeContext,
    generateProposal,
    generateFromContext
  };
}

// Helper function to map database product types to our ProductType enum
function mapProductType(desiredProduct: string | null): ProductType {
  if (!desiredProduct) return 'solar';
  
  const productMapping: Record<string, ProductType> = {
    'energia_solar': 'solar',
    'solar': 'solar',
    'solar_advanced': 'solar_advanced',
    'telha_shingle': 'shingle', 
    'shingle': 'shingle',
    'drywall_divisorias': 'drywall',
    'drywall': 'drywall',
    'divisoria': 'drywall',
    'steel_frame': 'steel_frame',
    'forros': 'ceiling',
    'ceiling': 'ceiling',
    'forro_drywall': 'forro_drywall',
    'battery_backup': 'battery_backup',
    'acoustic_mineral_ceiling': 'acoustic_mineral_ceiling',
    'forro_mineral_acustico': 'acoustic_mineral_ceiling'
  };
  
  return productMapping[desiredProduct.toLowerCase()] || 'solar';
}

function buildCalculationInputFromContext(productType: string | null, data: any): any {
  const baseInput = {
    complexity: 'medium' as const,
    region: 'southeast' as const,
    urgency: data.urgency === 'high' ? 'express' as const : 'normal' as const
  };

  const mappedProduct = mapProductType(productType);

  switch (mappedProduct) {
    case 'solar':
      return {
        ...baseInput,
        monthlyConsumption: data.energy_consumption ? parseInt(data.energy_consumption) : 300,
        roofType: 'ceramic',
        roofOrientation: 'north',
        shadowing: 'none',
        installationType: 'grid_tie'
      };
    case 'shingle':
      return {
        ...baseInput,
        roofArea: data.roof_size_m2 || data.construction_size_m2 || 100,
        roofSlope: 30,
        roofComplexity: 'medium',
        underlaymentType: 'standard',
        ventilationRequired: false,
        guttersIncluded: false
      };
    case 'drywall':
      return {
        ...baseInput,
        wallArea: data.floor_quantity_m2 || 50,
        wallHeight: 2.8,
        wallType: 'standard',
        finishType: 'level_4',
        insulationRequired: false,
        electricalInstallation: false
      };
    default:
      return baseInput;
  }
}

// Helper functions for context analysis
function extractClientNeeds(summary: string, extractedData: any): string[] {
  const needs = [];
  
  if (summary.toLowerCase().includes('economia') || extractedData.budget_range) {
    needs.push('Redução de custos');
  }
  if (summary.toLowerCase().includes('sustent')) {
    needs.push('Sustentabilidade');
  }
  if (summary.toLowerCase().includes('urgent') || extractedData.urgency === 'high') {
    needs.push('Execução urgente');
  }
  
  return needs;
}

function extractProductRequirements(productType: string | null, extractedData: any): Record<string, any> {
  const requirements: Record<string, any> = {};
  
  const mappedProduct = mapProductType(productType);
  
  switch (mappedProduct) {
    case 'solar':
      requirements.monthlyConsumption = extractedData.energy_consumption || 300;
      requirements.roofType = 'ceramic';
      requirements.area = extractedData.roof_size_m2 || 100;
      break;
    case 'shingle':
      requirements.roofArea = extractedData.roof_size_m2 || extractedData.construction_size_m2 || 100;
      requirements.roofSlope = 30;
      break;
    case 'drywall':
      requirements.wallArea = extractedData.floor_quantity_m2 || 50;
      requirements.wallHeight = 2.8;
      break;
  }
  
  return requirements;
}

function extractUrgencyLevel(summary: string, extractedData: any): 'low' | 'medium' | 'high' {
  if (summary.toLowerCase().includes('urgent') || extractedData.urgency === 'high') {
    return 'high';
  }
  if (summary.toLowerCase().includes('rápid') || extractedData.urgency === 'medium') {
    return 'medium';
  }
  return 'low';
}

function extractBudgetIndications(extractedData: any) {
  if (extractedData.budget_range) {
    // Try to parse budget range like "R$ 10.000 - R$ 20.000"
    const matches = extractedData.budget_range.match(/(\d+\.?\d*)/g);
    if (matches && matches.length >= 2) {
      const min = parseFloat(matches[0].replace('.', '')) * 1000;
      const max = parseFloat(matches[1].replace('.', '')) * 1000;
      return { min, max, preferred: (min + max) / 2 };
    }
  }
  return undefined;
}

function extractTimelineRequirements(extractedData: any) {
  if (extractedData.timeline) {
    return {
      preferred: extractedData.timeline,
    };
  }
  return undefined;
}

function extractSpecialRequirements(summary: string, extractedData: any): string[] {
  const requirements = [];
  
  if (summary.toLowerCase().includes('financiamento')) {
    requirements.push('Opções de financiamento');
  }
  if (extractedData.has_energy_backups) {
    requirements.push('Sistema de backup');
  }
  if (extractedData.has_architectural_project) {
    requirements.push('Projeto arquitetônico incluído');
  }
  
  return requirements;
}