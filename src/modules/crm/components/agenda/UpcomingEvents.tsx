import React from 'react';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarEvent } from './types';
import { EventItem } from './EventItem';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UpcomingEventsProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick?: (event: CalendarEvent) => void;
}

export function UpcomingEvents({ events, currentDate, onEventClick }: UpcomingEventsProps) {
  const todayEvents = events.filter(e => isToday(e.startTime));
  const tomorrowEvents = events.filter(e => isTomorrow(e.startTime));
  
  const formatTomorrowDate = () => {
    const tomorrow = addDays(new Date(), 1);
    return format(tomorrow, "dd MMM", { locale: ptBR });
  };

  return (
    <div className="bg-background rounded-lg border flex-1 flex flex-col min-h-0">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Próximos Eventos
        </h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Today Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Hoje</span>
            </div>
            
            {todayEvents.length > 0 ? (
              <div className="space-y-2">
                {todayEvents.map((event) => (
                  <EventItem 
                    key={event.id} 
                    event={event} 
                    onClick={() => onEventClick?.(event)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum evento hoje</p>
            )}
          </div>
          
          {/* Tomorrow Section */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">Amanhã</span>
              <span className="text-xs text-muted-foreground">{formatTomorrowDate()}</span>
            </div>
            
            {tomorrowEvents.length > 0 ? (
              <div className="space-y-2">
                {tomorrowEvents.map((event) => (
                  <EventItem 
                    key={event.id} 
                    event={event}
                    onClick={() => onEventClick?.(event)} 
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum evento amanhã</p>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
