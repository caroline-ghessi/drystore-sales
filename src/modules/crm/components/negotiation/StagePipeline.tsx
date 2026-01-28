import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';

type OpportunityStage = Database['public']['Enums']['opportunity_stage'];

const STAGES: { key: OpportunityStage; label: string }[] = [
  { key: 'prospecting', label: 'Prospecção' },
  { key: 'qualification', label: 'Qualificação' },
  { key: 'proposal', label: 'Proposta' },
  { key: 'negotiation', label: 'Negociação' },
  { key: 'closed_won', label: 'Fechamento' },
];

interface StagePipelineProps {
  currentStage: OpportunityStage;
  onStageClick?: (stage: OpportunityStage) => void;
  disabled?: boolean;
}

export function StagePipeline({ currentStage, onStageClick, disabled }: StagePipelineProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STAGES.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;

        return (
          <React.Fragment key={stage.key}>
            <button
              type="button"
              onClick={() => !disabled && onStageClick?.(stage.key)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap',
                'focus:outline-none focus:ring-2 focus:ring-primary/20',
                isCompleted && 'bg-green-100 text-green-700 border border-green-200',
                isCurrent && 'bg-primary text-primary-foreground shadow-sm',
                isFuture && 'bg-muted text-muted-foreground border border-border',
                !disabled && 'hover:opacity-80 cursor-pointer',
                disabled && 'cursor-default'
              )}
            >
              {isCompleted && <Check className="h-3 w-3" />}
              {stage.label}
            </button>

            {index < STAGES.length - 1 && (
              <div
                className={cn(
                  'w-4 h-0.5 shrink-0',
                  index < currentIndex ? 'bg-green-400' : 'bg-border'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
