import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpportunityCardProps {
  id: string;
  customerName: string;
  title: string;
  description?: string | null;
  value: number;
  formattedValue: string;
  temperature?: string | null;
  validationStatus?: string | null;
  timeAgo: string;
  productCategory?: string | null;
  nextStep?: string | null;
  isNew?: boolean;
  vendorName?: string | null;
  isClosed?: boolean;
  onValidate?: () => void;
  onClick?: () => void;
}

export function OpportunityCard({
  id,
  customerName,
  title,
  description,
  value,
  formattedValue,
  temperature,
  validationStatus,
  timeAgo,
  productCategory,
  nextStep,
  isNew,
  vendorName,
  isClosed,
  onValidate,
  onClick,
}: OpportunityCardProps) {
  const needsValidation = validationStatus === 'ai_generated' || validationStatus === 'pending';
  const isValidated = validationStatus === 'validated' || validationStatus === 'edited';
  
  // Get vendor initials
  const vendorInitials = vendorName 
    ? vendorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'V';

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer hover:shadow-md transition-all duration-200',
        'bg-background border border-border hover:border-border/80',
        isNew && 'border-l-4 border-l-green-500'
      )}
      onClick={onClick}
    >
      {/* Line 1: Badge novo (optional) + Customer name + Time */}
      <div className="flex items-center gap-2">
        {isNew && (
          <Badge className="bg-primary text-primary-foreground text-xs font-medium px-1.5 py-0 h-5">
            Novo
          </Badge>
        )}
        <span className="font-semibold text-sm text-foreground flex-1 truncate">
          {customerName}
        </span>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {timeAgo}
        </span>
      </div>

      {/* Line 2: Project title */}
      <p className="text-sm text-foreground mt-1 truncate">
        {title}
      </p>

      {/* Line 3: Description (optional) */}
      {description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {description}
        </p>
      )}

      {/* Line 4: Next step badge or validated status */}
      {nextStep && !isClosed && (
        <Badge 
          variant="outline" 
          className="mt-2 text-xs bg-primary/10 text-primary border-primary/20 font-normal"
        >
          <Play className="w-3 h-3 mr-1 fill-primary" />
          {nextStep}
        </Badge>
      )}
      
      {isValidated && !isClosed && (
        <div className="flex items-center gap-1 mt-2 text-xs text-primary">
          <CheckCircle className="h-3 w-3" />
          <span>Aprovado pelo técnico</span>
        </div>
      )}

      {/* Closed won badge */}
      {isClosed && (
        <Badge className="mt-2 bg-primary text-primary-foreground text-xs">
          Ganho
        </Badge>
      )}

      {/* Line 5: Value + Vendor avatar OR Validate button */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
        <span className="font-bold text-sm text-foreground">
          {formattedValue}
        </span>

        <div className="flex items-center gap-2">
          {needsValidation && onValidate ? (
            <Button
              size="sm"
              className="h-6 text-xs px-3 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onValidate();
              }}
            >
              Validar
            </Button>
          ) : (
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                {vendorInitials}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </Card>
  );
}
