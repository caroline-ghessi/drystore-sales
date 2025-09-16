import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PropostasAnalytics {
  totalRevenue: {
    value: number;
    growth: number;
  };
  activeProposals: {
    count: number;
    growth: number;
  };
  conversionRate: {
    percentage: number;
    growth: number;
  };
  activeClients: {
    count: number;
    growth: number;
  };
  vendorRanking: Array<{
    id: string;
    name: string;
    revenue: number;
    proposals: number;
    conversionRate: number;
    quota: number;
    quotaAchieved: number;
  }>;
  productPerformance: Array<{
    name: string;
    revenue: number;
    proposals: number;
    conversionRate: number;
    percentage: number;
  }>;
  monthlyQuota: {
    target: number;
    achieved: number;
    percentage: number;
    daysRemaining: number;
  };
}

async function fetchPropostasAnalytics(): Promise<PropostasAnalytics> {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Buscar propostas do mês atual
  const { data: currentMonthProposals, error: currentError } = await supabase
    .from('proposals')
    .select(`
      id,
      total_value,
      status,
      created_by,
      created_at,
      proposal_items (
        product_id,
        quantity,
        total_price
      )
    `)
    .gte('created_at', new Date(currentYear, currentMonth, 1).toISOString())
    .lt('created_at', new Date(currentYear, currentMonth + 1, 1).toISOString());

  if (currentError) {
    console.error('Error fetching current month proposals:', currentError);
  }

  // Buscar propostas do mês anterior para comparação
  const { data: lastMonthProposals, error: lastError } = await supabase
    .from('proposals')
    .select('id, total_value, status, created_at')
    .gte('created_at', new Date(lastMonthYear, lastMonth, 1).toISOString())
    .lt('created_at', new Date(lastMonthYear, lastMonth + 1, 1).toISOString());

  if (lastError) {
    console.error('Error fetching last month proposals:', lastError);
  }

  // Buscar dados dos vendedores
  const { data: vendorData, error: vendorError } = await supabase
    .from('profiles')
    .select(`
      id,
      display_name,
      user_roles (
        role
      )
    `)
    .eq('user_roles.role', 'vendedor');

  if (vendorError) {
    console.error('Error fetching vendor data:', vendorError);
  }

  // Buscar produtos para análise de performance
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, category');

  if (productsError) {
    console.error('Error fetching products:', productsError);
  }

  // Calcular métricas
  const currentRevenue = currentMonthProposals?.reduce((sum, proposal) => 
    sum + (Number(proposal.total_value) || 0), 0) || 0;
  
  const lastRevenue = lastMonthProposals?.reduce((sum, proposal) => 
    sum + (Number(proposal.total_value) || 0), 0) || 0;
  
  const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

  const activeProposalsCount = currentMonthProposals?.filter(p => 
    ['draft', 'pending', 'under_review'].includes(p.status)).length || 0;
  
  const lastActiveCount = lastMonthProposals?.filter(p => 
    ['draft', 'pending', 'under_review'].includes(p.status)).length || 0;
  
  const proposalsGrowth = lastActiveCount > 0 ? 
    ((activeProposalsCount - lastActiveCount) / lastActiveCount) * 100 : 0;

  // Calcular taxa de conversão
  const acceptedProposals = currentMonthProposals?.filter(p => p.status === 'accepted').length || 0;
  const totalProposals = currentMonthProposals?.length || 0;
  const conversionRate = totalProposals > 0 ? (acceptedProposals / totalProposals) * 100 : 0;

  const lastAccepted = lastMonthProposals?.filter(p => p.status === 'accepted').length || 0;
  const lastTotal = lastMonthProposals?.length || 0;
  const lastConversionRate = lastTotal > 0 ? (lastAccepted / lastTotal) * 100 : 0;
  const conversionGrowth = lastConversionRate > 0 ? 
    ((conversionRate - lastConversionRate) / lastConversionRate) * 100 : 0;

  // Buscar clientes únicos
  const { data: clients, error: clientsError } = await supabase
    .from('crm_customers')
    .select('id')
    .gte('created_at', new Date(currentYear, currentMonth, 1).toISOString());

  // Mock data para demonstração (substituir por dados reais conforme disponibilidade)
  const mockAnalytics: PropostasAnalytics = {
    totalRevenue: {
      value: currentRevenue,
      growth: revenueGrowth
    },
    activeProposals: {
      count: activeProposalsCount,
      growth: proposalsGrowth
    },
    conversionRate: {
      percentage: Math.round(conversionRate),
      growth: conversionGrowth
    },
    activeClients: {
      count: clients?.length || 0,
      growth: 12.5 // Mock - implementar cálculo real
    },
    vendorRanking: [
      {
        id: '1',
        name: 'Maria Santos',
        revenue: 180000,
        proposals: 15,
        conversionRate: 75,
        quota: 200000,
        quotaAchieved: 180000
      },
      {
        id: '2', 
        name: 'João Silva',
        revenue: 125000,
        proposals: 12,
        conversionRate: 68,
        quota: 150000,
        quotaAchieved: 125000
      },
      {
        id: '3',
        name: 'Pedro Costa', 
        revenue: 95000,
        proposals: 10,
        conversionRate: 45,
        quota: 140000,
        quotaAchieved: 95000
      }
    ],
    productPerformance: [
      {
        name: 'Sistema Solar',
        revenue: 450000,
        proposals: 25,
        conversionRate: 72,
        percentage: 37.5
      },
      {
        name: 'Drywall',
        revenue: 320000,
        proposals: 20,
        conversionRate: 65,
        percentage: 26.7
      },
      {
        name: 'Shingle',
        revenue: 280000,
        proposals: 18,
        conversionRate: 58,
        percentage: 23.3
      },
      {
        name: 'Steel Frame',
        revenue: 150000,
        proposals: 10,
        conversionRate: 62,
        percentage: 12.5
      }
    ],
    monthlyQuota: {
      target: 1500000,
      achieved: currentRevenue,
      percentage: Math.round((currentRevenue / 1500000) * 100),
      daysRemaining: new Date(currentYear, currentMonth + 1, 0).getDate() - now.getDate()
    }
  };

  return mockAnalytics;
}

export function usePropostasAnalytics() {
  return useQuery({
    queryKey: ['propostas-analytics'],
    queryFn: fetchPropostasAnalytics,
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
    staleTime: 2 * 60 * 1000 // Dados ficam frescos por 2 minutos
  });
}