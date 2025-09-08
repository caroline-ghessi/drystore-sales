import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AIGenerationRequest, AIGenerationResult, ContextAnalysis } from '../types/generation.types';
import { ProjectContext } from '../types/proposal.types';

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

      // Extract information from the context
      const extractedData = data;
      const summary = data.lead_summary || '';

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

      const result: AIGenerationResult = data;
      setGeneratedProposal(result);
      return result;
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

      // Build generation request
      const request: AIGenerationRequest = {
        projectContextId,
        clientData: {
          name: context.client_name || 'Cliente',
          phone: context.phone || '',
          email: context.email,
          address: context.project_address ? {
            street: context.project_address,
            city: context.city || '',
            state: context.state || '',
            number: '',
            neighborhood: '',
            zipCode: ''
          } : undefined
        },
        productType: context.desired_product as ProductType,
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

// Helper functions for context analysis
function extractClientNeeds(summary: string, extractedData: any): string[] {
  const needs = [];
  
  if (summary.toLowerCase().includes('economia') || extractedData.savings) {
    needs.push('Redução de custos');
  }
  if (summary.toLowerCase().includes('sustent') || extractedData.sustainability) {
    needs.push('Sustentabilidade');
  }
  if (summary.toLowerCase().includes('urgent') || extractedData.urgency) {
    needs.push('Execução urgente');
  }
  
  return needs;
}

function extractProductRequirements(productType: string, extractedData: any): Record<string, any> {
  const requirements: Record<string, any> = {};
  
  switch (productType) {
    case 'solar':
      requirements.monthlyConsumption = extractedData.monthly_consumption || 300;
      requirements.roofType = extractedData.roof_type || 'ceramic';
      requirements.area = extractedData.roof_area || 100;
      break;
    case 'shingle':
      requirements.roofArea = extractedData.roof_area || 100;
      requirements.roofSlope = extractedData.roof_slope || 30;
      break;
    case 'drywall':
      requirements.wallArea = extractedData.wall_area || 50;
      requirements.wallHeight = extractedData.wall_height || 2.8;
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
  if (extractedData.budget) {
    return {
      preferred: extractedData.budget,
      min: extractedData.budget * 0.8,
      max: extractedData.budget * 1.2
    };
  }
  return undefined;
}

function extractTimelineRequirements(extractedData: any) {
  if (extractedData.timeline || extractedData.deadline) {
    return {
      preferred: extractedData.timeline,
      deadline: extractedData.deadline
    };
  }
  return undefined;
}

function extractSpecialRequirements(summary: string, extractedData: any): string[] {
  const requirements = [];
  
  if (summary.toLowerCase().includes('financiamento')) {
    requirements.push('Opções de financiamento');
  }
  if (extractedData.warranty_extended) {
    requirements.push('Garantia estendida');
  }
  if (extractedData.maintenance_plan) {
    requirements.push('Plano de manutenção');
  }
  
  return requirements;
}

function buildCalculationInputFromContext(productType: string, data: any): any {
  const baseInput = {
    complexity: 'medium' as const,
    region: 'southeast' as const,
    urgency: 'normal' as const
  };

  switch (productType) {
    case 'energia_solar':
      return {
        ...baseInput,
        monthlyConsumption: data.energy_consumption || 300,
        roofType: 'ceramic',
        roofOrientation: 'north',
        shadowing: 'none',
        installationType: 'grid_tie'
      };
    case 'telha_shingle':
      return {
        ...baseInput,
        roofArea: data.construction_size_m2 || 100,
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