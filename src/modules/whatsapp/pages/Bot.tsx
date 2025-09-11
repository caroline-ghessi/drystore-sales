import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, Settings, TestTube, Save, Plus, Edit3, Trash2, 
  ChevronRight, Code, MessageSquare, Zap, Brain, 
  FileText, Copy, History, AlertCircle, CheckCircle,
  Sparkles, Rocket, Database, ArrowRight, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OverviewSection } from '@/modules/whatsapp/components/bot/OverviewSection';
import { AgentsSection } from '@/modules/whatsapp/components/bot/AgentsSection';
import { LLMSection } from '@/modules/whatsapp/components/bot/LLMSection';
import { TestSection } from '@/modules/whatsapp/components/bot/TestSection';
import { MasterAgentSection } from '@/modules/whatsapp/components/bot/MasterAgentSection';
import { ClassificationLogsSection } from '@/modules/whatsapp/components/bot/ClassificationLogsSection';
import { ClassificationStats } from '@/modules/whatsapp/components/bot/ClassificationStats';
import { RAGSection } from '@/modules/whatsapp/components/bot/RAGSection';
import { AgentConfigurationSection } from '@/modules/whatsapp/components/bot/AgentConfigurationSection';

type ActiveTab = 'overview' | 'agents' | 'llm' | 'rag' | 'test';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium
        ${active 
          ? 'bg-background text-drystore-orange shadow-sm border border-border' 
          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function BotPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Verificar se há parâmetro 'tab' na URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as ActiveTab;
    if (tab && ['overview', 'agents', 'llm', 'rag', 'test'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Principal com Navegação */}
      <div className="bg-background border-b border-border sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Bot className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">Bot Inteligente</h1>
                    <p className="text-sm text-muted-foreground">Sistema de IA para atendimento WhatsApp</p>
                  </div>
                </div>
              </div>

            {/* Tabs de Navegação */}
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
              <TabButton
                active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
                icon={<Sparkles className="w-4 h-4" />}
                label="Visão Geral"
              />
              <TabButton
                active={activeTab === 'agents'}
                onClick={() => setActiveTab('agents')}
                icon={<Brain className="w-4 h-4" />}
                label="Agentes"
              />
              <TabButton
                active={activeTab === 'llm'}
                onClick={() => setActiveTab('llm')}
                icon={<Zap className="w-4 h-4" />}
                label="Modelos IA"
              />
              <TabButton
                active={activeTab === 'rag'}
                onClick={() => setActiveTab('rag')}
                icon={<Database className="w-4 h-4" />}
                label="Sistema RAG"
              />
              <TabButton
                active={activeTab === 'test'}
                onClick={() => setActiveTab('test')}
                icon={<TestTube className="w-4 h-4" />}
                label="Testar"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <History className="w-4 h-4 mr-2" />
                Histórico
              </Button>
              <Button className="bg-drystore-orange hover:bg-drystore-orange/90 shadow-sm">
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div>
            <OverviewSection />
            <ClassificationStats />
            <ClassificationLogsSection />
          </div>
        )}
        {activeTab === 'agents' && (
          <div className="space-y-6">
            <MasterAgentSection />
            <AgentsSection 
              selectedAgent={selectedAgent} 
              setSelectedAgent={setSelectedAgent} 
            />
          </div>
        )}
        {activeTab === 'llm' && <LLMSection />}
        {activeTab === 'rag' && <RAGSection />}
        {activeTab === 'test' && <TestSection />}
      </div>
    </div>
  );
}