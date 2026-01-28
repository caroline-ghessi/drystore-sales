import React from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { useOpportunitiesCount } from '../../hooks/useOpportunities';
import { cn } from '@/lib/utils';

interface AIStatusIndicatorProps {
  variant?: 'sidebar' | 'header';
  className?: string;
}

export function AIStatusIndicator({ variant = 'sidebar', className }: AIStatusIndicatorProps) {
  const { data: aiOpportunitiesCount } = useOpportunitiesCount();
  
  const hasNewOpportunities = (aiOpportunitiesCount || 0) > 0;

  if (variant === 'header') {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full',
        hasNewOpportunities 
          ? 'bg-primary/10 text-primary' 
          : 'bg-muted text-muted-foreground',
        className
      )}>
        <div className="relative">
          <Brain className="h-4 w-4" />
          {hasNewOpportunities && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
        </div>
        <span className="text-xs font-medium">IA Monitorando</span>
      </div>
    );
  }

  // Sidebar variant
  return (
    <div className={cn(
      'mx-3 p-3 rounded-lg border',
      hasNewOpportunities 
        ? 'bg-primary/5 border-primary/20' 
        : 'bg-muted/50 border-border',
      className
    )}>
      <div className="flex items-center gap-2 mb-1">
        <div className={cn(
          'p-1 rounded',
          hasNewOpportunities ? 'bg-primary/10' : 'bg-muted'
        )}>
          <Sparkles className={cn(
            'h-3.5 w-3.5',
            hasNewOpportunities ? 'text-primary' : 'text-muted-foreground'
          )} />
        </div>
        <span className={cn(
          'text-xs font-medium',
          hasNewOpportunities ? 'text-primary' : 'text-muted-foreground'
        )}>
          IA Monitorando
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {hasNewOpportunities 
          ? `${aiOpportunitiesCount} ${aiOpportunitiesCount === 1 ? 'nova oportunidade detectada' : 'novas oportunidades detectadas'}`
          : 'Monitorando conversas em tempo real'
        }
      </p>
    </div>
  );
}
