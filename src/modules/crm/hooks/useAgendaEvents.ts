import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addHours, setHours, setMinutes, isSameDay, startOfDay, addDays } from 'date-fns';
import { CalendarEvent, CalendarFilters } from '../components/agenda/types';

export function useAgendaEvents(date: Date, filters: CalendarFilters) {
  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['agenda-opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select(`
          id,
          title,
          description,
          next_step,
          validation_status,
          stage,
          created_at,
          expected_close_date,
          customer_id,
          crm_customers (
            name
          )
        `)
        .not('next_step', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    }
  });

  const events = useMemo<CalendarEvent[]>(() => {
    if (!opportunities) return [];

    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);

    // Transform opportunities with next_step into events
    return opportunities.map((opp, index) => {
      const isAIGenerated = opp.validation_status === 'ai_generated';
      const isCall = opp.next_step?.toLowerCase().includes('ligar') || 
                     opp.next_step?.toLowerCase().includes('call');
      const isMeeting = opp.next_step?.toLowerCase().includes('reunião') || 
                        opp.next_step?.toLowerCase().includes('meeting');
      const isProposal = opp.next_step?.toLowerCase().includes('proposta') ||
                         opp.next_step?.toLowerCase().includes('enviar');
      
      // Determine event type
      let type: CalendarEvent['type'] = 'followup';
      if (isAIGenerated) type = 'ai_task';
      else if (isCall) type = 'call';
      else if (isMeeting) type = 'meeting';
      else if (isProposal) type = 'proposal';

      // Distribute events throughout today and tomorrow based on index
      const baseDate = index % 2 === 0 ? today : tomorrow;
      const hour = 9 + (index % 8); // Events between 9:00 and 16:00
      const startTime = setMinutes(setHours(baseDate, hour), 0);
      const endTime = addHours(startTime, index % 3 === 0 ? 1 : 0.5);

      // Determine status
      const now = new Date();
      const status: CalendarEvent['status'] = 
        startTime < now && isSameDay(startTime, now) ? 'overdue' : 'pending';

      const customerName = opp.crm_customers?.name || 'Cliente';

      return {
        id: opp.id,
        title: opp.next_step || `${type === 'ai_task' ? 'Validar lead' : 'Follow-up'} - ${customerName}`,
        description: opp.description || undefined,
        startTime,
        endTime,
        type,
        status,
        isAIGenerated,
        relatedOpportunity: {
          id: opp.id,
          name: opp.title
        }
      };
    });
  }, [opportunities]);

  // Filter events based on selected calendars
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (event.type === 'ai_task' && !filters.activities) return false;
      if (event.type === 'meeting' && !filters.meetings) return false;
      if (event.type === 'followup' && !filters.followups) return false;
      if (event.type === 'call' && !filters.activities) return false;
      if (event.type === 'proposal' && !filters.activities) return false;
      return true;
    });
  }, [events, filters]);

  return { events: filteredEvents, isLoading };
}
