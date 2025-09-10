import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Printer, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProposalData {
  id: string;
  proposal_number: string;
  title: string;
  description: string;
  total_value: number;
  discount_value: number;
  discount_percentage: number;
  final_value: number;
  valid_until: string;
  status: string;
  created_at: string;
  items: Array<{
    id: string;
    custom_name: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    specifications: any;
  }>;
}

export default function PublicProposal() {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProposal();
    }
  }, [id]);

  const fetchProposal = async () => {
    try {
      // Fetch proposal by acceptance_link containing the unique ID
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .select(`
          *,
          proposal_items (
            id,
            custom_name,
            description,
            quantity,
            unit_price,
            total_price,
            specifications
          )
        `)
        .like('acceptance_link', `%${id}%`)
        .single();

      if (proposalError) {
        throw new Error('Proposta não encontrada');
      }

      setProposal({
        ...proposalData,
        items: proposalData.proposal_items || []
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isExpired = proposal ? new Date(proposal.valid_until) < new Date() : false;
  const isValid = proposal ? new Date(proposal.valid_until) >= new Date() : false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Proposta não encontrada</h2>
            <p className="text-gray-600">
              {error || 'A proposta solicitada não existe ou foi removida.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header com botões - apenas na visualização */}
      <div className="no-print bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Visualizar Proposta</h1>
              <p className="text-sm text-gray-600">
                Proposta Nº {proposal.proposal_number}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {isExpired && (
                <div className="flex items-center text-red-600 text-sm">
                  <XCircle className="h-4 w-4 mr-1" />
                  Expirada
                </div>
              )}
              {isValid && (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Válida
                </div>
              )}
              <Button onClick={handlePrint} size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo da proposta otimizado para A4 */}
      <div className="proposal-content max-w-4xl mx-auto p-8">
        {/* Header da proposta */}
        <div className="text-center mb-8 pb-6 border-b-4 border-blue-600">
          <div className="text-2xl font-bold text-blue-600 mb-2">DRY STORE</div>
          <h1 className="text-3xl font-bold text-blue-600 mb-2">PROPOSTA COMERCIAL</h1>
          <p className="text-gray-600">Proposta Nº {proposal.proposal_number}</p>
        </div>

        {/* Status da proposta - visual */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Status da Proposta</h3>
              <p className="text-sm text-gray-600">
                Válida até: {new Date(proposal.valid_until).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="flex items-center">
              {isExpired ? (
                <div className="flex items-center text-red-600">
                  <XCircle className="h-5 w-5 mr-2" />
                  <span className="font-semibold">EXPIRADA</span>
                </div>
              ) : (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-semibold">VÁLIDA</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informações da proposta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-600 mb-3">INFORMAÇÕES DA PROPOSTA</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Data:</strong> {new Date(proposal.created_at).toLocaleDateString('pt-BR')}</p>
              <p><strong>Validade:</strong> {Math.ceil((new Date(proposal.valid_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias</p>
              <p><strong>Condições:</strong> Conforme especificado nos itens</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-600 mb-3">RESUMO FINANCEIRO</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Valor Total:</strong> R$ {proposal.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              {proposal.discount_value > 0 && (
                <p><strong>Desconto:</strong> R$ {proposal.discount_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              )}
              <p className="text-lg font-bold text-blue-600">
                <strong>VALOR FINAL:</strong> R$ {proposal.final_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Itens da proposta */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-blue-600 mb-4">ITENS DA PROPOSTA</h3>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Item</th>
                  <th className="px-4 py-3 text-left">Descrição</th>
                  <th className="px-4 py-3 text-center">Qtd</th>
                  <th className="px-4 py-3 text-right">Valor Unit.</th>
                  <th className="px-4 py-3 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {proposal.items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3 font-medium">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{item.custom_name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      R$ {item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      R$ {item.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totais */}
        <div className="mb-8">
          <div className="flex justify-end">
            <div className="w-80">
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {proposal.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                {proposal.discount_value > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto:</span>
                    <span>- R$ {proposal.discount_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2">
                  <div className="flex justify-between text-xl font-bold text-blue-600">
                    <span>TOTAL GERAL:</span>
                    <span>R$ {proposal.final_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Termos e condições */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-blue-600 mb-3">TERMOS E CONDIÇÕES</h4>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>• Esta proposta tem validade até {new Date(proposal.valid_until).toLocaleDateString('pt-BR')};</li>
            <li>• Os preços estão sujeitos a alterações sem aviso prévio após o vencimento;</li>
            <li>• O início dos trabalhos está condicionado à aprovação desta proposta;</li>
            <li>• Garantia conforme especificações de cada fabricante;</li>
            <li>• Valores não incluem custos de instalação, a menos que especificado;</li>
            <li>• Frete será calculado de acordo com a localização da obra.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-gray-200">
          <p className="text-gray-600 mb-2">Obrigado pela oportunidade!</p>
          <p className="text-sm text-gray-500">
            Proposta gerada em {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <p>DRY STORE - Soluções em Construção Seca</p>
            <p>www.drystore.com.br</p>
          </div>
        </div>
      </div>

      {/* CSS adicional para impressão */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            
            .proposal-content {
              max-width: none !important;
              padding: 0 !important;
            }
            
            body {
              font-size: 12px !important;
              line-height: 1.4 !important;
            }
            
            h1, h2, h3 {
              page-break-after: avoid;
            }
            
            table {
              page-break-inside: avoid;
            }
            
            .page-break {
              page-break-before: always;
            }
            
            .no-print {
              display: none !important;
            }
          }
        `
      }} />
    </div>
  );
}