import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, Settings, TestTube, Save, X, Play, Pause, 
  Zap, MessageSquare, Brain, Eye, Edit3, Database 
} from 'lucide-react';
import { AgentConfig } from '@/hooks/useAgentConfigs';
import { KnowledgeBaseManager } from './KnowledgeBaseManager';
import { PromptVariablesCard } from './PromptVariablesCard';

interface AgentEditorProps {
  agent: AgentConfig | null;
  onClose: () => void;
  onSave: (agent: AgentConfig) => void;
}

export function AgentEditor({ agent, onClose, onSave }: AgentEditorProps) {
  const [editAgent, setEditAgent] = useState<AgentConfig>(() => {
    if (agent) {
      return {
        ...agent,
        system_prompt: agent.system_prompt || '',
        temperature: agent.temperature || 0.7,
        max_tokens: agent.max_tokens || 2048
      };
    }
    return {
      id: '',
      agent_name: '',
      description: '',
      agent_type: 'specialist',
      llm_model: 'gpt-4',
      system_prompt: '',
      temperature: 0.7,
      max_tokens: 2048,
      is_active: true,
      is_spy: false,
      created_at: '',
      updated_at: ''
    };
  });

  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState('');
  const [isTestLoading, setIsTestLoading] = useState(false);

  const handleSave = () => {
    onSave(editAgent);
    onClose();
  };

  const handleTest = async () => {
    setIsTestLoading(true);
    // Simular teste do agente
    setTimeout(() => {
      setTestResult(`Agente ${editAgent.agent_name} processou: "${testMessage}"\n\nResposta: Esta é uma resposta simulada do agente configurado.`);
      setIsTestLoading(false);
    }, 2000);
  };

  if (!agent) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Editor do Agente</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {agent.id ? 'Editando agente existente' : 'Criando novo agente'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs defaultValue="config" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-muted/30">
              <TabsTrigger value="config" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuração
              </TabsTrigger>
              <TabsTrigger value="prompt" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Prompt
              </TabsTrigger>
              <TabsTrigger value="behavior" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Comportamento
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Base de Conhecimento
              </TabsTrigger>
              <TabsTrigger value="test" className="flex items-center gap-2">
                <TestTube className="w-4 h-4" />
                Teste
              </TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Agente</Label>
                    <Input
                      id="name"
                      value={editAgent.agent_name}
                      onChange={(e) => setEditAgent({...editAgent, agent_name: e.target.value})}
                      placeholder="Ex: Agente Energia Solar"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Tipo do Agente</Label>
                    <select 
                      id="type"
                      className="w-full p-2 border rounded-lg bg-background text-foreground"
                      value={editAgent.agent_type}
                      onChange={(e) => setEditAgent({...editAgent, agent_type: e.target.value as AgentConfig['agent_type']})}
                    >
                      <option value="specialist">Especialista</option>
                      <option value="classifier">Classificador</option>
                      <option value="extractor">Extrator</option>
                      <option value="general">Geral</option>
                      <option value="lead_scorer">Avaliador de Leads</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <select 
                      id="category"
                      className="w-full p-2 border rounded-lg bg-background text-foreground"
                      value={editAgent.product_category || ''}
                      onChange={(e) => setEditAgent({...editAgent, product_category: e.target.value as any})}
                    >
                      <option value="">Selecionar categoria</option>
                      <option value="energia_solar">Energia Solar</option>
                      <option value="telha_shingle">Telhas Shingle</option>
                      <option value="steel_frame">Steel Frame</option>
                      <option value="drywall_divisorias">Drywall</option>
                      <option value="ferramentas">Ferramentas</option>
                      <option value="pisos">Pisos</option>
                      <option value="acabamentos">Acabamentos</option>
                      <option value="forros">Forros</option>
                      <option value="geral">Geral</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="model">Modelo LLM</Label>
                    <select 
                      id="model"
                      className="w-full p-2 border rounded-lg bg-background text-foreground"
                      value={editAgent.llm_model || 'claude-3-5-sonnet-20241022'}
                      onChange={(e) => setEditAgent({...editAgent, llm_model: e.target.value})}
                    >
                      <optgroup label="Anthropic (Claude)">
                        <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Recomendado)</option>
                        <option value="claude-3-haiku-20240307">Claude 3 Haiku (Rápido)</option>
                        <option value="claude-3-opus-20240229">Claude 3 Opus (Avançado)</option>
                      </optgroup>
                      <optgroup label="OpenAI (ChatGPT)">
                        <option value="gpt-4o">GPT-4o (Recomendado)</option>
                        <option value="gpt-4o-mini">GPT-4o Mini (Econômico)</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      </optgroup>
                      <optgroup label="xAI (Grok)">
                        <option value="grok-beta">Grok Beta</option>
                        <option value="grok-2">Grok 2</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="active">Agente Ativo</Label>
                    <Switch
                      id="active"
                      checked={editAgent.is_active}
                      onCheckedChange={(checked) => setEditAgent({...editAgent, is_active: checked})}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={editAgent.is_active ? "default" : "secondary"}>
                      {editAgent.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline">{editAgent.agent_type}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={editAgent.description || ''}
                  onChange={(e) => setEditAgent({...editAgent, description: e.target.value})}
                  placeholder="Descreva a função e especialidade deste agente..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="prompt" className="p-6 space-y-4">
              <div>
                <Label htmlFor="prompt">Prompt Principal</Label>
                <Textarea
                  id="prompt"
                  value={editAgent.system_prompt}
                  onChange={(e) => setEditAgent({...editAgent, system_prompt: e.target.value})}
                  placeholder="Digite o prompt que define o comportamento do agente..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Dicas para um bom prompt:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Defina claramente o papel do agente</li>
                  <li>• Especifique o tom e estilo de comunicação</li>
                  <li>• Inclua exemplos de respostas esperadas</li>
                  <li>• Defina limites e restrições</li>
                </ul>
              </div>

              {/* Variáveis Disponíveis */}
              <PromptVariablesCard productCategory={editAgent.product_category} />
            </TabsContent>

            <TabsContent value="behavior" className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Temperatura: {editAgent.temperature}</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={editAgent.temperature}
                    onChange={(e) => setEditAgent({...editAgent, temperature: parseFloat(e.target.value)})}
                    className="w-full mt-2 accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Preciso (0.0)</span>
                    <span>Criativo (1.0)</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxTokens">Máximo de Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={editAgent.max_tokens}
                    onChange={(e) => setEditAgent({...editAgent, max_tokens: parseInt(e.target.value)})}
                    min="100"
                    max="4096"
                  />
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-medium mb-3">Configurações de Comportamento</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Agente espião</span>
                    <Switch 
                      checked={editAgent.is_spy}
                      onCheckedChange={(checked) => setEditAgent({...editAgent, is_spy: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Respostas rápidas</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Manter contexto</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="knowledge" className="p-6 pb-8 overflow-y-auto">
              {editAgent.product_category ? (
                <KnowledgeBaseManager agentCategory={editAgent.product_category} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Database className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Categoria não definida</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Para gerenciar a base de conhecimento, primeiro defina uma categoria para este agente na aba "Configuração".
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="test" className="p-6 space-y-4">
              <div>
                <Label htmlFor="testMessage">Mensagem de Teste</Label>
                <Textarea
                  id="testMessage"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Digite uma mensagem para testar o agente..."
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleTest} 
                disabled={!testMessage || isTestLoading}
                className="w-full"
              >
                {isTestLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Testar Agente
                  </>
                )}
              </Button>

              {testResult && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Resultado do Teste:</h4>
                  <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>

        <div className="border-t p-4 flex items-center justify-between bg-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="w-4 h-4" />
            Última edição há 2 minutos
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Agente
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}