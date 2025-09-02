import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, Settings, Plus, Search, Filter, Users, 
  Bot, MessageSquare, Target, Shield, TrendingUp, 
  FileText, Zap, Eye, Edit3, Trash2
} from 'lucide-react';
import { AgentEditor } from './AgentEditor';
import { 
  useAgentConfigs, 
  useUpdateAgentConfig, 
  useCreateAgentConfig, 
  type AgentConfig 
} from '@/hooks/useAgentConfigs';
import { ProductCategory } from '@/types/conversation.types';

// Interface para categorias de especialistas
const SPECIALIST_CATEGORIES: Partial<Record<ProductCategory, string>> = {
  'geral': 'Atendimento Geral',
  'acabamentos': 'Agente Acabamentos',
  'drywall_divisorias': 'Agente Drywall', 
  'forros': 'Agente Forros',
  'pisos': 'Agente Pisos',
  'energia_solar': 'Especialista Energia Solar',
  'ferramentas': 'Especialista Ferramentas',
  'steel_frame': 'Especialista Steel Frame',
  'telha_shingle': 'Especialista Telhas Shingle'
};

interface AgentsSectionProps {
  selectedAgent: string | null;
  setSelectedAgent: (agentId: string | null) => void;
}

export function AgentsSection({ selectedAgent, setSelectedAgent }: AgentsSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState('general');
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  
  // Hooks para carregar dados reais do Supabase
  const { data: allAgents, isLoading } = useAgentConfigs();
  const updateAgentMutation = useUpdateAgentConfig();
  const createAgentMutation = useCreateAgentConfig();
  
  // Processar agentes por tipo
  const agentsByType = useMemo(() => {
    if (!allAgents) return {};
    
    return {
      general: allAgents.filter(agent => agent.agent_type === 'general'),
      specialists: allAgents.filter(agent => agent.agent_type === 'specialist'),
      spies: allAgents.filter(agent => agent.is_spy === true),
      leads: allAgents.filter(agent => agent.agent_type === 'lead_scorer'),
      quality: allAgents.filter(agent => 
        agent.agent_type === 'classifier' || 
        agent.agent_type === 'extractor' ||
        agent.agent_name.toLowerCase().includes('qualidade')
      ),
      summary: allAgents.filter(agent => 
        agent.agent_name.toLowerCase().includes('resumo') ||
        agent.agent_name.toLowerCase().includes('summary')
      )
    };
  }, [allAgents]);

  // Contar agentes por tipo dinamicamente
  const subTabs = useMemo(() => [
    { 
      id: 'general', 
      label: 'Atendimento Geral', 
      icon: <MessageSquare className="w-4 h-4" />, 
      count: agentsByType.general?.length || 0 
    },
    { 
      id: 'specialists', 
      label: 'Especialistas', 
      icon: <Brain className="w-4 h-4" />, 
      count: agentsByType.specialists?.length || 0 
    },
    { 
      id: 'spies', 
      label: 'Agentes Espiões', 
      icon: <Eye className="w-4 h-4" />, 
      count: agentsByType.spies?.length || 0 
    },
    { 
      id: 'leads', 
      label: 'Avaliadores de Leads', 
      icon: <Target className="w-4 h-4" />, 
      count: agentsByType.leads?.length || 0 
    },
    { 
      id: 'quality', 
      label: 'Monitor de Qualidade', 
      icon: <Shield className="w-4 h-4" />, 
      count: agentsByType.quality?.length || 0 
    },
    { 
      id: 'summary', 
      label: 'Gerador de Resumos', 
      icon: <FileText className="w-4 h-4" />, 
      count: agentsByType.summary?.length || 0 
    }
  ], [agentsByType]);

  const getAgentsByType = (type: string) => {
    return agentsByType[type as keyof typeof agentsByType] || [];
  };

  const getAgentIcon = (agentType: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      general: <MessageSquare className="w-4 h-4 text-blue-600" />,
      specialist: <Brain className="w-4 h-4 text-purple-600" />,
      classifier: <Bot className="w-4 h-4 text-green-600" />,
      extractor: <Zap className="w-4 h-4 text-orange-600" />,
      lead_scorer: <Target className="w-4 h-4 text-pink-600" />
    };
    return iconMap[agentType] || <Bot className="w-4 h-4 text-muted-foreground" />;
  };
  
  const getAgentDisplayName = (agent: AgentConfig) => {
    if (agent.agent_type === 'specialist' && agent.product_category) {
      return SPECIALIST_CATEGORIES[agent.product_category] || agent.agent_name;
    }
    return agent.agent_name;
  };

  const handleEditAgent = (agent: AgentConfig) => {
    setEditingAgent(agent);
  };

  const handleSaveAgent = async (updatedAgent: AgentConfig) => {
    try {
      await updateAgentMutation.mutateAsync(updatedAgent);
      setEditingAgent(null);
    } catch (error) {
      console.error('Erro ao salvar agente:', error);
    }
  };

  const handleCreateAgent = async () => {
    // Implementar criação de novo agente quando necessário
    console.log('Criar novo agente');
  };

  const filteredAgents = getAgentsByType(activeSubTab);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Agentes Especializados
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Agente
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-muted/30">
              {subTabs.map(tab => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-2"
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 text-xs">
                      {tab.count}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-2/3" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="w-20 h-8" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAgents.length > 0 ? (
                <div className="space-y-4">
                  {filteredAgents.map(agent => (
                    <div 
                      key={agent.id}
                      className="p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedAgent(agent.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {getAgentIcon(agent.agent_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{getAgentDisplayName(agent)}</h4>
                              <Badge 
                                variant={agent.is_active ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {agent.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {agent.agent_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {agent.description || 'Sem descrição disponível'}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>Modelo: {(agent.llm_model || 'GPT-4').toUpperCase()}</span>
                              {agent.product_category && (
                                <span>Categoria: {agent.product_category}</span>
                              )}
                              <span>Temp: {agent.temperature}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAgent(agent);
                            }}
                            disabled={updateAgentMutation.isPending}
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                    <Bot className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">Nenhum agente encontrado</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Não há agentes configurados para esta categoria.
                  </p>
                  <Button size="sm" onClick={handleCreateAgent}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Agente
                  </Button>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {editingAgent && (
        <AgentEditor
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
          onSave={handleSaveAgent}
        />
      )}
    </>
  );
}