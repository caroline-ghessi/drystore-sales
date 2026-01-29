import React from 'react';
import { KanbanCard } from '@/components/ui/kanban';
import { OpportunityCard } from './OpportunityCard';
import { Opportunity } from '../../hooks/useOpportunities';

interface DraggableOpportunityCardProps {
  opportunity: Opportunity;
  index: number;
  parent: string;
  formattedValue: string;
  timeAgo: string;
  isNew: boolean;
  isClosed: boolean;
  onValidate: () => void;
  onClick: () => void;
  onDelete: () => void;
}

export function DraggableOpportunityCard({
  opportunity,
  index,
  parent,
  formattedValue,
  timeAgo,
  isNew,
  isClosed,
  onValidate,
  onClick,
  onDelete,
}: DraggableOpportunityCardProps) {
  return (
    <KanbanCard
      id={opportunity.id}
      name={opportunity.title}
      index={index}
      parent={parent}
    >
      <OpportunityCard
        id={opportunity.id}
        customerName={opportunity.customer?.name || 'Cliente não identificado'}
        title={opportunity.title}
        description={opportunity.description}
        value={opportunity.value}
        formattedValue={formattedValue}
        temperature={opportunity.temperature}
        validationStatus={opportunity.validation_status}
        timeAgo={timeAgo}
        productCategory={opportunity.product_category}
        nextStep={opportunity.next_step}
        isNew={isNew}
        vendorName={opportunity.vendor?.name}
        isClosed={isClosed}
        onValidate={onValidate}
        onClick={onClick}
        onDelete={onDelete}
      />
    </KanbanCard>
  );
}
