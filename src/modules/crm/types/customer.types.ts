export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  country?: string;
  source: string;
  leadScore: number;
  leadTemperature: 'hot' | 'warm' | 'cold';
  status: 'active' | 'inactive' | 'blocked';
  firstContactDate: Date;
  lastContactDate?: Date;
  totalInteractions: number;
  averageResponseTime?: number;
  tags: string[];
  customFields: Record<string, any>;
  notes: CustomerNote[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  type: 'general' | 'call' | 'meeting' | 'email' | 'follow_up';
  isPrivate?: boolean;
}

export interface CustomerInteraction {
  id: string;
  customerId: string;
  type: 'message' | 'call' | 'email' | 'meeting' | 'task';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  createdBy?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface CustomerFilters {
  search?: string;
  temperature?: 'hot' | 'warm' | 'cold';
  source?: string;
  status?: 'active' | 'inactive' | 'blocked';
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasInteractionInDays?: number;
}

export interface CustomerStats {
  total: number;
  active: number;
  byTemperature: {
    hot: number;
    warm: number;
    cold: number;
  };
  bySource: Record<string, number>;
  newThisMonth: number;
  churnRate: number;
  averageLifetimeValue: number;
}