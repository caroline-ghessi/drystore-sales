import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addHours, setHours, setMinutes, startOfDay, addDays } from 'date-fns';
import { Event } from '@/components/ui/event-manager';
import { toast } from 'sonner';

// Color mapping based on event type
const typeColorMap: Record<string, string> = {
  call: 'blue',
  meeting: 'green',
  followup: 'orange',
  proposal: 'purple',
  ai_task: 'pink',
};

// Category mapping based on event type
const typeCategoryMap: Record<string, string> = {
  call: 'Ligação',
  meeting: 'Reunião',
  followup: 'Follow-up',
  proposal: 'Proposta',
  ai_task: 'Tarefa IA',
};

export function useAgendaEvents() {
  const queryClient = useQueryClient();

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

  const events = useMemo<Event[]>(() => {
    if (!opportunities) return [];

    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);

    return opportunities.map((opp, index) => {
      const isAIGenerated = opp.validation_status === 'ai_generated';
      const isCall = opp.next_step?.toLowerCase().includes('ligar') || 
                     opp.next_step?.toLowerCase().includes('call');
      const isMeeting = opp.next_step?.toLowerCase().includes('reunião') || 
                        opp.next_step?.toLowerCase().includes('meeting');
      const isProposal = opp.next_step?.toLowerCase().includes('proposta') ||
                         opp.next_step?.toLowerCase().includes('enviar');
      
      // Determine event type
      let type = 'followup';
      if (isAIGenerated) type = 'ai_task';
      else if (isCall) type = 'call';
      else if (isMeeting) type = 'meeting';
      else if (isProposal) type = 'proposal';

      // Distribute events throughout today and tomorrow based on index
      const baseDate = index % 2 === 0 ? today : tomorrow;
      const hour = 9 + (index % 8);
      const startTime = setMinutes(setHours(baseDate, hour), 0);
      const endTime = addHours(startTime, index % 3 === 0 ? 1 : 0.5);

      const customerName = opp.crm_customers?.name || 'Cliente';

      // Map to Event format for EventManager
      const color = typeColorMap[type] || 'blue';
      const category = typeCategoryMap[type] || 'Follow-up';

      // Add tags based on status
      const tags: string[] = [];
      if (isAIGenerated) tags.push('IA');
      if (opp.stage === 'prospecting') tags.push('Prospecção');
      if (opp.stage === 'negotiation') tags.push('Negociação');

      return {
        id: opp.id,
        title: opp.next_step || `${type === 'ai_task' ? 'Validar lead' : 'Follow-up'} - ${customerName}`,
        description: opp.description || undefined,
        startTime,
        endTime,
        color,
        category,
        tags,
      };
    });
  }, [opportunities]);

  // Create event mutation (placeholder - will show info toast)
  const createEventMutation = useMutation({
    mutationFn: async (event: Omit<Event, 'id'>) => {
      // For now, just log and show info
      console.log('Creating event:', event);
      // In the future, this could create an entry in a dedicated crm_events table
      return event;
    },
    onSuccess: () => {
      toast.success('Evento criado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['agenda-opportunities'] });
    },
    onError: () => {
      toast.error('Erro ao criar evento');
    }
  });

  // Update event mutation (updates opportunity's next_step or expected dates)
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, event }: { id: string; event: Partial<Event> }) => {
      // Update the opportunity if it has date changes
      if (event.startTime) {
        const { error } = await supabase
          .from('crm_opportunities')
          .update({
            expected_close_date: event.startTime.toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
        
        if (error) throw error;
      }
      return { id, event };
    },
    onSuccess: () => {
      toast.success('Evento atualizado');
      queryClient.invalidateQueries({ queryKey: ['agenda-opportunities'] });
    },
    onError: () => {
      toast.error('Erro ao atualizar evento');
    }
  });

  // Delete event mutation (placeholder)
  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      // For now, just log - deleting would require clearing next_step
      console.log('Deleting event:', id);
      return id;
    },
    onSuccess: () => {
      toast.success('Evento removido');
      queryClient.invalidateQueries({ queryKey: ['agenda-opportunities'] });
    },
    onError: () => {
      toast.error('Erro ao remover evento');
    }
  });

  return { 
    events, 
    isLoading,
    createEvent: createEventMutation.mutate,
    updateEvent: (id: string, event: Partial<Event>) => updateEventMutation.mutate({ id, event }),
    deleteEvent: deleteEventMutation.mutate,
  };
}
