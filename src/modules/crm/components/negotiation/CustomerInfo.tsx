import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, MapPin, Users, DollarSign, FileText } from 'lucide-react';

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

interface CustomerInfoProps {
  customer: Customer | null | undefined;
}

export function CustomerInfo({ customer }: CustomerInfoProps) {
  if (!customer) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Informações do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhum cliente vinculado</p>
        </CardContent>
      </Card>
    );
  }

  const companyName = customer.company || customer.name;
  const initial = companyName.charAt(0).toUpperCase();

  const infoItems = [
    { 
      label: 'CNPJ', 
      value: 'Não informado', 
      icon: FileText 
    },
    { 
      label: 'Funcionários', 
      value: 'Não informado', 
      icon: Users 
    },
    { 
      label: 'Faturamento', 
      value: 'Não informado', 
      icon: DollarSign 
    },
    { 
      label: 'Localização', 
      value: customer.city && customer.state 
        ? `${customer.city}, ${customer.state}` 
        : customer.city || customer.state || 'Não informado',
      icon: MapPin 
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Informações do Cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Company Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">{initial}</span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{companyName}</h3>
            {customer.segment && (
              <p className="text-sm text-muted-foreground">{customer.segment}</p>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {infoItems.map((item) => (
            <div key={item.label} className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {item.label}
              </p>
              <p className="text-sm font-medium text-foreground">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
