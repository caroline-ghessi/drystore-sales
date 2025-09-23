import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResendInviteRequest {
  email: string;
  displayName: string;
  department?: string;
  role: 'admin' | 'supervisor' | 'atendente' | 'vendedor';
}

interface DeleteUserRequest {
  userId: string;
  deleteType: 'soft' | 'hard';
}

interface CancelInviteRequest {
  email: string;
}

export function useInviteManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resendInviteMutation = useMutation({
    mutationFn: async (inviteData: ResendInviteRequest) => {
      console.log('🔄 Reenviando convite para:', inviteData.email);
      
      const { data, error } = await supabase.functions.invoke('send-invite-email', {
        body: inviteData
      });

      if (error) {
        console.error('❌ Erro ao reenviar convite:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Convite Reenviado",
        description: `Convite reenviado para ${variables.email} com sucesso`,
      });
      queryClient.invalidateQueries({ queryKey: ['atendentes'] });
    },
    onError: (error: any) => {
      console.error('❌ Error resending invite:', error);
      toast({
        title: "Erro ao Reenviar",
        description: error.message || "Erro ao reenviar convite",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (deleteData: DeleteUserRequest) => {
      console.log('🗑️ Deletando usuário:', deleteData);
      
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: deleteData
      });

      if (error) {
        console.error('❌ Erro ao deletar usuário:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.deleteType === 'soft' ? 'Usuário Desativado' : 'Usuário Removido',
        description: variables.deleteType === 'soft' 
          ? 'Usuário foi desativado com sucesso'
          : 'Usuário foi removido permanentemente',
      });
      queryClient.invalidateQueries({ queryKey: ['atendentes'] });
    },
    onError: (error: any) => {
      console.error('❌ Error deleting user:', error);
      toast({
        title: "Erro ao Remover",
        description: error.message || "Erro ao remover usuário",
        variant: "destructive",
      });
    },
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (cancelData: CancelInviteRequest) => {
      console.log('🚫 Cancelando convite:', cancelData);
      
      const { data, error } = await supabase.functions.invoke('cancel-invite', {
        body: cancelData
      });

      if (error) {
        console.error('❌ Erro ao cancelar convite:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Convite Cancelado",
        description: `Convite para ${variables.email} foi cancelado com sucesso`,
      });
      queryClient.invalidateQueries({ queryKey: ['atendentes'] });
    },
    onError: (error: any) => {
      console.error('❌ Error cancelling invite:', error);
      toast({
        title: "Erro ao Cancelar",
        description: error.message || "Erro ao cancelar convite",
        variant: "destructive",
      });
    },
  });

  return {
    resendInvite: resendInviteMutation.mutateAsync,
    isResending: resendInviteMutation.isPending,
    deleteUser: deleteUserMutation.mutateAsync,
    isDeleting: deleteUserMutation.isPending,
    cancelInvite: cancelInviteMutation.mutateAsync,
    isCancelling: cancelInviteMutation.isPending,
  };
}