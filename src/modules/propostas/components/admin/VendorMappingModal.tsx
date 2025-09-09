import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCreateVendorMapping, useVendedoresProposta } from '../../hooks/useVendedoresProposta';
import { User, LinkIcon, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VendorMappingModalProps {
  open: boolean;
  onClose: () => void;
}

export default function VendorMappingModal({ open, onClose }: VendorMappingModalProps) {
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const { toast } = useToast();

  const { data: vendors } = useVendedoresProposta();
  const createMapping = useCreateVendorMapping();

  // Buscar profiles disponíveis
  const { data: profiles } = useQuery({
    queryKey: ['available-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, department')
        .order('display_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const unmappedVendors = vendors?.filter(vendor => !vendor.profile) || [];
  const mappedVendors = vendors?.filter(vendor => vendor.profile) || [];

  const handleCreateMapping = async () => {
    if (!selectedVendor || !selectedUser) {
      toast({
        title: "Erro",
        description: "Selecione um vendedor e um usuário",
        variant: "destructive"
      });
      return;
    }

    try {
      await createMapping.mutateAsync({
        vendorId: selectedVendor,
        userId: selectedUser,
        roleType: 'sales_rep'
      });

      toast({
        title: "Sucesso",
        description: "Mapeamento criado com sucesso!"
      });

      setSelectedVendor('');
      setSelectedUser('');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar mapeamento",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <LinkIcon className="h-5 w-5 mr-2 text-drystore-orange" />
            Mapear Vendedores aos Usuários
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Criar Novo Mapeamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Criar Mapeamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Vendedor</label>
                <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um vendedor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unmappedVendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        <div className="flex items-center space-x-2">
                          <span>{vendor.name}</span>
                          <Badge variant="outline">{vendor.phone_number}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Usuário do Sistema</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário..." />
                  </SelectTrigger>
                  <SelectContent className="z-[100]" position="popper">
                    {profiles?.map((profile) => (
                      <SelectItem key={profile.user_id} value={profile.user_id}>
                        {profile.display_name} ({profile.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleCreateMapping}
                className="w-full bg-drystore-orange hover:bg-drystore-orange/90"
                disabled={!selectedVendor || !selectedUser || createMapping.isPending}
              >
                {createMapping.isPending ? 'Criando...' : 'Criar Mapeamento'}
              </Button>
            </CardContent>
          </Card>

          {/* Mapeamentos Existentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                Mapeamentos Ativos ({mappedVendors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {mappedVendors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum mapeamento configurado ainda
                  </p>
                ) : (
                  mappedVendors.map((vendor) => (
                    <div key={vendor.id} className="p-3 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{vendor.name}</div>
                          <div className="text-xs text-muted-foreground">{vendor.phone_number}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-700">
                            {vendor.profile?.display_name}
                          </div>
                          <div className="text-xs text-green-600">
                            {vendor.profile?.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}