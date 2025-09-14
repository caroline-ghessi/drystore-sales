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
  product_category?: string;
  calculation_data?: any;
  client_data?: any;
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

interface ProductTemplate {
  displayName: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryColor: string;
  accentColor: string;
  benefits: string[];
  warranties: Array<{
    component: string;
    duration: string;
    details: string;
  }>;
}

const getProductTemplate = (productCategory: string): ProductTemplate => {
  const templates: Record<string, ProductTemplate> = {
    'telha_shingle': {
      displayName: 'Telha Shingle',
      heroTitle: 'Sistema de Cobertura Telha Shingle',
      heroSubtitle: 'Solução completa para sua cobertura com tecnologia americana',
      primaryColor: '#8B4513',
      accentColor: '#D2691E',
      benefits: [
        'Resistência superior a ventos e intempéries',
        'Isolamento térmico e acústico excelente',
        'Baixa manutenção e alta durabilidade',
        'Design moderno e variadas opções de cores',
        'Sistema de ventilação natural integrado',
        'Instalação rápida e eficiente'
      ],
      warranties: [
        {
          component: 'Telhas Shingle',
          duration: '30 anos',
          details: 'Garantia contra defeitos de fabricação e resistência ao vento até 180 km/h'
        },
        {
          component: 'Manta Subcobertura',
          duration: '15 anos',
          details: 'Proteção contra infiltrações e umidade'
        }
      ]
    },
    'energia_solar': {
      displayName: 'Energia Solar',
      heroTitle: 'Sistema de Energia Solar Fotovoltaica',
      heroSubtitle: 'Economia garantida e sustentabilidade para sua casa ou empresa',
      primaryColor: '#FF8C00',
      accentColor: '#FFD700',
      benefits: [
        'Redução de até 95% na conta de energia',
        'Valorização do imóvel',
        'Contribuição para sustentabilidade',
        'Tecnologia de ponta',
        'Monitoramento em tempo real'
      ],
      warranties: [
        {
          component: 'Painéis Solares',
          duration: '25 anos',
          details: 'Garantia de performance linear de 25 anos'
        },
        {
          component: 'Inversor',
          duration: '12 anos',
          details: 'Garantia total do fabricante'
        }
      ]
    }
  };

  return templates[productCategory] || {
    displayName: 'Sistema Personalizado',
    heroTitle: 'Proposta Técnica Especializada',
    heroSubtitle: 'Solução profissional para sua necessidade',
    primaryColor: '#2563EB',
    accentColor: '#60A5FA',
    benefits: [
      'Qualidade garantida',
      'Atendimento especializado',
      'Suporte pós-venda'
    ],
    warranties: [
      {
        component: 'Materiais',
        duration: '2 anos',
        details: 'Garantia contra defeitos de fabricação'
      }
    ]
  };
};

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
      // Fetch proposal by proposal_number
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .select(`
          *,
          proposal_items (
            *
          )
        `)
        .eq('proposal_number', id)
        .single();

      if (proposalError) {
        console.error('Error fetching proposal:', proposalError);
        setError('Erro ao carregar proposta');
        return;
      }

      if (proposalData) {
        const formattedProposal: ProposalData = {
          id: proposalData.id,
          proposal_number: proposalData.proposal_number,
          title: proposalData.title,
          description: proposalData.description,
          total_value: proposalData.total_value,
          discount_value: proposalData.discount_value,
          discount_percentage: proposalData.discount_percentage,
          final_value: proposalData.final_value,
          valid_until: proposalData.valid_until,
          status: proposalData.status,
          created_at: proposalData.created_at,
          product_category: proposalData.project_type || 'generic',
          calculation_data: (proposalData as any).calculation_data || {},
          client_data: (proposalData as any).client_data || {},
          items: proposalData.proposal_items || []
        };
        setProposal(formattedProposal);
      } else {
        setError('Proposta não encontrada');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Erro ao carregar proposta');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Proposta não encontrada
            </h2>
            <p className="text-gray-600">
              {error || 'A proposta solicitada não existe ou foi removida.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(proposal.valid_until) < new Date();
  const statusIcon = isExpired ? XCircle : proposal.status === 'sent' ? Clock : CheckCircle;
  const statusColor = isExpired ? 'text-red-500' : proposal.status === 'sent' ? 'text-yellow-500' : 'text-green-500';
  const StatusIcon = statusIcon;
  
  // Obter template específico do produto
  const template = getProductTemplate(proposal.product_category || 'generic');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Específico do Produto */}
      <div 
        className="text-white"
        style={{ 
          background: `linear-gradient(135deg, ${template.primaryColor}, ${template.accentColor})` 
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold">{template.heroTitle}</h1>
            <p className="text-lg mt-2 opacity-90">{template.heroSubtitle}</p>
            <div className="mt-6 bg-white bg-opacity-10 rounded-lg p-4 inline-block">
              <p className="font-medium">Proposta Nº: {proposal.proposal_number}</p>
              <p className="text-sm">Data: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center space-x-2">
              <StatusIcon className={`h-5 w-5 ${statusColor}`} />
              <span className={`font-medium ${statusColor}`}>
                {isExpired ? 'Expirada' : proposal.status === 'sent' ? 'Enviada' : 'Válida'}
              </span>
            </div>
            <span className="mx-4">•</span>
            <p className="text-sm">
              Válida até: {new Date(proposal.valid_until).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Actions */}
        <div className="flex justify-center space-x-4 print:hidden">
          <Button onClick={handlePrint} className="flex items-center space-x-2">
            <Printer className="h-4 w-4" />
            <span>Imprimir</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </Button>
        </div>

        {/* Client Information */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Informações do Cliente</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nome</label>
                <p className="text-lg">{proposal.client_data?.name || proposal.title || 'Nome não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Telefone</label>
                <p className="text-lg">{proposal.client_data?.phone || 'Não informado'}</p>
              </div>
              {proposal.client_data?.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg">{proposal.client_data.email}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* KPIs Section - Específico por produto */}
        {proposal.calculation_data && proposal.product_category && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4" style={{ color: template.primaryColor }}>
                Destaques do Projeto
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {proposal.product_category === 'telha_shingle' && (
                  <>
                    <div className="text-center p-4 bg-gray-50 rounded-lg" style={{ borderLeft: `4px solid ${template.primaryColor}` }}>
                      <div className="text-2xl font-bold" style={{ color: template.primaryColor }}>
                        {proposal.calculation_data.totalRealArea || 0}m²
                      </div>
                      <div className="text-sm text-gray-600">Área Total Coberta</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg" style={{ borderLeft: `4px solid ${template.primaryColor}` }}>
                      <div className="text-2xl font-bold" style={{ color: template.primaryColor }}>
                        {proposal.calculation_data.shingleBundles || 0}
                      </div>
                      <div className="text-sm text-gray-600">Fardos de Telha</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg" style={{ borderLeft: `4px solid ${template.accentColor}` }}>
                      <div className="text-2xl font-bold" style={{ color: template.primaryColor }}>
                        30+ anos
                      </div>
                      <div className="text-sm text-gray-600">Vida Útil</div>
                    </div>
                  </>
                )}
                {proposal.product_category === 'energia_solar' && (
                  <>
                    <div className="text-center p-4 bg-gray-50 rounded-lg" style={{ borderLeft: `4px solid ${template.primaryColor}` }}>
                      <div className="text-2xl font-bold" style={{ color: template.primaryColor }}>
                        {proposal.calculation_data.systemPower || 0}kWp
                      </div>
                      <div className="text-sm text-gray-600">Potência Instalada</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg" style={{ borderLeft: `4px solid ${template.primaryColor}` }}>
                      <div className="text-2xl font-bold" style={{ color: template.primaryColor }}>
                        R$ {proposal.calculation_data.monthlySavings?.toFixed(2) || '0,00'}
                      </div>
                      <div className="text-sm text-gray-600">Economia Mensal</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg" style={{ borderLeft: `4px solid ${template.accentColor}` }}>
                      <div className="text-2xl font-bold" style={{ color: template.primaryColor }}>
                        {proposal.calculation_data.paybackYears || 0} anos
                      </div>
                      <div className="text-sm text-gray-600">Payback</div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items Table */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Itens da Proposta</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: template.primaryColor }}>
                    <th className="text-left p-3 text-white font-medium">Item</th>
                    <th className="text-left p-3 text-white font-medium">Quantidade</th>
                    <th className="text-left p-3 text-white font-medium">Valor Unit.</th>
                    <th className="text-left p-3 text-white font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {proposal.items.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{item.custom_name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-600">{item.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3">R$ {item.unit_price.toFixed(2)}</td>
                      <td className="p-3 font-medium">R$ {item.total_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: template.primaryColor }}>
              Benefícios
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {template.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: template.primaryColor }}
                  ></div>
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Warranties Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: template.primaryColor }}>
              Garantias
            </h2>
            <div className="space-y-4">
              {template.warranties.map((warranty, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg" style={{ borderLeft: `4px solid ${template.primaryColor}` }}>
                  <div className="font-semibold" style={{ color: template.primaryColor }}>
                    {warranty.component}
                  </div>
                  <div className="font-medium text-gray-900 mt-1">
                    {warranty.duration}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {warranty.details}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Resumo Financeiro</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Subtotal:</span>
                <span className="font-medium">R$ {proposal.total_value.toFixed(2)}</span>
              </div>
              {proposal.discount_value > 0 && (
                <div className="flex justify-between items-center text-red-600">
                  <span>Desconto ({proposal.discount_percentage}%):</span>
                  <span className="font-medium">- R$ {proposal.discount_value.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-bold" style={{ color: template.primaryColor }}>
                  R$ {proposal.final_value.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Conditions */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Termos e Condições</h2>
            <div className="prose prose-sm max-w-none">
              <p className="mb-3">
                <strong>Validade da Proposta:</strong> {new Date(proposal.valid_until).toLocaleDateString('pt-BR')}
              </p>
              <p className="mb-3">
                <strong>Condições de Pagamento:</strong> Conforme acordo estabelecido.
              </p>
              <p className="mb-3">
                <strong>Prazo de Entrega:</strong> Conforme cronograma apresentado.
              </p>
              <p>
                <strong>Observações:</strong> Esta proposta está sujeita à aprovação técnica e disponibilidade de materiais.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            body { background: white !important; }
            .print\\:hidden { display: none !important; }
            .page-break-inside-avoid { page-break-inside: avoid; }
          }
        `}
      </style>
    </div>
  );
}