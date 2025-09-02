import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Play, Bot, MessageSquare, User, Clock, 
  Target, TrendingUp, Zap, Brain
} from 'lucide-react';
import { ChatSimulator } from './ChatSimulator';

interface TestSectionProps {}

export function TestSection({}: TestSectionProps) {
  const [testMode, setTestMode] = useState<'simple' | 'advanced'>('simple');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('energia_solar');
  const [testMessage, setTestMessage] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [leadTemperature, setLeadTemperature] = useState('frio');

  const agents = [
    { id: 'energia_solar', name: 'Agente Energia Solar', icon: '☀️' },
    { id: 'telhas_shingle', name: 'Agente Telhas Shingle', icon: '🏠' },
    { id: 'steel_frame', name: 'Agente Steel Frame', icon: '🏗️' },
    { id: 'geral', name: 'Agente Geral', icon: '🤖' }
  ];

  const handleTest = () => {
    setIsProcessing(true);
    // Simular processamento
    setTimeout(() => {
      setIsProcessing(false);
    }, 2500);
  };

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Painel de Configuração - 5 colunas */}
      <div className="col-span-5">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Configurar Teste
            </h2>
            
            {/* Mode Selector */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg mb-6">
              <button
                onClick={() => setTestMode('simple')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  testMode === 'simple' 
                    ? 'bg-card shadow-sm text-foreground border' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Teste Simples
              </button>
              <button
                onClick={() => setTestMode('advanced')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  testMode === 'advanced' 
                    ? 'bg-card shadow-sm text-foreground border' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Teste Avançado
              </button>
            </div>

            {/* Test Configuration */}
            <div className="space-y-5">
              <div>
                <Label htmlFor="agent">Selecione o Agente</Label>
                <select 
                  id="agent"
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full p-3 border rounded-lg bg-background text-foreground mt-2"
                >
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.icon} {agent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="message">Mensagem de Teste</Label>
                <Textarea
                  id="message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Digite uma mensagem para testar o bot..."
                  rows={4}
                  className="mt-2"
                />
              </div>

              {testMode === 'advanced' && (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                  <h4 className="font-medium text-sm">Contexto do Cliente</h4>
                  <div className="space-y-3">
                    <Input
                      placeholder="Nome do cliente"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <Input
                      placeholder="Telefone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                    <select 
                      value={leadTemperature}
                      onChange={(e) => setLeadTemperature(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-background text-foreground"
                    >
                      <option value="frio">❄️ Lead Frio</option>
                      <option value="morno">🌡️ Lead Morno</option>
                      <option value="quente">🔥 Lead Quente</option>
                    </select>
                  </div>
                </div>
              )}

              <Button
                onClick={handleTest}
                disabled={!testMessage || isProcessing}
                className="w-full py-3"
                size="lg"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </span>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Executar Teste
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel de Resultados - 7 colunas */}
      <div className="col-span-7">
        <Card>
          <CardContent className="p-6 h-full">
            <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Resultado do Teste
            </h2>
            
            <div className="space-y-6">
              {/* Chat Simulation */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <ChatSimulator />
              </div>

              {/* Analysis Panel */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-400">
                      Intenção Detectada
                    </h4>
                  </div>
                  <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                    Energia Solar
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <h4 className="text-sm font-medium text-green-900 dark:text-green-400">
                      Confiança
                    </h4>
                  </div>
                  <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                    95%
                  </p>
                </div>
              </div>

              {/* Detailed Analysis */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3 h-3 text-orange-600" />
                    <span className="text-xs font-medium text-orange-900 dark:text-orange-400">
                      Tempo de Resposta
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                    0.8s
                  </p>
                </div>
                
                <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3 h-3 text-purple-600" />
                    <span className="text-xs font-medium text-purple-900 dark:text-purple-400">
                      Tokens Usados
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                    245
                  </p>
                </div>
                
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-3 h-3 text-indigo-600" />
                    <span className="text-xs font-medium text-indigo-900 dark:text-indigo-400">
                      Modelo Usado
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    GPT-4
                  </p>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Badge variant="default" className="bg-green-100 text-green-700">
                  ✅ Teste Concluído
                </Badge>
                <Badge variant="outline">
                  🎯 Classificação: Precisa
                </Badge>
                <Badge variant="outline">
                  ⚡ Performance: Excelente
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}