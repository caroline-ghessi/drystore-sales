import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useSavedCalculations } from '../hooks/useSavedCalculations';
import { CalculationReviewCard } from '../components/review/CalculationReviewCard';

export default function ReviewPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { calculations, updateCalculation, isLoading } = useSavedCalculations();

  // Filter calculations based on status
  const filteredCalculations = calculations.filter(calc => {
    if (statusFilter === 'all') return true;
    return calc.status === statusFilter;
  });

  // Group calculations by status for stats
  const calculationStats = calculations.reduce((acc, calc) => {
    acc[calc.status] = (acc[calc.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleApprove = (id: string, comments?: string) => {
    updateCalculation({
      id,
      updates: {
        status: 'aprovado',
        notes: comments ? `${calculations.find(c => c.id === id)?.notes || ''}\n\n[APROVADO] ${comments}`.trim() : undefined
      }
    });
  };

  const handleReject = (id: string, comments: string) => {
    updateCalculation({
      id,
      updates: {
        status: 'rejeitado',
        notes: `${calculations.find(c => c.id === id)?.notes || ''}\n\n[REJEITADO] ${comments}`.trim()
      }
    });
  };

  const handleRequestChanges = (id: string, comments: string) => {
    updateCalculation({
      id,
      updates: {
        status: 'alteracoes_solicitadas',
        notes: `${calculations.find(c => c.id === id)?.notes || ''}\n\n[ALTERAÇÕES SOLICITADAS] ${comments}`.trim()
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando cálculos para revisão...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revisão de Cálculos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a aprovação e revisão dos cálculos da equipe
          </p>
        </div>
        <Badge variant="outline" className="flex items-center">
          <ClipboardList className="h-4 w-4 mr-1" />
          {filteredCalculations.length} cálculos
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aguardando Revisão</p>
                <p className="text-2xl font-bold text-orange-600">
                  {calculationStats.aguardando_revisao || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold text-green-600">
                  {calculationStats.aprovado || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alterações Solicitadas</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {calculationStats.alteracoes_solicitadas || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejeitados</p>
                <p className="text-2xl font-bold text-red-600">
                  {calculationStats.rejeitado || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Filtre os cálculos por status</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="aguardando_revisao">Aguardando Revisão</SelectItem>
                <SelectItem value="alteracoes_solicitadas">Alterações Solicitadas</SelectItem>
                <SelectItem value="aprovado">Aprovados</SelectItem>
                <SelectItem value="rejeitado">Rejeitados</SelectItem>
                <SelectItem value="draft">Rascunhos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calculations List */}
      <div className="space-y-4">
        {filteredCalculations.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum cálculo encontrado</h3>
                <p className="text-muted-foreground">
                  {statusFilter === 'all' 
                    ? 'Não há cálculos cadastrados ainda.'
                    : `Não há cálculos com status "${statusFilter}".`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">
                Pendentes ({(calculationStats.aguardando_revisao || 0) + (calculationStats.alteracoes_solicitadas || 0)})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Aprovados ({calculationStats.aprovado || 0})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejeitados ({calculationStats.rejeitado || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {filteredCalculations
                .filter(calc => ['aguardando_revisao', 'alteracoes_solicitadas'].includes(calc.status))
                .map((calculation) => (
                  <CalculationReviewCard
                    key={calculation.id}
                    calculation={calculation}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onRequestChanges={handleRequestChanges}
                    currentUserRole="supervisor"
                  />
                ))
              }
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {filteredCalculations
                .filter(calc => calc.status === 'aprovado')
                .map((calculation) => (
                  <CalculationReviewCard
                    key={calculation.id}
                    calculation={calculation}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onRequestChanges={handleRequestChanges}
                    currentUserRole="supervisor"
                  />
                ))
              }
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {filteredCalculations
                .filter(calc => calc.status === 'rejeitado')
                .map((calculation) => (
                  <CalculationReviewCard
                    key={calculation.id}
                    calculation={calculation}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onRequestChanges={handleRequestChanges}
                    currentUserRole="supervisor"
                  />
                ))
              }
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}