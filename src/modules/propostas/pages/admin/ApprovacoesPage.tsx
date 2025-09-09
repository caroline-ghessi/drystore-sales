import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  DollarSign,
  Calendar,
  FileText,
  Filter
} from 'lucide-react';
import { DryStoreButton } from '@/modules/propostas/components/ui/DryStoreButton';

interface DiscountApproval {
  id: string;
  proposalId: string;
  clientName: string;
  vendorName: string;
  vendorEmail: string;
  originalValue: number;
  discountPercentage: number;
  discountValue: number;
  finalValue: number;
  reason: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
}

export default function ApprovacoesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Mock data - would come from database
  const approvals: DiscountApproval[] = [
    {
      id: '1',
      proposalId: 'PROP-2024-001',
      clientName: 'Construtora ABC Ltda',
      vendorName: 'João Silva',
      vendorEmail: 'joao@empresa.com',
      originalValue: 50000,
      discountPercentage: 15,
      discountValue: 7500,
      finalValue: 42500,
      reason: 'Cliente solicitou desconto para fechar hoje',
      requestedAt: '2024-01-15T10:30:00Z',
      status: 'pending'
    },
    {
      id: '2',
      proposalId: 'PROP-2024-002',
      clientName: 'Incorporadora XYZ',
      vendorName: 'Maria Santos',
      vendorEmail: 'maria@empresa.com',
      originalValue: 75000,
      discountPercentage: 12,
      discountValue: 9000,
      finalValue: 66000,
      reason: 'Concorrência ofereceu preço menor',
      requestedAt: '2024-01-14T15:45:00Z',
      status: 'approved',
      approvedBy: 'Admin Master',
      approvedAt: '2024-01-14T16:20:00Z'
    },
    {
      id: '3',
      proposalId: 'PROP-2024-003',
      clientName: 'Reformas Silva & Cia',
      vendorName: 'Pedro Costa',
      vendorEmail: 'pedro@empresa.com',
      originalValue: 30000,
      discountPercentage: 20,
      discountValue: 6000,
      finalValue: 24000,
      reason: 'Desconto solicitado sem justificativa adequada',
      requestedAt: '2024-01-13T09:15:00Z',
      status: 'rejected',
      approvedBy: 'Admin Master',
      approvedAt: '2024-01-13T14:30:00Z'
    }
  ];

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = 
      approval.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.proposalId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || approval.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: DiscountApproval['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Pendente
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Aprovado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Rejeitado
          </Badge>
        );
      default:
        return <Badge variant="secondary">Indefinido</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApprove = (approvalId: string) => {
    console.log('Aprovando:', approvalId);
    // Implementar lógica de aprovação
  };

  const handleReject = (approvalId: string) => {
    console.log('Rejeitando:', approvalId);
    // Implementar lógica de rejeição
  };

  const getPendingCount = () => approvals.filter(a => a.status === 'pending').length;
  const getApprovedCount = () => approvals.filter(a => a.status === 'approved').length;
  const getRejectedCount = () => approvals.filter(a => a.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-drystore-dark-gray">Central de Aprovações</h2>
          <p className="text-drystore-medium-gray">
            Gerencie solicitações de aprovação de desconto
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-drystore-medium-gray">Pendentes</div>
          <div className="text-2xl font-bold text-drystore-orange">{getPendingCount()}</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-drystore-medium-gray flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-drystore-dark-gray">{getPendingCount()}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-drystore-medium-gray flex items-center">
              <CheckCircle className="mr-2 h-4 w-4" />
              Aprovadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-drystore-dark-gray">{getApprovedCount()}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-drystore-medium-gray flex items-center">
              <XCircle className="mr-2 h-4 w-4" />
              Rejeitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-drystore-dark-gray">{getRejectedCount()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por cliente, vendedor ou ID da proposta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-drystore-medium-gray" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-drystore-light-gray rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-drystore-orange"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovadas</option>
            <option value="rejected">Rejeitadas</option>
          </select>
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {filteredApprovals.map((approval) => (
          <Card key={approval.id} className="border-l-4 border-l-drystore-orange">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  {/* Header */}
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-drystore-light-orange rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-drystore-orange" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-drystore-dark-gray">{approval.proposalId}</h3>
                        {getStatusBadge(approval.status)}
                      </div>
                      <p className="text-sm text-drystore-medium-gray">{approval.clientName}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-drystore-medium-gray" />
                        <span className="text-sm text-drystore-medium-gray">
                          Vendedor: <span className="font-medium text-drystore-dark-gray">{approval.vendorName}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-drystore-medium-gray" />
                        <span className="text-sm text-drystore-medium-gray">
                          Solicitado em: <span className="font-medium text-drystore-dark-gray">{formatDate(approval.requestedAt)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-drystore-medium-gray">Valor Original:</span>
                        <span className="font-medium text-drystore-dark-gray">R$ {approval.originalValue.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-drystore-medium-gray">Desconto ({approval.discountPercentage}%):</span>
                        <span className="font-medium text-red-600">- R$ {approval.discountValue.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between border-t pt-2">
                        <span className="text-sm font-medium text-drystore-dark-gray">Valor Final:</span>
                        <span className="font-bold text-drystore-orange">R$ {approval.finalValue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="bg-drystore-light-gray/50 p-3 rounded-md">
                    <p className="text-sm text-drystore-medium-gray">
                      <span className="font-medium">Justificativa:</span> {approval.reason}
                    </p>
                  </div>

                  {/* Approval Info */}
                  {approval.status !== 'pending' && (
                    <div className="text-sm text-drystore-medium-gray">
                      {approval.status === 'approved' ? 'Aprovado' : 'Rejeitado'} por {approval.approvedBy} em {formatDate(approval.approvedAt!)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {approval.status === 'pending' && (
                  <div className="flex flex-col space-y-2 ml-4">
                    <DryStoreButton
                      size="sm"
                      onClick={() => handleApprove(approval.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Aprovar
                    </DryStoreButton>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(approval.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredApprovals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-drystore-medium-gray mx-auto mb-4" />
            <h3 className="text-lg font-medium text-drystore-dark-gray mb-2">
              Nenhuma solicitação encontrada
            </h3>
            <p className="text-drystore-medium-gray">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Não há solicitações de aprovação no momento'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}