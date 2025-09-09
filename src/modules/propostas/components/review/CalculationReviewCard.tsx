import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, MessageCircle, Clock, User, Calendar } from 'lucide-react';
import { SavedCalculation } from '../../hooks/useSavedCalculations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalculationReviewCardProps {
  calculation: SavedCalculation;
  onApprove: (id: string, comments?: string) => void;
  onReject: (id: string, comments: string) => void;
  onRequestChanges: (id: string, comments: string) => void;
  currentUserRole?: 'supervisor' | 'admin';
}

export function CalculationReviewCard({
  calculation,
  onApprove,
  onReject,
  onRequestChanges,
  currentUserRole = 'supervisor'
}: CalculationReviewCardProps) {
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'changes'>('approve');
  const [comments, setComments] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'aguardando_revisao': return 'default';
      case 'aprovado': return 'default';
      case 'rejeitado': return 'destructive';
      case 'alteracoes_solicitadas': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'aguardando_revisao': return 'Aguardando Revisão';
      case 'aprovado': return 'Aprovado';
      case 'rejeitado': return 'Rejeitado';
      case 'alteracoes_solicitadas': return 'Alterações Solicitadas';
      default: return status;
    }
  };

  const handleReviewAction = () => {
    switch (reviewAction) {
      case 'approve':
        onApprove(calculation.id, comments);
        break;
      case 'reject':
        onReject(calculation.id, comments);
        break;
      case 'changes':
        onRequestChanges(calculation.id, comments);
        break;
    }
    setShowReviewDialog(false);
    setComments('');
  };

  const openReviewDialog = (action: 'approve' | 'reject' | 'changes') => {
    setReviewAction(action);
    setShowReviewDialog(true);
  };

  const canReview = ['aguardando_revisao', 'alteracoes_solicitadas'].includes(calculation.status) && 
                   ['supervisor', 'admin'].includes(currentUserRole || '');

  return (
    <>
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{calculation.name}</CardTitle>
              <CardDescription className="flex items-center space-x-4">
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {calculation.client_data.name}
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(calculation.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </CardDescription>
            </div>
            <Badge variant={getStatusColor(calculation.status)}>
              {getStatusText(calculation.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Resumo do Cálculo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Produto</p>
              <p className="font-semibold capitalize">{calculation.product_type.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
              <p className="font-semibold text-primary">
                R$ {(calculation.calculation_result as any)?.totalCost?.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                }) || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cliente</p>
              <p className="font-semibold">{calculation.client_data.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
              <p className="font-semibold">{calculation.client_data.phone}</p>
            </div>
          </div>

          {/* Notas */}
          {calculation.notes && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm">
                <MessageCircle className="h-4 w-4 inline mr-1" />
                <strong>Observações:</strong> {calculation.notes}
              </p>
            </div>
          )}

          {/* Ações de Revisão */}
          {canReview && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button
                size="sm"
                onClick={() => openReviewDialog('approve')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openReviewDialog('changes')}
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <Clock className="h-4 w-4 mr-1" />
                Solicitar Alterações
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => openReviewDialog('reject')}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Rejeitar
              </Button>
            </div>
          )}

          {/* Status não revisável */}
          {!canReview && calculation.status !== 'draft' && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {calculation.status === 'aprovado' && '✅ Cálculo aprovado e pronto para gerar proposta'}
                {calculation.status === 'rejeitado' && '❌ Cálculo rejeitado - necessita refazer'}
                {calculation.status === 'ready_to_propose' && '📋 Pronto para proposta'}
                {!['aprovado', 'rejeitado', 'aguardando_revisao', 'alteracoes_solicitadas', 'ready_to_propose'].includes(calculation.status) && 
                 '⏳ Aguardando envio para revisão'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Revisão */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' && 'Aprovar Cálculo'}
              {reviewAction === 'reject' && 'Rejeitar Cálculo'}
              {reviewAction === 'changes' && 'Solicitar Alterações'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve' && 'Confirme a aprovação deste cálculo. Comentários são opcionais.'}
              {reviewAction === 'reject' && 'Informe o motivo da rejeição deste cálculo.'}
              {reviewAction === 'changes' && 'Descreva quais alterações são necessárias neste cálculo.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Resumo do Cálculo:</h4>
              <p className="text-sm">
                <strong>Cliente:</strong> {calculation.client_data.name}<br />
                <strong>Produto:</strong> {calculation.product_type}<br />
                <strong>Valor:</strong> R$ {(calculation.calculation_result as any)?.totalCost?.toLocaleString('pt-BR') || 'N/A'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">
                Comentários {reviewAction !== 'approve' && '*'}
              </label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  reviewAction === 'approve' ? 'Comentários opcionais sobre a aprovação...' :
                  reviewAction === 'reject' ? 'Descreva o motivo da rejeição...' :
                  'Descreva as alterações necessárias...'
                }
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleReviewAction}
              disabled={reviewAction !== 'approve' && !comments.trim()}
              variant={reviewAction === 'reject' ? 'destructive' : 'default'}
            >
              {reviewAction === 'approve' && 'Confirmar Aprovação'}
              {reviewAction === 'reject' && 'Confirmar Rejeição'}
              {reviewAction === 'changes' && 'Solicitar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}