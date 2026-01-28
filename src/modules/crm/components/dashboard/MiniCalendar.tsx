import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, getDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CalendarEvent {
  date: Date;
  type: 'urgent' | 'meeting' | 'followup';
}

// Sample events - in production these would come from opportunities/tasks
const sampleEvents: CalendarEvent[] = [
  { date: new Date(), type: 'urgent' },
  { date: addMonths(new Date(), 0), type: 'meeting' },
];

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const eventTypeColors = {
  urgent: 'bg-destructive',
  meeting: 'bg-primary',
  followup: 'bg-accent-foreground',
};

export function MiniCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the day of week the month starts on (0 = Sunday)
  const startDayOfWeek = getDay(monthStart);
  
  // Create padding for days before the month starts
  const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => null);

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getEventsForDay = (day: Date): CalendarEvent[] => {
    return sampleEvents.filter(event => isSameDay(event.date, day));
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((day, index) => (
            <div 
              key={index} 
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Padding for days before month starts */}
          {paddingDays.map((_, index) => (
            <div key={`padding-${index}`} className="aspect-square" />
          ))}
          
          {/* Actual days */}
          {daysInMonth.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center text-xs rounded-md relative cursor-pointer hover:bg-muted/50 transition-colors",
                  isCurrentDay && "bg-primary text-primary-foreground font-semibold",
                  !isSameMonth(day, currentMonth) && "text-muted-foreground/50"
                )}
              >
                <span>{format(day, 'd')}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 2).map((event, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "w-1 h-1 rounded-full",
                          eventTypeColors[event.type]
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            Urgente
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary" />
            Reunião
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-accent-foreground" />
            Follow-up
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
