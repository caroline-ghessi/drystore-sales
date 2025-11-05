import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { usePromptVariables } from '@/hooks/useAgentPrompts';
import { toast } from 'sonner';

interface PromptVariablesCardProps {
  agentType?: string;
  productCategory?: string;
  compact?: boolean;
}

const categoryLabels: Record<string, string> = {
  customer: 'Cliente',
  project: 'Projeto',
  calculated: 'Calculadas',
  system: 'Sistema'
};

const categoryColors: Record<string, string> = {
  customer: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  project: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  calculated: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  system: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
};

export function PromptVariablesCard({ agentType, productCategory, compact = false }: PromptVariablesCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(compact);
  const { data: variables, isLoading, error } = usePromptVariables();

  // Se não há variáveis ou houve erro, não renderizar nada
  if (isLoading || error || !variables || variables.length === 0) {
    return null;
  }

  // Agrupar variáveis por categoria
  const groupedVariables = variables.reduce((acc, variable) => {
    const category = variable.category || 'system';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(variable);
    return acc;
  }, {} as Record<string, typeof variables>);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Variável copiada!');
  };

  return (
    <Card className="border-dashed border-2 border-primary/20">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code className="w-4 h-4 text-primary" />
            Variáveis Disponíveis
            <Badge variant="secondary" className="text-xs">
              {variables.length}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        </div>
        {isCollapsed && (
          <p className="text-xs text-muted-foreground mt-1">
            Clique para ver as variáveis que você pode usar nos prompts
          </p>
        )}
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Clique em uma variável para copiá-la e use nos seus prompts para dados dinâmicos.
          </p>

          {Object.entries(groupedVariables).map(([category, vars]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                  {categoryLabels[category] || category}
                </h4>
                <div className="flex-1 h-px bg-border" />
              </div>
              
              <div className="space-y-1">
                {vars.map((variable) => (
                  <div
                    key={variable.id}
                    className="group flex items-center justify-between p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-primary font-semibold">
                          {variable.variable_name}
                        </code>
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1.5 py-0 ${categoryColors[category]}`}
                        >
                          {categoryLabels[category]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {variable.description}
                      </p>
                      {variable.example_value && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5 italic">
                          Ex: {variable.example_value}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(variable.variable_name)}
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copiar variável"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Dica:</strong> Use variáveis para personalizar as respostas do bot com dados reais do cliente e do projeto.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
