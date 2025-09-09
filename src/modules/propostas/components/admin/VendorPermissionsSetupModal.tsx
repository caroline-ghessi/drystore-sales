import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VendorPermissionsSetupModalProps {
  open: boolean;
  onClose: () => void;
  vendor?: any;
  onComplete?: () => void;
}

interface PermissionSettings {
  access_level: 'basic' | 'intermediate' | 'advanced';
  max_discount_percentage: number;
  max_proposal_value: number;
  can_access_calculator: boolean;
  can_generate_proposals: boolean;
  can_save_calculations: boolean;
  can_view_ranking: boolean;
}

const defaultPermissions: Record<string, PermissionSettings> = {
  basic: {
    access_level: 'basic',
    max_discount_percentage: 5,
    max_proposal_value: 50000,
    can_access_calculator: true,
    can_generate_proposals: true,
    can_save_calculations: true,
    can_view_ranking: true,
  },
  intermediate: {
    access_level: 'intermediate',
    max_discount_percentage: 10,
    max_proposal_value: 150000,
    can_access_calculator: true,
    can_generate_proposals: true,
    can_save_calculations: true,
    can_view_ranking: true,
  },
  advanced: {
    access_level: 'advanced',
    max_discount_percentage: 20,
    max_proposal_value: 500000,
    can_access_calculator: true,
    can_generate_proposals: true,
    can_save_calculations: true,
    can_view_ranking: true,
  },
};

export function VendorPermissionsSetupModal({
  open,
  onClose,
  vendor,
  onComplete,
}: VendorPermissionsSetupModalProps) {
  const [permissions, setPermissions] = useState<PermissionSettings>(defaultPermissions.basic);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const savePermissions = useMutation({
    mutationFn: async (permissionsData: PermissionSettings) => {
      if (!vendor?.id) throw new Error('Vendor ID is required');

      const { error } = await supabase
        .from('vendor_permissions')
        .upsert({
          vendor_id: vendor.id,
          user_id: vendor.user_id, // Assumindo que o vendor já tem user_id mapeado
          ...permissionsData,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Permissões configuradas',
        description: `Permissões do vendedor ${vendor?.name} foram configuradas com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      onComplete?.();
      onClose();
    },
    onError: (error) => {
      console.error('Error saving vendor permissions:', error);
      toast({
        title: 'Erro ao configurar permissões',
        description: 'Ocorreu um erro ao salvar as permissões do vendedor.',
        variant: 'destructive',
      });
    },
  });

  const handleAccessLevelChange = (level: string) => {
    setPermissions(defaultPermissions[level]);
  };

  const handleSave = () => {
    savePermissions.mutate(permissions);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Permissões do Vendedor</DialogTitle>
          <DialogDescription>
            Configure o nível de acesso e permissões para {vendor?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nível de Acesso */}
          <div className="space-y-3">
            <Label htmlFor="access_level">Nível de Acesso</Label>
            <Select
              value={permissions.access_level}
              onValueChange={handleAccessLevelChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nível de acesso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">
                  Básico - Acesso limitado às funcionalidades essenciais
                </SelectItem>
                <SelectItem value="intermediate">
                  Intermediário - Acesso ampliado com limites moderados
                </SelectItem>
                <SelectItem value="advanced">
                  Avançado - Acesso completo com limites elevados
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Limites Financeiros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Limites Financeiros</CardTitle>
              <CardDescription>
                Configure os limites monetários para este vendedor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_discount">Desconto Máximo (%)</Label>
                  <Input
                    id="max_discount"
                    type="number"
                    value={permissions.max_discount_percentage}
                    onChange={(e) =>
                      setPermissions({
                        ...permissions,
                        max_discount_percentage: Number(e.target.value),
                      })
                    }
                    min="0"
                    max="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_value">Valor Máximo de Proposta (R$)</Label>
                  <Input
                    id="max_value"
                    type="number"
                    value={permissions.max_proposal_value}
                    onChange={(e) =>
                      setPermissions({
                        ...permissions,
                        max_proposal_value: Number(e.target.value),
                      })
                    }
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissões de Funcionalidades */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permissões de Funcionalidades</CardTitle>
              <CardDescription>
                Configure quais funcionalidades o vendedor pode acessar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Acessar Calculadoras</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite usar as calculadoras de propostas
                  </p>
                </div>
                <Switch
                  checked={permissions.can_access_calculator}
                  onCheckedChange={(checked) =>
                    setPermissions({ ...permissions, can_access_calculator: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Gerar Propostas</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite criar e gerar propostas para clientes
                  </p>
                </div>
                <Switch
                  checked={permissions.can_generate_proposals}
                  onCheckedChange={(checked) =>
                    setPermissions({ ...permissions, can_generate_proposals: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Salvar Cálculos</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite salvar cálculos para uso posterior
                  </p>
                </div>
                <Switch
                  checked={permissions.can_save_calculations}
                  onCheckedChange={(checked) =>
                    setPermissions({ ...permissions, can_save_calculations: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ver Ranking</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite visualizar o ranking geral de vendedores
                  </p>
                </div>
                <Switch
                  checked={permissions.can_view_ranking}
                  onCheckedChange={(checked) =>
                    setPermissions({ ...permissions, can_view_ranking: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={savePermissions.isPending}>
            {savePermissions.isPending ? 'Salvando...' : 'Salvar Permissões'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}