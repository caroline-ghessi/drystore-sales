import { subDays, format } from 'date-fns';

export class LeadCalculations {
  // Cálculo de métricas de leads
  static calculateConversionRate(totalLeads: number, convertedLeads: number): number {
    if (totalLeads === 0) return 0;
    return Math.round((convertedLeads / totalLeads) * 100 * 100) / 100;
  }

  static calculateAverageScore(leads: any[]): number {
    if (leads.length === 0) return 0;
    const totalScore = leads.reduce((sum, lead) => sum + (lead.lead_score || 0), 0);
    return Math.round((totalScore / leads.length) * 10) / 10;
  }

  static calculateResponseTime(messages: any[]): number {
    if (messages.length < 2) return 0;
    
    const responseTimes = [];
    let lastCustomerMessage = null;
    
    for (const message of messages) {
      if (message.sender === 'customer') {
        lastCustomerMessage = new Date(message.created_at);
      } else if (message.sender === 'agent' && lastCustomerMessage) {
        const responseTime = new Date(message.created_at).getTime() - lastCustomerMessage.getTime();
        responseTimes.push(responseTime / (1000 * 60)); // em minutos
        lastCustomerMessage = null;
      }
    }
    
    if (responseTimes.length === 0) return 0;
    
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    return Math.round(avgResponseTime * 10) / 10;
  }

  // Análise de tendências
  static calculateDailyTrends(data: any[], period: string = '7d') {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 7;
    const trends = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayData = data.filter(item => 
        item.created_at?.startsWith(dateStr) ||
        item.date === dateStr
      );
      
      trends.push({
        date: dateStr,
        count: dayData.length,
        value: dayData.reduce((sum, item) => sum + (item.value || item.lead_score || 1), 0)
      });
    }
    
    return trends;
  }

  // Distribuição por categorias
  static calculateDistribution(data: any[], key: string) {
    const distribution = data.reduce((acc, item) => {
      const value = item[key] || 'unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const total = data.length;
    
    return Object.entries(distribution).map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0
    }));
  }

  // Cálculos de valor
  static estimateLeadValue(productInterest?: string, leadScore?: number): number {
    const baseValues = {
      'energia_solar': 25000,
      'telha_shingle': 15000,
      'steel_frame': 45000,
      'construcao': 35000,
      'reforma': 20000,
      'consultoria': 5000
    };
    
    const baseValue = baseValues[productInterest as keyof typeof baseValues] || 15000;
    const scoreMultiplier = leadScore ? (leadScore / 100) : 0.5;
    
    return Math.round(baseValue * scoreMultiplier);
  }

  static calculateTotalPipelineValue(leads: any[]): number {
    return leads.reduce((total, lead) => {
      const estimatedValue = this.estimateLeadValue(
        lead.product_interest || lead.context?.product_group,
        lead.lead_score
      );
      const probability = this.calculateProbability(lead.lead_temperature, lead.lead_score);
      
      return total + (estimatedValue * probability);
    }, 0);
  }

  private static calculateProbability(temperature: string, score?: number): number {
    const baseProb = {
      'hot': 0.8,
      'warm': 0.4,
      'cold': 0.1
    };
    
    let probability = baseProb[temperature as keyof typeof baseProb] || 0.3;
    
    // Ajustar baseado no score
    if (score) {
      if (score >= 80) probability *= 1.2;
      else if (score >= 60) probability *= 1.1;
      else if (score < 40) probability *= 0.8;
    }
    
    return Math.min(probability, 1);
  }

  // Análise de performance
  static calculatePerformanceMetrics(leads: any[], period: string = '30d') {
    const now = new Date();
    const periodStart = period === '7d' ? subDays(now, 7) : 
                       period === '30d' ? subDays(now, 30) : 
                       subDays(now, 90);
    
    const periodLeads = leads.filter(lead => 
      new Date(lead.created_at) >= periodStart
    );
    
    const metrics = {
      totalLeads: periodLeads.length,
      averageScore: this.calculateAverageScore(periodLeads),
      hotLeadsPercentage: this.calculateConversionRate(
        periodLeads.length,
        periodLeads.filter(l => l.lead_temperature === 'hot').length
      ),
      responseTimeAvg: 0, // Calculado separadamente com mensagens
      conversionRate: 0, // Calculado separadamente com conversões
      growthRate: this.calculateGrowthRate(leads, period)
    };
    
    return metrics;
  }

  private static calculateGrowthRate(leads: any[], period: string): number {
    const now = new Date();
    const currentPeriodStart = period === '7d' ? subDays(now, 7) : 
                              period === '30d' ? subDays(now, 30) : 
                              subDays(now, 90);
    
    const previousPeriodStart = period === '7d' ? subDays(now, 14) : 
                               period === '30d' ? subDays(now, 60) : 
                               subDays(now, 180);
    
    const currentPeriodLeads = leads.filter(lead => {
      const date = new Date(lead.created_at);
      return date >= currentPeriodStart;
    }).length;
    
    const previousPeriodLeads = leads.filter(lead => {
      const date = new Date(lead.created_at);
      return date >= previousPeriodStart && date < currentPeriodStart;
    }).length;
    
    if (previousPeriodLeads === 0) return 0;
    
    return Math.round(((currentPeriodLeads - previousPeriodLeads) / previousPeriodLeads) * 100 * 10) / 10;
  }
}