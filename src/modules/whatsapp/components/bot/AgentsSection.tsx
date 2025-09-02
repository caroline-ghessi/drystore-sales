import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, Settings, Plus, Search, Filter, Users, 
  Bot, MessageSquare, Target, Shield, TrendingUp, 
  FileText, Zap, Eye, Edit3, Trash2
} from 'lucide-react';
import { AgentEditor } from './AgentEditor';

interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  model: string;
  isActive: boolean;
  category: string;
  lastUsed?: string;
  accuracy?: number;
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
}

interface AgentsSectionProps {
  selectedAgent: string | null;
  setSelectedAgent: (agentId: string | null) => void;
}

export function AgentsSection({ selectedAgent, setSelectedAgent }: AgentsSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState('general');
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [agents] = useState<Agent[]>([
    {
      id: '1',
      name: 'Atendimento Geral',
      description: 'Agente principal para atendimento inicial',
      type: 'general',
      model: 'gpt-4',
      isActive: true,
      category: 'geral',
      accuracy: 94
    },
    {
      id: '2', 
      name: 'Especialista Energia Solar',
      description: 'Especializado em sistemas fotovoltaicos',
      type: 'specialist',
      model: 'claude-3',
      isActive: true,
      category: 'energia_solar',
      accuracy: 97
    },
    {
      id: '3',
      name: 'Especialista Telhas Shingle',
      description: 'Especializado em cobertura residencial',
      type: 'specialist',
      model: 'gpt-4',
      isActive: false,
      category: 'telhas_shingle',
      accuracy: 91
    },
    {
      id: '4',
      name: 'Classificador Principal',
      description: 'Classifica intenções dos clientes',
      type: 'classifier',
      model: 'grok',
      isActive: true,
      category: 'geral',
      accuracy: 89
    },
    {
      id: '5',
      name: 'Extrator de Dados',
      description: 'Extrai informações do cliente',
      type: 'extractor',
      model: 'gpt-4',
      isActive: true,
      category: 'geral',
      accuracy: 92
    },
    {
      id: '6',
      name: 'Monitor de Qualidade',
      description: 'Monitora qualidade do atendimento',
      type: 'quality',
      model: 'claude-3',
      isActive: true,
      category: 'geral',
      accuracy: 88
    }
  ]);

  const subTabs = [
    { id: 'general', label: 'Atendimento Geral', icon: <MessageSquare className="w-4 h-4" />, count: 1 },
    { id: 'specialists', label: 'Especialistas', icon: <Brain className="w-4 h-4" />, count: 2 },
    { id: 'spies', label: 'Agentes Espiões', icon: <Eye className="w-4 h-4" />, count: 0 },
    { id: 'leads', label: 'Avaliadores de Leads', icon: <Target className="w-4 h-4" />, count: 0 },
    { id: 'quality', label: 'Monitor de Qualidade', icon: <Shield className="w-4 h-4" />, count: 1 },
    { id: 'summary', label: 'Gerador de Resumos', icon: <FileText className="w-4 h-4" />, count: 0 }
  ];

  const getAgentsByType = (type: string) => {
    const typeMap: { [key: string]: string[] } = {
      general: ['general'],
      specialists: ['specialist'],
      spies: ['spy'],
      leads: ['lead'],
      quality: ['quality', 'classifier', 'extractor'],
      summary: ['summary']
    };
    return agents.filter(agent => typeMap[type]?.includes(agent.type));
  };

  const getAgentIcon = (type: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      general: <MessageSquare className="w-4 h-4 text-blue-600" />,
      specialist: <Brain className="w-4 h-4 text-purple-600" />,
      classifier: <Bot className="w-4 h-4 text-green-600" />,
      extractor: <Zap className="w-4 h-4 text-orange-600" />,
      quality: <Shield className="w-4 h-4 text-red-600" />,
      spy: <Eye className="w-4 h-4 text-indigo-600" />,
      lead: <Target className="w-4 h-4 text-pink-600" />,
      summary: <FileText className="w-4 h-4 text-teal-600" />
    };
    return iconMap[type] || <Bot className="w-4 h-4 text-muted-foreground" />;
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
  };

  const handleSaveAgent = (agent: Agent) => {
    // Aqui implementaria a lógica de salvamento
    console.log('Salvando agente:', agent);
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
              {filteredAgents.length > 0 ? (
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
                            {getAgentIcon(agent.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{agent.name}</h4>
                              <Badge 
                                variant={agent.isActive ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {agent.isActive ? "Ativo" : "Inativo"}
                              </Badge>
                              {agent.accuracy && (
                                <Badge variant="outline" className="text-xs">
                                  {agent.accuracy}% precisão
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {agent.description}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>Modelo: {agent.model.toUpperCase()}</span>
                              <span>Categoria: {agent.category}</span>
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
                  <Button size="sm">
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