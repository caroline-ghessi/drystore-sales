import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface WhatsAppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const WhatsAppInput = React.forwardRef<HTMLInputElement, WhatsAppInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const formatWhatsApp = (inputValue: string) => {
      // Remove tudo que não é dígito
      const numbers = inputValue.replace(/\D/g, '');
      
      // Limita a 11 dígitos
      const limited = numbers.slice(0, 11);
      
      // Aplica a máscara (XX) XXXXX-XXXX
      if (limited.length <= 2) {
        return limited;
      } else if (limited.length <= 7) {
        return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
      } else {
        return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatWhatsApp(e.target.value);
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formatted
        }
      };
      onChange(syntheticEvent);
    };

    return (
      <Input
        type="tel"
        ref={ref}
        className={cn(className)}
        value={value}
        onChange={handleChange}
        placeholder="(11) 99999-9999"
        maxLength={15}
        {...props}
      />
    );
  }
);

WhatsAppInput.displayName = "WhatsAppInput";