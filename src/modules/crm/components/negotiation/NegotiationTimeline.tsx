import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TimelineItem, TimelineEventType } from './TimelineItem';

interface NegotiationTimelineProps {
  opportunityId: string | undefined;
}

// Placeholder events - in the future this will come from a crm_activities table
const PLACEHOLDER_EVENTS: Array<{
  type: TimelineEventType;
  title: string;
  timestamp: Date;
  author: string;
  description?: string;
}> = [
  {
    type: 'ai_detected',
    title: 'Cliente mencionou cancelamento',
    timestamp: new Date(),
    author: 'IA Detectou',
    description: 'Estamos repensando o investimento devido ao cenário econômico atual...',
  },
  {
    type: 'proposal',
    title: 'Proposta enviada',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    author: 'Carlos',
    description: 'Proposta comercial detalhada com ROI de 18 meses',
  },
  {
    type: 'meeting',
    title: 'Reunião realizada',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    author: 'Reunião',
    description: 'Apresentação da solução para equipe técnica',
  },
];

export function NegotiationTimeline({ opportunityId }: NegotiationTimelineProps) {
  // In the future, this will fetch from a crm_activities table
  const events = PLACEHOLDER_EVENTS;

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
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma atividade registrada.
          </p>
        ) : (
          <div className="relative">
            {events.map((event, index) => (
              <TimelineItem
                key={index}
                type={event.type}
                title={event.title}
                timestamp={event.timestamp}
                author={event.author}
                description={event.description}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
