import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DryStoreButton } from '../components/ui/DryStoreButton';
import { DryStoreBadge } from '../components/ui/DryStoreBadge';
import { 
  Search,
  Plus,
  Eye,
  Download,
  MessageSquare,
  Calendar,
  DollarSign,
  Calculator
} from 'lucide-react';

interface Proposal {
  id: string;
  clientName: string;
  value: number;
  status: 'enviada' | 'visualizada' | 'aprovada' | 'rejeitada' | 'pendente';
  type: 'solar' | 'shingle' | 'drywall' | 'steel_frame' | 'ceiling';
  date: string;
  lastUpdate: string;
}

export default function ProposalsListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Mock data - would come from database
  const proposals: Proposal[] = [
    {
      id: '1',
      clientName: 'João Silva',
      value: 125000,
      status: 'visualizada',
      type: 'solar',
      date: '2024-01-15',
      lastUpdate: '2024-01-16'
    },
    {
      id: '2',
      clientName: 'Maria Santos',
      value: 89000,
      status: 'enviada',
      type: 'shingle',
      date: '2024-01-12',
      lastUpdate: '2024-01-12'
    },
    {
      id: '3',
      clientName: 'Pedro Costa',
      value: 250000,
      status: 'aprovada',
      type: 'drywall',
      date: '2024-01-10',
      lastUpdate: '2024-01-14'
    },
    {
      id: '4',
      clientName: 'Ana Oliveira',
      value: 95000,
      status: 'pendente',
      type: 'steel_frame',
      date: '2024-01-08',
      lastUpdate: '2024-01-08'
    },
    {
      id: '5',
      clientName: 'Carlos Ferreira',
      value: 45000,
      status: 'rejeitada',
      type: 'ceiling',
      date: '2024-01-05',
      lastUpdate: '2024-01-07'
    }
  ];

  const filteredProposals = proposals.filter(proposal =>
    proposal.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Proposal['status']) => {
    switch (status) {
      case 'aprovada':
        return <DryStoreBadge variant="success">Aprovada</DryStoreBadge>;
      case 'visualizada':
        return <DryStoreBadge variant="info">Visualizada</DryStoreBadge>;
      case 'enviada':
        return <DryStoreBadge variant="drystore">Enviada</DryStoreBadge>;
      case 'pendente':
        return <DryStoreBadge variant="warning">Pendente</DryStoreBadge>;
      case 'rejeitada':
        return <DryStoreBadge variant="danger">Rejeitada</DryStoreBadge>;
      default:
        return <DryStoreBadge variant="info">Desconhecido</DryStoreBadge>;
    }
  };

  const getTypeLabel = (type: Proposal['type']) => {
    const types = {
      solar: 'Energia Solar',
      shingle: 'Telha Shingle',
      drywall: 'Drywall',
      steel_frame: 'Steel Frame',
      ceiling: 'Forros'
    };
    return types[type];
  };

  const getTotalValue = () => {
    return proposals.reduce((acc, proposal) => acc + proposal.value, 0);
  };

  const getStatusCount = (status: Proposal['status']) => {
    return proposals.filter(p => p.status === status).length;
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
          <DryStoreButton onClick={() => navigate('/propostas')}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Proposta
          </DryStoreButton>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-drystore-medium-gray">Total</p>
                <p className="text-2xl font-bold text-drystore-dark-gray">
                  {proposals.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-drystore-medium-gray">Aprovadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {getStatusCount('aprovada')}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-drystore-medium-gray">Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {getStatusCount('pendente')}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-drystore-medium-gray">Visualizadas</p>
                <p className="text-2xl font-bold text-drystore-orange">
                  {getStatusCount('visualizada')}
                </p>
              </div>
              <div className="w-10 h-10 bg-drystore-orange/10 rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5 text-drystore-orange" />
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
                  R$ {(getTotalValue() / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="w-10 h-10 bg-drystore-orange/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-drystore-orange" />
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

          {/* Proposals Table */}
          <div className="space-y-4">
            {filteredProposals.map((proposal) => (
              <div 
                key={proposal.id} 
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-white"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 bg-drystore-orange/10 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-semibold text-drystore-orange">
                      {proposal.clientName.charAt(0)}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-semibold text-drystore-dark-gray">
                        {proposal.clientName}
                      </h3>
                      {getStatusBadge(proposal.status)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-drystore-medium-gray">
                      <span>{getTypeLabel(proposal.type)}</span>
                      <span>•</span>
                      <span>Criada em {new Date(proposal.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-drystore-dark-gray">
                      R$ {proposal.value.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-drystore-medium-gray">Valor</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="font-semibold text-drystore-dark-gray">
                      {new Date(proposal.lastUpdate).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-drystore-medium-gray">Atualizada</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-6">
                  <Button variant="ghost" size="sm" className="text-drystore-medium-gray hover:text-drystore-orange" title="Visualizar">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-drystore-medium-gray hover:text-drystore-orange" title="Download">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-drystore-medium-gray hover:text-drystore-orange" title="Follow-up">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}