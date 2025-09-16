import React from 'react';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const dryStoreBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Status específicos com contraste garantido
        draft: "border-orange-400 text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400",
        sent: "border-transparent bg-orange-500 text-white shadow hover:bg-orange-600",
        accepted: "border-transparent bg-green-500 text-white shadow hover:bg-green-600",
        rejected: "border-transparent bg-red-500 text-white shadow hover:bg-red-600",
        expired: "border-transparent bg-gray-500 text-white shadow hover:bg-gray-600",
        viewed: "border-transparent bg-blue-500 text-white shadow hover:bg-blue-600",
        under_review: "border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-600",
        
        // Variantes genéricas
        drystore: "border-transparent bg-orange-500 text-white shadow hover:bg-orange-600",
        "drystore-outline": "border-orange-400 text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400",
        success: "border-transparent bg-green-500 text-white shadow hover:bg-green-600",
        warning: "border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-600",
        danger: "border-transparent bg-red-500 text-white shadow hover:bg-red-600",
        info: "border-transparent bg-blue-500 text-white shadow hover:bg-blue-600",
        default: "border-transparent bg-gray-500 text-white shadow hover:bg-gray-600"
      },
    },
    defaultVariants: {
      variant: "drystore",
    },
  }
);

export interface DryStoreBadgeProps
  extends Omit<BadgeProps, 'variant'>,
    VariantProps<typeof dryStoreBadgeVariants> {}

export function DryStoreBadge({ 
  className, 
  variant, 
  ...props 
}: DryStoreBadgeProps) {
  return (
    <Badge
      className={cn(dryStoreBadgeVariants({ variant, className }))}
      {...props}
    />
  );
}