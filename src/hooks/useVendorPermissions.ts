import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useVendorPermissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['vendor-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('vendor_permissions')
        .select(`
          *,
          vendor_user_mapping!inner(
            vendor_id,
            vendors(name, email)
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}