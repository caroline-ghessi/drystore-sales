import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Plus,
  Calculator,
  FileText,
  Trash2,
  Edit,
  Play,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useSavedCalculations, SavedCalculation } from '../hooks/useSavedCalculations';
import { useNavigate } from 'react-router-dom';

export default function SavedCalculationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const {
    calculations,
    isLoading,
    deleteCalculation,
    convertToProposal,
    isDeleting
  } = useSavedCalculations();

  const filteredCalculations = calculations.filter(calc =>
    calc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calc.client_data.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProductLabel = (productType: string) => {
    const types = {
      solar: 'Energia Solar',
      shingle: 'Telha Shingle', 
      drywall: 'Drywall',
      steel_frame: 'Steel Frame',
      ceiling: 'Forros',
      forro_drywall: 'Forro Drywall'
    };
    return types[productType as keyof typeof types] || productType;
  };

  const getStatusBadge = (status: string) => {
    return status === 'ready_to_propose' 
      ? <Badge variant="default">Pronto para Proposta</Badge>
      : <Badge variant="secondary">Rascunho</Badge>;
  };

  const handleEdit = (calculation: SavedCalculation) => {
    // Navigate to generator with pre-filled data
    navigate('/propostas/nova', { 
      state: { editCalculation: calculation }
    });
  };

  const handleConvertToProposal = async (calculation: SavedCalculation) => {
    await convertToProposal(calculation);
    // Could navigate to proposal generator or show success message
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <Calculator className="h-12 w-12 animate-pulse mx-auto mb-4 text-muted-foreground" />
          <p>Carregando cálculos salvos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cálculos Salvos</h1>
          <p className="text-muted-foreground">
            Gerencie seus cálculos salvos e converta-os em propostas
          </p>
        </div>
        <Button onClick={() => navigate('/propostas/nova')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cálculo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{calculations.length}</p>
              </div>
              <Calculator className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rascunhos</p>
                <p className="text-2xl font-bold text-orange-600">
                  {calculations.filter(c => c.status === 'draft').length}
                </p>
              </div>
              <Edit className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prontos</p>
                <p className="text-2xl font-bold text-green-600">
                  {calculations.filter(c => c.status === 'ready_to_propose').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {Math.round(calculations.reduce((sum, calc) => sum + (calc.calculation_result?.totalCost || 0), 0) / 1000)}K
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Cálculos Salvos</CardTitle>
          <CardDescription>
            Lista de todos os cálculos salvos organizados por data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do cálculo ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Calculations List */}
          <div className="space-y-4">
            {filteredCalculations.length === 0 ? (
              <div className="text-center py-12">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum cálculo encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece criando seu primeiro cálculo'}
                </p>
                <Button onClick={() => navigate('/propostas/nova')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Cálculo
                </Button>
              </div>
            ) : (
              filteredCalculations.map((calculation) => (
                <div 
                  key={calculation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Calculator className="h-6 w-6 text-primary" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold">{calculation.name}</h3>
                        {getStatusBadge(calculation.status)}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{getProductLabel(calculation.product_type)}</span>
                        <span>•</span>
                        <span>Cliente: {calculation.client_data.name || 'Não informado'}</span>
                        <span>•</span>
                        <span>{new Date(calculation.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">
                        R$ {(calculation.calculation_result?.totalCost || 0).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-muted-foreground">Valor Total</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="font-semibold">
                        {new Date(calculation.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-muted-foreground">Atualizado</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-6">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit(calculation)}
                      title="Editar cálculo"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleConvertToProposal(calculation)}
                      title="Gerar proposta"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteCalculation(calculation.id)}
                      disabled={isDeleting}
                      title="Excluir cálculo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}