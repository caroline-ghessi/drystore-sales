import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Settings } from 'lucide-react';

interface AgentsSectionProps {
  selectedAgent: string | null;
  setSelectedAgent: (agentId: string | null) => void;
}

export function AgentsSection({ selectedAgent, setSelectedAgent }: AgentsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Agentes Especializados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Agente Classificador</h4>
                <p className="text-sm text-muted-foreground">Classifica mensagens por categoria</p>
              </div>
              <button className="p-1.5 hover:bg-muted rounded transition-colors">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Agente Extrator</h4>
                <p className="text-sm text-muted-foreground">Extrai dados do cliente</p>
              </div>
              <button className="p-1.5 hover:bg-muted rounded transition-colors">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Brain className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Agente de Qualidade</h4>
                <p className="text-sm text-muted-foreground">Monitora qualidade do atendimento</p>
              </div>
              <button className="p-1.5 hover:bg-muted rounded transition-colors">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}