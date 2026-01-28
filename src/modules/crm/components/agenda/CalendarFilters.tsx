import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CalendarFilters as CalendarFiltersType } from './types';
import { cn } from '@/lib/utils';

interface CalendarFiltersProps {
  filters: CalendarFiltersType;
  onChange: (filters: CalendarFiltersType) => void;
}

const filterOptions = [
  { key: 'activities' as const, label: 'Minhas Atividades', color: 'bg-blue-500' },
  { key: 'meetings' as const, label: 'Reuniões', color: 'bg-green-500' },
  { key: 'followups' as const, label: 'Follow-ups', color: 'bg-yellow-500' },
  { key: 'team' as const, label: 'Equipe', color: 'bg-purple-500' },
];

export function CalendarFilters({ filters, onChange }: CalendarFiltersProps) {
  const handleToggle = (key: keyof CalendarFiltersType) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  return (
    <div className="bg-background rounded-lg border p-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Calendários
      </h3>
      
      <div className="space-y-3">
        {filterOptions.map((option) => (
          <div key={option.key} className="flex items-center gap-3">
            <Checkbox
              id={option.key}
              checked={filters[option.key]}
              onCheckedChange={() => handleToggle(option.key)}
            />
            <div className={cn('w-2 h-2 rounded-full', option.color)} />
            <Label 
              htmlFor={option.key}
              className="text-sm text-foreground cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
