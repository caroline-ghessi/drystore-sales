import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileDown, Filter, Calendar, TrendingUp, Users, ShoppingBag, FileText, DollarSign } from 'lucide-react';
import { useReportsGenerator } from '../hooks/useReportsGenerator';

const REPORT_TYPES = [
  { 
    id: 'propostas', 
    name: 'Relatório de Propostas', 
    description: 'Todas as propostas com status, valores e datas',
    icon: FileText,
    color: 'bg-blue-500'
  },
  { 
    id: 'vendedores', 
    name: 'Performance dos Vendedores', 
    description: 'Cálculos, propostas e conversões por vendedor',
    icon: Users,
    color: 'bg-green-500'
  },
  { 
    id: 'produtos', 
    name: 'Análise de Produtos', 
    description: 'Produtos mais calculados e categorias',
    icon: ShoppingBag,
    color: 'bg-purple-500'
  },
  { 
    id: 'financeiro', 
    name: 'Relatório Financeiro', 
    description: 'Valores totais, médias e projeções',
    icon: DollarSign,
    color: 'bg-yellow-500'
  }
];

const PERIOD_OPTIONS = [
  { value: '30', label: 'Últimos 30 dias' },
  { value: '60', label: 'Últimos 60 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: 'custom', label: 'Período personalizado' }
];

export default function ReportsPage() {
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [filters, setFilters] = useState({
    status: '',
    vendor: '',
    minValue: '',
    maxValue: ''
  });

  const { generateReport, isGenerating, reportData } = useReportsGenerator();

  const handleGeneratePreview = async () => {
    if (!selectedReportType) return;

    const reportConfig = {
      type: selectedReportType,
      period: selectedPeriod,
      startDate: selectedPeriod === 'custom' ? customStartDate : '',
      endDate: selectedPeriod === 'custom' ? customEndDate : '',
      filters
    };

    await generateReport(reportConfig, 'preview');
  };

  const handleExportExcel = async () => {
    if (!selectedReportType) return;

    const reportConfig = {
      type: selectedReportType,
      period: selectedPeriod,
      startDate: selectedPeriod === 'custom' ? customStartDate : '',
      endDate: selectedPeriod === 'custom' ? customEndDate : '',
      filters
    };

    await generateReport(reportConfig, 'excel');
  };

  const handleExportCSV = async () => {
    if (!selectedReportType) return;

    const reportConfig = {
      type: selectedReportType,
      period: selectedPeriod,
      startDate: selectedPeriod === 'custom' ? customStartDate : '',
      endDate: selectedPeriod === 'custom' ? customEndDate : '',
      filters
    };

    await generateReport(reportConfig, 'csv');
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios Administrativos</h1>
          <p className="text-muted-foreground">Gere e exporte relatórios detalhados do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-primary">
            <TrendingUp className="h-3 w-3 mr-1" />
            Apenas Administradores
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Configuração do Relatório */}
        <div className="xl:col-span-2 space-y-6">
          {/* Seleção do Tipo de Relatório */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tipo de Relatório
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {REPORT_TYPES.map((report) => {
                  const Icon = report.icon;
                  return (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReportType(report.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedReportType === report.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg text-white ${report.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{report.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Filtros */}
          {selectedReportType && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros e Período
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Seleção de Período */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="period">Período</Label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIOD_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedPeriod === 'custom' && (
                    <>
                      <div>
                        <Label htmlFor="startDate">Data Inicial</Label>
                        <Input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">Data Final</Label>
                        <Input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                {/* Filtros Específicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos os status</SelectItem>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="sent">Enviada</SelectItem>
                        <SelectItem value="accepted">Aceita</SelectItem>
                        <SelectItem value="rejected">Rejeitada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="vendor">Vendedor</Label>
                    <Select value={filters.vendor} onValueChange={(value) => setFilters(prev => ({ ...prev, vendor: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os vendedores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos os vendedores</SelectItem>
                        {/* Aqui seria carregado dinamicamente */}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="minValue">Valor Mínimo (R$)</Label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      value={filters.minValue}
                      onChange={(e) => setFilters(prev => ({ ...prev, minValue: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxValue">Valor Máximo (R$)</Label>
                    <Input
                      type="number"
                      placeholder="Sem limite"
                      value={filters.maxValue}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxValue: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ações e Preview */}
        <div className="space-y-6">
          {/* Ações de Exportação */}
          <Card>
            <CardHeader>
              <CardTitle>Gerar Relatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleGeneratePreview}
                disabled={!selectedReportType || isGenerating}
                className="w-full"
                variant="outline"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {isGenerating ? 'Gerando...' : 'Visualizar Preview'}
              </Button>

              <Separator />

              <Button 
                onClick={handleExportExcel}
                disabled={!selectedReportType || isGenerating}
                className="w-full"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exportar Excel (.xlsx)
              </Button>

              <Button 
                onClick={handleExportCSV}
                disabled={!selectedReportType || isGenerating}
                className="w-full"
                variant="outline"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardContent>
          </Card>

          {/* Estatísticas Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de Registros</span>
                <Badge variant="secondary">{reportData?.totalRecords || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Período</span>
                <span className="text-sm font-medium">
                  {PERIOD_OPTIONS.find(p => p.value === selectedPeriod)?.label || 'Não definido'}
                </span>
              </div>
              {reportData?.summary && (
                <div className="pt-2 border-t space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valor Total</span>
                    <span className="text-sm font-medium">R$ {reportData.summary.totalValue?.toLocaleString('pt-BR') || '0,00'}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview dos Dados */}
      {reportData && reportData.preview && (
        <Card>
          <CardHeader>
            <CardTitle>Preview dos Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {reportData.columns?.map((column, index) => (
                      <th key={index} className="text-left p-2 font-medium text-muted-foreground">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.preview.slice(0, 5).map((row, index) => (
                    <tr key={index} className="border-b">
                      {Object.values(row as Record<string, any>).map((cell, cellIndex) => (
                        <td key={cellIndex} className="p-2">
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.preview.length > 5 && (
                <div className="text-center p-4 text-muted-foreground">
                  ... e mais {reportData.preview.length - 5} registros
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}