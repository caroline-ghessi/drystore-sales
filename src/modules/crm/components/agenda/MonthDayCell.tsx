import React from 'react';
import { isToday, isSameMonth } from 'date-fns';
import { CalendarEvent } from './types';
import { Bot } from 'lucide-react';

interface MonthDayCellProps {
  date: Date;
  currentMonth: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  call: 'bg-blue-500',
  meeting: 'bg-green-500',
  followup: 'bg-yellow-500',
  proposal: 'bg-purple-500',
  ai_task: 'bg-primary',
};

export function MonthDayCell({ date, currentMonth, events, onDayClick, onEventClick }: MonthDayCellProps) {
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isTodayDate = isToday(date);
  const maxVisibleEvents = 2;
  const visibleEvents = events.slice(0, maxVisibleEvents);
  const remainingCount = events.length - maxVisibleEvents;

  return (
    <div
      onClick={() => onDayClick(date)}
      className={`min-h-[100px] p-1 border-b border-r cursor-pointer transition-colors hover:bg-muted/50 ${
        !isCurrentMonth ? 'bg-muted/20' : ''
      }`}
    >
      {/* Day number */}
      <div className="flex justify-end mb-1">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${
            isTodayDate
              ? 'bg-primary text-primary-foreground font-semibold'
              : isCurrentMonth
              ? 'text-foreground'
              : 'text-muted-foreground/50'
          }`}
        >
          {date.getDate()}
        </span>
      </div>

      {/* Events */}
      <div className="space-y-0.5">
        {visibleEvents.map((event) => (
          <div
            key={event.id}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick?.(event);
            }}
            className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer transition-opacity hover:opacity-80 ${
              event.status === 'overdue'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : event.type === 'meeting'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : event.type === 'followup'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : event.isAIGenerated
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            }`}
          >
            <span className="flex items-center gap-1">
              {event.isAIGenerated && <Bot className="h-3 w-3 shrink-0" />}
              <span className="truncate">{event.title}</span>
            </span>
          </div>
        ))}

        {remainingCount > 0 && (
          <div className="text-xs text-muted-foreground px-1.5 py-0.5 hover:text-foreground transition-colors">
            +{remainingCount} mais
          </div>
        )}

        {/* Event dots for days with many events when collapsed */}
        {events.length > 0 && visibleEvents.length === 0 && (
          <div className="flex gap-0.5 justify-center mt-1">
            {events.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className={`w-1.5 h-1.5 rounded-full ${EVENT_TYPE_COLORS[event.type] || 'bg-muted-foreground'}`}
              />
            ))}
            {events.length > 3 && (
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
