export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'call' | 'meeting' | 'followup' | 'proposal' | 'ai_task';
  status: 'pending' | 'overdue' | 'completed';
  isAIGenerated?: boolean;
  relatedOpportunity?: {
    id: string;
    name: string;
  };
}

export interface CalendarFilters {
  activities: boolean;
  meetings: boolean;
  followups: boolean;
  team: boolean;
}

export type ViewMode = 'day' | 'week' | 'month';
