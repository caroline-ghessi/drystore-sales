import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';

interface DiscountApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (justification: string, requestedDiscount: number) => void;
  maxAllowedDiscount: number;
  currentDiscount: number;
  totalValue: number;
}

export function DiscountApprovalModal({
  isOpen,
  onClose,
  onSubmit,
  maxAllowedDiscount,
  currentDiscount,
  totalValue
}: DiscountApprovalModalProps) {
  const [requestedDiscount, setRequestedDiscount] = useState(currentDiscount);
  const [justification, setJustification] = useState('');

  const handleSubmit = () => {
    if (!justification.trim() || requestedDiscount <= maxAllowedDiscount) {
      return;
    }

    onSubmit(justification, requestedDiscount);
    setJustification('');
  };

  const discountValue = (totalValue * requestedDiscount) / 100;
  const finalValue = totalValue - discountValue;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Solicitação de Aprovação de Desconto
          </DialogTitle>
          <DialogDescription>
            O desconto solicitado excede seu limite permitido de {maxAllowedDiscount}%. 
            Envie uma solicitação para aprovação do desconto adicional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor Original</Label>
              <p className="text-lg font-semibold">
                R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <Label>Seu Limite de Desconto</Label>
              <p className="text-sm text-muted-foreground">
                {maxAllowedDiscount}% (R$ {((totalValue * maxAllowedDiscount) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="requested-discount">Desconto Solicitado (%)</Label>
            <Input
              id="requested-discount"
              type="number"
              min={maxAllowedDiscount + 0.1}
              max="50"
              step="0.1"
              value={requestedDiscount}
              onChange={(e) => setRequestedDiscount(Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Desconto:</span>
                <p className="font-medium">
                  {requestedDiscount}% (R$ {discountValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Valor Final:</span>
                <p className="font-medium text-primary">
                  R$ {finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="justification">Justificativa *</Label>
            <Textarea
              id="justification"
              placeholder="Explique o motivo da solicitação de desconto adicional (ex: cliente fiel, concorrência, fechamento de meta, etc.)"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!justification.trim() || requestedDiscount <= maxAllowedDiscount}
          >
            Enviar Solicitação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}