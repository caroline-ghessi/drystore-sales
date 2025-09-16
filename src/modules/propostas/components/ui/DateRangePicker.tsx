import React, { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  startDate?: Date | null;
  endDate?: Date | null;
  className?: string;
}

export function DateRangePicker({ 
  onDateRangeChange, 
  startDate, 
  endDate, 
  className 
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate || null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate || null);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // Starting new selection
      setTempStartDate(date);
      setTempEndDate(null);
    } else if (tempStartDate && !tempEndDate) {
      // Selecting end date
      if (date >= tempStartDate) {
        setTempEndDate(date);
        onDateRangeChange(tempStartDate, date);
        setIsOpen(false);
      } else {
        // If selected date is before start date, make it the new start date
        setTempStartDate(date);
        setTempEndDate(null);
      }
    }
  };

  const handleClear = () => {
    setTempStartDate(null);
    setTempEndDate(null);
    onDateRangeChange(null, null);
  };

  const formatDateRange = () => {
    if (startDate && endDate) {
      return `${format(startDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(endDate, 'dd/MM/yyyy', { locale: ptBR })}`;
    }
    if (startDate) {
      return `${format(startDate, 'dd/MM/yyyy', { locale: ptBR })} - Selecione fim`;
    }
    return 'Selecionar período';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-60 justify-start text-left font-normal',
            !startDate && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <Calendar
            mode="single"
            selected={tempStartDate || undefined}
            onSelect={handleDateSelect}
            initialFocus
            className="pointer-events-auto"
          />
          {tempStartDate && !tempEndDate && (
            <div className="text-sm text-muted-foreground p-2 text-center">
              Selecione a data final
            </div>
          )}
          {(tempStartDate || tempEndDate) && (
            <div className="flex justify-center p-2">
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Limpar
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}