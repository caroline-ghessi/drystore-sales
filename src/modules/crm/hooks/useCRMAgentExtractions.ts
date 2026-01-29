import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CRMAgentExtraction {
  id: string;
  opportunity_id: string;
  agent_type: string;
  extraction_data: Record<string, unknown>;
  confidence: number;
  model_used: string | null;
  tokens_used: number;
  processing_time_ms: number;
  created_at: string;
  version: number;
}

export type AgentType = 
  | 'spin_analyzer'
  | 'bant_qualifier'
  | 'objection_analyzer'
  | 'client_profiler'
  | 'project_extractor'
  | 'deal_extractor'
  | 'pipeline_classifier'
  | 'coaching_generator';

export function useOpportunityExtractions(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ['crm-extractions', opportunityId],
    queryFn: async () => {
      if (!opportunityId) return [];

      const { data, error } = await supabase
        .from('crm_agent_extractions')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CRMAgentExtraction[];
    },
    enabled: !!opportunityId,
  });
}

export function useLatestExtractionByType(opportunityId: string | undefined, agentType: AgentType) {
  return useQuery({
    queryKey: ['crm-extraction', opportunityId, agentType],
    queryFn: async () => {
      if (!opportunityId) return null;

      const { data, error } = await supabase
        .from('crm_agent_extractions')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .eq('agent_type', agentType)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as CRMAgentExtraction | null;
    },
    enabled: !!opportunityId,
  });
}

export function useLatestExtractionsMap(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ['crm-extractions-map', opportunityId],
    queryFn: async () => {
      if (!opportunityId) return {};

      // Buscar a extração mais recente de cada tipo
      const { data, error } = await supabase
        .from('crm_agent_extractions')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar por tipo (mantendo apenas a mais recente)
      const extractionsMap: Record<AgentType, CRMAgentExtraction> = {} as Record<AgentType, CRMAgentExtraction>;
      
      for (const extraction of data || []) {
        const type = extraction.agent_type as AgentType;
        if (!extractionsMap[type]) {
          extractionsMap[type] = extraction as CRMAgentExtraction;
        }
      }

      return extractionsMap;
    },
    enabled: !!opportunityId,
  });
}

export function useExtractionHistory(opportunityId: string | undefined, agentType: AgentType) {
  return useQuery({
    queryKey: ['crm-extraction-history', opportunityId, agentType],
    queryFn: async () => {
      if (!opportunityId) return [];

      const { data, error } = await supabase
        .from('crm_agent_extractions')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .eq('agent_type', agentType)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as CRMAgentExtraction[];
    },
    enabled: !!opportunityId,
  });
}

export function useAgentMetrics() {
  return useQuery({
    queryKey: ['crm-agent-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_agent_extractions')
        .select('agent_type, tokens_used, processing_time_ms, confidence, created_at');

      if (error) throw error;

      // Agrupar métricas por tipo de agente
      const metrics: Record<string, {
        totalExecutions: number;
        totalTokens: number;
        avgProcessingTime: number;
        avgConfidence: number;
        lastExecution: string | null;
      }> = {};

      for (const extraction of data || []) {
        const type = extraction.agent_type;
        
        if (!metrics[type]) {
          metrics[type] = {
            totalExecutions: 0,
            totalTokens: 0,
            avgProcessingTime: 0,
            avgConfidence: 0,
            lastExecution: null,
          };
        }

        metrics[type].totalExecutions++;
        metrics[type].totalTokens += extraction.tokens_used || 0;
        metrics[type].avgProcessingTime += extraction.processing_time_ms || 0;
        metrics[type].avgConfidence += extraction.confidence || 0;
        
        if (!metrics[type].lastExecution || extraction.created_at > metrics[type].lastExecution) {
          metrics[type].lastExecution = extraction.created_at;
        }
      }

      // Calcular médias
      for (const type in metrics) {
        const m = metrics[type];
        if (m.totalExecutions > 0) {
          m.avgProcessingTime = Math.round(m.avgProcessingTime / m.totalExecutions);
          m.avgConfidence = m.avgConfidence / m.totalExecutions;
        }
      }

      return metrics;
    },
  });
}

export function useProcessOpportunityWithAgents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opportunityId: string) => {
      const { data, error } = await supabase.functions.invoke('crm-process-opportunity', {
        body: { opportunityId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, opportunityId) => {
      queryClient.invalidateQueries({ queryKey: ['crm-extractions', opportunityId] });
      queryClient.invalidateQueries({ queryKey: ['crm-extractions-map', opportunityId] });
      queryClient.invalidateQueries({ queryKey: ['crm-agent-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity-detail', opportunityId] });
      toast.success('Análise de IA concluída com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro na análise: ${error.message}`);
    },
  });
}

export function useTestAgentWithConversation() {
  return useMutation({
    mutationFn: async ({ 
      agentType, 
      vendorConversationId 
    }: { 
      agentType: AgentType; 
      vendorConversationId: number;
    }) => {
      const { data, error } = await supabase.functions.invoke(`crm-${agentType.replace(/_/g, '-')}`, {
        body: { vendorConversationId, testMode: true },
      });

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      toast.error(`Erro no teste: ${error.message}`);
    },
  });
}
