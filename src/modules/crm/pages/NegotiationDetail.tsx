import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  useOpportunityDetail, 
  useUpdateOpportunity 
} from '../hooks/useOpportunityDetail';
import {
  NegotiationHeader,
  NegotiationSummary,
  NegotiationTimeline,
  WhatsAppHistory,
  CustomerInfo,
  ContactInfo,
  AIInsights,
  NextActions,
} from '../components/negotiation';
import { Database } from '@/integrations/supabase/types';

type OpportunityStage = Database['public']['Enums']['opportunity_stage'];

export default function NegotiationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: opportunity, isLoading, error } = useOpportunityDetail(id);
  const updateOpportunity = useUpdateOpportunity();

  // Local state for editable fields
  const [localValue, setLocalValue] = useState<number | null>(null);
  const [localStage, setLocalStage] = useState<OpportunityStage | null>(null);
  const [localDate, setLocalDate] = useState<Date | undefined>(undefined);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local state when opportunity loads
  React.useEffect(() => {
    if (opportunity) {
      setLocalValue(opportunity.value);
      setLocalStage(opportunity.stage);
      setLocalDate(opportunity.expected_close_date ? new Date(opportunity.expected_close_date) : undefined);
    }
  }, [opportunity]);

  const handleValueChange = (value: number) => {
    setLocalValue(value);
    setHasChanges(true);
  };

  const handleStageChange = (stage: OpportunityStage) => {
    setLocalStage(stage);
    setHasChanges(true);
  };

  const handleDateChange = (date: Date | undefined) => {
    setLocalDate(date);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!id) return;

    try {
      const updates: Record<string, any> = {};
      
      if (localValue !== null && localValue !== opportunity?.value) {
        updates.value = localValue;
      }
      if (localStage && localStage !== opportunity?.stage) {
        updates.stage = localStage;
      }
      if (localDate) {
        updates.expected_close_date = format(localDate, 'yyyy-MM-dd');
      }

      if (Object.keys(updates).length > 0) {
        await updateOpportunity.mutateAsync({ id, updates });
        toast.success('Alterações salvas com sucesso!');
        setHasChanges(false);
      }
    } catch (err) {
      toast.error('Erro ao salvar alterações');
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Negociação não encontrada
          </h2>
          <p className="text-muted-foreground mb-4">
            A negociação que você está procurando não existe ou foi removida.
          </p>
          <button
            onClick={() => navigate('/crm/pipeline')}
            className="text-primary hover:underline"
          >
            Voltar ao Pipeline
          </button>
        </div>
      </div>
    );
  }

  // Create a modified opportunity object with local state
  const displayOpportunity = {
    ...opportunity,
    value: localValue ?? opportunity.value,
    stage: localStage ?? opportunity.stage,
    expected_close_date: localDate ? format(localDate, 'yyyy-MM-dd') : opportunity.expected_close_date,
  };

  return (
    <div className="p-6 space-y-6">
      <NegotiationHeader
        opportunity={displayOpportunity}
        onBack={() => navigate(-1)}
        onSave={hasChanges ? handleSave : undefined}
        isSaving={updateOpportunity.isPending}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - 3/5 */}
        <div className="lg:col-span-3 space-y-6">
          <NegotiationSummary
            opportunity={displayOpportunity}
            onValueChange={handleValueChange}
            onStageChange={handleStageChange}
            onDateChange={handleDateChange}
          />
          <NegotiationTimeline opportunityId={id} />
          <WhatsAppHistory 
            conversationId={opportunity.conversation_id} 
            vendorConversationId={opportunity.vendor_conversation_id}
            customerName={opportunity.customer?.name}
            vendorName={opportunity.vendor?.name}
          />
        </div>

        {/* Right Column - 2/5 */}
        <div className="lg:col-span-2 space-y-6">
          <CustomerInfo customer={opportunity.customer} />
          <ContactInfo customer={opportunity.customer} />
          <AIInsights opportunity={opportunity} />
          <NextActions opportunity={opportunity} />
        </div>
      </div>
    </div>
  );
}
