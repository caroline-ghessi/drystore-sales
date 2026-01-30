import React from 'react';
import { Bot, Check, Settings, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToggleCRMAgentStatus, CRM_AGENT_DEFINITIONS } from '../../hooks/useCRMAgentConfigs';
import { useAgentMetrics } from '../../hooks/useCRMAgentExtractions';
import { cn } from '@/lib/utils';

interface AgentWithStatus {
  key: string;
  name: string;
  category: string;
  categoryLabel: string;
  type: string;
  description: string;
  icon: string;
  configId: string | undefined;
  isConfigured: boolean;
  isActive: boolean;
  config: unknown;
}

interface CRMAgentsListProps {
  agents: AgentWithStatus[];
  onEdit: (agentKey: string) => void;
  isLoading: boolean;
}

const categoryColors: Record<string, string> = {
  analysis: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  extraction: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  decision: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  validation: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

export function CRMAgentsList({ agents, onEdit, isLoading }: CRMAgentsListProps) {
  const { data: metrics } = useAgentMetrics();
  const toggleStatus = useToggleCRMAgentStatus();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  // Agrupar por categoria
  const categories = ['analysis', 'extraction', 'decision', 'validation'];
  const groupedAgents = categories.map(cat => ({
    category: cat,
    label: agents.find(a => a.category === cat)?.categoryLabel || cat,
    items: agents.filter(a => a.category === cat),
  }));

  const handleToggleStatus = (agent: AgentWithStatus) => {
    if (agent.configId) {
      toggleStatus.mutate({
        id: agent.configId,
        is_active: !agent.isActive,
      });
    }
  };

  return (
    <div className="space-y-6">
      {groupedAgents.map(group => (
        <div key={group.category} className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Badge className={cn('text-xs', categoryColors[group.category])}>
              {group.label}
            </Badge>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.items.map(agent => {
              const agentMetrics = metrics?.[agent.key];
              
              return (
                <Card 
                  key={agent.key}
                  className={cn(
                    'transition-all hover:shadow-md',
                    !agent.isConfigured && 'border-dashed opacity-75',
                    agent.isActive && 'border-primary/50'
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{agent.icon}</span>
                        <div>
                          <CardTitle className="text-base">{agent.name}</CardTitle>
                          <CardDescription className="text-xs line-clamp-1">
                            {agent.description}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {agent.isConfigured ? (
                          <Badge 
                            variant={agent.isActive ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {agent.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Não configurado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-2">
                    {/* Metrics */}
                    {agentMetrics && (
                      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                        <div className="text-center">
                          <div className="font-semibold">{agentMetrics.totalExecutions}</div>
                          <div className="text-muted-foreground">Execuções</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{agentMetrics.avgProcessingTime}ms</div>
                          <div className="text-muted-foreground">Tempo médio</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">
                            {Math.round(agentMetrics.avgConfidence * 100)}%
                          </div>
                          <div className="text-muted-foreground">Confiança</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onEdit(agent.key)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        {agent.isConfigured ? 'Editar' : 'Configurar'}
                      </Button>
                      
                      {agent.isConfigured && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(agent)}
                          disabled={toggleStatus.isPending}
                        >
                          {agent.isActive ? (
                            <PowerOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Power className="h-4 w-4 text-primary" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
