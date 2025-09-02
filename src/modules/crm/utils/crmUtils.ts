import { format, formatDistanceToNow, subDays, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { LeadTemperature, LeadStatus } from '../types';

export class CRMUtils {
  // Formatação de datas
  static formatDate(date: Date | string, formatStr: string = 'dd/MM/yyyy'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatStr, { locale: ptBR });
  }

  static formatRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isToday(dateObj)) {
      return `hoje às ${format(dateObj, 'HH:mm')}`;
    }
    
    if (isYesterday(dateObj)) {
      return `ontem às ${format(dateObj, 'HH:mm')}`;
    }
    
    return formatDistanceToNow(dateObj, { 
      locale: ptBR, 
      addSuffix: true 
    });
  }

  // Cálculos de leads
  static calculateLeadScore(factors: {
    engagement: number; // 0-100
    responseTime: number; // em minutos
    messagesSent: number;
    hasPhone: boolean;
    hasEmail: boolean;
    productInterest: boolean;
    budgetMentioned: boolean;
  }): number {
    let score = 0;
    
    // Engagement (40% do score)
    score += (factors.engagement * 0.4);
    
    // Tempo de resposta (20% do score)
    if (factors.responseTime < 5) score += 20;
    else if (factors.responseTime < 15) score += 15;
    else if (factors.responseTime < 60) score += 10;
    else score += 5;
    
    // Quantidade de mensagens (15% do score)
    if (factors.messagesSent > 10) score += 15;
    else if (factors.messagesSent > 5) score += 10;
    else score += 5;
    
    // Informações coletadas (25% do score)
    if (factors.hasPhone) score += 5;
    if (factors.hasEmail) score += 5;
    if (factors.productInterest) score += 8;
    if (factors.budgetMentioned) score += 7;
    
    return Math.min(Math.round(score), 100);
  }

  static determineTemperature(score: number, daysSinceLastContact: number): LeadTemperature {
    if (score >= 75 && daysSinceLastContact <= 1) return 'hot';
    if (score >= 50 && daysSinceLastContact <= 3) return 'warm';
    return 'cold';
  }

  // Formatação de valores
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  static formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  // Utilitários de status
  static getTemperatureColor(temperature: LeadTemperature): string {
    const colors = {
      hot: 'text-red-600 bg-red-50 border-red-200',
      warm: 'text-orange-600 bg-orange-50 border-orange-200',
      cold: 'text-blue-600 bg-blue-50 border-blue-200'
    };
    
    return colors[temperature];
  }

  static getTemperatureEmoji(temperature: LeadTemperature): string {
    const emojis = {
      hot: '🔥',
      warm: '🟠',
      cold: '❄️'
    };
    
    return emojis[temperature];
  }

  static getStatusLabel(status: LeadStatus): string {
    const labels = {
      new: 'Novo',
      contacted: 'Contatado',
      qualified: 'Qualificado',
      proposal: 'Proposta Enviada',
      negotiation: 'Em Negociação',
      won: 'Ganho',
      lost: 'Perdido'
    };
    
    return labels[status];
  }

  // Filtros e busca
  static filterLeads(leads: any[], filters: {
    search?: string;
    temperature?: LeadTemperature;
    status?: LeadStatus;
    dateRange?: { start: Date; end: Date };
  }) {
    return leads.filter(lead => {
      // Busca por texto
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchName = lead.customer_name?.toLowerCase().includes(search);
        const matchPhone = lead.whatsapp_number?.includes(search);
        if (!matchName && !matchPhone) return false;
      }
      
      // Filtro por temperatura
      if (filters.temperature && lead.lead_temperature !== filters.temperature) {
        return false;
      }
      
      // Filtro por status
      if (filters.status && lead.status !== filters.status) {
        return false;
      }
      
      // Filtro por data
      if (filters.dateRange) {
        const leadDate = new Date(lead.created_at);
        if (leadDate < filters.dateRange.start || leadDate > filters.dateRange.end) {
          return false;
        }
      }
      
      return true;
    });
  }

  // Geração de insights
  static generateLeadInsights(lead: any): string[] {
    const insights = [];
    
    if (lead.lead_score >= 80) {
      insights.push('Lead com alta probabilidade de conversão');
    }
    
    const daysSinceLastContact = lead.updated_at 
      ? Math.floor((Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    if (daysSinceLastContact > 3) {
      insights.push('Lead sem contato há mais de 3 dias - ação urgente necessária');
    }
    
    if (lead.messages?.length > 10) {
      insights.push('Lead altamente engajado - considere escalação para vendedor');
    }
    
    return insights;
  }
}