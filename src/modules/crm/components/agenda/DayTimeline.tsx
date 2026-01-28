import React, { useEffect, useRef } from 'react';
import { format, getHours, getMinutes, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarEvent } from './types';
import { TimelineEvent } from './TimelineEvent';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface DayTimelineProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 06:00 to 20:00
const HOUR_HEIGHT = 64; // pixels per hour

export function DayTimeline({ date, events, onEventClick }: DayTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const currentHour = getHours(now);
  const currentMinute = getMinutes(now);
  const isCurrentDay = isSameDay(date, now);

  // Calculate position for current time indicator
  const currentTimeTop = isCurrentDay 
    ? (currentHour - 6) * HOUR_HEIGHT + (currentMinute / 60) * HOUR_HEIGHT 
    : -1;

  // Get events for the day
  const dayEvents = events.filter(e => isSameDay(e.startTime, date));

  // Calculate event position and height
  const getEventStyle = (event: CalendarEvent) => {
    const startHour = getHours(event.startTime);
    const startMinute = getMinutes(event.startTime);
    const endHour = getHours(event.endTime);
    const endMinute = getMinutes(event.endTime);
    
    const top = (startHour - 6) * HOUR_HEIGHT + (startMinute / 60) * HOUR_HEIGHT;
    const duration = (endHour - startHour) + (endMinute - startMinute) / 60;
    const height = Math.max(duration * HOUR_HEIGHT - 4, 40); // min height 40px

    return { top, height };
  };

  // Format day of week
  const dayOfWeek = format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current && isCurrentDay && currentHour >= 6) {
      const scrollPosition = (currentHour - 6 - 2) * HOUR_HEIGHT;
      scrollRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, [isCurrentDay, currentHour]);

  return (
    <div className="bg-background rounded-lg border flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{capitalizedDay}</h3>
        <span className="text-sm text-muted-foreground">GMT-3</span>
      </div>

      {/* Timeline */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
          {/* Hour lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute w-full flex items-start"
              style={{ top: (hour - 6) * HOUR_HEIGHT }}
            >
              <span className="w-14 text-xs text-muted-foreground text-right pr-3 pt-0.5">
                {hour.toString().padStart(2, '0')}:00
              </span>
              <div className="flex-1 border-t border-border" />
            </div>
          ))}

          {/* Current time indicator */}
          {isCurrentDay && currentTimeTop >= 0 && currentTimeTop <= HOURS.length * HOUR_HEIGHT && (
            <div
              className="absolute left-14 right-0 flex items-center z-10"
              style={{ top: currentTimeTop }}
            >
              <div className="w-2 h-2 bg-red-500 rounded-full -ml-1" />
              <div className="flex-1 h-0.5 bg-red-500" />
              <span className="text-xs text-red-500 font-medium ml-2 pr-2">
                {format(now, 'HH:mm')}
              </span>
            </div>
          )}

          {/* Events */}
          <div className="absolute left-16 right-4">
            {dayEvents.map((event) => {
              const { top, height } = getEventStyle(event);
              return (
                <div
                  key={event.id}
                  className="absolute left-0 right-0"
                  style={{ top: top + 2, height }}
                >
                  <TimelineEvent 
                    event={event} 
                    onClick={() => onEventClick?.(event)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
