import React from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { KanbanColumn } from './KanbanColumn';
import { useOpportunities, useUpdateOpportunityStage, useDeleteOpportunity, STAGE_CONFIG, Opportunity } from '../../hooks/useOpportunities';
import { useNavigate } from 'react-router-dom';
import { KanbanProvider, type DragEndEvent } from '@/components/ui/kanban';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type OpportunityStage = Database['public']['Enums']['opportunity_stage'];

interface PipelineKanbanProps {
  onValidate?: (opportunity: Opportunity) => void;
  searchTerm?: string;
}

// Stages to show in the Kanban (excluding closed_lost for cleaner view)
const VISIBLE_STAGES = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won'] as const;

export function PipelineKanban({ onValidate, searchTerm = '' }: PipelineKanbanProps) {
  const { data, isLoading, error } = useOpportunities();
  const updateStage = useUpdateOpportunityStage();
  const deleteOpportunity = useDeleteOpportunity();
  const navigate = useNavigate();

  // Filter opportunities based on search term
  const filteredByStage = React.useMemo(() => {
    if (!data?.byStage || !searchTerm.trim()) {
      return data?.byStage;
    }
    
    const lowerSearch = searchTerm.toLowerCase().trim();
    
    const filtered: typeof data.byStage = {
      prospecting: [],
      qualification: [],
      proposal: [],
      negotiation: [],
      closed_won: [],
      closed_lost: [],
    };
    
    Object.entries(data.byStage).forEach(([stage, opportunities]) => {
      filtered[stage as keyof typeof filtered] = opportunities.filter(opp => {
        const customerName = opp.customer?.name?.toLowerCase() || '';
        const title = opp.title?.toLowerCase() || '';
        const city = opp.customer?.city?.toLowerCase() || '';
        
        return customerName.includes(lowerSearch) || 
               title.includes(lowerSearch) || 
               city.includes(lowerSearch);
      });
    });
    
    return filtered;
  }, [data?.byStage, searchTerm]);

  const handleOpportunityClick = (opportunity: Opportunity) => {
    navigate(`/crm/opportunities/${opportunity.id}`);
  };

  const handleDelete = (opportunity: Opportunity) => {
    deleteOpportunity.mutate(opportunity.id, {
      onSuccess: () => {
        toast.success('Negociação excluída com sucesso');
      },
      onError: () => {
        toast.error('Erro ao excluir negociação');
      },
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const opportunityId = active.id as string;
    const newStage = over.id as OpportunityStage;
    const currentStage = active.data.current?.parent as OpportunityStage;

    if (currentStage !== newStage) {
      updateStage.mutate(
        { opportunityId, newStage },
        {
          onSuccess: () => {
            toast.success('Oportunidade movida com sucesso');
          },
          onError: () => {
            toast.error('Erro ao mover oportunidade');
          },
        }
      );
    }
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

  const byStage = filteredByStage;

  return (
    <ScrollArea className="w-full">
      <KanbanProvider onDragEnd={handleDragEnd} className="pb-4 min-w-max">
        {VISIBLE_STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            opportunities={byStage?.[stage] || []}
            onOpportunityClick={handleOpportunityClick}
            onValidate={onValidate}
            onDelete={handleDelete}
          />
        ))}
      </KanbanProvider>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
