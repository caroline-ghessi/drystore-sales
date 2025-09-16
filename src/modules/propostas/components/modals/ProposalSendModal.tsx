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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Send, MessageCircle, Mail, FileText } from 'lucide-react';
import { ClientData } from '../../types/proposal.types';

interface ProposalSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (options: { whatsapp: boolean; email: boolean }) => void;
  clientData: ClientData;
  proposalSummary?: {
    totalValue: number;
    discountPercent: number;
    finalValue: number;
  };
}

export function ProposalSendModal({
  isOpen,
  onClose,
  onSend,
  clientData,
  proposalSummary
}: ProposalSendModalProps) {
  const [sendWhatsApp, setSendWhatsApp] = useState(!!clientData.phone);
  const [sendEmail, setSendEmail] = useState(!!clientData.email);

  const handleSend = () => {
    if (!sendWhatsApp && !sendEmail) {
      return;
    }

    onSend({
      whatsapp: sendWhatsApp,
      email: sendEmail
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Enviar Proposta para Cliente
          </DialogTitle>
          <DialogDescription>
            Confirme os canais de envio da proposta para {clientData.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo da proposta */}
          {proposalSummary && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Resumo da Proposta</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Valor Original:</span>
                  <p className="font-medium">
                    R$ {proposalSummary.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {proposalSummary.discountPercent > 0 && (
                  <div>
                    <span className="text-muted-foreground">Desconto:</span>
                    <p className="font-medium">
                      {proposalSummary.discountPercent}%
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Valor Final:</span>
                  <p className="font-medium text-primary">
                    R$ {proposalSummary.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Opções de envio */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Canais de Envio</Label>
            
            {clientData.phone && (
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="whatsapp"
                  checked={sendWhatsApp}
                  onCheckedChange={(checked) => setSendWhatsApp(checked as boolean)}
                />
                <div className="flex items-center space-x-2 flex-1">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <Label htmlFor="whatsapp" className="font-medium">
                      WhatsApp
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {clientData.phone}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {clientData.email && (
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id="email"
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                />
                <div className="flex items-center space-x-2 flex-1">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <div>
                    <Label htmlFor="email" className="font-medium">
                      E-mail
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {clientData.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!clientData.phone && !clientData.email && (
              <div className="text-center py-4 text-muted-foreground">
                <p>Nenhum canal de contato disponível.</p>
                <p className="text-sm">Adicione WhatsApp ou e-mail do cliente.</p>
              </div>
            )}
          </div>

          {/* Aviso */}
          <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
            <p>
              <strong>📋 O que acontecerá:</strong> A proposta será enviada com link de aceitação digital. 
              O cliente poderá visualizar, aprovar ou solicitar alterações diretamente pelo link.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSend}
            disabled={!sendWhatsApp && !sendEmail}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Enviar Proposta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}