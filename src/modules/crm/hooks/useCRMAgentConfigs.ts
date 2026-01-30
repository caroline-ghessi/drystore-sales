import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CRMAgentConfig {
  id: string;
  agent_name: string;
  agent_type: string;
  description: string | null;
  system_prompt: string;
  llm_model: string | null;
  temperature: number | null;
  max_tokens: number | null;
  is_active: boolean | null;
  product_category: string | null;
  output_schema: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CRMAgentConfigInput {
  agent_name: string;
  agent_type: 'crm_analyzer' | 'crm_extractor' | 'crm_classifier' | 'crm_coach';
  description?: string;
  system_prompt: string;
  llm_model?: string;
  temperature?: number;
  max_tokens?: number;
  is_active?: boolean;
  product_category?: string;
  output_schema?: Record<string, unknown>;
}

// Definição dos 8 agentes do sistema CRM
export const CRM_AGENT_DEFINITIONS = [
  {
    key: 'spin_analyzer',
    name: 'SPIN Analyzer',
    category: 'analysis',
    categoryLabel: 'Análise de Vendas',
    type: 'crm_analyzer' as const,
    description: 'Analisa em qual fase SPIN (Situação, Problema, Implicação, Necessidade) a conversa está',
    icon: '📊',
    outputSchema: {
      spin_stage: 'situation | problem | implication | need_payoff',
      spin_score: '0-100',
      indicators: 'string[]',
      confidence: '0.0-1.0'
    }
  },
  {
    key: 'bant_qualifier',
    name: 'BANT Qualifier',
    category: 'analysis',
    categoryLabel: 'Análise de Vendas',
    type: 'crm_analyzer' as const,
    description: 'Verifica qualificação do lead por Budget, Authority, Need e Timeline',
    icon: '✅',
    outputSchema: {
      bant_score: '0-100',
      budget: { identified: 'boolean', value: 'number | null', notes: 'string' },
      authority: { identified: 'boolean', decision_maker: 'string | null', notes: 'string' },
      need: { identified: 'boolean', urgency: 'low | medium | high', notes: 'string' },
      timeline: { identified: 'boolean', expected_date: 'string | null', notes: 'string' },
      qualified: 'boolean',
      confidence: '0.0-1.0'
    }
  },
  {
    key: 'objection_analyzer',
    name: 'Objection Analyzer',
    category: 'analysis',
    categoryLabel: 'Análise de Vendas',
    type: 'crm_analyzer' as const,
    description: 'Identifica objeções levantadas pelo cliente e como foram tratadas',
    icon: '🚧',
    outputSchema: {
      objections: [{
        type: 'price | time | trust | competition | need | other',
        description: 'string',
        treatment_status: 'not_addressed | partially_addressed | fully_addressed',
        vendor_response: 'string | null'
      }],
      total_objections: 'number',
      addressed_count: 'number',
      confidence: '0.0-1.0'
    }
  },
  {
    key: 'client_profiler',
    name: 'Client Profiler',
    category: 'extraction',
    categoryLabel: 'Extração de Dados',
    type: 'crm_extractor' as const,
    description: 'Extrai dados sobre a PESSOA: perfil, motivação, dores e processo de decisão',
    icon: '👤',
    outputSchema: {
      identification: { name: 'string', city: 'string', state: 'string' },
      profile: { type: 'cliente_final | tecnico | empresa', profession: 'string | null', is_technical: 'boolean' },
      origin: { channel: 'string', source: 'string', referred_by: 'string | null' },
      motivation: { main: 'string', secondary: 'string | null', trigger: 'string' },
      pain_points: [{ pain: 'string', intensity: 'low | medium | high', impact: 'string' }],
      decision: { is_decision_maker: 'boolean', others_involved: 'string[]', process: 'string' },
      confidence: '0.0-1.0'
    }
  },
  {
    key: 'project_extractor',
    name: 'Project Extractor',
    category: 'extraction',
    categoryLabel: 'Extração de Dados',
    type: 'crm_extractor' as const,
    description: 'Extrai dados sobre a OBRA/PROJETO: localização, especificações e cronograma',
    icon: '🏗️',
    outputSchema: {
      location: { city: 'string', neighborhood: 'string | null', address: 'string | null' },
      project_type: { nature: 'nova | reforma | ampliacao', category: 'residencial | comercial | industrial', phase: 'string' },
      professional: { has_architect: 'boolean', has_engineer: 'boolean', name: 'string | null' },
      technical_specs: 'object (varies by product category)',
      materials: { products_needed: 'string[]', quantities: 'object', specifications: 'string[]' },
      timeline: { urgency: 'low | medium | high', expected_start: 'string | null', restrictions: 'string | null' },
      confidence: '0.0-1.0'
    }
  },
  {
    key: 'deal_extractor',
    name: 'Deal Extractor',
    category: 'extraction',
    categoryLabel: 'Extração de Dados',
    type: 'crm_extractor' as const,
    description: 'Extrai dados sobre a NEGOCIAÇÃO: proposta, concorrência e valores',
    icon: '💰',
    outputSchema: {
      proposal: { requested: 'boolean', sent: 'boolean', value: 'number | null', items: 'string[]' },
      values: { client_mentioned: 'number | null', vendor_mentioned: 'number | null', budget_range: 'string | null' },
      competition: { is_comparing: 'boolean', competitors: [{ name: 'string', value: 'number | null', pros: 'string[]', cons: 'string[]' }] },
      negotiation: { discount_requested: 'number | null', discount_offered: 'number | null', justification: 'string | null' },
      payment: { preference: 'string | null', financing_interest: 'boolean', installment_interest: 'boolean' },
      visits: { offered: 'boolean', done: 'number', scheduled: 'string | null' },
      timeline: { first_contact: 'string', last_contact: 'string', days_in_negotiation: 'number', total_interactions: 'number' },
      confidence: '0.0-1.0'
    }
  },
  {
    key: 'pipeline_classifier',
    name: 'Pipeline Classifier',
    category: 'decision',
    categoryLabel: 'Decisão e Ação',
    type: 'crm_classifier' as const,
    description: 'Classifica o estágio atual da oportunidade no pipeline e calcula probabilidade',
    icon: '🎯',
    outputSchema: {
      stage: 'prospecting | qualification | proposal | negotiation | closing | won | lost',
      probability: '0-100',
      stage_reasoning: 'string',
      recommended_next_stage: 'string | null',
      blockers: 'string[]',
      confidence: '0.0-1.0'
    }
  },
  {
    key: 'coaching_generator',
    name: 'Coaching Generator',
    category: 'decision',
    categoryLabel: 'Decisão e Ação',
    type: 'crm_coach' as const,
    description: 'Gera recomendações e scripts de abordagem para o vendedor',
    icon: '🎓',
    outputSchema: {
      recommended_actions: [{ priority: 'high | medium | low', action: 'string', reasoning: 'string', script: 'string | null' }],
      approach_suggestions: 'string[]',
      timing_recommendation: { best_time: 'string', urgency: 'string', follow_up_in_days: 'number' },
      risk_alerts: [{ type: 'string', severity: 'low | medium | high', mitigation: 'string' }],
      confidence: '0.0-1.0'
    }
  }
];

export function useCRMAgentConfigs() {
  return useQuery({
    queryKey: ['crm-agent-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_configs')
        .select('*')
        .in('agent_type', ['crm_analyzer', 'crm_extractor', 'crm_classifier', 'crm_coach'])
        .order('agent_name');

      if (error) throw error;
      return data as CRMAgentConfig[];
    },
  });
}

export function useCRMAgentConfig(agentId: string | undefined) {
  return useQuery({
    queryKey: ['crm-agent-config', agentId],
    queryFn: async () => {
      if (!agentId) return null;
      
      const { data, error } = await supabase
        .from('agent_configs')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error) throw error;
      return data as CRMAgentConfig;
    },
    enabled: !!agentId,
  });
}

export function useCreateCRMAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CRMAgentConfigInput) => {
      const insertData: Record<string, unknown> = {
        agent_name: input.agent_name,
        agent_type: input.agent_type,
        description: input.description || null,
        system_prompt: input.system_prompt,
        llm_model: input.llm_model || 'google/gemini-3-flash-preview',
        temperature: input.temperature ?? 0.3,
        max_tokens: input.max_tokens ?? 2000,
        is_active: input.is_active ?? true,
        output_schema: input.output_schema || {},
      };
      
      // Only add product_category if provided and valid
      if (input.product_category) {
        insertData.product_category = input.product_category;
      }

      const { data, error } = await supabase
        .from('agent_configs')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-agent-configs'] });
      toast.success('Agente criado com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao criar agente: ${error.message}`);
    },
  });
}

export function useUpdateCRMAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CRMAgentConfigInput> & { id: string }) => {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.agent_name !== undefined) updateData.agent_name = updates.agent_name;
      if (updates.agent_type !== undefined) updateData.agent_type = updates.agent_type;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.system_prompt !== undefined) updateData.system_prompt = updates.system_prompt;
      if (updates.llm_model !== undefined) updateData.llm_model = updates.llm_model;
      if (updates.temperature !== undefined) updateData.temperature = updates.temperature;
      if (updates.max_tokens !== undefined) updateData.max_tokens = updates.max_tokens;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.output_schema !== undefined) updateData.output_schema = updates.output_schema;

      const { data, error } = await supabase
        .from('agent_configs')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['crm-agent-configs'] });
      queryClient.invalidateQueries({ queryKey: ['crm-agent-config', data.id] });
      toast.success('Agente atualizado com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar agente: ${error.message}`);
    },
  });
}

export function useToggleCRMAgentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('agent_configs')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-agent-configs'] });
      toast.success('Status do agente atualizado');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
}

export function useDeleteCRMAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agent_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-agent-configs'] });
      toast.success('Agente removido com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao remover agente: ${error.message}`);
    },
  });
}
