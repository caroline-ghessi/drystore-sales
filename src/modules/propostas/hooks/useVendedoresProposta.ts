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
      const { data: vendors, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Por enquanto, retornar vendors sem mapping
      // TODO: Implementar mapping quando tabela estiver criada
      const vendorsWithProfiles = vendors?.map(vendor => ({
        ...vendor,
        profile: {
          user_id: vendor.id,
          display_name: vendor.name,
          email: `${vendor.name.toLowerCase().replace(' ', '.')}@empresa.com`,
          department: 'Vendas'
        }
      })) || [];

      return vendorsWithProfiles as VendorProposta[];
    },
  });
}

// Hook para criar mapeamento vendor -> user (mock por enquanto)
export function useCreateVendorMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, userId, roleType = 'sales_rep' }: {
      vendorId: string;
      userId: string;
      roleType?: string;
    }) => {
      // Mock por enquanto - implementar quando tabela estiver criada
      console.log('Create mapping (mock):', { vendorId, userId, roleType });
      return { id: 'new-mapping', vendor_id: vendorId, user_id: userId, role_type: roleType };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors-proposta'] });
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