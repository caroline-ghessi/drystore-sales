import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ViewMode } from './types';

interface AgendaHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function AgendaHeader({ viewMode, onViewModeChange }: AgendaHeaderProps) {
  const viewOptions: { label: string; value: ViewMode }[] = [
    { label: 'Dia', value: 'day' },
    { label: 'Semana', value: 'week' },
    { label: 'Mês', value: 'month' },
  ];

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
      
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
        {viewOptions.map((option) => (
          <Button
            key={option.value}
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange(option.value)}
            className={cn(
              'px-4 h-8 text-sm font-medium transition-all',
              viewMode === option.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
