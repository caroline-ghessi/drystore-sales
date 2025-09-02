import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  MessageCircle, 
  Users, 
  FileText, 
  BarChart3, 
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';

export default function HomePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    whatsapp: { conversations: 45, activeAgents: 8, pendingMessages: 12 },
    crm: { hotLeads: 23, totalLeads: 156, conversionRate: 18.5 },
    propostas: { pending: 7, approved: 15, totalValue: 45800 }
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const moduleCards = [
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      description: 'Gerencie conversas, bots e atendimento',
      icon: MessageCircle,
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      iconColor: 'text-green-600',
      route: '/whatsapp',
      stats: [
        { label: 'Conversas Ativas', value: stats.whatsapp.conversations, icon: MessageCircle },
        { label: 'Agentes Online', value: stats.whatsapp.activeAgents, icon: Users },
        { label: 'Msgs Pendentes', value: stats.whatsapp.pendingMessages, icon: Clock }
      ]
    },
    {
      id: 'crm',
      title: 'CRM',
      description: 'Leads, pipeline e análises de vendas',
      icon: BarChart3,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-600',
      route: '/crm',
      stats: [
        { label: 'Leads Quentes', value: stats.crm.hotLeads, icon: TrendingUp },
        { label: 'Total Leads', value: stats.crm.totalLeads, icon: Users },
        { label: 'Conversão', value: `${stats.crm.conversionRate}%`, icon: CheckCircle }
      ]
    },
    {
      id: 'propostas',
      title: 'Propostas',
      description: 'Criação e gestão de propostas comerciais',
      icon: FileText,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      iconColor: 'text-purple-600',
      route: '/propostas',
      stats: [
        { label: 'Pendentes', value: stats.propostas.pending, icon: Clock },
        { label: 'Aprovadas', value: stats.propostas.approved, icon: CheckCircle },
        { label: 'Valor Total', value: `R$ ${(stats.propostas.totalValue / 1000).toFixed(0)}k`, icon: TrendingUp }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <Bot className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">DryStore AI</h1>
                <p className="text-sm text-muted-foreground">Sistema de Atendimento Inteligente</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Bem-vindo ao seu painel de controle
          </h2>
          <p className="text-muted-foreground">
            Selecione um módulo para começar a trabalhar
          </p>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {moduleCards.map((module) => (
            <Card 
              key={module.id}
              className={`${module.color} transition-all duration-200 cursor-pointer transform hover:scale-105 hover:shadow-lg`}
              onClick={() => navigate(module.route)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`inline-flex items-center justify-center w-12 h-12 bg-card rounded-lg shadow-sm`}>
                      <module.icon className={`w-6 h-6 ${module.iconColor}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {module.stats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <stat.icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{stat.label}</span>
                      </div>
                      <Badge variant="secondary" className="font-semibold">
                        {stat.value}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={() => navigate(module.route)}
                >
                  Acessar {module.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Resumo Geral do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {stats.whatsapp.conversations}
                </div>
                <div className="text-sm text-muted-foreground">Conversas WhatsApp Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {stats.crm.hotLeads}
                </div>
                <div className="text-sm text-muted-foreground">Leads Quentes no CRM</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {stats.propostas.pending}
                </div>
                <div className="text-sm text-muted-foreground">Propostas Pendentes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}