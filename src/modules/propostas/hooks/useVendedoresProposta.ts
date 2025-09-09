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
      // Buscar vendors ativos
      const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (vendorError) throw vendorError;

      // Buscar profiles que correspondem aos vendor IDs (mapeamento direto)
      const vendorIds = vendors?.map(v => v.id) || [];
      let profiles: any[] = [];
      
      if (vendorIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, email, department')
          .in('user_id', vendorIds);

        if (profilesError) throw profilesError;
        profiles = profilesData || [];
      }

      // Combinar dados usando ID direto (vendors.id = profiles.user_id)
      const vendorsWithProfiles = vendors?.map(vendor => {
        const profile = profiles.find(p => p.user_id === vendor.id);

        return {
          ...vendor,
          profile: profile ? {
            user_id: profile.user_id,
            display_name: profile.display_name,
            email: profile.email,
            department: profile.department || 'Vendas'
          } : null
        };
      }) || [];

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