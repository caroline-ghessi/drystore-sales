import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  CheckCircle, 
  BarChart3, 
  Settings,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MetasPage from './MetasPage';
import ApprovacoesPage from './ApprovacoesPage';

export default function AdminLayout() {
  const location = useLocation();
  
  const adminMenuItems = [
    {
      title: 'Visão Geral',
      path: '/propostas/administracao',
      icon: BarChart3,
      exact: true
    },
    {
      title: 'Metas de Vendas',
      path: '/propostas/administracao/metas',
      icon: Target,
      badge: '5 vendedores'
    },
    {
      title: 'Aprovações',
      path: '/propostas/administracao/aprovacoes',
      icon: CheckCircle,
      badge: '3 pendentes'
    }
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="p-6 bg-drystore-light-gray min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.history.back()}
                  className="text-drystore-medium-gray hover:text-drystore-orange"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div className="h-6 w-px bg-drystore-medium-gray/30"></div>
                <h1 className="text-3xl font-bold text-drystore-dark-gray">
                  Administração
                </h1>
                <Badge variant="secondary" className="bg-drystore-orange text-white">
                  <Settings className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              </div>
              <p className="text-drystore-medium-gray">
                Configurações e controles administrativos do sistema
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${active 
                      ? 'bg-drystore-orange text-white shadow-sm' 
                      : 'text-drystore-medium-gray hover:text-drystore-orange hover:bg-drystore-light-orange/10'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.title}</span>
                  {item.badge && (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${active ? 'bg-white/20 text-white' : 'bg-drystore-light-orange/20 text-drystore-orange'}`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="metas" element={<MetasPage />} />
          <Route path="aprovacoes" element={<ApprovacoesPage />} />
        </Routes>
      </div>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Overview Cards */}
      <Card className="border-l-4 border-l-drystore-orange">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-drystore-medium-gray">
            Aprovações Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-drystore-dark-gray">3</div>
          <p className="text-xs text-drystore-medium-gray mt-1">
            Descontos aguardando aprovação
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-drystore-medium-gray">
            Vendedores Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-drystore-dark-gray">5</div>
          <p className="text-xs text-drystore-medium-gray mt-1">
            Com metas configuradas
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-drystore-medium-gray">
            Meta Geral do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-drystore-dark-gray">78%</div>
          <p className="text-xs text-drystore-medium-gray mt-1">
            R$ 156k de R$ 200k
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-drystore-dark-gray">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4 border-drystore-orange/20 hover:bg-drystore-light-orange/10"
            >
              <Target className="h-5 w-5 mr-3 text-drystore-orange" />
              <div className="text-left">
                <div className="font-medium text-drystore-dark-gray">Configurar Metas</div>
                <div className="text-sm text-drystore-medium-gray">Definir objetivos mensais</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4 border-drystore-orange/20 hover:bg-drystore-light-orange/10"
            >
              <CheckCircle className="h-5 w-5 mr-3 text-drystore-orange" />
              <div className="text-left">
                <div className="font-medium text-drystore-dark-gray">Revisar Aprovações</div>
                <div className="text-sm text-drystore-medium-gray">3 solicitações pendentes</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}