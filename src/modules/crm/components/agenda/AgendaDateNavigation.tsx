import React from 'react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AgendaDateNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onNewEvent: () => void;
}

export function AgendaDateNavigation({ 
  currentDate, 
  onDateChange, 
  onNewEvent 
}: AgendaDateNavigationProps) {
  const handlePrevious = () => onDateChange(subDays(currentDate, 1));
  const handleNext = () => onDateChange(addDays(currentDate, 1));
  const handleToday = () => onDateChange(new Date());

  const formattedDate = format(currentDate, "dd MMMM yyyy", { locale: ptBR });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

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
        
        <span className="font-semibold text-foreground min-w-[180px] text-center">
          {capitalizedDate}
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
        {!isToday(currentDate) && (
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
