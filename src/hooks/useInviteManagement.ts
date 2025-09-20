import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResendInviteRequest {
  email: string;
  displayName: string;
  department?: string;
  role: 'admin' | 'supervisor' | 'atendente' | 'vendedor';
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

  return {
    resendInvite: resendInviteMutation.mutateAsync,
    isResending: resendInviteMutation.isPending,
  };
}