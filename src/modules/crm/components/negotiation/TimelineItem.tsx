import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, Calendar, Phone, Mail, Sparkles } from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export type TimelineEventType = 'alert' | 'proposal' | 'meeting' | 'call' | 'email' | 'ai_detected';

interface TimelineItemProps {
  type: TimelineEventType;
  title: string;
  timestamp: Date;
  author: string;
  description?: string;
}

const TYPE_CONFIG: Record<TimelineEventType, {
  icon: React.ComponentType<{ className?: string }>;
  borderColor: string;
  iconColor: string;
  badgeVariant: 'destructive' | 'secondary' | 'default' | 'outline';
}> = {
  alert: {
    icon: AlertTriangle,
    borderColor: 'border-l-red-500',
    iconColor: 'text-red-600 bg-red-100',
    badgeVariant: 'destructive',
  },
  proposal: {
    icon: FileText,
    borderColor: 'border-l-orange-500',
    iconColor: 'text-orange-600 bg-orange-100',
    badgeVariant: 'secondary',
  },
  meeting: {
    icon: Calendar,
    borderColor: 'border-l-green-500',
    iconColor: 'text-green-600 bg-green-100',
    badgeVariant: 'secondary',
  },
  call: {
    icon: Phone,
    borderColor: 'border-l-blue-500',
    iconColor: 'text-blue-600 bg-blue-100',
    badgeVariant: 'secondary',
  },
  email: {
    icon: Mail,
    borderColor: 'border-l-purple-500',
    iconColor: 'text-purple-600 bg-purple-100',
    badgeVariant: 'secondary',
  },
  ai_detected: {
    icon: Sparkles,
    borderColor: 'border-l-red-500',
    iconColor: 'text-red-600 bg-red-100',
    badgeVariant: 'destructive',
  },
};

export function TimelineItem({ type, title, timestamp, author, description }: TimelineItemProps) {
  const config = TYPE_CONFIG[type];
  const IconComponent = config.icon;

  const formatDate = (date: Date) => {
    if (isToday(date)) {
      return `Hoje, ${format(date, 'HH:mm', { locale: ptBR })}`;
    }
    if (isYesterday(date)) {
      return `Ontem, ${format(date, 'HH:mm', { locale: ptBR })}`;
    }
    return format(date, "dd/MM/yyyy, HH:mm", { locale: ptBR });
  };

  return (
    <div className={cn('relative pl-6 pb-6 border-l-2', config.borderColor)}>
      {/* Icon */}
      <div className={cn(
        'absolute -left-3 top-0 h-6 w-6 rounded-full flex items-center justify-center',
        config.iconColor
      )}>
        <IconComponent className="h-3.5 w-3.5" />
      </div>

      {/* Content */}
      <div className="bg-muted/30 rounded-lg p-3 ml-2">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-medium text-sm text-foreground">{title}</span>
          <Badge variant={config.badgeVariant} className="text-xs">
            {type === 'ai_detected' ? 'IA Detectou' : author}
          </Badge>
        </div>
        
        <p className="text-xs text-muted-foreground mb-2">
          {formatDate(timestamp)}
        </p>
        
        {description && (
          <p className="text-sm text-muted-foreground italic">
            "{description}"
          </p>
        )}
      </div>
    </div>
  );
}
