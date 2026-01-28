import React from 'react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface WhatsAppMessageProps {
  content: string;
  timestamp: Date;
  isFromCustomer: boolean;
  hasAvatar?: boolean;
}

export function WhatsAppMessage({ content, timestamp, isFromCustomer, hasAvatar = false }: WhatsAppMessageProps) {
  const formatTime = (date: Date) => {
    if (isToday(date)) {
      return `Hoje, ${format(date, 'HH:mm', { locale: ptBR })}`;
    }
    return format(date, "dd/MM, HH:mm", { locale: ptBR });
  };

  return (
    <div className={cn(
      'flex gap-2 mb-3',
      isFromCustomer ? 'justify-start' : 'justify-end'
    )}>
      {isFromCustomer && hasAvatar && (
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <span className="text-xs font-medium text-muted-foreground">C</span>
        </div>
      )}
      
      <div className={cn(
        'max-w-[80%] rounded-xl p-3 shadow-sm',
        isFromCustomer 
          ? 'bg-muted rounded-tl-none' 
          : 'bg-primary/10 rounded-tr-none'
      )}>
        <p className="text-sm text-foreground leading-relaxed">
          {content}
        </p>
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {formatTime(timestamp)}
        </p>
      </div>
    </div>
  );
}
