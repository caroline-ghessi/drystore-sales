import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Download, Eye, MessageCircle, MoreHorizontal, Loader2, Calculator } from 'lucide-react';
import { DryStoreBadge } from '@/modules/propostas/components/ui/DryStoreBadge';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useProposals, useProposalStats } from '../hooks/useProposals';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ProposalsListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  // Buscar dados reais das propostas
  const { data: proposalsData = [], isLoading, error } = useProposals();
  const stats = useProposalStats();

  // Função para extrair dados do cliente do JSON
  const getClientData = (clientData: any) => {
    if (typeof clientData === 'string') {
      try {
        return JSON.parse(clientData);
      } catch {
        return { name: 'Cliente não informado', phone: '', email: '' };
      }
    }
    return clientData || { name: 'Cliente não informado', phone: '', email: '' };
  };

  // Filtrar propostas baseado no termo de busca
  const filteredProposals = proposalsData.filter(proposal => {
    const clientData = getClientData(proposal.client_data);
    return clientData?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Função para renderizar badge baseado no status
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'draft' as const, label: 'Rascunho' },
      sent: { variant: 'sent' as const, label: 'Enviada' },
      accepted: { variant: 'accepted' as const, label: 'Aceita' },
      rejected: { variant: 'rejected' as const, label: 'Rejeitada' },
      expired: { variant: 'expired' as const, label: 'Expirada' },
      viewed: { variant: 'viewed' as const, label: 'Visualizada' },
      under_review: { variant: 'under_review' as const, label: 'Em Análise' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <DryStoreBadge variant={config?.variant || 'default'}>{config?.label || status}</DryStoreBadge>;
  };

  // Função para obter label do tipo de proposta
  const getTypeLabel = (type: string) => {
    const typeLabels = {
      energia_solar: 'Energia Solar',
      telha_shingle: 'Telha Shingle', 
      drywall: 'Drywall',
      forro_drywall: 'Forro Drywall',
      impermeabilizacao_mapei: 'Impermeabilização MAPEI',
      preparacao_piso_mapei: 'Preparação de Piso MAPEI',
      forro_mineral_acustico: 'Forro Mineral Acústico'
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  return (
    <div className="p-6 space-y-6 bg-drystore-light-gray min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-drystore-dark-gray">Propostas</h1>
          <p className="text-drystore-medium-gray">
            Gerencie todas as suas propostas comerciais
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/propostas/calculos-salvos')}
            className="border-drystore-orange text-drystore-orange hover:bg-drystore-orange hover:text-white"
          >
            <Calculator className="mr-2 h-4 w-4" />
            Cálculos Salvos
          </Button>
          <Button 
            onClick={() => navigate('/propostas')}
            className="bg-drystore-orange hover:bg-drystore-orange/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Proposta
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-drystore-medium-gray">Total de Propostas</p>
                <p className="text-2xl font-bold text-drystore-dark-gray">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-drystore-medium-gray">Aceitas</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-drystore-medium-gray">Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-drystore-medium-gray">Enviadas</p>
                <p className="text-2xl font-bold text-drystore-orange">{stats.visualized}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-drystore-medium-gray">Valor Total</p>
                <p className="text-2xl font-bold text-drystore-dark-gray">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    notation: 'compact',
                    maximumFractionDigits: 0
                  }).format(stats.totalValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-drystore-dark-gray">Lista de Propostas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-drystore-medium-gray" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de Propostas */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Carregando propostas...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>Erro ao carregar propostas.</p>
              <p className="text-sm">Tente recarregar a página.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProposals.map((proposal) => {
                const clientData = getClientData(proposal.client_data);
                return (
                  <div 
                    key={proposal.id} 
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-white"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-drystore-orange/10 rounded-lg flex items-center justify-center">
                        <span className="text-lg font-semibold text-drystore-orange">
                          {(clientData?.name || 'C').charAt(0)}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="font-semibold text-drystore-dark-gray">
                            {clientData?.name || 'Cliente não informado'}
                          </h3>
                          {getStatusBadge(proposal.status)}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-drystore-medium-gray">
                          <span>{getTypeLabel(proposal.project_type)}</span>
                          <span>•</span>
                          <span>Criada em {format(new Date(proposal.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          {proposal.profiles?.display_name && (
                            <>
                              <span>•</span>
                              <span>Por: {proposal.profiles.display_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-drystore-dark-gray">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(proposal.final_value || 0)}
                        </p>
                        <p className="text-drystore-medium-gray">Valor</p>
                        {proposal.discount_percentage > 0 && (
                          <p className="text-xs text-green-600">
                            Desconto: {proposal.discount_percentage}%
                          </p>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <p className="font-semibold text-drystore-dark-gray">
                          {format(new Date(proposal.updated_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <p className="text-drystore-medium-gray">Atualizada</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-6">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-drystore-medium-gray hover:text-drystore-orange" 
                        title="Visualizar"
                        onClick={() => window.open(proposal.acceptance_link, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-drystore-medium-gray hover:text-drystore-orange" title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-drystore-medium-gray hover:text-drystore-orange" title="Follow-up">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-drystore-medium-gray hover:text-drystore-orange">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem>Duplicar</DropdownMenuItem>
                          <DropdownMenuItem>Arquivar</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
              
              {filteredProposals.length === 0 && !isLoading && (
                <div className="text-center py-8 text-drystore-medium-gray">
                  <p>Nenhuma proposta encontrada.</p>
                  <p className="text-sm">Tente ajustar os filtros ou criar uma nova proposta.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalsListPage;