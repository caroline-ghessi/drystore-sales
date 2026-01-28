import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OpportunityDetail } from '../../hooks/useOpportunityDetail';

interface NextActionsProps {
  opportunity: OpportunityDetail | undefined;
}

interface Action {
  id: number;
  title: string;
  deadline: string;
}

export function NextActions({ opportunity }: NextActionsProps) {
  const generateActions = (): Action[] => {
    const actions: Action[] = [];

    if (!opportunity) return actions;

    // Parse next_step if available
    if (opportunity.next_step) {
      actions.push({
        id: 1,
        title: opportunity.next_step,
        deadline: 'Em breve',
      });
    }

    // Add default actions based on stage
    if (opportunity.stage === 'prospecting') {
      if (!opportunity.next_step) {
        actions.push({
          id: 1,
          title: 'Fazer primeiro contato',
          deadline: 'Hoje',
        });
      }
      actions.push({
        id: actions.length + 1,
        title: 'Qualificar lead',
        deadline: 'Esta semana',
      });
    } else if (opportunity.stage === 'qualification') {
      if (!opportunity.next_step) {
        actions.push({
          id: 1,
          title: 'Agendar reunião de apresentação',
          deadline: 'Em 2 dias',
        });
      }
      actions.push({
        id: actions.length + 1,
        title: 'Levantar necessidades do cliente',
        deadline: 'Esta semana',
      });
    } else if (opportunity.stage === 'proposal') {
      if (!opportunity.next_step) {
        actions.push({
          id: 1,
          title: 'Enviar proposta comercial',
          deadline: 'Hoje',
        });
      }
      actions.push({
        id: actions.length + 1,
        title: 'Fazer follow-up da proposta',
        deadline: 'Em 48h',
      });
    } else if (opportunity.stage === 'negotiation') {
      if (!opportunity.next_step) {
        actions.push({
          id: 1,
          title: 'Ligar para negociar termos',
          deadline: 'Urgente',
        });
      }
      actions.push({
        id: actions.length + 1,
        title: 'Revisar condições comerciais',
        deadline: 'Em breve',
      });
    }

    // Limit to 3 actions
    return actions.slice(0, 3);
  };

  const actions = generateActions();

  if (actions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Próximas Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma ação pendente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Próximas Ações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <div
            key={action.id}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
              {action.id}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {action.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {action.deadline}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
