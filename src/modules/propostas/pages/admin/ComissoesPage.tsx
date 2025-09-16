import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Calculator, Plus, Edit, Trash2, TrendingDown, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCommissionManagement } from '../../hooks/useCommissionManagement';
import { toast } from '@/hooks/use-toast';

export default function ComissoesPage() {
  const { rules, vendors, isLoading, createRule, updateRule, deleteRule, calculateCommission } = useCommissionManagement();
  const [newRule, setNewRule] = useState({
    discount_min: '',
    discount_max: '',
    commission_rate: '',
    description: ''
  });
  const [simulatorValues, setSimulatorValues] = useState({
    proposal_value: '',
    discount_percentage: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const handleCreateRule = async () => {
    try {
      await createRule({
        discount_min: parseFloat(newRule.discount_min),
        discount_max: parseFloat(newRule.discount_max),
        commission_rate: parseFloat(newRule.commission_rate),
        description: newRule.description
      });
      setNewRule({ discount_min: '', discount_max: '', commission_rate: '', description: '' });
      setIsDialogOpen(false);
      toast({ title: 'Regra criada com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao criar regra', variant: 'destructive' });
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule) return;
    try {
      await updateRule(editingRule.id, {
        discount_min: parseFloat(editingRule.discount_min),
        discount_max: parseFloat(editingRule.discount_max),
        commission_rate: parseFloat(editingRule.commission_rate),
        description: editingRule.description
      });
      setEditingRule(null);
      toast({ title: 'Regra atualizada com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao atualizar regra', variant: 'destructive' });
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteRule(id);
      toast({ title: 'Regra excluída com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao excluir regra', variant: 'destructive' });
    }
  };

  const simulateCommission = () => {
    const proposalValue = parseFloat(simulatorValues.proposal_value);
    const discountPercentage = parseFloat(simulatorValues.discount_percentage);
    
    if (isNaN(proposalValue) || isNaN(discountPercentage)) return null;
    
    return calculateCommission(proposalValue, discountPercentage);
  };

  const commissionResult = simulateCommission();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando configurações de comissão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuração de Comissões</h1>
          <p className="text-muted-foreground">
            Gerencie as regras de comissão baseadas nos descontos concedidos
          </p>
        </div>
      </div>

      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Regras de Comissão</TabsTrigger>
          <TabsTrigger value="simulator">Simulador</TabsTrigger>
          <TabsTrigger value="reports">Relatório por Vendedor</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Regras de Comissão</CardTitle>
                <CardDescription>
                  Configure as faixas de desconto e suas respectivas taxas de comissão
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Regra
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Regra de Comissão</DialogTitle>
                    <DialogDescription>
                      Defina uma nova faixa de desconto e sua taxa de comissão correspondente
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="discount_min">Desconto Mínimo (%)</Label>
                        <Input
                          id="discount_min"
                          type="number"
                          step="0.01"
                          value={newRule.discount_min}
                          onChange={(e) => setNewRule({...newRule, discount_min: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="discount_max">Desconto Máximo (%)</Label>
                        <Input
                          id="discount_max"
                          type="number"
                          step="0.01"
                          value={newRule.discount_max}
                          onChange={(e) => setNewRule({...newRule, discount_max: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="commission_rate">Taxa de Comissão (%)</Label>
                      <Input
                        id="commission_rate"
                        type="number"
                        step="0.01"
                        value={newRule.commission_rate}
                        onChange={(e) => setNewRule({...newRule, commission_rate: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Input
                        id="description"
                        value={newRule.description}
                        onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                        placeholder="Ex: Comissão alta para descontos baixos"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateRule}>Criar Regra</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faixa de Desconto</TableHead>
                    <TableHead>Taxa de Comissão</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules?.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        {rule.discount_min}% - {rule.discount_max}%
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {rule.commission_rate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {rule.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingRule(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Simulador de Comissão
              </CardTitle>
              <CardDescription>
                Teste diferentes cenários para calcular a comissão resultante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="proposal_value">Valor da Proposta (R$)</Label>
                    <Input
                      id="proposal_value"
                      type="number"
                      step="0.01"
                      value={simulatorValues.proposal_value}
                      onChange={(e) => setSimulatorValues({...simulatorValues, proposal_value: e.target.value})}
                      placeholder="Ex: 50000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount_percentage">Desconto Concedido (%)</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      step="0.01"
                      value={simulatorValues.discount_percentage}
                      onChange={(e) => setSimulatorValues({...simulatorValues, discount_percentage: e.target.value})}
                      placeholder="Ex: 8.5"
                    />
                  </div>
                </div>
                
                {commissionResult && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Resultado da Simulação</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">Valor Original:</span>
                        <span className="font-medium">
                          R$ {parseFloat(simulatorValues.proposal_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">Desconto Aplicado:</span>
                        <span className="font-medium text-red-600">
                          -{simulatorValues.discount_percentage}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">Valor Final:</span>
                        <span className="font-medium">
                          R$ {commissionResult.final_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                        <span className="text-sm font-medium">Taxa de Comissão:</span>
                        <span className="font-bold text-primary">
                          {commissionResult.commission_rate}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                        <span className="text-sm font-medium">Valor da Comissão:</span>
                        <span className="font-bold text-primary text-lg">
                          R$ {commissionResult.commission_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Relatório por Vendedor
              </CardTitle>
              <CardDescription>
                Visualize o desempenho e comissões dos vendedores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">Relatórios em Desenvolvimento</h3>
                <p>Os relatórios de comissão por vendedor estarão disponíveis em breve.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Rule Dialog */}
      {editingRule && (
        <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Regra de Comissão</DialogTitle>
              <DialogDescription>
                Modifique os parâmetros da regra de comissão
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_discount_min">Desconto Mínimo (%)</Label>
                  <Input
                    id="edit_discount_min"
                    type="number"
                    step="0.01"
                    value={editingRule.discount_min}
                    onChange={(e) => setEditingRule({...editingRule, discount_min: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_discount_max">Desconto Máximo (%)</Label>
                  <Input
                    id="edit_discount_max"
                    type="number"
                    step="0.01"
                    value={editingRule.discount_max}
                    onChange={(e) => setEditingRule({...editingRule, discount_max: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_commission_rate">Taxa de Comissão (%)</Label>
                <Input
                  id="edit_commission_rate"
                  type="number"
                  step="0.01"
                  value={editingRule.commission_rate}
                  onChange={(e) => setEditingRule({...editingRule, commission_rate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit_description">Descrição</Label>
                <Input
                  id="edit_description"
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({...editingRule, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateRule}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}