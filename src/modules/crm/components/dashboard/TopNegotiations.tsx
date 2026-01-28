import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Building2, CheckCircle2 } from 'lucide-react';
import { useOpportunities, STAGE_CONFIG, Opportunity } from '../../hooks/useOpportunities';
import { formatFullCurrency } from '../../hooks/usePipelineStats';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function getTimeAgo(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { 
    addSuffix: false, 
    locale: ptBR 
  });
}

function NegotiationItem({ opportunity }: { opportunity: Opportunity }) {
  const stageConfig = STAGE_CONFIG[opportunity.stage] || STAGE_CONFIG.prospecting;
  const isWon = opportunity.stage === 'closed_won';
  
  return (
    <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
          {opportunity.customer?.name?.[0]?.toUpperCase() || <Building2 className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm text-foreground truncate max-w-[200px] md:max-w-[300px]">
            {opportunity.customer?.name || 'Cliente'} - {opportunity.title}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className={`${stageConfig.textColor} text-[10px] px-1.5 py-0`}>
              {stageConfig.label}
            </Badge>
            <span>•</span>
            <span>{getTimeAgo(opportunity.updated_at)}</span>
            {isWon && (
              <>
                <span>•</span>
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  GANHO
                </span>
              </>
            )}
            {opportunity.next_step && !isWon && (
              <>
                <span>•</span>
                <span className="truncate max-w-[100px]">{opportunity.next_step}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="font-semibold text-foreground">
          {formatFullCurrency(opportunity.value)}
        </span>
        {opportunity.vendor?.name && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {opportunity.vendor.name[0]}
            </div>
            <span className="hidden md:inline">{opportunity.vendor.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function NegotiationSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div>
          <Skeleton className="h-4 w-48 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

export function TopNegotiations() {
  const navigate = useNavigate();
  const { data, isLoading } = useOpportunities();

  // Get top 5 opportunities by value, excluding closed_lost
  const topOpportunities = data?.all
    ?.filter(o => o.stage !== 'closed_lost')
    ?.sort((a, b) => b.value - a.value)
    ?.slice(0, 5) || [];

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Principais Negociações</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-primary hover:text-primary/80"
          onClick={() => navigate('/crm/pipeline')}
        >
          Ver todas
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <NegotiationSkeleton key={i} />
          ))
        ) : topOpportunities.length > 0 ? (
          topOpportunities.map((opportunity) => (
            <NegotiationItem key={opportunity.id} opportunity={opportunity} />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Nenhuma negociação encontrada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
