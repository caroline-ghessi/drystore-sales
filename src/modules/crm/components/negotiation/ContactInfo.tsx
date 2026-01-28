import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MessageSquare } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  state: string | null;
  company: string | null;
  segment: string | null;
}

interface ContactInfoProps {
  customer: Customer | null | undefined;
}

export function ContactInfo({ customer }: ContactInfoProps) {
  if (!customer) {
    return null;
  }

  const initial = customer.name.charAt(0).toUpperCase();
  
  const formatPhone = (phone: string) => {
    // Simple phone formatting for display
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const getWhatsAppLink = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return `https://wa.me/${cleaned}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Contato Principal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{initial}</span>
          </div>
          <div>
            <h3 className="font-medium text-foreground">{customer.name}</h3>
            <p className="text-sm text-muted-foreground">Contato</p>
          </div>
        </div>

        {/* Contact Details */}
        <div className="space-y-2">
          <a
            href={`tel:${customer.phone}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="h-4 w-4" />
            {formatPhone(customer.phone)}
          </a>
          
          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-4 w-4" />
              {customer.email}
            </a>
          )}
        </div>

        {/* WhatsApp Button */}
        <Button
          className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
          asChild
        >
          <a href={getWhatsAppLink(customer.phone)} target="_blank" rel="noopener noreferrer">
            <MessageSquare className="h-4 w-4" />
            Abrir WhatsApp
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
