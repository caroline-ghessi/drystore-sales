import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  DollarSign,
  Calendar,
  FileText,
  Filter,
  Loader2,
  FileX
} from 'lucide-react';
import { DryStoreButton } from '@/modules/propostas/components/ui/DryStoreButton';
import { 
  useVendorApprovals, 
  useVendorApprovalsStats, 
  useApproveVendorApproval, 
  useRejectVendorApproval 
} from '../../hooks/useVendorApprovals';

export default function ApprovacoesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Hooks para dados reais
  const approvals = useVendorApprovals(statusFilter);
  const stats = useVendorApprovalsStats();
  const approveApproval = useApproveVendorApproval();
  const rejectApproval = useRejectVendorApproval();

  const filteredApprovals = approvals.data?.filter((approval) => {
    const matchesSearch = !searchTerm || 
      approval.justification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.approval_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || approval.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Pendente
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Aprovado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
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

  const handleApprove = async (approvalId: string) => {
    try {
      await approveApproval.mutateAsync({ 
        id: approvalId,
        // Pode passar approved_amount se necessário
      });
    } catch (error) {
      console.error('Erro ao aprovar:', error);
    }
  };

  const handleReject = async (approvalId: string) => {
    try {
      await rejectApproval.mutateAsync({ 
        id: approvalId,
        notes: 'Rejeitado pelo administrador'
      });
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
    }
  };

  if (approvals.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Central de Aprovações</h2>
          <p className="text-muted-foreground">
            Gerencie solicitações de aprovação de desconto
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Pendentes</div>
          <div className="text-2xl font-bold text-primary">{stats.pendingCount}</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <CheckCircle className="mr-2 h-4 w-4" />
              Aprovadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedCount}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <XCircle className="mr-2 h-4 w-4" />
              Rejeitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por justificativa ou tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovadas</option>
            <option value="rejected">Rejeitadas</option>
          </select>
        </div>
      </div>

      {/* Approvals List */}
      <div className="grid gap-6">
        {filteredApprovals.map((approval) => (
          <Card key={approval.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    Solicitação de Desconto #{approval.id.slice(-8)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Tipo: {approval.approval_type}
                  </p>
                </div>
                {getStatusBadge(approval.status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Solicitante</Label>
                  <p className="font-medium">{approval.user_id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Valor Solicitado</Label>
                  <p className="font-bold text-lg">
                    {approval.requested_amount ? `${approval.requested_amount}%` : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Data da Solicitação</Label>
                  <p>{formatDate(approval.requested_at)}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Justificativa</Label>
                <p className="text-sm bg-muted p-3 rounded-md mt-1">
                  {approval.justification || 'Nenhuma justificativa fornecida'}
                </p>
              </div>
              
              {approval.notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Observações do Aprovador</Label>
                  <p className="text-sm bg-blue-50 p-3 rounded-md mt-1 border border-blue-200">
                    {approval.notes}
                  </p>
                </div>
              )}
              
              {approval.status === 'approved' && approval.approver_id && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovado em {formatDate(approval.responded_at || '')}
                </div>
              )}
              
              {approval.status === 'rejected' && approval.approver_id && (
                <div className="flex items-center text-sm text-red-600">
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitado em {formatDate(approval.responded_at || '')}
                </div>
              )}
              
              {approval.status === 'pending' && (
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(approval.id)}
                    disabled={approveApproval.isPending}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(approval.id)}
                    disabled={rejectApproval.isPending}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {filteredApprovals.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca' 
                  : 'Não há solicitações de aprovação no momento'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}