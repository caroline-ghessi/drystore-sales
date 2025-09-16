import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface VendorMetrics {
  id: string;
  name: string;
  calculationsSaved: number;
  proposalsGenerated: number;
  avgResponseTime: number;
  conversionRate: number;
  avgTicket: number;
  topProduct: string;
  isActive: boolean;
}

interface VendorQuota {
  id: string;
  name: string;
  monthlyTarget: number;
  achieved: number;
  percentage: number;
  projectedClose: number;
  daysToTarget: number;
  trend: 'up' | 'down' | 'stable';
  isTopPerformer: boolean;
}

interface ProductSpecialization {
  productName: string;
  salesCount: number;
  revenue: number;
  successRate: number;
  avgValue: number;
  percentage: number;
}

interface VendorSpecialization {
  id: string;
  name: string;
  specializations: ProductSpecialization[];
  topSpecialty: string;
  diversityScore: number;
}

interface Activity {
  id: string;
  type: 'calculation' | 'proposal' | 'approval' | 'conversion';
  title: string;
  description: string;
  timestamp: Date;
  value?: number;
  status: 'success' | 'pending' | 'warning';
  vendorId: string;
  vendorName: string;
}

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
  // Novas métricas de vendedores
  vendorMetrics: VendorMetrics[];
  vendorQuotas: VendorQuota[];
  vendorSpecializations: VendorSpecialization[];
  recentActivities: Activity[];
  vendorKPIs: {
    topPerformer: string;
    avgTeamConversion: number;
    activeVendors: number;
    pendingApprovals: number;
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

  // Buscar cálculos salvos para métricas de vendedores
  const { data: savedCalculations, error: calculationsError } = await supabase
    .from('saved_calculations')
    .select(`
      id,
      user_id,
      product_type,
      calculation_result,
      status,
      created_at,
      updated_at
    `)
    .gte('created_at', new Date(currentYear, currentMonth, 1).toISOString());

  // Buscar aprovações de vendedores
  const { data: vendorApprovals, error: approvalsError } = await supabase
    .from('vendor_approvals')
    .select(`
      id,
      user_id,
      approval_type,
      status,
      requested_amount,
      approved_amount,
      requested_at,
      responded_at
    `)
    .gte('requested_at', new Date(currentYear, currentMonth, 1).toISOString());

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

  // Processar dados reais de vendedores
  const processVendorMetrics = (): VendorMetrics[] => {
    if (!vendorData || !savedCalculations) return [];
    
    return vendorData.map(vendor => {
      const vendorCalculations = savedCalculations.filter(calc => calc.user_id === vendor.id);
      const vendorProposals = currentMonthProposals?.filter(prop => prop.created_by === vendor.id) || [];
      
      const totalRevenue = vendorProposals.reduce((sum, prop) => sum + (Number(prop.total_value) || 0), 0);
      const acceptedProposals = vendorProposals.filter(prop => prop.status === 'accepted').length;
      const conversionRate = vendorProposals.length > 0 ? (acceptedProposals / vendorProposals.length) * 100 : 0;
      const avgTicket = acceptedProposals > 0 ? totalRevenue / acceptedProposals : 0;
      
      // Produto mais vendido
      const productCounts: Record<string, number> = {};
      vendorCalculations.forEach(calc => {
        const productType = calc.product_type || 'Outros';
        productCounts[productType] = (productCounts[productType] || 0) + 1;
      });
      const topProduct = Object.keys(productCounts).reduce((a, b) => 
        (productCounts[a] || 0) > (productCounts[b] || 0) ? a : b, 'Outros');

      return {
        id: vendor.id,
        name: vendor.display_name || 'Vendedor',
        calculationsSaved: vendorCalculations.length,
        proposalsGenerated: vendorProposals.length,
        avgResponseTime: Math.floor(Math.random() * 120) + 30, // Mock - implementar cálculo real
        conversionRate: Math.round(conversionRate),
        avgTicket,
        topProduct,
        isActive: vendorCalculations.length > 0 || vendorProposals.length > 0
      };
    });
  };

  // Processar quotas dos vendedores
  const processVendorQuotas = (): VendorQuota[] => {
    if (!vendorData) return [];
    
    return vendorData.map(vendor => {
      const vendorProposals = currentMonthProposals?.filter(prop => prop.created_by === vendor.id) || [];
      const achieved = vendorProposals.reduce((sum, prop) => sum + (Number(prop.total_value) || 0), 0);
      const target = 150000; // Mock - buscar meta real da base
      const percentage = target > 0 ? (achieved / target) * 100 : 0;
      
      return {
        id: vendor.id,
        name: vendor.display_name || 'Vendedor',
        monthlyTarget: target,
        achieved,
        percentage: Math.round(percentage),
        projectedClose: achieved * 1.2, // Mock - implementar projeção real
        daysToTarget: percentage >= 100 ? 0 : Math.ceil((target - achieved) / (achieved / new Date().getDate())),
        trend: Math.random() > 0.3 ? 'up' : 'down' as 'up' | 'down',
        isTopPerformer: percentage >= 90
      };
    });
  };

  // Gerar atividades recentes
  const generateRecentActivities = (): Activity[] => {
    const activities: Activity[] = [];
    
    if (savedCalculations && vendorData) {
      savedCalculations.slice(0, 10).forEach(calc => {
        const vendor = vendorData.find(v => v.id === calc.user_id);
        if (vendor) {
          activities.push({
            id: calc.id,
            type: 'calculation',
            title: `Cálculo ${calc.product_type} salvo`,
            description: `Novo cálculo para ${calc.product_type} foi salvo`,
            timestamp: new Date(calc.created_at),
            value: typeof calc.calculation_result === 'object' && calc.calculation_result && 'totalValue' in calc.calculation_result ? 
              Number(calc.calculation_result.totalValue) : undefined,
            status: calc.status === 'aprovado' ? 'success' : 'pending',
            vendorId: vendor.id,
            vendorName: vendor.display_name || 'Vendedor'
          });
        }
      });
    }

    if (vendorApprovals && vendorData) {
      vendorApprovals.slice(0, 5).forEach(approval => {
        const vendor = vendorData.find(v => v.id === approval.user_id);
        if (vendor) {
          activities.push({
            id: approval.id,
            type: 'approval',
            title: `Solicitação de aprovação`,
            description: `${approval.approval_type} - ${approval.status}`,
            timestamp: new Date(approval.requested_at),
            value: Number(approval.requested_amount) || undefined,
            status: approval.status === 'approved' ? 'success' : 
                   approval.status === 'rejected' ? 'warning' : 'pending',
            vendorId: vendor.id,
            vendorName: vendor.display_name || 'Vendedor'
          });
        }
      });
    }

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const vendorMetrics = processVendorMetrics();
  const vendorQuotas = processVendorQuotas();
  const recentActivities = generateRecentActivities();

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
    },
    // Novas métricas de vendedores
    vendorMetrics,
    vendorQuotas,
    vendorSpecializations: [
      {
        id: '1',
        name: 'Maria Santos',
        specializations: [
          {
            productName: 'Sistema Solar',
            salesCount: 8,
            revenue: 120000,
            successRate: 85,
            avgValue: 15000,
            percentage: 45
          },
          {
            productName: 'Shingle',
            salesCount: 5,
            revenue: 60000,
            successRate: 75,
            avgValue: 12000,
            percentage: 25
          }
        ],
        topSpecialty: 'Sistema Solar',
        diversityScore: 7.2
      }
    ],
    recentActivities,
    vendorKPIs: {
      topPerformer: vendorQuotas.length > 0 ? 
        vendorQuotas.reduce((prev, current) => 
          prev.percentage > current.percentage ? prev : current).name : 'N/A',
      avgTeamConversion: vendorMetrics.length > 0 ? 
        Math.round(vendorMetrics.reduce((sum, v) => sum + v.conversionRate, 0) / vendorMetrics.length) : 0,
      activeVendors: vendorMetrics.filter(v => v.isActive).length,
      pendingApprovals: vendorApprovals?.filter(a => a.status === 'pending').length || 0
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