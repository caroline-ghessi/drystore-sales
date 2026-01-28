import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DraggableOpportunityCard } from './DraggableOpportunityCard';
import { Opportunity, STAGE_CONFIG } from '../../hooks/useOpportunities';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { KanbanBoard } from '@/components/ui/kanban';

interface KanbanColumnProps {
  stage: keyof typeof STAGE_CONFIG;
  opportunities: Opportunity[];
  onOpportunityClick?: (opportunity: Opportunity) => void;
  onValidate?: (opportunity: Opportunity) => void;
}

function getTimeAgo(dateString: string | null): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { locale: ptBR, addSuffix: false });
  } catch {
    return '';
  }
}

function formatShortCurrency(value: number): string {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${Math.round(value / 1000)}k`;
  }
  return `R$ ${value.toLocaleString('pt-BR')}`;
}

function formatTotalCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

export function KanbanColumn({
  stage,
  opportunities,
  onOpportunityClick,
  onValidate,
}: KanbanColumnProps) {
  const config = STAGE_CONFIG[stage];
  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);

  return (
    <KanbanBoard
      id={stage}
      className="min-w-[280px] max-w-[320px] bg-card border border-border shadow-sm"
    >
      {/* Column Header with colored bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30 rounded-t-lg">
        <div className={cn('w-1 h-6 rounded-full', config.color)} />
        <h3 className="font-semibold text-sm text-foreground">{config.label}</h3>
        <Badge 
          variant="secondary" 
          className="ml-auto bg-muted text-foreground hover:bg-muted/80"
        >
          {opportunities.length}
        </Badge>
      </div>

      {/* Cards Container */}
      <ScrollArea className="flex-1 min-h-[300px] max-h-[calc(100vh-380px)]">
        <div className="p-2 space-y-2">
          {opportunities.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Nenhuma oportunidade
            </div>
          ) : (
            opportunities.map((opp, index) => {
              const isNew = opp.validation_status === 'ai_generated' && 
                new Date(opp.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000;
              
              return (
                <DraggableOpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  index={index}
                  parent={stage}
                  formattedValue={formatShortCurrency(opp.value)}
                  timeAgo={getTimeAgo(opp.updated_at)}
                  isNew={isNew}
                  isClosed={stage === 'closed_won'}
                  onValidate={() => onValidate?.(opp)}
                  onClick={() => onOpportunityClick?.(opp)}
                />
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Column Footer with Total */}
      <div className="p-3 border-t border-border bg-muted/20 rounded-b-lg">
        <span className="text-sm font-medium text-muted-foreground">
          Total: <span className="text-foreground font-semibold">{formatTotalCurrency(totalValue)}</span>
        </span>
      </div>
    </KanbanBoard>
  );
}
