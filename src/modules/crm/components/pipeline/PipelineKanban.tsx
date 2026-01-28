import React from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { KanbanColumn } from './KanbanColumn';
import { useOpportunities, STAGE_CONFIG, Opportunity } from '../../hooks/useOpportunities';
import { useNavigate } from 'react-router-dom';

interface PipelineKanbanProps {
  onValidate?: (opportunity: Opportunity) => void;
}

// Stages to show in the Kanban (excluding closed_lost for cleaner view)
const VISIBLE_STAGES = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won'] as const;

export function PipelineKanban({ onValidate }: PipelineKanbanProps) {
  const { data, isLoading, error } = useOpportunities();
  const navigate = useNavigate();

  const handleOpportunityClick = (opportunity: Opportunity) => {
    // Navigate to opportunity detail or open modal
    navigate(`/crm/opportunities/${opportunity.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {VISIBLE_STAGES.map((stage) => (
          <div key={stage} className="min-w-[280px] max-w-[320px]">
            <Skeleton className="h-12 w-full rounded-t-lg" />
            <div className="p-2 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-b-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Erro ao carregar oportunidades: {error.message}
      </div>
    );
  }

  const byStage = data?.byStage;

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4 min-w-max">
        {VISIBLE_STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            opportunities={byStage?.[stage] || []}
            onOpportunityClick={handleOpportunityClick}
            onValidate={onValidate}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
