import React, { useState } from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Bot, Plus, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CRMAgentsList } from '../components/agents/CRMAgentsList';
import { CRMAgentEditor } from '../components/agents/CRMAgentEditor';
import { CRMAgentMetrics } from '../components/agents/CRMAgentMetrics';
import { useCRMAgentConfigs, CRM_AGENT_DEFINITIONS } from '../hooks/useCRMAgentConfigs';

export default function AgentManagement() {
  const { isAdmin, loading } = useUserPermissions();
  const { data: existingAgents, isLoading: loadingAgents } = useCRMAgentConfigs();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<typeof CRM_AGENT_DEFINITIONS[0] | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-md">
          Esta página é exclusiva para administradores. Entre em contato com o admin do sistema se precisar de acesso.
        </p>
      </div>
    );
  }

  // Mapear definições com configs existentes
  const agentsWithStatus = CRM_AGENT_DEFINITIONS.map(def => {
    const existingConfig = existingAgents?.find(
      agent => agent.agent_name === def.name || agent.description?.includes(def.key)
    );
    return {
      ...def,
      configId: existingConfig?.id,
      isConfigured: !!existingConfig,
      isActive: existingConfig?.is_active ?? false,
      config: existingConfig,
    };
  });

  const handleEditAgent = (agentKey: string) => {
    const agent = agentsWithStatus.find(a => a.key === agentKey);
    if (agent) {
      setSelectedDefinition(agent);
      setSelectedAgentId(agent.configId || null);
      setIsEditorOpen(true);
    }
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedAgentId(null);
    setSelectedDefinition(null);
  };

  const configuredCount = agentsWithStatus.filter(a => a.isConfigured).length;
  const activeCount = agentsWithStatus.filter(a => a.isActive).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Agentes de IA do CRM</h1>
            <p className="text-muted-foreground">
              Gerencie os 8 agentes especializados para análise e extração de dados
            </p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {configuredCount < 8 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              {8 - configuredCount} agente(s) ainda não configurado(s)
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Configure todos os agentes para habilitar a análise completa de oportunidades
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold">{configuredCount}/8</div>
          <div className="text-sm text-muted-foreground">Agentes Configurados</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          <div className="text-sm text-muted-foreground">Agentes Ativos</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            {existingAgents?.length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Total de Configs</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <CRMAgentsList 
            agents={agentsWithStatus}
            onEdit={handleEditAgent}
            isLoading={loadingAgents}
          />
        </TabsContent>

        <TabsContent value="metrics">
          <CRMAgentMetrics />
        </TabsContent>
      </Tabs>

      {/* Editor Modal */}
      {isEditorOpen && selectedDefinition && (
        <CRMAgentEditor
          definition={selectedDefinition}
          configId={selectedAgentId}
          open={isEditorOpen}
          onClose={handleCloseEditor}
        />
      )}
    </div>
  );
}
