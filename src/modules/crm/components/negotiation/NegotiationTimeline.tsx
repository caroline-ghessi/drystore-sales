import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, History } from 'lucide-react';

interface NegotiationTimelineProps {
  opportunityId: string | undefined;
}

export function NegotiationTimeline({ opportunityId }: NegotiationTimelineProps) {
  // TODO: No futuro, buscar de uma tabela crm_activities
  // Por ora, mostrar estado vazio indicando que atividades serão registradas

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Timeline da Negociação</CardTitle>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nova Atividade
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">Histórico de atividades</p>
          <p className="text-xs mt-1">
            Atividades serão registradas automaticamente<br />
            conforme a negociação progride.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
