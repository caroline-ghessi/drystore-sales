import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface AcceptProposalOptions {
  proposalId: string;
  includeOrderBump?: boolean;
  orderBumpRuleId?: string;
}

export function useProposalActions() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const acceptProposal = async ({ proposalId, includeOrderBump, orderBumpRuleId }: AcceptProposalOptions) => {
    setLoading(true);
    try {
      // Atualizar status da proposta
      const { error: proposalError } = await supabase
        .from('proposals')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', proposalId);

      if (proposalError) throw proposalError;

      // Se incluir order bump, atualizar status
      if (includeOrderBump && orderBumpRuleId) {
        await supabase
          .from('proposal_order_bumps')
          .update({
            status: 'accepted',
            interacted_at: new Date().toISOString(),
          })
          .eq('proposal_id', proposalId)
          .eq('rule_id', orderBumpRuleId);
      } else if (orderBumpRuleId) {
        // Se existe order bump mas não foi aceito, marcar como rejected
        await supabase
          .from('proposal_order_bumps')
          .update({
            status: 'rejected',
            interacted_at: new Date().toISOString(),
          })
          .eq('proposal_id', proposalId)
          .eq('rule_id', orderBumpRuleId);
      }

      // Buscar informações da proposta para notificação
      const { data: proposalData } = await supabase
        .from('proposals')
        .select('created_by, proposal_number, title')
        .eq('id', proposalId)
        .single();

      if (proposalData) {
        // Criar notificação para o vendedor
        await supabase.from('user_notifications').insert({
          user_id: proposalData.created_by,
          type: 'proposal_accepted',
          title: '✅ Proposta Aceita!',
          message: includeOrderBump
            ? `A proposta #${proposalData.proposal_number} foi aceita com a promoção adicional!`
            : `A proposta #${proposalData.proposal_number} foi aceita pelo cliente.`,
          data: { proposalId, includeOrderBump },
        });
      }

      queryClient.invalidateQueries({ queryKey: ['order-bumps'] });

      toast({
        title: includeOrderBump ? '🎉 Proposta + Promoção Aceitas!' : '✅ Proposta Aceita',
        description: includeOrderBump
          ? 'Parabéns! Você aproveitou uma oferta especial. Em breve entraremos em contato.'
          : 'Sua proposta foi aceita com sucesso. Em breve entraremos em contato.',
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao aceitar proposta:', error);
      toast({
        title: 'Erro ao aceitar proposta',
        description: 'Não foi possível processar sua solicitação. Tente novamente.',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const rejectProposal = async (proposalId: string, reason?: string) => {
    setLoading(true);
    try {
      // Atualizar status da proposta
      const { error: proposalError } = await supabase
        .from('proposals')
        .update({
          status: 'rejected',
        })
        .eq('id', proposalId);

      if (proposalError) throw proposalError;

      // Buscar informações da proposta para notificação
      const { data: proposalData } = await supabase
        .from('proposals')
        .select('created_by, proposal_number, title')
        .eq('id', proposalId)
        .single();

      if (proposalData) {
        // Criar notificação para o vendedor
        await supabase.from('user_notifications').insert({
          user_id: proposalData.created_by,
          type: 'proposal_rejected',
          title: '❌ Proposta Recusada',
          message: reason
            ? `A proposta #${proposalData.proposal_number} foi recusada. Motivo: ${reason}`
            : `A proposta #${proposalData.proposal_number} foi recusada pelo cliente.`,
          data: { proposalId, reason },
        });
      }

      toast({
        title: 'Proposta Recusada',
        description: 'Sua resposta foi registrada. Obrigado pelo feedback.',
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao recusar proposta:', error);
      toast({
        title: 'Erro ao recusar proposta',
        description: 'Não foi possível processar sua solicitação. Tente novamente.',
        variant: 'destructive',
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async (proposalId: string) => {
    try {
      const { data: currentProposal } = await supabase
        .from('proposals')
        .select('status')
        .eq('id', proposalId)
        .single();

      // Só atualizar se estiver em 'sent'
      if (currentProposal?.status === 'sent') {
        await supabase
          .from('proposals')
          .update({ status: 'viewed' })
          .eq('id', proposalId);
      }
    } catch (error) {
      console.error('Erro ao marcar proposta como visualizada:', error);
    }
  };

  return {
    acceptProposal,
    rejectProposal,
    markAsViewed,
    loading,
  };
}
