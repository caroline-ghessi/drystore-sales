import React from 'react';
import { ArrowLeft, Share2, Save, AlertTriangle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OpportunityDetail } from '../../hooks/useOpportunityDetail';

interface NegotiationHeaderProps {
  opportunity: OpportunityDetail | undefined;
  onBack: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export function NegotiationHeader({ opportunity, onBack, onSave, isSaving }: NegotiationHeaderProps) {
  const getRiskLevel = () => {
    if (!opportunity) return null;
    
    if (opportunity.temperature === 'cold') {
      return { label: 'Risco Alto', className: 'bg-red-100 text-red-700 border-red-300' };
    }
    if (opportunity.objections && opportunity.objections.length > 0) {
      return { label: 'Risco Médio', className: 'bg-amber-100 text-amber-700 border-amber-300' };
    }
    if (opportunity.temperature === 'hot') {
      return { label: 'Baixo Risco', className: 'bg-green-100 text-green-700 border-green-300' };
    }
    return null;
  };

  const risk = getRiskLevel();
  const displayTitle = opportunity 
    ? `${opportunity.customer?.company || opportunity.customer?.name || 'Cliente'} - ${opportunity.title}`
    : 'Carregando...';

  const opportunityNumber = opportunity?.id 
    ? `#NC-${opportunity.id.slice(0, 8).toUpperCase()}`
    : '';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h1 className="text-xl font-semibold text-foreground line-clamp-1">
            {displayTitle}
          </h1>
          
          <div className="flex items-center gap-2 flex-wrap">
            {opportunity?.vendor?.name && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                <User className="h-3 w-3 mr-1" />
                {opportunity.vendor.name}
              </Badge>
            )}
            {risk && (
              <Badge variant="outline" className={risk.className}>
                <AlertTriangle className="h-3 w-3 mr-1" />
                {risk.label}
              </Badge>
            )}
            {opportunityNumber && (
              <Badge variant="secondary" className="font-mono text-xs">
                {opportunityNumber}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto sm:ml-0">
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Compartilhar</span>
        </Button>
        
        {onSave && (
          <Button 
            size="sm" 
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={onSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
