import React from 'react';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewMode } from './types';

interface AgendaDateNavigationProps {
  currentDate: Date;
  viewMode: ViewMode;
  onDateChange: (date: Date) => void;
  onNewEvent: () => void;
}

export function AgendaDateNavigation({ 
  currentDate, 
  viewMode,
  onDateChange, 
  onNewEvent 
}: AgendaDateNavigationProps) {
  const handlePrevious = () => {
    switch (viewMode) {
      case 'day':
        onDateChange(subDays(currentDate, 1));
        break;
      case 'week':
        onDateChange(subWeeks(currentDate, 1));
        break;
      case 'month':
        onDateChange(subMonths(currentDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case 'day':
        onDateChange(addDays(currentDate, 1));
        break;
      case 'week':
        onDateChange(addWeeks(currentDate, 1));
        break;
      case 'month':
        onDateChange(addMonths(currentDate, 1));
        break;
    }
  };

  const handleToday = () => onDateChange(new Date());

  const getFormattedDate = () => {
    switch (viewMode) {
      case 'day': {
        const formatted = format(currentDate, "dd MMMM yyyy", { locale: ptBR });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
      }
      case 'week': {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
        const startFormatted = format(weekStart, "dd", { locale: ptBR });
        const endFormatted = format(weekEnd, "dd MMMM yyyy", { locale: ptBR });
        return `${startFormatted} - ${endFormatted.charAt(0).toUpperCase() + endFormatted.slice(1)}`;
      }
      case 'month': {
        const formatted = format(currentDate, "MMMM yyyy", { locale: ptBR });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
      }
    }
  };

  const showTodayButton = !isToday(currentDate);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="font-semibold text-foreground min-w-[200px] text-center">
          {getFormattedDate()}
        </span>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {showTodayButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-8"
          >
            Hoje
          </Button>
        )}
        
        <Button
          size="sm"
          onClick={onNewEvent}
          className="h-8 bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo Evento
        </Button>
      </div>
    </div>
  );
}
