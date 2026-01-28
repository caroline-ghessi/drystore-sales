import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { OpportunityCard } from './OpportunityCard';
import { Opportunity, STAGE_CONFIG } from '../../hooks/useOpportunities';
import { formatFullCurrency } from '../../hooks/usePipelineStats';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export function KanbanColumn({
  stage,
  opportunities,
  onOpportunityClick,
  onValidate,
}: KanbanColumnProps) {
  const config = STAGE_CONFIG[stage];
  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);

  return (
    <div className={cn(
      'flex flex-col min-w-[280px] max-w-[320px] rounded-lg border',
      config.bgLight,
      config.border
    )}>
      {/* Column Header */}
      <div className={cn(
        'flex items-center justify-between p-3 rounded-t-lg',
        config.color,
        'text-white'
      )}>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{config.label}</h3>
          <Badge 
            variant="secondary" 
            className="bg-white/20 text-white hover:bg-white/30"
          >
            {opportunities.length}
          </Badge>
        </div>
      </div>

      {/* Cards Container */}
      <ScrollArea className="flex-1 min-h-[300px] max-h-[calc(100vh-400px)]">
        <div className="p-2 space-y-2">
          {opportunities.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Nenhuma oportunidade
            </div>
          ) : (
            opportunities.map((opp) => {
              const isNew = opp.validation_status === 'ai_generated' && 
                new Date(opp.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000;
              
              return (
                <OpportunityCard
                  key={opp.id}
                  id={opp.id}
                  customerName={opp.customer?.name || 'Cliente não identificado'}
                  title={opp.title}
                  description={opp.description}
                  value={opp.value}
                  temperature={opp.temperature}
                  validationStatus={opp.validation_status}
                  timeAgo={getTimeAgo(opp.updated_at)}
                  productCategory={opp.product_category}
                  nextStep={opp.next_step}
                  isNew={isNew}
                  onValidate={() => onValidate?.(opp)}
                  onClick={() => onOpportunityClick?.(opp)}
                />
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Column Footer with Total */}
      <div className={cn(
        'p-3 border-t text-center',
        config.border
      )}>
        <span className="text-sm font-medium text-foreground">
          Total: {formatFullCurrency(totalValue)}
        </span>
      </div>
    </div>
  );
}
