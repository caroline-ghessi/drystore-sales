import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VendorProposta {
  id: string;
  name: string;
  phone_number: string;
  whapi_channel_id: string;
  token_configured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Dados do perfil via mapping (mock por enquanto)
  profile?: {
    user_id: string;
    display_name: string;
    email: string;
    department?: string;
  };
}

export function useVendedoresProposta() {
  return useQuery({
    queryKey: ['vendors-proposta'],
    queryFn: async () => {
      // Buscar vendors com seus mapeamentos
      const { data: vendorsWithMapping, error } = await supabase
        .from('vendors')
        .select(`
          *,
          vendor_user_mapping(
            user_id,
            role_type,
            profiles(user_id, display_name, email, department)
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const vendorsWithProfiles = vendorsWithMapping?.map(vendor => ({
        ...vendor,
        profile: vendor.vendor_user_mapping?.[0]?.profiles ? {
          user_id: vendor.vendor_user_mapping[0].profiles.user_id,
          display_name: vendor.vendor_user_mapping[0].profiles.display_name,
          email: vendor.vendor_user_mapping[0].profiles.email,
          department: vendor.vendor_user_mapping[0].profiles.department || 'Vendas'
        } : null
      })) || [];

      return vendorsWithProfiles as VendorProposta[];
    },
  });
}

export function useCreateVendorMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, userId, roleType = 'sales_rep' }: {
      vendorId: string;
      userId: string;
      roleType?: string;
    }) => {
      const { data, error } = await supabase
        .from('vendor_user_mapping')
        .insert({
          vendor_id: vendorId,
          user_id: userId,
          role_type: roleType
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors-proposta'] });
      queryClient.invalidateQueries({ queryKey: ['sales-quotas'] });
    },
  });
}

// Hook para buscar apenas vendors sem mapeamento (mock por enquanto)
export function useUnmappedVendors() {
  return useQuery({
    queryKey: ['vendors-unmapped'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
  });
}