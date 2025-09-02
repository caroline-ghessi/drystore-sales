export interface AnalyticsMetric {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  format?: 'number' | 'percentage' | 'currency' | 'time';
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  category?: string;
}

export interface LeadAnalyticsData {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  conversionRate: number;
  averageScore: number;
  leadsBySource: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  dailyTrend: ChartDataPoint[];
  weeklyTrend: ChartDataPoint[];
  monthlyTrend: ChartDataPoint[];
}

export interface ConversionFunnelData {
  stage: string;
  count: number;
  percentage: number;
  conversionRate?: number;
}

export interface PerformanceMetrics {
  responseTime: {
    average: number;
    median: number;
    p95: number;
  };
  qualityScore: {
    average: number;
    distribution: Array<{
      range: string;
      count: number;
    }>;
  };
  customerSatisfaction: {
    rating: number;
    nps: number;
  };
}