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
      // Buscar apenas vendors por enquanto (vendor_user_mapping será criado depois)
      const { data: vendors, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Por enquanto retornar vendors sem mapeamento de perfil
      const vendorsWithProfiles = vendors?.map(vendor => ({
        ...vendor,
        profile: null // Será preenchido quando a tabela vendor_user_mapping for criada
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
      // Mock implementation - será implementado quando a tabela vendor_user_mapping for criada
      console.log('Mock: Creating vendor mapping', { vendorId, userId, roleType });
      
      // Simular sucesso
      return Promise.resolve({
        id: crypto.randomUUID(),
        vendor_id: vendorId,
        user_id: userId,
        role_type: roleType,
        created_at: new Date().toISOString()
      });
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