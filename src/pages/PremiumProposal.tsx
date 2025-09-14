import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function PremiumProposal() {
  const { id } = useParams<{ id: string }>();
  const [proposalHtml, setProposalHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProposal();
    }
  }, [id]);

  const fetchProposal = async () => {
    try {
      // Primeiro, buscar os dados da proposta no banco
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .select('*')
        .eq('proposal_number', id)
        .single();

      if (proposalError || !proposalData) {
        setError('Proposta não encontrada');
        setLoading(false);
        return;
      }

      // Gerar HTML usando a edge function com os dados da proposta
      const { data, error: functionError } = await supabase.functions.invoke('generate-proposal', {
        body: {
          proposalId: proposalData.id,
          regenerate: true
        }
      });

      if (functionError) {
        console.error('Error regenerating proposal:', functionError);
        setError('Erro ao gerar proposta');
        setLoading(false);
        return;
      }

      if (data?.htmlContent) {
        setProposalHtml(data.htmlContent);
      } else {
        setError('Erro ao gerar conteúdo da proposta');
      }

    } catch (err) {
      console.error('Error:', err);
      setError('Erro ao carregar proposta');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Carregando proposta premium...</p>
        </div>
      </div>
    );
  }

  if (error || !proposalHtml) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Proposta não encontrada
          </h2>
          <p className="text-gray-600">
            {error || 'A proposta solicitada não existe ou não pôde ser carregada.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: proposalHtml }}
      style={{ 
        width: '100%',
        minHeight: '100vh',
        margin: 0,
        padding: 0
      }}
    />
  );
}