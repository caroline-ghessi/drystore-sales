import React from 'react';
import { EventManager, Event } from '@/components/ui/event-manager';
import { useAgendaEvents } from '../hooks/useAgendaEvents';
import { Loader2 } from 'lucide-react';

export default function Agenda() {
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useAgendaEvents();

  const handleEventCreate = (event: Omit<Event, 'id'>) => {
    createEvent(event);
  };

  const handleEventUpdate = (id: string, event: Partial<Event>) => {
    updateEvent(id, event);
  };

  const handleEventDelete = (id: string) => {
    deleteEvent(id);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 bg-muted/20">
      <EventManager
        events={events}
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        categories={['Reunião', 'Ligação', 'Follow-up', 'Proposta', 'Tarefa IA']}
        availableTags={['Importante', 'Urgente', 'Cliente', 'Equipe', 'IA', 'Prospecção', 'Negociação']}
        defaultView="month"
        className="h-full"
      />
    </div>
  );
}
