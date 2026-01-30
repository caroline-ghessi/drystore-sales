import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  User, 
  Building, 
  Handshake, 
  Target, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Clock,
  Lightbulb,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { useProcessOpportunityWithAgents, useLatestExtractionsMap } from '../../hooks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AgentAnalysisPanelProps {
  opportunityId: string;
  lastAnalysisAt?: string | null;
}

const AGENT_CONFIG = {
  client_profiler: { 
    icon: User, 
    label: 'Perfil do Cliente', 
    color: 'bg-blue-100 text-blue-700',
    category: 'extraction'
  },
  project_extractor: { 
    icon: Building, 
    label: 'Dados do Projeto', 
    color: 'bg-purple-100 text-purple-700',
    category: 'extraction'
  },
  deal_extractor: { 
    icon: Handshake, 
    label: 'Negociação', 
    color: 'bg-green-100 text-green-700',
    category: 'extraction'
  },
  spin_analyzer: { 
    icon: Target, 
    label: 'Análise SPIN', 
    color: 'bg-orange-100 text-orange-700',
    category: 'analysis'
  },
  bant_qualifier: { 
    icon: CheckCircle, 
    label: 'Qualificação BANT', 
    color: 'bg-teal-100 text-teal-700',
    category: 'analysis'
  },
  objection_analyzer: { 
    icon: AlertTriangle, 
    label: 'Objeções', 
    color: 'bg-red-100 text-red-700',
    category: 'analysis'
  },
  pipeline_classifier: { 
    icon: TrendingUp, 
    label: 'Classificação Pipeline', 
    color: 'bg-indigo-100 text-indigo-700',
    category: 'decision'
  },
  coaching_generator: { 
    icon: Lightbulb, 
    label: 'Coaching', 
    color: 'bg-amber-100 text-amber-700',
    category: 'decision'
  },
} as const;

type AgentType = keyof typeof AGENT_CONFIG;

export function AgentAnalysisPanel({ opportunityId, lastAnalysisAt }: AgentAnalysisPanelProps) {
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  
  const { mutate: processOpportunity, isPending: isProcessing } = useProcessOpportunityWithAgents();
  const { data: extractions, isLoading: isLoadingExtractions, refetch } = useLatestExtractionsMap(opportunityId);

  const handleAnalyze = () => {
    processOpportunity(
      { opportunityId, forceReprocess: true },
      { onSuccess: () => refetch() }
    );
  };

  const toggleAgent = (agentType: string) => {
    setExpandedAgents(prev => {
      const next = new Set(prev);
      if (next.has(agentType)) {
        next.delete(agentType);
      } else {
        next.add(agentType);
      }
      return next;
    });
  };

  const hasExtractions = extractions && Object.keys(extractions).length > 0;

  const renderConfidenceBadge = (confidence: number | undefined) => {
    if (confidence === undefined) return null;
    const percent = Math.round(confidence * 100);
    const color = percent >= 80 ? 'bg-green-100 text-green-700' :
                  percent >= 60 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700';
    return (
      <Badge variant="secondary" className={`text-xs ${color}`}>
        {percent}% confiança
      </Badge>
    );
  };

  const renderExtractionContent = (agentType: AgentType, data: Record<string, unknown>) => {
    if (!data || Object.keys(data).length === 0) {
      return <p className="text-sm text-muted-foreground">Sem dados extraídos</p>;
    }

    // Renderização específica por tipo de agente
    switch (agentType) {
      case 'client_profiler':
        return (
          <div className="space-y-2 text-sm">
            {data.profile_type && (
              <div><span className="font-medium">Tipo:</span> {String(data.profile_type)}</div>
            )}
            {data.profession && (
              <div><span className="font-medium">Profissão:</span> {String(data.profession)}</div>
            )}
            {data.main_motivation && (
              <div><span className="font-medium">Motivação:</span> {String(data.main_motivation)}</div>
            )}
            {Array.isArray(data.pain_points) && data.pain_points.length > 0 && (
              <div>
                <span className="font-medium">Dores:</span>
                <ul className="list-disc list-inside ml-2">
                  {data.pain_points.slice(0, 3).map((p: { pain?: string }, i: number) => (
                    <li key={i}>{typeof p === 'string' ? p : p.pain}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'spin_analyzer':
        const spinProgress = data.spin_progress as Record<string, { score?: number }> | undefined;
        return (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Estágio:</span>
              <Badge variant="outline">{String(data.spin_stage || 'N/A')}</Badge>
              <span className="font-medium ml-2">Score:</span>
              <span>{data.spin_score as number || 0}/100</span>
            </div>
            {spinProgress && (
              <div className="space-y-2">
                {['situation', 'problem', 'implication', 'need_payoff'].map(phase => {
                  const phaseData = spinProgress[phase];
                  return (
                    <div key={phase} className="flex items-center gap-2">
                      <span className="w-24 capitalize">{phase.replace('_', ' ')}</span>
                      <Progress value={phaseData?.score || 0} className="flex-1 h-2" />
                      <span className="w-8 text-right">{phaseData?.score || 0}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'bant_qualifier':
        const bantDetails = data.bant_details as Record<string, { identified?: boolean; value?: number; range?: string }> | undefined;
        return (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-4">
              <span className="font-medium">Score BANT:</span>
              <span>{data.bant_score as number || 0}/100</span>
              <Badge variant={data.bant_qualified ? 'default' : 'secondary'}>
                {data.bant_qualified ? 'Qualificado' : 'Não Qualificado'}
              </Badge>
            </div>
            {bantDetails && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(bantDetails).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1">
                    {val?.identified ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-muted-foreground" />
                    )}
                    <span className="capitalize">{key}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'coaching_generator':
        const actions = data.recommended_actions as Array<{
          priority?: string;
          action?: string;
          script?: string;
        }> | undefined;
        return (
          <div className="space-y-3 text-sm">
            {data.coaching_priority && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Prioridade:</span>
                <Badge variant={data.coaching_priority === 'high' ? 'destructive' : 'secondary'}>
                  {data.coaching_priority === 'high' ? 'Alta' : 
                   data.coaching_priority === 'medium' ? 'Média' : 'Baixa'}
                </Badge>
              </div>
            )}
            {actions && actions.length > 0 && (
              <div>
                <span className="font-medium">Ações Recomendadas:</span>
                <div className="space-y-2 mt-2">
                  {actions.slice(0, 3).map((action, i) => (
                    <div key={i} className="p-2 bg-muted rounded-md">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {action.priority === 'high' ? '🔴' : action.priority === 'medium' ? '🟡' : '🟢'}
                        </Badge>
                        <span>{action.action}</span>
                      </div>
                      {action.script && (
                        <div className="mt-1 text-xs text-muted-foreground bg-background p-2 rounded border">
                          <MessageSquare className="h-3 w-3 inline mr-1" />
                          {action.script}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        // Renderização genérica
        return (
          <div className="space-y-1 text-sm">
            {Object.entries(data)
              .filter(([key]) => key !== 'confidence')
              .slice(0, 5)
              .map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                  <span className="text-muted-foreground">
                    {typeof value === 'object' ? JSON.stringify(value).slice(0, 50) + '...' : String(value)}
                  </span>
                </div>
              ))}
          </div>
        );
    }
  };

  const renderAgentCard = (agentType: AgentType) => {
    const config = AGENT_CONFIG[agentType];
    const extraction = extractions?.[agentType];
    const data = extraction?.extraction_data as Record<string, unknown> | undefined;
    const isExpanded = expandedAgents.has(agentType);
    const Icon = config.icon;

    return (
      <Collapsible key={agentType} open={isExpanded} onOpenChange={() => toggleAgent(agentType)}>
        <CollapsibleTrigger asChild>
          <div className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
            data ? 'border' : 'border border-dashed'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${config.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <span className="font-medium text-sm">{config.label}</span>
                {extraction?.created_at && (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(extraction.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {data ? (
                renderConfidenceBadge(extraction?.confidence)
              ) : (
                <Badge variant="outline" className="text-xs">Pendente</Badge>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pl-12 pr-3 pb-3 pt-2">
            {data ? renderExtractionContent(agentType, data) : (
              <p className="text-sm text-muted-foreground">Execute a análise para ver os dados.</p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const extractionAgents: AgentType[] = ['client_profiler', 'project_extractor', 'deal_extractor'];
  const analysisAgents: AgentType[] = ['spin_analyzer', 'bant_qualifier', 'objection_analyzer'];
  const decisionAgents: AgentType[] = ['pipeline_classifier', 'coaching_generator'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Análise de IA
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastAnalysisAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(lastAnalysisAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
              </span>
            )}
            <Button 
              size="sm" 
              onClick={handleAnalyze}
              disabled={isProcessing || isLoadingExtractions}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1" />
                  {hasExtractions ? 'Re-analisar' : 'Analisar com IA'}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="extraction" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="extraction">Extração</TabsTrigger>
            <TabsTrigger value="analysis">Análise</TabsTrigger>
            <TabsTrigger value="decision">Decisão</TabsTrigger>
          </TabsList>

          <TabsContent value="extraction" className="space-y-2 mt-4">
            {extractionAgents.map(renderAgentCard)}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-2 mt-4">
            {analysisAgents.map(renderAgentCard)}
          </TabsContent>

          <TabsContent value="decision" className="space-y-2 mt-4">
            {decisionAgents.map(renderAgentCard)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
