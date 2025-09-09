import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Mail, User, CheckCircle, AlertCircle } from 'lucide-react';

interface VendorEmailSetupModalProps {
  open: boolean;
  onClose: () => void;
  vendors?: any[];
}

export function VendorEmailSetupModal({ open, onClose, vendors = [] }: VendorEmailSetupModalProps) {
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Vendedores sem email
  const vendorsWithoutEmail = vendors.filter(vendor => !vendor.email);

  const updateVendorEmail = useMutation({
    mutationFn: async ({ vendorId, email }: { vendorId: string; email: string }) => {
      const { data, error } = await supabase
        .from('vendors')
        .update({ email })
        .eq('id', vendorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors-proposta'] });
      toast({
        title: "Email atualizado",
        description: "Email do vendedor foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEmailChange = (vendorId: string, email: string) => {
    setEmails(prev => ({ ...prev, [vendorId]: email }));
  };

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

  const handleSaveEmails = async () => {
    const vendorsToUpdate = Array.from(selectedVendors)
      .filter(vendorId => emails[vendorId]?.trim())
      .map(vendorId => ({
        vendorId,
        email: emails[vendorId].trim()
      }));

    if (vendorsToUpdate.length === 0) {
      toast({
        title: "Nenhum vendedor selecionado",
        description: "Selecione pelo menos um vendedor e adicione um email válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      for (const { vendorId, email } of vendorsToUpdate) {
        await updateVendorEmail.mutateAsync({ vendorId, email });
      }
      
      toast({
        title: "Emails salvos",
        description: `${vendorsToUpdate.length} vendedor(es) atualizado(s) com sucesso.`,
      });
      
      setEmails({});
      setSelectedVendors(new Set());
      onClose();
    } catch (error) {
      console.error('Erro ao salvar emails:', error);
    }
  };

  if (vendorsWithoutEmail.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Todos os Vendedores Configurados
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Todos os vendedores já possuem emails cadastrados.
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
            <Mail className="h-5 w-5" />
            Adicionar Emails dos Vendedores
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              Para integrar os vendedores do WhatsApp ao sistema de propostas, 
              é necessário adicionar emails para criar contas de usuário.
            </p>
          </div>

          <div className="space-y-3">
            {vendorsWithoutEmail.map((vendor) => (
              <div 
                key={vendor.id} 
                className={`p-4 border rounded-lg transition-colors ${
                  selectedVendors.has(vendor.id) 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedVendors.has(vendor.id)}
                    onChange={() => handleSelectVendor(vendor.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
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

                    {selectedVendors.has(vendor.id) && (
                      <div className="space-y-1">
                        <Label htmlFor={`email-${vendor.id}`} className="text-sm">
                          Email para criar conta:
                        </Label>
                        <Input
                          id={`email-${vendor.id}`}
                          type="email"
                          placeholder="exemplo@empresa.com"
                          value={emails[vendor.id] || ''}
                          onChange={(e) => handleEmailChange(vendor.id, e.target.value)}
                          className="w-full"
                        />
                      </div>
                    )}
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
            onClick={handleSaveEmails}
            disabled={selectedVendors.size === 0 || updateVendorEmail.isPending}
            className="flex-1"
          >
            {updateVendorEmail.isPending ? 'Salvando...' : `Salvar ${selectedVendors.size} Email(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}