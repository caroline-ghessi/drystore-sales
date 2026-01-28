import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StagePipeline } from './StagePipeline';
import { OpportunityDetail } from '../../hooks/useOpportunityDetail';
import { Database } from '@/integrations/supabase/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

type OpportunityStage = Database['public']['Enums']['opportunity_stage'];

interface NegotiationSummaryProps {
  opportunity: OpportunityDetail | undefined;
  onValueChange?: (value: number) => void;
  onStageChange?: (stage: OpportunityStage) => void;
  onProbabilityChange?: (probability: number) => void;
  onDateChange?: (date: Date | undefined) => void;
}

export function NegotiationSummary({
  opportunity,
  onValueChange,
  onStageChange,
  onProbabilityChange,
  onDateChange,
}: NegotiationSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getSourceIcon = (source: string | null) => {
    switch (source?.toLowerCase()) {
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const expectedDate = opportunity?.expected_close_date 
    ? new Date(opportunity.expected_close_date) 
    : undefined;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Resumo da Negociação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stage Pipeline */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-2 block">Estágio</Label>
          <StagePipeline
            currentStage={opportunity?.stage || 'prospecting'}
            onStageClick={onStageChange}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Value */}
          <div className="space-y-2">
            <Label htmlFor="value" className="text-sm font-medium text-muted-foreground">
              Valor
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                R$
              </span>
              <Input
                id="value"
                type="text"
                className="pl-10 font-medium"
                value={opportunity?.value ? opportunity.value.toLocaleString('pt-BR') : '0'}
                onChange={(e) => {
                  const numValue = parseFloat(e.target.value.replace(/\D/g, '')) || 0;
                  onValueChange?.(numValue);
                }}
              />
            </div>
          </div>

          {/* Probability */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Probabilidade
            </Label>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${opportunity?.probability || 0}%` }}
                />
              </div>
              <span className="text-sm font-medium w-12 text-right">
                {opportunity?.probability || 0}%
              </span>
            </div>
          </div>

          {/* Expected Close Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Previsão de Fechamento
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !expectedDate && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {expectedDate 
                    ? format(expectedDate, 'dd/MM/yyyy', { locale: ptBR })
                    : 'Selecionar data'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={expectedDate}
                  onSelect={onDateChange}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Origem
            </Label>
            <div className="flex items-center gap-2 h-10">
              {getSourceIcon(opportunity?.source)}
              <span className="text-sm font-medium">
                {opportunity?.source || 'WhatsApp Business'}
              </span>
            </div>
          </div>

          {/* Responsible */}
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Responsável
            </Label>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium">
                {opportunity?.vendor?.name || 'Não atribuído'}
              </span>
            </div>
          </div>
        </div>

        {/* Product Category Badge */}
        {opportunity?.product_category && (
          <div className="pt-2 border-t">
            <Badge variant="secondary" className="capitalize">
              {opportunity.product_category.replace(/_/g, ' ')}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
