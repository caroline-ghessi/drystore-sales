import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgentMetrics } from '../../hooks/useCRMAgentExtractions';
import { CRM_AGENT_DEFINITIONS } from '../../hooks/useCRMAgentConfigs';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = {
  spin_analyzer: 'hsl(221, 83%, 53%)',
  bant_qualifier: 'hsl(142, 76%, 36%)',
  objection_analyzer: 'hsl(38, 92%, 50%)',
  client_profiler: 'hsl(280, 67%, 51%)',
  project_extractor: 'hsl(173, 80%, 40%)',
  deal_extractor: 'hsl(339, 79%, 50%)',
  pipeline_classifier: 'hsl(199, 89%, 48%)',
  coaching_generator: 'hsl(47, 96%, 53%)',
};

export function CRMAgentMetrics() {
  const { data: metrics, isLoading } = useAgentMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!metrics || Object.keys(metrics).length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">
            Nenhuma execução de agentes registrada ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para gráficos
  const executionsData = CRM_AGENT_DEFINITIONS.map(def => ({
    name: def.name.split(' ')[0],
    fullName: def.name,
    key: def.key,
    executions: metrics[def.key]?.totalExecutions || 0,
  }));

  const tokensData = CRM_AGENT_DEFINITIONS.map(def => ({
    name: def.name.split(' ')[0],
    fullName: def.name,
    key: def.key,
    tokens: metrics[def.key]?.totalTokens || 0,
  }));

  const confidenceData = CRM_AGENT_DEFINITIONS.map(def => ({
    name: def.name.split(' ')[0],
    fullName: def.name,
    key: def.key,
    confidence: Math.round((metrics[def.key]?.avgConfidence || 0) * 100),
  }));

  const totalExecutions = Object.values(metrics).reduce((acc, m) => acc + m.totalExecutions, 0);
  const totalTokens = Object.values(metrics).reduce((acc, m) => acc + m.totalTokens, 0);
  const avgConfidence = Object.values(metrics).length > 0
    ? Object.values(metrics).reduce((acc, m) => acc + m.avgConfidence, 0) / Object.values(metrics).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Execuções
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExecutions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tokens Consumidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confiança Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgConfidence * 100)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agentes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(metrics).length}/{CRM_AGENT_DEFINITIONS.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Execuções por Agente</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={executionsData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: number) => [value, 'Execuções']}
                  labelFormatter={(label) => executionsData.find(d => d.name === label)?.fullName}
                />
                <Bar dataKey="executions" radius={[0, 4, 4, 0]}>
                  {executionsData.map((entry) => (
                    <Cell key={entry.key} fill={COLORS[entry.key as keyof typeof COLORS] || 'hsl(var(--primary))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confiança por Agente (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={confidenceData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Confiança']}
                  labelFormatter={(label) => confidenceData.find(d => d.name === label)?.fullName}
                />
                <Bar dataKey="confidence" radius={[0, 4, 4, 0]}>
                  {confidenceData.map((entry) => (
                    <Cell key={entry.key} fill={COLORS[entry.key as keyof typeof COLORS] || 'hsl(var(--primary))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhes por Agente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Agente</th>
                  <th className="text-right py-2 px-3">Execuções</th>
                  <th className="text-right py-2 px-3">Tokens</th>
                  <th className="text-right py-2 px-3">Tempo Médio</th>
                  <th className="text-right py-2 px-3">Confiança</th>
                  <th className="text-right py-2 px-3">Última Execução</th>
                </tr>
              </thead>
              <tbody>
                {CRM_AGENT_DEFINITIONS.map(def => {
                  const m = metrics[def.key];
                  return (
                    <tr key={def.key} className="border-b last:border-0">
                      <td className="py-2 px-3 font-medium">
                        {def.icon} {def.name}
                      </td>
                      <td className="text-right py-2 px-3">
                        {m?.totalExecutions || 0}
                      </td>
                      <td className="text-right py-2 px-3">
                        {(m?.totalTokens || 0).toLocaleString()}
                      </td>
                      <td className="text-right py-2 px-3">
                        {m?.avgProcessingTime || 0}ms
                      </td>
                      <td className="text-right py-2 px-3">
                        {Math.round((m?.avgConfidence || 0) * 100)}%
                      </td>
                      <td className="text-right py-2 px-3 text-muted-foreground">
                        {m?.lastExecution 
                          ? formatDistanceToNow(new Date(m.lastExecution), { addSuffix: true, locale: ptBR })
                          : '-'
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
