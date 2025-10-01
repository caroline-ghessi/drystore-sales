import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UpdateProposalData {
  title?: string;
  description?: string;
  total_value?: number;
  discount_value?: number;
  discount_percentage?: number;
  final_value?: number;
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'viewed' | 'under_review';
  valid_until?: string;
  client_data?: any;
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (proposalId: string) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', proposalId);

      if (error) throw error;
      
      return proposalId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast({
        title: 'Proposta excluída',
        description: 'A proposta foi excluída com sucesso.',
      });
    },
    onError: (error: any) => {
      console.error('Error deleting proposal:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir a proposta.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateProposal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      proposalId, 
      data,
      changeSummary 
    }: { 
      proposalId: string; 
      data: UpdateProposalData;
      changeSummary?: string;
    }) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar dados anteriores para comparação
      const { data: oldProposal } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      // Atualizar proposta
      const { data: updatedProposal, error } = await supabase
        .from('proposals')
        .update({
          ...data,
          edited_by: user.id,
          edited_at: new Date().toISOString(),
        })
        .eq('id', proposalId)
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico de edições
      const changes: Record<string, any> = {};
      Object.keys(data).forEach(key => {
        if (oldProposal && oldProposal[key] !== data[key as keyof UpdateProposalData]) {
          changes[key] = {
            old: oldProposal[key],
            new: data[key as keyof UpdateProposalData],
          };
        }
      });

      if (Object.keys(changes).length > 0) {
        await supabase
          .from('proposal_edit_history')
          .insert({
            proposal_id: proposalId,
            edited_by: user.id,
            changes,
            change_summary: changeSummary || 'Proposta atualizada',
          });
      }

      return updatedProposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast({
        title: 'Proposta atualizada',
        description: 'As alterações foram salvas com sucesso.',
      });
    },
    onError: (error: any) => {
      console.error('Error updating proposal:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Não foi possível atualizar a proposta.',
        variant: 'destructive',
      });
    },
  });
}
