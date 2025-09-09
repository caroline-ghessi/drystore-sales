import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCreateVendorAccount } from '../../hooks/useCreateVendorAccount';
import { Mail, User, CheckCircle, Send, AlertCircle } from 'lucide-react';

interface VendorAccountCreationModalProps {
  open: boolean;
  onClose: () => void;
  vendors?: any[];
}

export function VendorAccountCreationModal({ open, onClose, vendors = [] }: VendorAccountCreationModalProps) {
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());
  const createVendorAccount = useCreateVendorAccount();

  // Vendedores com email mas sem conta no sistema (sem user_id mapeado)
  const vendorsReadyForAccount = vendors.filter(vendor => 
    vendor.email && !vendor.profile?.user_id
  );

  const handleSelectVendor = (vendorId: string) => {
    setSelectedVendors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendorId)) {
        newSet.delete(vendorId);
      } else {
        newSet.add(vendorId);
      }
      return newSet;
    });
  };

  const handleCreateAccounts = async () => {
    const vendorsToCreate = vendorsReadyForAccount.filter(vendor => 
      selectedVendors.has(vendor.id)
    );

    if (vendorsToCreate.length === 0) return;

    try {
      for (const vendor of vendorsToCreate) {
        await createVendorAccount.mutateAsync({
          vendorId: vendor.id,
          vendorName: vendor.name,
          email: vendor.email
        });
      }
      
      setSelectedVendors(new Set());
      onClose();
    } catch (error) {
      console.error('Erro ao criar contas:', error);
    }
  };

  if (vendorsReadyForAccount.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Nenhum Vendedor Pendente
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Não há vendedores com email cadastrado aguardando criação de conta.
            </p>
          </div>
          <Button onClick={onClose} className="w-full">
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Criar Contas dos Vendedores
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-800">
              Os vendedores selecionados receberão um convite por email para criar suas contas no sistema.
            </p>
          </div>

          <div className="space-y-3">
            {vendorsReadyForAccount.map((vendor) => (
              <div 
                key={vendor.id} 
                className={`p-4 border rounded-lg transition-colors ${
                  selectedVendors.has(vendor.id) 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedVendors.has(vendor.id)}
                    onChange={() => handleSelectVendor(vendor.id)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{vendor.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {vendor.phone_number}
                      </Badge>
                      {vendor.token_configured && (
                        <Badge variant="secondary" className="text-xs">
                          Token OK
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{vendor.email}</span>
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Email cadastrado
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateAccounts}
            disabled={selectedVendors.size === 0 || createVendorAccount.isPending}
            className="flex-1"
          >
            {createVendorAccount.isPending 
              ? 'Enviando convites...' 
              : `Criar ${selectedVendors.size} Conta(s)`
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}