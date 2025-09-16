import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Calculator, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Activity {
  id: string;
  type: 'calculation' | 'proposal' | 'approval' | 'conversion';
  title: string;
  description: string;
  timestamp: Date;
  value?: number;
  status: 'success' | 'pending' | 'warning';
  vendorId: string;
  vendorName: string;
}

interface VendorActivityTimelineProps {
  activities: Activity[];
  limit?: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'calculation':
      return <Calculator className="h-4 w-4" />;
    case 'proposal':
      return <FileText className="h-4 w-4" />;
    case 'approval':
      return <AlertCircle className="h-4 w-4" />;
    case 'conversion':
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getActivityColor = (type: Activity['type'], status: Activity['status']) => {
  if (status === 'pending') return 'text-yellow-600 bg-yellow-50';
  if (status === 'warning') return 'text-red-600 bg-red-50';
  
  switch (type) {
    case 'calculation':
      return 'text-blue-600 bg-blue-50';
    case 'proposal':
      return 'text-purple-600 bg-purple-50';
    case 'approval':
      return 'text-orange-600 bg-orange-50';
    case 'conversion':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getStatusBadge = (status: Activity['status']) => {
  switch (status) {
    case 'success':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Sucesso</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>;
    case 'warning':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Atenção</Badge>;
    default:
      return null;
  }
};

export default function VendorActivityTimeline({ activities, limit = 20 }: VendorActivityTimelineProps) {
  const displayActivities = activities.slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Atividades Recentes dos Vendedores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {displayActivities.map((activity, index) => (
              <div key={activity.id} className="flex gap-4 pb-4 border-b border-border last:border-0">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type, activity.status)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{activity.title}</div>
                      <div className="text-sm text-muted-foreground">
                        por <strong>{activity.vendorName}</strong>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(activity.status)}
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(activity.timestamp, { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {activity.description}
                  </div>
                  
                  {activity.value && (
                    <div className="text-sm font-medium text-primary">
                      Valor: {formatCurrency(activity.value)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {activities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma atividade recente encontrada</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}