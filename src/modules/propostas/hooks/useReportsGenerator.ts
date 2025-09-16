import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReportConfig {
  type: string;
  period: string;
  startDate?: string;
  endDate?: string;
  filters: {
    status: string;
    vendor: string;
    minValue: string;
    maxValue: string;
  };
}

interface ReportData {
  totalRecords: number;
  preview: any[];
  columns: string[];
  summary?: {
    totalValue: number;
    averageValue: number;
    count: number;
  };
}

export function useReportsGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const { toast } = useToast();

  const generateReport = async (config: ReportConfig, exportType: 'preview' | 'excel' | 'csv') => {
    setIsGenerating(true);
    
    try {
      // Calcular datas baseado no período
      const endDate = new Date();
      let startDate = new Date();
      
      if (config.period === 'custom') {
        startDate = new Date(config.startDate || '');
        endDate.setTime(new Date(config.endDate || '').getTime());
      } else {
        const days = parseInt(config.period);
        startDate.setDate(endDate.getDate() - days);
      }

      let data: any[] = [];
      let columns: string[] = [];

      // Buscar dados baseado no tipo de relatório
      switch (config.type) {
        case 'propostas':
          data = await fetchProposalsReport(startDate, endDate, config.filters);
          columns = ['Número', 'Cliente', 'Valor Total', 'Status', 'Data Criação', 'Vendedor'];
          break;
        
        case 'vendedores':
          data = await fetchVendorsReport(startDate, endDate, config.filters);
          columns = ['Vendedor', 'Total Cálculos', 'Total Propostas', 'Valor Total', 'Taxa Conversão'];
          break;
        
        case 'produtos':
          data = await fetchProductsReport(startDate, endDate, config.filters);
          columns = ['Produto', 'Categoria', 'Qtd Cálculos', 'Valor Médio', 'Popularidade'];
          break;
        
        case 'financeiro':
          data = await fetchFinancialReport(startDate, endDate, config.filters);
          columns = ['Período', 'Total Propostas', 'Valor Total', 'Valor Médio', 'Comissões'];
          break;
        
        default:
          throw new Error('Tipo de relatório não suportado');
      }

      // Calcular resumo
      const totalValue = data.reduce((sum, item) => {
        const value = parseFloat(String(item.valor_total || item.total_value || 0).replace(/[^0-9.-]/g, '')) || 0;
        return sum + value;
      }, 0);

      const summary = {
        totalValue,
        averageValue: data.length > 0 ? totalValue / data.length : 0,
        count: data.length
      };

      const reportData: ReportData = {
        totalRecords: data.length,
        preview: data,
        columns,
        summary
      };

      setReportData(reportData);

      // Exportar se necessário
      if (exportType === 'excel') {
        await exportToExcel(data, columns, config.type, summary);
      } else if (exportType === 'csv') {
        await exportToCSV(data, columns, config.type);
      }

      toast({
        title: "Relatório gerado com sucesso",
        description: `${data.length} registros encontrados`,
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao processar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchProposalsReport = async (startDate: Date, endDate: Date, filters: any) => {
    let query = supabase
      .from('proposal_with_context')
      .select(`
        proposal_number,
        customer_name,
        final_value,
        status,
        created_at,
        created_by_name
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.minValue) {
      query = query.gte('final_value', parseFloat(filters.minValue));
    }

    if (filters.maxValue) {
      query = query.lte('final_value', parseFloat(filters.maxValue));
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      numero: item.proposal_number || 'N/A',
      cliente: item.customer_name || 'N/A',
      valor_total: `R$ ${(item.final_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      status: item.status || 'N/A',
      data_criacao: new Date(item.created_at || '').toLocaleDateString('pt-BR'),
      vendedor: item.created_by_name || 'N/A'
    }));
  };

  const fetchVendorsReport = async (startDate: Date, endDate: Date, filters: any) => {
    // Buscar dados de cálculos salvos por vendedor
    const { data: calculations, error: calcError } = await supabase
      .from('saved_calculations')
      .select(`
        user_id,
        profiles!inner(display_name)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (calcError) throw calcError;

    // Buscar propostas por vendedor
    const { data: proposals, error: propError } = await supabase
      .from('proposal_with_context')
      .select(`
        created_by,
        created_by_name,
        final_value,
        status
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (propError) throw propError;

    // Agrupar por vendedor
    const vendorStats = new Map();

    // Processar cálculos
    calculations?.forEach(calc => {
      const vendorName = (calc.profiles as any)?.display_name || 'Vendedor Desconhecido';
      if (!vendorStats.has(vendorName)) {
        vendorStats.set(vendorName, { calculos: 0, propostas: 0, valorTotal: 0, conversoes: 0 });
      }
      vendorStats.get(vendorName).calculos++;
    });

    // Processar propostas
    proposals?.forEach(prop => {
      const vendorName = prop.created_by_name || 'Vendedor Desconhecido';
      if (!vendorStats.has(vendorName)) {
        vendorStats.set(vendorName, { calculos: 0, propostas: 0, valorTotal: 0, conversoes: 0 });
      }
      const stats = vendorStats.get(vendorName);
      stats.propostas++;
      stats.valorTotal += prop.final_value || 0;
      if (prop.status === 'accepted') {
        stats.conversoes++;
      }
    });

    return Array.from(vendorStats.entries()).map(([vendedor, stats]) => ({
      vendedor,
      total_calculos: stats.calculos,
      total_propostas: stats.propostas,
      valor_total: `R$ ${stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      taxa_conversao: stats.propostas > 0 ? `${((stats.conversoes / stats.propostas) * 100).toFixed(1)}%` : '0%'
    }));
  };

  const fetchProductsReport = async (startDate: Date, endDate: Date, filters: any) => {
    // Para este exemplo, vamos simular dados de produtos
    // Em uma implementação real, você buscaria da tabela products e relacionaria com calculations
    return [
      {
        produto: 'Sistema Solar Residencial',
        categoria: 'Energia Solar',
        qtd_calculos: 45,
        valor_medio: 'R$ 25.500,00',
        popularidade: '85%'
      },
      {
        produto: 'Telhas Shingle',
        categoria: 'Telhas',
        qtd_calculos: 32,
        valor_medio: 'R$ 18.200,00',
        popularidade: '72%'
      },
      {
        produto: 'Drywall Residencial',
        categoria: 'Drywall',
        qtd_calculos: 28,
        valor_medio: 'R$ 12.800,00',
        popularidade: '68%'
      }
    ];
  };

  const fetchFinancialReport = async (startDate: Date, endDate: Date, filters: any) => {
    const { data, error } = await supabase
      .from('proposal_with_context')
      .select('final_value, status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const totalValue = data?.reduce((sum, item) => sum + (item.final_value || 0), 0) || 0;
    const acceptedProposals = data?.filter(item => item.status === 'accepted') || [];
    const acceptedValue = acceptedProposals.reduce((sum, item) => sum + (item.final_value || 0), 0);

    return [
      {
        periodo: `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`,
        total_propostas: data?.length || 0,
        valor_total: `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        valor_medio: data?.length ? `R$ ${(totalValue / data.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',
        comissoes: `R$ ${(acceptedValue * 0.05).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` // 5% de comissão
      }
    ];
  };

  const exportToExcel = async (data: any[], columns: string[], reportType: string, summary: any) => {
    try {
      const wb = XLSX.utils.book_new();

      // Aba principal com dados
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Dados');

      // Aba de resumo
      const summaryData = [
        { Campo: 'Total de Registros', Valor: data.length },
        { Campo: 'Valor Total', Valor: `R$ ${summary.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
        { Campo: 'Valor Médio', Valor: `R$ ${summary.averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
        { Campo: 'Data de Geração', Valor: new Date().toLocaleString('pt-BR') }
      ];
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumo');

      // Gerar arquivo
      const fileName = `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Excel exportado com sucesso",
        description: `Arquivo ${fileName} foi baixado`,
      });
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      throw error;
    }
  };

  const exportToCSV = async (data: any[], columns: string[], reportType: string) => {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "CSV exportado com sucesso",
        description: `Arquivo CSV foi baixado`,
      });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      throw error;
    }
  };

  return {
    generateReport,
    isGenerating,
    reportData
  };
}