import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VendorPermissions {
  id: string;
  vendor_id: string;
  access_level: 'basic' | 'intermediate' | 'advanced';
  max_discount_percentage: number;
  max_proposal_value: number;
  allowed_product_categories: string[];
  can_access_calculator: boolean;
  can_generate_proposals: boolean;
  can_save_calculations: boolean;
  can_view_ranking: boolean;
}

export interface UserRole {
  role: 'admin' | 'supervisor' | 'atendente' | 'vendedor';
}

export function useUserPermissions() {
  const { user } = useAuth();

  const { data: userRole } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: vendorPermissions } = useQuery({
    queryKey: ['vendor-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('vendor_permissions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id && userRole?.role === 'vendedor',
  });

  const isAdmin = userRole?.role === 'admin';
  const isSupervisor = userRole?.role === 'supervisor';
  const isVendor = userRole?.role === 'vendedor';
  const isAtendente = userRole?.role === 'atendente';

  const canEditProducts = isAdmin || isSupervisor;
  const canAccessAdminArea = isAdmin || isSupervisor;
  const canManageUsers = isAdmin;
  const canViewAllProposals = isAdmin || isSupervisor;
  const canViewAllMetrics = isAdmin || isSupervisor;

  // Vendor specific permissions
  const canAccessCalculator = vendorPermissions?.can_access_calculator ?? true;
  const canGenerateProposals = vendorPermissions?.can_generate_proposals ?? true;
  const canSaveCalculations = vendorPermissions?.can_save_calculations ?? true;
  const canViewRanking = vendorPermissions?.can_view_ranking ?? true;
  const maxDiscountPercentage = vendorPermissions?.max_discount_percentage ?? 5;
  const maxProposalValue = vendorPermissions?.max_proposal_value ?? 100000;

  return {
    userRole: userRole?.role,
    vendorPermissions,
    isAdmin,
    isSupervisor,
    isVendor,
    isAtendente,
    canEditProducts,
    canAccessAdminArea,
    canManageUsers,
    canViewAllProposals,
    canViewAllMetrics,
    canAccessCalculator,
    canGenerateProposals,
    canSaveCalculations,
    canViewRanking,
    maxDiscountPercentage,
    maxProposalValue,
    loading: !userRole,
  };
}