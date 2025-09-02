import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Users, 
  FileText, 
  BarChart3, 
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle,
  Building2,
  Zap,
  Wrench
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
      subtitle: 'COMUNICAÇÃO INTELIGENTE',
      icon: MessageCircle,
      color: 'bg-card border hover:shadow-lg transition-all duration-200',
      iconColor: 'text-drystore-orange',
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
      subtitle: 'GESTÃO DE RELACIONAMENTO',
      icon: BarChart3,
      color: 'bg-card border hover:shadow-lg transition-all duration-200',
      iconColor: 'text-drystore-orange',
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
      subtitle: 'SOLUÇÕES COMERCIAIS',
      icon: FileText,
      color: 'bg-card border hover:shadow-lg transition-all duration-200',
      iconColor: 'text-drystore-orange',
      route: '/propostas',
      stats: [
        { label: 'Pendentes', value: stats.propostas.pending, icon: Clock },
        { label: 'Aprovadas', value: stats.propostas.approved, icon: CheckCircle },
        { label: 'Valor Total', value: `R$ ${(stats.propostas.totalValue / 1000).toFixed(0)}k`, icon: TrendingUp }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-drystore-orange rounded-lg shadow-sm">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-drystore-dark-gray">
                  <span className="text-drystore-orange">Dry</span>store
                </h1>
                <p className="text-xs font-light tracking-wider text-drystore-medium-gray uppercase">
                  SOLUÇÕES INTELIGENTES
                </p>
                <p className="text-xs text-drystore-medium-gray">Desde 2002</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-drystore-dark-gray">{user?.email}</p>
                <p className="text-xs text-drystore-medium-gray">Administrador</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="border-drystore-orange text-drystore-orange hover:bg-drystore-orange hover:text-white rounded-full px-6"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-drystore-dark-gray mb-4">
            Construir, Viver e <span className="text-drystore-orange">Transformar</span>
          </h2>
          <p className="text-xl text-drystore-medium-gray mb-2">
            Soluções inteligentes para gestão completa do seu negócio
          </p>
          <p className="text-sm font-light tracking-wider text-drystore-medium-gray uppercase mb-8">
            Mais de 22 anos de experiência • 50.000+ clientes atendidos
          </p>
          <div className="flex justify-center">
            <div className="w-20 h-1 bg-drystore-orange rounded-full"></div>
          </div>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {moduleCards.map((module) => (
            <Card 
              key={module.id}
              className={`${module.color} cursor-pointer rounded-lg border-border bg-card hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]`}
              onClick={() => navigate(module.route)}
            >
              <CardHeader className="pb-4">
                <div className="flex flex-col items-center text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-drystore-orange/10 rounded-lg mb-4">
                    <module.icon className={`w-8 h-8 ${module.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-xs font-light tracking-wider text-drystore-medium-gray uppercase mb-1">
                      {module.subtitle}
                    </p>
                    <CardTitle className="text-xl font-bold text-drystore-dark-gray mb-2">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-drystore-medium-gray">
                      {module.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  {module.stats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <stat.icon className="w-4 h-4 text-drystore-medium-gray" />
                        <span className="text-sm text-drystore-medium-gray">{stat.label}</span>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="font-semibold bg-drystore-orange/10 text-drystore-orange border-0"
                      >
                        {stat.value}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="w-full bg-drystore-orange hover:bg-drystore-orange/90 text-white rounded-full py-3 font-semibold" 
                  onClick={() => navigate(module.route)}
                >
                  Acessar {module.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats Summary */}
        <Card className="bg-gradient-to-r from-drystore-orange/5 to-drystore-orange/10 border-drystore-orange/20">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-drystore-dark-gray">
              <BarChart3 className="w-6 h-6 text-drystore-orange" />
              Visão Geral do Sistema
            </CardTitle>
            <p className="text-sm text-drystore-medium-gray">
              Acompanhe o desempenho em tempo real
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white/50 rounded-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-drystore-orange/10 rounded-lg mb-3">
                  <MessageCircle className="w-6 h-6 text-drystore-orange" />
                </div>
                <div className="text-3xl font-bold text-drystore-dark-gray mb-1">
                  {stats.whatsapp.conversations}
                </div>
                <div className="text-sm text-drystore-medium-gray">Conversas WhatsApp Ativas</div>
              </div>
              <div className="text-center p-6 bg-white/50 rounded-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-drystore-orange/10 rounded-lg mb-3">
                  <TrendingUp className="w-6 h-6 text-drystore-orange" />
                </div>
                <div className="text-3xl font-bold text-drystore-dark-gray mb-1">
                  {stats.crm.hotLeads}
                </div>
                <div className="text-sm text-drystore-medium-gray">Leads Quentes no CRM</div>
              </div>
              <div className="text-center p-6 bg-white/50 rounded-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-drystore-orange/10 rounded-lg mb-3">
                  <FileText className="w-6 h-6 text-drystore-orange" />
                </div>
                <div className="text-3xl font-bold text-drystore-dark-gray mb-1">
                  {stats.propostas.pending}
                </div>
                <div className="text-sm text-drystore-medium-gray">Propostas Pendentes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}