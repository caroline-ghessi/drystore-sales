import React from 'react';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimelineEvent } from './TimelineEvent';
import { CalendarEvent } from './types';

interface WeekTimelineProps {
  startDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: Date) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 06:00 to 20:00

export function WeekTimeline({ startDate, events, onEventClick, onDayClick }: WeekTimelineProps) {
  const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(startDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(event.startTime, date));
  };

  const getEventPosition = (event: CalendarEvent) => {
    const startHour = event.startTime.getHours();
    const startMinutes = event.startTime.getMinutes();
    const endHour = event.endTime.getHours();
    const endMinutes = event.endTime.getMinutes();
    
    const top = ((startHour - 6) * 60 + startMinutes) * (48 / 60);
    const duration = (endHour - startHour) * 60 + (endMinutes - startMinutes);
    const height = Math.max(duration * (48 / 60), 24);
    
    return { top, height };
  };

  const currentHour = new Date().getHours();
  const currentMinutes = new Date().getMinutes();
  const currentTimeTop = ((currentHour - 6) * 60 + currentMinutes) * (48 / 60);

  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
      <CardHeader className="py-3 px-4 border-b shrink-0">
        <div className="grid grid-cols-8 gap-0">
          <div className="w-16" />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              className={`text-center cursor-pointer px-1 py-2 rounded-lg transition-colors hover:bg-muted/50 ${
                isToday(day) ? 'bg-primary/10' : ''
              }`}
            >
              <p className={`text-xs font-medium ${isToday(day) ? 'text-primary' : 'text-muted-foreground'}`}>
                {format(day, 'EEE', { locale: ptBR }).replace('.', '')}
              </p>
              <p className={`text-lg font-semibold ${isToday(day) ? 'text-primary' : 'text-foreground'}`}>
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="relative">
            <div className="grid grid-cols-8 gap-0">
              {/* Hours column */}
              <div className="w-16 border-r">
                {HOURS.map((hour) => (
                  <div key={hour} className="h-12 relative">
                    <span className="absolute -top-2 right-2 text-xs text-muted-foreground">
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((day) => {
                const dayEvents = getEventsForDay(day);
                const showCurrentTime = isToday(day) && currentHour >= 6 && currentHour <= 20;

                return (
                  <div
                    key={day.toISOString()}
                    className={`relative border-r last:border-r-0 ${isToday(day) ? 'bg-primary/5' : ''}`}
                    onClick={() => onDayClick?.(day)}
                  >
                    {/* Hour grid lines */}
                    {HOURS.map((hour) => (
                      <div key={hour} className="h-12 border-b border-dashed border-muted/50" />
                    ))}

                    {/* Events */}
                    {dayEvents.map((event) => {
                      const { top, height } = getEventPosition(event);
                      return (
                        <div
                          key={event.id}
                          className="absolute left-0.5 right-0.5 z-10"
                          style={{ top: `${top}px`, height: `${height}px` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                        >
                          <TimelineEvent event={event} compact />
                        </div>
                      );
                    })}

                    {/* Current time indicator */}
                    {showCurrentTime && (
                      <div
                        className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                        style={{ top: `${currentTimeTop}px` }}
                      >
                        <div className="w-2 h-2 rounded-full bg-destructive" />
                        <div className="flex-1 h-0.5 bg-destructive" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
