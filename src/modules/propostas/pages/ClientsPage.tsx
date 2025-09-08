import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DryStoreButton } from '../components/ui/DryStoreButton';
import { DryStoreBadge } from '../components/ui/DryStoreBadge';
import { 
  Search,
  Plus,
  Mail,
  Phone,
  FileText,
  Eye,
  MessageSquare,
  Users
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastInteraction: string;
  proposalsCount: number;
  totalValue: number;
  status: 'ativo' | 'lead' | 'inativo';
}

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - would come from database
  const clients: Client[] = [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '(11) 99999-9999',
      lastInteraction: '2024-01-15',
      proposalsCount: 3,
      totalValue: 125000,
      status: 'ativo'
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@email.com',
      phone: '(11) 88888-8888',
      lastInteraction: '2024-01-12',
      proposalsCount: 1,
      totalValue: 89000,
      status: 'lead'
    },
    {
      id: '3',
      name: 'Pedro Costa',
      email: 'pedro@email.com',
      phone: '(11) 77777-7777',
      lastInteraction: '2024-01-10',
      proposalsCount: 5,
      totalValue: 250000,
      status: 'ativo'
    },
    {
      id: '4',
      name: 'Ana Oliveira',
      email: 'ana@email.com',
      phone: '(11) 66666-6666',
      lastInteraction: '2023-12-20',
      proposalsCount: 0,
      totalValue: 0,
      status: 'inativo'
    }
  ];

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Client['status']) => {
    switch (status) {
      case 'ativo':
        return <DryStoreBadge variant="success">Ativo</DryStoreBadge>;
      case 'lead':
        return <DryStoreBadge variant="warning">Lead</DryStoreBadge>;
      case 'inativo':
        return <DryStoreBadge variant="danger">Inativo</DryStoreBadge>;
      default:
        return <DryStoreBadge variant="info">Desconhecido</DryStoreBadge>;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-drystore-light-gray min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-drystore-dark-gray">Clientes</h1>
          <p className="text-drystore-medium-gray">
            Gerencie todos os seus clientes e relacionamentos
          </p>
        </div>
        <DryStoreButton>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </DryStoreButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-drystore-medium-gray">Total de Clientes</p>
                <p className="text-2xl font-bold text-drystore-dark-gray">
                  {clients.length}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-drystore-medium-gray">Clientes Ativos</p>
                <p className="text-2xl font-bold text-drystore-dark-gray">
                  {clients.filter(c => c.status === 'ativo').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-drystore-medium-gray">Novos Leads</p>
                <p className="text-2xl font-bold text-drystore-dark-gray">
                  {clients.filter(c => c.status === 'lead').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-orange-600" />
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
                  R$ {(clients.reduce((acc, client) => acc + client.totalValue, 0) / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="w-10 h-10 bg-drystore-orange/10 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-drystore-orange" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-drystore-dark-gray">Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-drystore-medium-gray" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Clients Table */}
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <div 
                key={client.id} 
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-white"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 bg-drystore-orange/10 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-semibold text-drystore-orange">
                      {client.name.charAt(0)}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-semibold text-drystore-dark-gray">
                        {client.name}
                      </h3>
                      {getStatusBadge(client.status)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-drystore-medium-gray">
                      <span className="flex items-center">
                        <Mail className="mr-1 h-3 w-3" />
                        {client.email}
                      </span>
                      <span className="flex items-center">
                        <Phone className="mr-1 h-3 w-3" />
                        {client.phone}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-drystore-dark-gray">
                      {client.proposalsCount}
                    </p>
                    <p className="text-drystore-medium-gray">Propostas</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="font-semibold text-drystore-dark-gray">
                      R$ {client.totalValue.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-drystore-medium-gray">Total</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="font-semibold text-drystore-dark-gray">
                      {new Date(client.lastInteraction).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-drystore-medium-gray">Último contato</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-6">
                  <Button variant="ghost" size="sm" className="text-drystore-medium-gray hover:text-drystore-orange">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-drystore-medium-gray hover:text-drystore-orange">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-drystore-medium-gray hover:text-drystore-orange">
                    <FileText className="h-4 w-4" />
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

// Missing import above is now included in the main import