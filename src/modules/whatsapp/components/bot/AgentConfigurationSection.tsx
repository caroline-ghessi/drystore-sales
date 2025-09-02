import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Wrench } from 'lucide-react';

export function AgentConfigurationSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuração de Agentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium">Configurações Gerais</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure os parâmetros gerais dos agentes, como temperatura, max tokens, e prompts do sistema.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium">Modelos de IA</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Selecione e configure os modelos de linguagem utilizados pelos agentes.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}