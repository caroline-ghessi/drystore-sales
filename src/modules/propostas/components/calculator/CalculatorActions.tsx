import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, Send, Download, Trash2 } from 'lucide-react';
import { SavedCalculation, useSavedCalculations } from '../../hooks/useSavedCalculations';

interface CalculatorActionsProps {
  calculation: SavedCalculation | null;
  onSave?: () => void;
  onDiscard?: () => void;
  onGenerateProposal?: () => void;
}

export function CalculatorActions({
  calculation,
  onSave,
  onDiscard,
  onGenerateProposal
}: CalculatorActionsProps) {
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const { updateCalculation, isUpdating } = useSavedCalculations();

  const handleSendForReview = () => {
    if (!calculation) return;
    
    updateCalculation({
      id: calculation.id,
      updates: {
        status: 'aguardando_revisao',
        notes: reviewNotes ? `${calculation.notes || ''}\n\n[ENVIO PARA REVISÃO] ${reviewNotes}`.trim() : calculation.notes
      }
    });
    
    setShowReviewDialog(false);
    setReviewNotes('');
  };

  const canSendForReview = calculation && ['draft', 'alteracoes_solicitadas'].includes(calculation.status);
  const canGenerateProposal = calculation && calculation.status === 'aprovado';
  
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Salvar Cálculo */}
        <Button 
          variant="outline"
          onClick={onSave}
          disabled={!onSave}
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar Cálculo
        </Button>

        {/* Enviar para Revisão */}
        {canSendForReview && (
          <Button 
            onClick={() => setShowReviewDialog(true)}
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="mr-2 h-4 w-4" />
            Enviar para Revisão
          </Button>
        )}

        {/* Gerar Proposta */}
        {canGenerateProposal && (
          <Button 
            onClick={onGenerateProposal}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Gerar Proposta
          </Button>
        )}

        {/* Descartar */}
        <Button 
          variant="destructive"
          onClick={onDiscard}
          disabled={!onDiscard}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Descartar
        </Button>
      </div>

      {/* Dialog para Envio para Revisão */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar para Revisão</DialogTitle>
            <DialogDescription>
              Este cálculo será enviado para revisão e aprovação. Adicione observações se necessário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Resumo do Cálculo:</h4>
              <p className="text-sm">
                <strong>Cliente:</strong> {calculation?.client_data.name}<br />
                <strong>Produto:</strong> {calculation?.product_type}<br />
                <strong>Valor:</strong> R$ {(calculation?.calculation_result as any)?.totalCost?.toLocaleString('pt-BR') || 'N/A'}
              </p>
            </div>

            <div>
              <Label htmlFor="review-notes">Observações (opcionais)</Label>
              <Textarea
                id="review-notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Adicione informações adicionais para o revisor..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendForReview}
              disabled={isUpdating}
            >
              Enviar para Revisão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}