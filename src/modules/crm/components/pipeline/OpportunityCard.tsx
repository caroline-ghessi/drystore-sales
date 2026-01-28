import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Clock, CheckCircle } from 'lucide-react';
import { formatFullCurrency } from '../../hooks/usePipelineStats';
import { cn } from '@/lib/utils';

interface OpportunityCardProps {
  id: string;
  customerName: string;
  title: string;
  description?: string | null;
  value: number;
  temperature?: string | null;
  validationStatus?: string | null;
  timeAgo: string;
  productCategory?: string | null;
  nextStep?: string | null;
  isNew?: boolean;
  onValidate?: () => void;
  onClick?: () => void;
}

const TEMPERATURE_INDICATORS = {
  hot: { icon: '🔥', color: 'text-red-500', bg: 'bg-red-100' },
  warm: { icon: '🟠', color: 'text-orange-500', bg: 'bg-orange-100' },
  cold: { icon: '❄️', color: 'text-blue-500', bg: 'bg-blue-100' },
};

export function OpportunityCard({
  id,
  customerName,
  title,
  description,
  value,
  temperature,
  validationStatus,
  timeAgo,
  productCategory,
  nextStep,
  isNew,
  onValidate,
  onClick,
}: OpportunityCardProps) {
  const tempConfig = TEMPERATURE_INDICATORS[temperature as keyof typeof TEMPERATURE_INDICATORS] 
    || TEMPERATURE_INDICATORS.warm;
  
  const needsValidation = validationStatus === 'ai_generated' || validationStatus === 'pending';
  const isValidated = validationStatus === 'validated' || validationStatus === 'edited';

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer hover:shadow-md transition-all duration-200 border',
        'bg-card hover:bg-card/90',
        isNew && 'ring-2 ring-primary/50'
      )}
      onClick={onClick}
    >
      {/* Header with badge and time */}
      <div className="flex items-center justify-between mb-2">
        {isNew && (
          <Badge className="bg-primary/20 text-primary text-xs font-medium">
            Novo
          </Badge>
        )}
        <div className={cn(
          'flex items-center gap-1 text-xs text-muted-foreground ml-auto',
          timeAgo.includes('Atrasado') && 'text-destructive font-medium'
        )}>
          <Clock className="h-3 w-3" />
          {timeAgo}
        </div>
      </div>

      {/* Customer name */}
      <h4 className="font-semibold text-sm text-foreground truncate">
        {customerName}
      </h4>

      {/* Title */}
      <p className="text-sm text-muted-foreground truncate mt-1">
        {title}
      </p>

      {/* Description */}
      {description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {description}
        </p>
      )}

      {/* Next step badge */}
      {nextStep && (
        <Badge variant="outline" className="mt-2 text-xs font-normal">
          {nextStep}
        </Badge>
      )}

      {/* Validated status */}
      {isValidated && (
        <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
          <CheckCircle className="h-3 w-3" />
          Aprovado
        </div>
      )}

      {/* Footer with value and actions */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-foreground">
            {formatFullCurrency(value)}
          </span>
          <span className={cn('text-sm', tempConfig.color)}>
            {tempConfig.icon}
          </span>
        </div>

        {needsValidation && onValidate && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs px-2 text-primary border-primary hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              onValidate();
            }}
          >
            Validar
          </Button>
        )}

        {!needsValidation && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
