import React from 'react';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const dryStoreBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        drystore: "border-transparent bg-drystore-orange text-drystore-white shadow hover:bg-drystore-orange-hover",
        "drystore-outline": "border-drystore-orange text-drystore-orange",
        success: "border-transparent bg-green-100 text-green-800",
        warning: "border-transparent bg-amber-100 text-amber-800",
        danger: "border-transparent bg-red-100 text-red-800",
        info: "border-transparent bg-blue-100 text-blue-800"
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