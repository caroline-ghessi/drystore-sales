import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save } from 'lucide-react';
import { 
  useCRMAgentConfig, 
  useCreateCRMAgent, 
  useUpdateCRMAgent,
  CRM_AGENT_DEFINITIONS,
} from '../../hooks/useCRMAgentConfigs';

interface CRMAgentEditorProps {
  definition: typeof CRM_AGENT_DEFINITIONS[0];
  configId: string | null;
  open: boolean;
  onClose: () => void;
}

const LLM_MODELS = [
  // === ANTHROPIC (Claude) ===
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Recomendado)', provider: 'anthropic' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Rápido)', provider: 'anthropic' },
  { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Avançado)', provider: 'anthropic' },
  
  // === OPENAI (ChatGPT) ===
  { value: 'gpt-4o', label: 'GPT-4o (Recomendado)', provider: 'openai' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Econômico)', provider: 'openai' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'openai' },
  
  // === XAI (Grok) ===
  { value: 'grok-beta', label: 'Grok Beta', provider: 'xai' },
  { value: 'grok-2', label: 'Grok 2', provider: 'xai' },
];

const DEFAULT_PROMPTS: Record<string, string> = {
  spin_analyzer: `Você é um especialista em vendas consultivas usando a metodologia SPIN Selling.

Analise a conversa de vendas abaixo e identifique em qual fase SPIN a conversa se encontra:
- SITUATION (Situação): Perguntas sobre fatos e contexto atual do cliente
- PROBLEM (Problema): Identificação de dificuldades, insatisfações ou desafios
- IMPLICATION (Implicação): Exploração das consequências dos problemas
- NEED-PAYOFF (Necessidade-Benefício): Cliente expressa interesse na solução

Forneça um score de 0-100 indicando o progresso geral na metodologia SPIN.`,

  bant_qualifier: `Você é um especialista em qualificação de leads usando a metodologia BANT.

Analise a conversa e extraia informações sobre:
- BUDGET (Orçamento): O cliente tem ou mencionou orçamento disponível?
- AUTHORITY (Autoridade): O interlocutor é o decisor ou precisa consultar alguém?
- NEED (Necessidade): Existe uma necessidade real e urgente?
- TIMELINE (Prazo): Há um prazo definido para a decisão ou implementação?

Calcule um score BANT de 0-100 e determine se o lead está qualificado.`,

  objection_analyzer: `Você é um especialista em análise de objeções de vendas.

Identifique todas as objeções levantadas pelo cliente durante a conversa:
- Objeções de PREÇO (muito caro, sem orçamento)
- Objeções de TEMPO (não é o momento, preciso pensar)
- Objeções de CONFIANÇA (não conheço a empresa, preciso de referências)
- Objeções de CONCORRÊNCIA (tenho outras opções, já tenho fornecedor)
- Objeções de NECESSIDADE (não preciso, estou apenas pesquisando)

Para cada objeção, identifique se foi tratada pelo vendedor e como.`,

  client_profiler: `Você é um especialista em análise de perfil de clientes.

Extraia da conversa as seguintes informações sobre o cliente:
1. IDENTIFICAÇÃO: Nome, cidade, estado, contato
2. PERFIL: Tipo (final/técnico/empresa), profissão, se é técnico da área
3. ORIGEM: Como chegou até nós (WhatsApp direto, indicação, anúncio)
4. MOTIVAÇÃO: O que o levou a entrar em contato, qual o gatilho
5. DORES: Quais problemas ou insatisfações ele mencionou
6. DECISÃO: Se é o decisor, quem mais está envolvido na decisão`,

  project_extractor: `Você é um especialista em análise de projetos de construção e energia solar.

Extraia da conversa os dados do projeto ou obra:
1. LOCALIZAÇÃO: Cidade, bairro, endereço
2. TIPO DE OBRA: Nova construção, reforma, ampliação
3. PROFISSIONAIS: Se tem arquiteto ou engenheiro envolvido
4. DADOS TÉCNICOS: Área, consumo de energia, especificações
5. MATERIAIS: Produtos de interesse, quantidades estimadas
6. CRONOGRAMA: Urgência, data prevista de início, restrições`,

  deal_extractor: `Você é um especialista em análise de negociações comerciais.

Extraia da conversa os dados da negociação:
1. PROPOSTA: Foi solicitada? Foi enviada? Qual valor?
2. VALORES: Valores mencionados pelo cliente e vendedor
3. CONCORRÊNCIA: O cliente está comparando? Com quem? Quais valores?
4. NEGOCIAÇÃO: Pediu desconto? Quanto? Foi oferecido?
5. PAGAMENTO: Preferência de forma de pagamento
6. VISITAS: Foi oferecida visita? Foi realizada?
7. TIMELINE: Data primeiro contato, tempo em negociação, total de interações`,

  pipeline_classifier: `Você é um especialista em gestão de pipeline de vendas.

Com base em todas as análises anteriores, classifique o estágio atual da oportunidade:
- PROSPECTING: Contato inicial, ainda coletando informações básicas
- QUALIFICATION: Validando se é uma oportunidade real (BANT em andamento)
- PROPOSAL: Proposta em elaboração ou enviada
- NEGOTIATION: Em negociação ativa de valores/condições
- CLOSING: Próximo de fechar, últimas tratativas
- WON: Negócio fechado com sucesso
- LOST: Negócio perdido

Calcule a probabilidade de fechamento (0-100%) e identifique bloqueios.`,

  coaching_generator: `Você é um coach de vendas experiente.

Com base em toda a análise da oportunidade, gere recomendações para o vendedor:
1. AÇÕES RECOMENDADAS: O que o vendedor deve fazer agora (prioridade alta/média/baixa)
2. SCRIPTS: Sugestões de mensagens ou abordagens para cada ação
3. TIMING: Melhor momento para contato, urgência, prazo para follow-up
4. ALERTAS DE RISCO: Sinais de que pode perder a venda e como mitigar

Seja específico e acionável. O vendedor precisa saber exatamente o que fazer.`,
};

export function CRMAgentEditor({ definition, configId, open, onClose }: CRMAgentEditorProps) {
  const { data: existingConfig, isLoading } = useCRMAgentConfig(configId || undefined);
  const createAgent = useCreateCRMAgent();
  const updateAgent = useUpdateCRMAgent();
  
  const [formData, setFormData] = useState({
    agent_name: definition.name,
    description: definition.description,
    system_prompt: DEFAULT_PROMPTS[definition.key] || '',
    llm_model: 'claude-3-5-sonnet-20241022',
    temperature: 0.3,
    max_tokens: 2000,
    is_active: true,
  });

  useEffect(() => {
    if (existingConfig) {
      setFormData({
        agent_name: existingConfig.agent_name,
        description: existingConfig.description || definition.description,
        system_prompt: existingConfig.system_prompt,
        llm_model: existingConfig.llm_model || 'claude-3-5-sonnet-20241022',
        temperature: existingConfig.temperature ?? 0.3,
        max_tokens: existingConfig.max_tokens ?? 2000,
        is_active: existingConfig.is_active ?? true,
      });
    }
  }, [existingConfig, definition]);

  const handleSave = async () => {
    if (configId && existingConfig) {
      await updateAgent.mutateAsync({
        id: configId,
        ...formData,
      });
    } else {
      await createAgent.mutateAsync({
        ...formData,
        agent_type: definition.type,
      });
    }
    onClose();
  };

  const isSaving = createAgent.isPending || updateAgent.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{definition.icon}</span>
            {configId ? 'Editar' : 'Configurar'} {definition.name}
          </DialogTitle>
          <DialogDescription>
            {definition.description}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="config" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="config">Configuração</TabsTrigger>
              <TabsTrigger value="prompt">Prompt</TabsTrigger>
              <TabsTrigger value="output">Output Esperado</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do Agente</Label>
                  <Input
                    id="name"
                    value={formData.agent_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, agent_name: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="model">Modelo LLM</Label>
                  <Select
                    value={formData.llm_model}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, llm_model: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LLM_MODELS.map(model => (
                        <SelectItem key={model.value} value={model.value}>
                          <div className="flex items-center justify-between w-full gap-4">
                            <span>{model.label}</span>
                            <Badge 
                              variant="outline" 
                              className={
                                model.provider === 'anthropic' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' :
                                model.provider === 'openai' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                              }
                            >
                              {model.provider === 'anthropic' ? 'Anthropic' : 
                               model.provider === 'openai' ? 'OpenAI' : 'xAI'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Temperatura: {formData.temperature}</Label>
                    <span className="text-xs text-muted-foreground">
                      Menor = mais focado, Maior = mais criativo
                    </span>
                  </div>
                  <Slider
                    value={[formData.temperature]}
                    onValueChange={([value]) => setFormData(prev => ({ ...prev, temperature: value }))}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tokens">Max Tokens</Label>
                  <Input
                    id="tokens"
                    type="number"
                    value={formData.max_tokens}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 2000 }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Agente Ativo</Label>
                    <p className="text-xs text-muted-foreground">
                      Agentes inativos não serão executados no pipeline
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prompt" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prompt">System Prompt</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      system_prompt: DEFAULT_PROMPTS[definition.key] || ''
                    }))}
                  >
                    Restaurar padrão
                  </Button>
                </div>
                <Textarea
                  id="prompt"
                  value={formData.system_prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Insira o prompt do sistema..."
                />
                <p className="text-xs text-muted-foreground">
                  O histórico da conversa será adicionado automaticamente após o prompt.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="output" className="space-y-4 mt-4">
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium mb-2">Estrutura de Output Esperada</h4>
                <pre className="text-xs overflow-auto bg-background p-3 rounded border">
                  {JSON.stringify(definition.outputSchema, null, 2)}
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  Esta é a estrutura JSON que o agente deve retornar. O output será validado contra este schema.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
