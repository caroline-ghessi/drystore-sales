import { supabase } from '@/integrations/supabase/client';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  source: string;
  firstContactDate: Date;
  lastContactDate?: Date;
  totalInteractions: number;
  leadScore: number;
  leadTemperature: 'hot' | 'warm' | 'cold';
  tags: string[];
  notes: string[];
}

export class CustomerService {
  static async getCustomers(filters?: {
    search?: string;
    temperature?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from('conversations')
      .select(`
        *,
        messages(count)
      `)
      .order('updated_at', { ascending: false });

    if (filters?.search) {
      query = query.or(`customer_name.ilike.%${filters.search}%,whatsapp_number.ilike.%${filters.search}%`);
    }

    if (filters?.temperature && ['hot', 'warm', 'cold'].includes(filters.temperature)) {
      query = query.eq('lead_temperature', filters.temperature as 'hot' | 'warm' | 'cold');
    }

    if (filters?.source) {
      query = query.eq('source', filters.source);
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

  static async getCustomerById(id: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages(*),
        lead_distributions(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateCustomer(id: string, updates: Partial<Customer>) {
    const { data, error } = await supabase
      .from('conversations')
      .update({
        customer_name: updates.name,
        lead_score: updates.leadScore,
        lead_temperature: updates.leadTemperature,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getCustomerStats() {
    const { data, error } = await supabase
      .from('conversations')
      .select('lead_temperature, source, created_at');

    if (error) throw error;

    const stats = {
      total: data.length,
      byTemperature: {
        hot: data.filter(c => c.lead_temperature === 'hot').length,
        warm: data.filter(c => c.lead_temperature === 'warm').length,
        cold: data.filter(c => c.lead_temperature === 'cold').length,
      },
      bySource: data.reduce((acc, customer) => {
        const source = customer.source || 'direct';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      newThisMonth: data.filter(c => {
        const created = new Date(c.created_at);
        const now = new Date();
        return created.getMonth() === now.getMonth() && 
               created.getFullYear() === now.getFullYear();
      }).length,
    };

    return stats;
  }
}