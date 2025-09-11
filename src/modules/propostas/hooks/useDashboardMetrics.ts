import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';

export interface DashboardMetrics {
  // Métricas para vendedor
  personalSales: {
    value: number;
    growth: number;
    lastWeekData: number[];
  };
  personalQuota: {
    target: number;
    achieved: number;
    percentage: number;
    remaining: number;
  };
  openProposals: {
    total: number;
    recent: Array<{
      id: string;
      client: string;
      value: number;
      status: string;
      date: string;
    }>;
  };
  conversionRate: {
    percentage: number;
    teamAverage: number;
    trend: 'up' | 'down' | 'stable';
  };

  // Métricas para admin
  totalRevenue: {
    value: number;
    monthlyGrowth: number;
    yearOverYear: number;
    monthlyData: number[];
  };
  companyQuota: {
    target: number;
    achieved: number;
    percentage: number;
    daysRemaining: number;
    teamBreakdown: Array<{
      vendorName: string;
      achieved: number;
      target: number;
      percentage: number;
      hasMetGoal: boolean;
    }>;
  };
  vendorRanking: Array<{
    id: string;
    name: string;
    avatar?: string;
    sales: number;
    conversionRate: number;
    hasMetGoal: boolean;
    alertLevel?: 'success' | 'warning' | 'danger';
  }>;
  productPerformance: Array<{
    name: string;
    sales: number;
    percentage: number;
    conversionRate: number;
  }>;
}

export function useDashboardMetrics() {
  const { user } = useAuth();
  const { isAdmin, isVendor } = useUserPermissions();

  return useQuery({
    queryKey: ['dashboard-metrics', user?.id, isAdmin, isVendor],
    queryFn: async (): Promise<DashboardMetrics> => {
      // Mock data - substituir por calls reais ao Supabase
      const mockMetrics: DashboardMetrics = {
        personalSales: {
          value: 125000,
          growth: 15.2,
          lastWeekData: [15000, 18000, 22000, 19000, 24000, 26000, 21000]
        },
        personalQuota: {
          target: 150000,
          achieved: 125000,
          percentage: 83.3,
          remaining: 25000
        },
        openProposals: {
          total: 12,
          recent: [
            {
              id: '1',
              client: 'João Silva',
              value: 15000,
              status: 'Em análise',
              date: '2024-01-15'
            },
            {
              id: '2',
              client: 'Maria Santos',
              value: 28000,
              status: 'Aguardando aprovação',
              date: '2024-01-14'
            },
            {
              id: '3',
              client: 'Pedro Costa',
              value: 35000,
              status: 'Negociação',
              date: '2024-01-13'
            }
          ]
        },
        conversionRate: {
          percentage: 68,
          teamAverage: 62,
          trend: 'up'
        },
        totalRevenue: {
          value: 1200000,
          monthlyGrowth: 18.5,
          yearOverYear: 25.3,
          monthlyData: [800000, 950000, 1100000, 1200000, 1350000, 1200000]
        },
        companyQuota: {
          target: 1500000,
          achieved: 1200000,
          percentage: 80,
          daysRemaining: 15,
          teamBreakdown: [
            {
              vendorName: 'João Silva',
              achieved: 125000,
              target: 150000,
              percentage: 83.3,
              hasMetGoal: false
            },
            {
              vendorName: 'Maria Santos',
              achieved: 180000,
              target: 160000,
              percentage: 112.5,
              hasMetGoal: true
            },
            {
              vendorName: 'Pedro Costa',
              achieved: 95000,
              target: 140000,
              percentage: 67.8,
              hasMetGoal: false
            }
          ]
        },
        vendorRanking: [
          {
            id: '1',
            name: 'Maria Santos',
            sales: 180000,
            conversionRate: 75,
            hasMetGoal: true,
            alertLevel: 'success'
          },
          {
            id: '2',
            name: 'João Silva',
            sales: 125000,
            conversionRate: 68,
            hasMetGoal: false,
            alertLevel: 'warning'
          },
          {
            id: '3',
            name: 'Pedro Costa',
            sales: 95000,
            conversionRate: 45,
            hasMetGoal: false,
            alertLevel: 'danger'
          }
        ],
        productPerformance: [
          { name: 'Solar', sales: 450000, percentage: 37.5, conversionRate: 72 },
          { name: 'Drywall', sales: 320000, percentage: 26.7, conversionRate: 65 },
          { name: 'Shingle', sales: 280000, percentage: 23.3, conversionRate: 58 },
          { name: 'Steel Frame', sales: 150000, percentage: 12.5, conversionRate: 62 }
        ]
      };

      return mockMetrics;
    },
    refetchInterval: 5 * 60 * 1000 // Refetch a cada 5 minutos
  });
}