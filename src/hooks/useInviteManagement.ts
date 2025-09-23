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
      console.log('🔄 Iniciando reenvio de convite para:', inviteData.email);
      console.log('📊 Dados do convite:', {
        email: inviteData.email,
        displayName: inviteData.displayName,
        role: inviteData.role,
        department: inviteData.department
      });
      
      const { data, error } = await supabase.functions.invoke('send-invite-email', {
        body: inviteData
      });

      if (error) {
        console.error('❌ Erro na chamada da edge function:', error);
        console.error('📝 Detalhes do erro:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Melhorar mensagem de erro baseada no tipo
        let userFriendlyMessage = error.message || 'Erro desconhecido ao enviar convite';
        
        if (error.message?.includes('535') || error.message?.includes('API key')) {
          userFriendlyMessage = 'Erro de configuração SMTP. Verifique as configurações de email no sistema.';
        } else if (error.message?.includes('SMTP')) {
          userFriendlyMessage = 'Erro no envio do email. Verifique as configurações de SMTP.';
        } else if (error.message?.includes('JSON')) {
          userFriendlyMessage = 'Erro nos dados enviados. Tente novamente.';
        }
        
        const enhancedError = new Error(userFriendlyMessage);
        (enhancedError as any).originalError = error;
        throw enhancedError;
      }

      console.log('✅ Resposta da edge function:', data);
      
      // Verificar se o response indica sucesso
      if (!data?.success) {
        console.error('❌ Edge function retornou erro:', data);
        const errorMessage = data?.error || 'Falha no envio do convite';
        throw new Error(errorMessage);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      console.log('🎉 Convite reenviado com sucesso!', {
        email: variables.email,
        requestId: data?.requestId,
        attempts: data?.attempts
      });
      
      toast({
        title: "Convite Enviado ✅",
        description: `Convite enviado para ${variables.email} com sucesso${data?.attempts > 1 ? ` (${data.attempts} tentativas)` : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ['atendentes'] });
    },
    onError: (error: any, variables) => {
      console.error('❌ Falha final no reenvio do convite:', {
        email: variables.email,
        error: error.message,
        originalError: error.originalError
      });
      
      toast({
        title: "Erro ao Enviar Convite ❌",
        description: error.message || "Erro ao reenviar convite. Tente novamente.",
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