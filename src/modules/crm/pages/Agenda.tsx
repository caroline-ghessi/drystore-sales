import React, { useState } from 'react';
import { toast } from 'sonner';
import { startOfWeek } from 'date-fns';
import { 
  AgendaHeader, 
  AgendaDateNavigation, 
  CalendarFilters, 
  UpcomingEvents, 
  DayTimeline,
  WeekTimeline,
  MonthCalendar,
  ViewMode,
  CalendarFiltersType,
  CalendarEvent
} from '../components/agenda';
import { useAgendaEvents } from '../hooks/useAgendaEvents';

export default function Agenda() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [filters, setFilters] = useState<CalendarFiltersType>({
    activities: true,
    meetings: true,
    followups: true,
    team: true,
  });

  const { events, isLoading } = useAgendaEvents(currentDate, filters);

  const handleNewEvent = () => {
    toast.info('Funcionalidade de criar evento será implementada em breve');
  };

  const handleEventClick = (event: CalendarEvent) => {
    toast.info(`Evento: ${event.title}`);
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
  };

  return (
    <div className="h-full flex flex-col p-6 bg-muted/20">
      {/* Header with view toggle */}
      <AgendaHeader viewMode={viewMode} onViewModeChange={setViewMode} />
      
      {/* Date navigation */}
      <div className="mt-4">
        <AgendaDateNavigation 
          currentDate={currentDate}
          viewMode={viewMode}
          onDateChange={setCurrentDate}
          onNewEvent={handleNewEvent}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 mt-6 flex gap-6 min-h-0">
        {/* Left sidebar */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          <CalendarFilters filters={filters} onChange={setFilters} />
          <UpcomingEvents 
            events={events} 
            currentDate={currentDate}
            onEventClick={handleEventClick}
          />
        </div>

        {/* Main timeline/calendar */}
        {viewMode === 'day' && (
          <DayTimeline 
            date={currentDate}
            events={events}
            onEventClick={handleEventClick}
          />
        )}

        {viewMode === 'week' && (
          <WeekTimeline 
            startDate={startOfWeek(currentDate, { weekStartsOn: 0 })}
            events={events}
            onEventClick={handleEventClick}
            onDayClick={handleDayClick}
          />
        )}

        {viewMode === 'month' && (
          <MonthCalendar 
            currentDate={currentDate}
            events={events}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        )}
      </div>
    </div>
  );
}
