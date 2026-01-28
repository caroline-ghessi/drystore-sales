import React from 'react';
import { format } from 'date-fns';
import { Bot, AlertCircle, Video } from 'lucide-react';
import { CalendarEvent } from './types';
import { cn } from '@/lib/utils';

interface TimelineEventProps {
  event: CalendarEvent;
  onClick?: () => void;
}

const typeStyles = {
  call: {
    bg: 'bg-red-50 hover:bg-red-100',
    border: 'border-red-200',
    accent: 'text-red-600',
  },
  meeting: {
    bg: 'bg-green-50 hover:bg-green-100',
    border: 'border-green-200',
    accent: 'text-green-600',
  },
  followup: {
    bg: 'bg-yellow-50 hover:bg-yellow-100',
    border: 'border-yellow-200',
    accent: 'text-yellow-700',
  },
  proposal: {
    bg: 'bg-blue-50 hover:bg-blue-100',
    border: 'border-blue-200',
    accent: 'text-blue-600',
  },
  ai_task: {
    bg: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-200',
    accent: 'text-purple-600',
  },
};

export function TimelineEvent({ event, onClick }: TimelineEventProps) {
  const style = typeStyles[event.type];
  const startTime = format(event.startTime, 'HH:mm');
  const endTime = format(event.endTime, 'HH:mm');
  const isOverdue = event.status === 'overdue';

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-2.5 rounded-lg border cursor-pointer transition-all',
        style.bg,
        style.border
      )}
    >
      <div className="flex items-start gap-2">
        {event.isAIGenerated && (
          <Bot className={cn('h-4 w-4 shrink-0 mt-0.5', style.accent)} />
        )}
        {event.type === 'meeting' && !event.isAIGenerated && (
          <Video className={cn('h-4 w-4 shrink-0 mt-0.5', style.accent)} />
        )}
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground truncate">
            {event.title}
          </h4>
          
          <div className="flex items-center gap-1 mt-0.5">
            <p className={cn(
              'text-xs',
              isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
            )}>
              {startTime} - {endTime}
            </p>
            
            {isOverdue && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-red-600 font-medium flex items-center gap-0.5">
                  <AlertCircle className="h-3 w-3" />
                  Atrasado
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
