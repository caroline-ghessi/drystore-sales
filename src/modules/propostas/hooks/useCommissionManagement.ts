import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CommissionRule {
  id: string;
  discount_min: number;
  discount_max: number;
  commission_rate: number;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface CreateCommissionRule {
  discount_min: number;
  discount_max: number;
  commission_rate: number;
  description?: string;
}

interface UpdateCommissionRule extends CreateCommissionRule {
  is_active?: boolean;
}

interface CommissionCalculation {
  proposal_value: number;
  discount_percentage: number;
  discount_value: number;
  final_value: number;
  commission_rate: number;
  commission_value: number;
  rule_id: string;
}

export function useCommissionManagement() {
  const queryClient = useQueryClient();

  // Fetch commission rules
  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['commission-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_rules')
        .select('*')
        .order('discount_min', { ascending: true });

      if (error) throw error;
      return data as CommissionRule[];
    },
  });

  // Fetch vendors for reports
  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors-commission'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          id,
          name,
          email,
          phone_number,
          is_active
        `)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
  });

  // Create commission rule
  const createRuleMutation = useMutation({
    mutationFn: async (newRule: CreateCommissionRule) => {
      const { data, error } = await supabase
        .from('commission_rules')
        .insert(newRule)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
    },
  });

  // Update commission rule
  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateCommissionRule }) => {
      const { data, error } = await supabase
        .from('commission_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
    },
  });

  // Delete commission rule
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commission_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
    },
  });

  // Calculate commission based on discount percentage
  const calculateCommission = (proposalValue: number, discountPercentage: number): CommissionCalculation | null => {
    if (!rules || rules.length === 0) return null;

    // Find the appropriate rule based on discount percentage
    const applicableRule = rules.find(rule => 
      rule.is_active && 
      discountPercentage >= rule.discount_min && 
      discountPercentage <= rule.discount_max
    );

    if (!applicableRule) return null;

    const discountValue = (proposalValue * discountPercentage) / 100;
    const finalValue = proposalValue - discountValue;
    const commissionValue = (finalValue * applicableRule.commission_rate) / 100;

    return {
      proposal_value: proposalValue,
      discount_percentage: discountPercentage,
      discount_value: discountValue,
      final_value: finalValue,
      commission_rate: applicableRule.commission_rate,
      commission_value: commissionValue,
      rule_id: applicableRule.id
    };
  };

  // Get vendor commission history
  const { data: vendorCommissions } = useQuery({
    queryKey: ['vendor-commissions'],
    queryFn: async () => {
      // This would fetch actual commission data from vendor_approvals and saved_calculations
      // For now, returning mock data structure
      const { data, error } = await supabase
        .from('vendor_approvals')
        .select(`
          id,
          user_id,
          requested_amount,
          approved_amount,
          status,
          created_at,
          profiles!vendor_approvals_user_id_fkey(display_name)
        `)
        .eq('status', 'approved');

      if (error) throw error;

      // Transform data to include commission calculations
      return data?.map(approval => {
        const discountPercentage = approval.approved_amount && approval.requested_amount 
          ? ((approval.requested_amount - approval.approved_amount) / approval.requested_amount) * 100
          : 0;
        
        const commissionData = calculateCommission(approval.approved_amount || 0, discountPercentage);
        
        return {
          ...approval,
          discount_percentage: discountPercentage,
          commission_data: commissionData
        };
      }) || [];
    },
    enabled: !!rules,
  });

  return {
    rules,
    vendors,
    vendorCommissions,
    isLoading: rulesLoading || vendorsLoading,
    createRule: createRuleMutation.mutateAsync,
    updateRule: (id: string, updates: UpdateCommissionRule) => 
      updateRuleMutation.mutateAsync({ id, updates }),
    deleteRule: deleteRuleMutation.mutateAsync,
    calculateCommission,
    isCreating: createRuleMutation.isPending,
    isUpdating: updateRuleMutation.isPending,
    isDeleting: deleteRuleMutation.isPending,
  };
}