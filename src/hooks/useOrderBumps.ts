import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrderBumpRule {
  id: string;
  name: string;
  description: string | null;
  trigger_conditions: any;
  bump_title: string;
  bump_description: string;
  bump_image_url: string | null;
  bump_price: number | null;
  bump_discount_percentage: number | null;
  is_active: boolean;
  priority: number;
  max_displays: number | null;
  current_displays: number;
}

export interface ProposalOrderBump {
  id: string;
  proposal_id: string;
  rule_id: string;
  status: 'displayed' | 'clicked' | 'accepted' | 'rejected';
  bump_data: any;
  displayed_at: string;
  interacted_at: string | null;
}

export function useOrderBumps(proposalId: string, proposalData?: any) {
  const queryClient = useQueryClient();

  // Buscar order bumps aplicáveis para a proposta
  const { data: bumps, isLoading } = useQuery({
    queryKey: ['order-bumps', proposalId],
    queryFn: async () => {
      // 1. Buscar regras ativas
      const { data: rules, error: rulesError } = await supabase
        .from('order_bump_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (rulesError) throw rulesError;
      if (!rules || rules.length === 0) return [];

      // 2. Verificar quais já foram exibidos
      const { data: existingBumps } = await supabase
        .from('proposal_order_bumps')
        .select('rule_id, status')
        .eq('proposal_id', proposalId);

      const existingRuleIds = new Set(existingBumps?.map(b => b.rule_id) || []);

      // 3. Filtrar regras por condições
      const validBumps = rules.filter(rule => {
        // Já foi exibido? Pular
        if (existingRuleIds.has(rule.id)) return false;

        // Limite de exibições atingido?
        if (rule.max_displays && rule.current_displays >= rule.max_displays) {
          return false;
        }

        // Avaliar condições se houver dados da proposta
        if (proposalData && rule.trigger_conditions) {
          const conditions = rule.trigger_conditions as any;

          // Verificar faixa de valor
          if (conditions.min_value && proposalData.final_value < conditions.min_value) {
            return false;
          }
          if (conditions.max_value && proposalData.final_value > conditions.max_value) {
            return false;
          }

          // Verificar categoria de produto
          if (conditions.product_category && Array.isArray(conditions.product_category)) {
            if (!conditions.product_category.includes(proposalData.category)) {
              return false;
            }
          }
        }

        return true;
      });

      // 4. Limitar a 2 bumps por proposta
      return validBumps.slice(0, 2);
    },
    enabled: !!proposalId,
  });

  // Registrar exibição
  const registerDisplay = useMutation({
    mutationFn: async (ruleId: string) => {
      const rule = bumps?.find(b => b.id === ruleId);
      if (!rule) return;

      const { error } = await supabase
        .from('proposal_order_bumps')
        .insert({
          proposal_id: proposalId,
          rule_id: ruleId,
          status: 'displayed',
          bump_data: {
            title: rule.bump_title,
            description: rule.bump_description,
            image_url: rule.bump_image_url,
            price: rule.bump_price,
            discount_percentage: rule.bump_discount_percentage,
          },
        });

      if (error) throw error;

      // Incrementar contador de exibições
      await supabase
        .from('order_bump_rules')
        .update({ current_displays: rule.current_displays + 1 })
        .eq('id', ruleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-bumps', proposalId] });
    },
  });

  // Atualizar status de interação
  const updateInteraction = useMutation({
    mutationFn: async ({
      ruleId,
      action,
    }: {
      ruleId: string;
      action: 'clicked' | 'accepted' | 'rejected';
    }) => {
      const { error } = await supabase
        .from('proposal_order_bumps')
        .update({
          status: action,
          interacted_at: new Date().toISOString(),
        })
        .eq('proposal_id', proposalId)
        .eq('rule_id', ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-bumps', proposalId] });
    },
  });

  return {
    bumps,
    isLoading,
    registerDisplay: registerDisplay.mutate,
    updateInteraction: updateInteraction.mutate,
  };
}
