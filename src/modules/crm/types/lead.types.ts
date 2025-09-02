export type LeadTemperature = 'hot' | 'warm' | 'cold';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type LeadSource = 'whatsapp' | 'website' | 'social' | 'referral' | 'paid_ads' | 'organic' | 'direct';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  score: number;
  temperature: LeadTemperature;
  status: LeadStatus;
  source: LeadSource;
  assignedTo?: string;
  estimatedValue?: number;
  probability?: number;
  expectedCloseDate?: Date;
  lastContactDate?: Date;
  productInterest?: string;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadFilters {
  search?: string;
  temperature?: LeadTemperature;
  status?: LeadStatus;
  source?: LeadSource;
  assignedTo?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface LeadStats {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  averageScore: number;
  conversionRate: number;
  responseTime: number;
}