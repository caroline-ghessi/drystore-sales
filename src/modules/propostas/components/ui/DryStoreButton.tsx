import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const dryStoreButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        drystore: "bg-drystore-orange text-drystore-white hover:bg-drystore-orange-hover shadow-lg hover:shadow-xl transition-all duration-200",
        "drystore-outline": "border-2 border-drystore-orange text-drystore-orange hover:bg-drystore-orange hover:text-drystore-white",
        "drystore-ghost": "text-drystore-orange hover:bg-drystore-orange/10",
        "drystore-secondary": "bg-drystore-dark-gray text-drystore-white hover:bg-drystore-dark-gray/90"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "drystore",
      size: "default",
    },
  }
);

export interface DryStoreButtonProps
  extends Omit<ButtonProps, 'variant' | 'size'>,
    VariantProps<typeof dryStoreButtonVariants> {}

export function DryStoreButton({ 
  className, 
  variant, 
  size, 
  ...props 
}: DryStoreButtonProps) {
  return (
    <Button
      className={cn(dryStoreButtonVariants({ variant, size, className }))}
      {...props}
    />
  );
}