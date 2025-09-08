import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DryStoreButton } from '../components/ui/DryStoreButton';
import { DryStoreBadge } from '../components/ui/DryStoreBadge';
import { 
  Building,
  Sun, 
  Wrench,
  TrendingUp,
  FileText,
  Target,
  Users,
  ArrowRight,
  BarChart3
} from 'lucide-react';

export default function DryStoreDashboard() {
  const ecosystemCards = [
    {
      icon: Building,
      title: 'Construir',
      description: 'Materiais de alta qualidade para sua construção',
      color: 'bg-blue-50 text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      icon: Sun,
      title: 'Viver',
      description: 'Soluções sustentáveis para o seu dia a dia',
      color: 'bg-green-50 text-green-600',
      borderColor: 'border-green-200'
    },
    {
      icon: Wrench,
      title: 'Transformar',
      description: 'Tecnologias inovadoras que fazem a diferença',
      color: 'bg-purple-50 text-purple-600',
      borderColor: 'border-purple-200'
    }
  ];

  const metrics = [
    {
      title: 'Faturamento Mensal',
      value: 'R$ 1.2M',
      change: '+15%',
      changeType: 'positive',
      icon: TrendingUp,
      description: 'vs mês anterior'
    },
    {
      title: 'Propostas Enviadas',
      value: '89',
      change: '+8',
      changeType: 'positive',
      icon: FileText,
      description: 'esta semana'
    },
    {
      title: 'Taxa de Conversão',
      value: '68%',
      change: '+12%',
      changeType: 'positive',
      icon: Target,
      description: 'vs mês anterior'
    },
    {
      title: 'Clientes Ativos',
      value: '234',
      change: '+23',
      changeType: 'positive',
      icon: Users,
      description: 'novos clientes'
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-drystore-light-gray min-h-full">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-drystore-orange to-drystore-dark-gray rounded-2xl p-8 text-drystore-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard DryStore</h1>
            <p className="text-lg opacity-90">Gerencie suas propostas e acompanhe o desempenho do seu negócio</p>
          </div>
          <div className="hidden md:block">
            <DryStoreButton 
              variant="drystore-secondary"
              className="bg-drystore-white text-drystore-orange hover:bg-drystore-white/90"
            >
              <FileText className="mr-2 h-5 w-5" />
              Nova Proposta
            </DryStoreButton>
          </div>
        </div>
      </div>

      {/* Ecosystem Cards */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-drystore-dark-gray">Nosso Ecossistema</h2>
            <p className="text-drystore-medium-gray">Explore nossas soluções integradas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ecosystemCards.map((card, index) => (
            <Card key={index} className={`border-2 ${card.borderColor} hover:shadow-lg transition-all duration-200 cursor-pointer group`}>
              <CardHeader className="pb-4">
                <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center mb-4`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl text-drystore-dark-gray group-hover:text-drystore-orange transition-colors">
                  {card.title}
                </CardTitle>
                <CardDescription className="text-drystore-medium-gray">
                  {card.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DryStoreButton variant="drystore-outline" size="sm" className="group-hover:bg-drystore-orange group-hover:text-drystore-white">
                  Explorar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </DryStoreButton>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div>
        <h2 className="text-2xl font-bold text-drystore-dark-gray mb-6">Métricas de Performance</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg bg-drystore-orange/10 flex items-center justify-center`}>
                    <metric.icon className="h-5 w-5 text-drystore-orange" />
                  </div>
                  <DryStoreBadge 
                    variant={metric.changeType === 'positive' ? 'success' : 'danger'}
                    className="text-xs"
                  >
                    {metric.change}
                  </DryStoreBadge>
                </div>
                
                <div>
                  <p className="text-2xl font-bold text-drystore-dark-gray mb-1">
                    {metric.value}
                  </p>
                  <p className="text-sm text-drystore-medium-gray">
                    {metric.title}
                  </p>
                  <p className="text-xs text-drystore-medium-gray mt-1">
                    {metric.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-drystore-dark-gray flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-drystore-orange" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>Acesse rapidamente as funcionalidades mais utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DryStoreButton variant="drystore-outline" className="h-20 flex-col">
              <FileText className="h-6 w-6 mb-2" />
              <span className="text-sm">Nova Proposta</span>
            </DryStoreButton>
            <DryStoreButton variant="drystore-outline" className="h-20 flex-col">
              <Users className="h-6 w-6 mb-2" />
              <span className="text-sm">Clientes</span>
            </DryStoreButton>
            <DryStoreButton variant="drystore-outline" className="h-20 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span className="text-sm">Relatórios</span>
            </DryStoreButton>
            <DryStoreButton variant="drystore-outline" className="h-20 flex-col">
              <Target className="h-6 w-6 mb-2" />
              <span className="text-sm">Metas</span>
            </DryStoreButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}