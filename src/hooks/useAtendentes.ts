import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Atendente {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  phone?: string;
  department?: string;
  avatar_url?: string;
  is_active: boolean;
  role?: 'admin' | 'supervisor' | 'atendente';
  created_at: string;
  updated_at: string;
  invite_status?: 'confirmed' | 'pending' | 'not_sent';
  stats?: {
    total_conversations: number;
    avg_response_time: number;
    quality_score: number;
  };
}

export function useAtendentes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: atendentes = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['atendentes'],
    queryFn: async (): Promise<Atendente[]> => {
      console.log('🔍 Fetching atendentes...');

      // Buscar perfis ativos
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('📊 Found profiles:', profiles.length);

      // Buscar roles de todos os usuários
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.warn('⚠️ Error fetching user roles:', rolesError);
      }

      // Processar dados e buscar estatísticas
      const atendentesWithStats = await Promise.all(
        profiles.map(async (profile: any) => {
          // TODO: Implementar estatísticas de conversas quando tivermos sistema de atribuição
          const stats = {
            total_conversations: 0,
            avg_response_time: 0,
            quality_score: 0
          };

          // Encontrar role do usuário
          const userRole = userRoles?.find(role => role.user_id === profile.user_id);
          const role = (userRole?.role || 'atendente') as 'admin' | 'supervisor' | 'atendente';

          // Verificar status do convite no Supabase Auth
          let invite_status: 'confirmed' | 'pending' | 'not_sent' = 'confirmed';
          
          try {
            const { data: statusData, error: statusError } = await supabase.functions.invoke('check-invite-status', {
              body: { email: profile.email }
            });
            
            if (statusError) {
              console.warn('⚠️ Erro ao verificar status do convite:', statusError);
            } else if (statusData?.status) {
              invite_status = statusData.status;
            }
          } catch (error) {
            console.warn('⚠️ Erro ao verificar status do convite:', error);
            // Manter status padrão 'confirmed' em caso de erro
          }

          return {
            ...profile,
            role,
            invite_status,
            stats
          };
        })
      );

      console.log('✅ Processed atendentes:', atendentesWithStats.length);
      return atendentesWithStats;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const updateAtendenteMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Atendente> }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atendentes'] });
      toast({
        title: "Sucesso",
        description: "Atendente atualizado com sucesso",
      });
    },
    onError: (error) => {
      console.error('❌ Error updating atendente:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar atendente",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'supervisor' | 'atendente' }) => {
      // Remover role existente
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Adicionar nova role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atendentes'] });
      toast({
        title: "Sucesso",
        description: "Permissão atualizada com sucesso",
      });
    },
    onError: (error) => {
      console.error('❌ Error updating role:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar permissão",
        variant: "destructive",
      });
    },
  });

  return {
    atendentes,
    isLoading,
    error,
    refetch,
    updateAtendente: updateAtendenteMutation.mutateAsync,
    updateRole: updateRoleMutation.mutateAsync,
    isUpdating: updateAtendenteMutation.isPending || updateRoleMutation.isPending,
  };
}