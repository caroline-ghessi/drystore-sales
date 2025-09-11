import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  showValue?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  showValue = true,
  variant = 'default',
  size = 'md',
  className,
  label
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'danger':
        return 'bg-red-500';
      default:
        return 'bg-drystore-orange';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-2';
      case 'lg':
        return 'h-4';
      default:
        return 'h-3';
    }
  };

  const getVariantColor = () => {
    if (percentage >= 100) return 'success';
    if (percentage >= 70) return 'default';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  const actualVariant = variant === 'default' ? getVariantColor() : variant;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {showValue && (
            <span className="text-sm font-medium text-muted-foreground">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      
      <div className={cn(
        "w-full bg-muted rounded-full overflow-hidden",
        getSizeClasses()
      )}>
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            actualVariant === 'success' && 'bg-green-500',
            actualVariant === 'warning' && 'bg-yellow-500', 
            actualVariant === 'danger' && 'bg-red-500',
            actualVariant === 'default' && 'bg-drystore-orange'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {showValue && !label && (
        <div className="mt-1 text-right">
          <span className="text-xs text-muted-foreground">
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}