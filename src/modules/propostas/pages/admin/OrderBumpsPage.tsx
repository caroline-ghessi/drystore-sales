import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, TrendingUp, Eye, MousePointer, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OrderBumpRuleForm } from '@/modules/propostas/components/OrderBumpRuleForm';
import { OrderBumpAnalytics } from '@/modules/propostas/components/OrderBumpAnalytics';
import type { OrderBumpRule } from '@/hooks/useOrderBumps';

export default function OrderBumpsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRule, setSelectedRule] = useState<OrderBumpRule | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: rules, isLoading } = useQuery({
    queryKey: ['order-bump-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_bump_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      return data as OrderBumpRule[];
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ['order-bump-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposal_order_bumps')
        .select('*');

      if (error) throw error;

      const totalDisplays = data.length;
      const totalClicks = data.filter(b => ['clicked', 'accepted'].includes(b.status)).length;
      const totalAccepted = data.filter(b => b.status === 'accepted').length;

      return {
        totalDisplays,
        totalClicks,
        totalAccepted,
        ctr: totalDisplays > 0 ? (totalClicks / totalDisplays) * 100 : 0,
        conversionRate: totalDisplays > 0 ? (totalAccepted / totalDisplays) * 100 : 0,
      };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('order_bump_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-bump-rules'] });
      toast({
        title: 'Regra excluída',
        description: 'A regra de order bump foi excluída com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a regra.',
        variant: 'destructive',
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('order_bump_rules')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-bump-rules'] });
      toast({
        title: 'Status atualizado',
        description: 'O status da regra foi atualizado com sucesso.',
      });
    },
  });

  const handleEdit = (rule: OrderBumpRule) => {
    setSelectedRule(rule);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedRule(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedRule(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Bumps</h1>
          <p className="text-muted-foreground">
            Gerencie ofertas personalizadas para aumentar conversões
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedRule ? 'Editar Regra' : 'Nova Regra de Order Bump'}
              </DialogTitle>
              <DialogDescription>
                Configure as condições e o conteúdo da oferta personalizada
              </DialogDescription>
            </DialogHeader>
            <OrderBumpRuleForm
              rule={selectedRule}
              onSuccess={handleCloseForm}
              onCancel={handleCloseForm}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Exibições
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalDisplays}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MousePointer className="h-4 w-4" />
                Cliques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalClicks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Aceitos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics.totalAccepted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                CTR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.ctr.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics.conversionRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Regras Configuradas</CardTitle>
          <CardDescription>
            {rules?.length || 0} regra(s) cadastrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : rules && rules.length > 0 ? (
            <div className="space-y-4">
              {rules.map((rule) => (
                <Card key={rule.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{rule.name}</h3>
                          {rule.is_active ? (
                            <Badge variant="default">Ativa</Badge>
                          ) : (
                            <Badge variant="secondary">Inativa</Badge>
                          )}
                          <Badge variant="outline">Prioridade: {rule.priority}</Badge>
                        </div>
                        
                        {rule.description && (
                          <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                        )}

                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Oferta: </span>
                            <span className="text-muted-foreground">{rule.bump_title}</span>
                          </div>
                          
                          {rule.bump_price && (
                            <div>
                              <span className="font-medium">Preço: </span>
                              <span className="text-muted-foreground">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(rule.bump_price)}
                                {rule.bump_discount_percentage && (
                                  <Badge variant="secondary" className="ml-2">
                                    {rule.bump_discount_percentage}% OFF
                                  </Badge>
                                )}
                              </span>
                            </div>
                          )}

                          <div>
                            <span className="font-medium">Exibições: </span>
                            <span className="text-muted-foreground">
                              {rule.current_displays}
                              {rule.max_displays && ` / ${rule.max_displays}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        
                        <Button
                          variant={rule.is_active ? 'secondary' : 'default'}
                          size="sm"
                          onClick={() => toggleActiveMutation.mutate({
                            id: rule.id,
                            isActive: !rule.is_active,
                          })}
                        >
                          {rule.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta regra?')) {
                              deleteMutation.mutate(rule.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Nenhuma regra configurada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira regra de order bump para começar
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Regra
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      {rules && rules.length > 0 && <OrderBumpAnalytics />}
    </div>
  );
}
