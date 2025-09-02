import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  score: number;
  temperature: 'hot' | 'warm' | 'cold';
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  source: string;
  assignedTo?: string;
  estimatedValue?: number;
  probability?: number;
  expectedCloseDate?: Date;
  lastContactDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class LeadService {
  static async getLeads(filters?: {
    temperature?: string;
    status?: string;
    assignedTo?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from('conversations')
      .select(`
        *,
        messages:messages(count),
        lead_distributions(*)
      `)
      .order('updated_at', { ascending: false });

    if (filters?.temperature) {
      query = query.eq('lead_temperature', filters.temperature);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  static async updateLeadScore(leadId: string, score: number) {
    const { data, error } = await supabase
      .from('conversations')
      .update({ lead_score: score, updated_at: new Date().toISOString() })
      .eq('id', leadId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateLeadTemperature(leadId: string, temperature: 'hot' | 'warm' | 'cold') {
    const { data, error } = await supabase
      .from('conversations')
      .update({ lead_temperature: temperature, updated_at: new Date().toISOString() })
      .eq('id', leadId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getLeadStatistics(period: string = '30d') {
    const { data, error } = await supabase
      .from('conversations')
      .select('lead_temperature, lead_score, status, created_at')
      .gte('created_at', this.getDateFromPeriod(period));

    if (error) throw error;

    const stats = {
      total: data.length,
      hot: data.filter(l => l.lead_temperature === 'hot').length,
      warm: data.filter(l => l.lead_temperature === 'warm').length,
      cold: data.filter(l => l.lead_temperature === 'cold').length,
      averageScore: data.reduce((sum, l) => sum + (l.lead_score || 0), 0) / data.length || 0,
    };

    return stats;
  }

  private static getDateFromPeriod(period: string): string {
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 7;
    const date = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return date.toISOString();
  }
}