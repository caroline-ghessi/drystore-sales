import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CalendarEvent } from './types';
import { cn } from '@/lib/utils';

interface EventItemProps {
  event: CalendarEvent;
  onClick?: () => void;
}

const typeColors = {
  call: 'border-l-red-400 bg-red-50',
  meeting: 'border-l-green-400 bg-green-50',
  followup: 'border-l-yellow-400 bg-yellow-50',
  proposal: 'border-l-blue-400 bg-blue-50',
  ai_task: 'border-l-purple-400 bg-purple-50',
};

export function EventItem({ event, onClick }: EventItemProps) {
  const startTime = format(event.startTime, 'HH:mm');
  const endTime = format(event.endTime, 'HH:mm');
  const isOverdue = event.status === 'overdue';

  return (
    <div 
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-sm',
        typeColors[event.type]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground truncate">
            {event.title}
          </h4>
          
          <p className={cn(
            'text-xs mt-0.5',
            isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
          )}>
            {startTime} - {endTime}
            {isOverdue && ' • Atrasado'}
          </p>
          
          {event.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {event.description}
            </p>
          )}
        </div>
        
        {event.isAIGenerated && (
          <Badge 
            variant="outline" 
            className="shrink-0 text-xs bg-purple-50 text-purple-700 border-purple-200"
          >
            <Bot className="h-3 w-3 mr-1" />
            IA
          </Badge>
        )}
      </div>
    </div>
  );
}
