import React, { useState } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  CheckCircle, 
  BarChart3, 
  Settings,
  ArrowLeft,
  Users,
  LinkIcon,
  Mail,
  UserPlus,
  AlertTriangle,
  UserCheck,
  Percent,
  Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MetasPage from './MetasPage';
import ApprovacoesPage from './ApprovacoesPage';
import ConfiguracoesPage from './ConfiguracoesPage';
import ComissoesPage from './ComissoesPage';
import VendedoresPage from './VendedoresPage';
import DebugPage from './DebugPage';
import { TemplateAssetsPage } from '../TemplateAssetsPage';
import VendorMappingModal from '../../components/admin/VendorMappingModal';
import { VendorEmailSetupModal } from '../../components/admin/VendorEmailSetupModal';
import { VendorAccountCreationModal } from '../../components/admin/VendorAccountCreationModal';
import { VendorPermissionsSetupModal } from '../../components/admin/VendorPermissionsSetupModal';
import { useVendedoresProposta } from '../../hooks/useVendedoresProposta';
import { useSalesQuotas } from '../../hooks/useSalesQuotas';
import { useVendorApprovals } from '../../hooks/useVendorApprovals';

export default function AdminLayout() {
  const location = useLocation();
  const [showVendorMapping, setShowVendorMapping] = useState(false);
  const [showEmailSetup, setShowEmailSetup] = useState(false);
  const [showAccountCreation, setShowAccountCreation] = useState(false);
  const [showPermissionsSetup, setShowPermissionsSetup] = useState(false);
  const [selectedVendorForPermissions, setSelectedVendorForPermissions] = useState<any>(null);
  
  const { data: vendors } = useVendedoresProposta();
  const { data: quotas } = useSalesQuotas();
  const { data: approvals } = useVendorApprovals();

  const mappedVendors = vendors?.filter(v => v.profile) || [];
  const pendingApprovals = approvals?.filter(a => a.status === 'pending') || [];
  
  const adminMenuItems = [
    {
      title: 'Visão Geral',
      path: '/propostas/administracao',
      icon: BarChart3,
      exact: true
    },
    {
      title: 'Vendedores',
      path: '/propostas/administracao/vendedores',
      icon: Users,
      badge: `${vendors?.length || 0} cadastrados`
    },
    {
      title: 'Metas de Vendas',
      path: '/propostas/administracao/metas',
      icon: Target,
      badge: `${mappedVendors.length} vendedores`
    },
    {
      title: 'Aprovações',
      path: '/propostas/administracao/aprovacoes',
      icon: CheckCircle,
      badge: `${pendingApprovals.length} pendentes`
    },
    {
      title: 'Comissões',
      path: '/propostas/administracao/comissoes',
      icon: Percent
    },
    {
      title: 'Templates',
      path: '/propostas/administracao/templates',
      icon: Image
    },
    {
      title: 'Configurações',
      path: '/propostas/administracao/configuracoes',
      icon: Settings
    },
    {
      title: 'Debug',
      path: '/propostas/administracao/debug',
      icon: AlertTriangle
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

        {/* Navigation Tabs - Two Line Grid Layout */}
        <div className="mb-8">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="grid grid-cols-4 gap-3">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path, item.exact);
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center justify-center space-x-2 px-6 py-3 rounded-md text-base font-medium transition-all duration-200
                      ${active 
                        ? 'bg-drystore-orange text-white shadow-md transform scale-[1.02]' 
                        : 'text-drystore-medium-gray hover:text-drystore-orange hover:bg-drystore-light-orange/10 hover:scale-[1.01]'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ml-1 ${active ? 'bg-white/20 text-white' : 'bg-drystore-light-orange/20 text-drystore-orange'}`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <Routes>
          <Route index element={<AdminDashboard 
            quotas={quotas || []} 
            approvals={approvals || []}
          />} />
          <Route path="vendedores" element={<VendedoresPage />} />
          <Route path="metas" element={<MetasPage />} />
          <Route path="aprovacoes" element={<ApprovacoesPage />} />
          <Route path="comissoes" element={<ComissoesPage />} />
          <Route path="templates" element={<TemplateAssetsPage />} />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
          <Route path="debug" element={
            <RouteGuard requireAdmin={true}>
              <DebugPage />
            </RouteGuard>
          } />
        </Routes>

        <VendorMappingModal 
          open={showVendorMapping} 
          onClose={() => setShowVendorMapping(false)} 
        />
        
        <VendorEmailSetupModal
          open={showEmailSetup}
          onClose={() => setShowEmailSetup(false)}
          vendors={vendors}
        />
        
        <VendorAccountCreationModal
          open={showAccountCreation}
          onClose={() => setShowAccountCreation(false)}
          vendors={vendors}
        />

        <VendorPermissionsSetupModal
          open={showPermissionsSetup}
          onClose={() => setShowPermissionsSetup(false)}
          vendor={selectedVendorForPermissions}
          onComplete={() => {
            setSelectedVendorForPermissions(null);
            setShowPermissionsSetup(false);
          }}
        />
      </div>
    </div>
  );
}

function AdminDashboard({ 
  quotas, 
  approvals
}: { 
  quotas: any[]; 
  approvals: any[]; 
}) {
  const totalQuota = quotas.reduce((sum, q) => sum + (q.quota_amount || 0), 0);
  const totalAchieved = quotas.reduce((sum, q) => sum + (q.achieved_amount || 0), 0);
  const generalPercentage = totalQuota > 0 ? Math.round(totalAchieved / totalQuota * 100) : 0;
  const pendingApprovals = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-8 p-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Propostas do Mês
              </span>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">124</div>
            <p className="text-xs text-gray-600 mt-1">
              +12% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Taxa de Conversão
              </span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">68%</div>
            <p className="text-xs text-gray-600 mt-1">
              Propostas aceitas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Aprovações Pendentes
              </span>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{pendingApprovals}</div>
            <p className="text-xs text-gray-600 mt-1">
              Aguardando revisão
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Meta Geral
              </span>
              <Target className="h-4 w-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{generalPercentage}%</div>
            <p className="text-xs text-gray-600 mt-1">
              R$ {(totalAchieved / 1000).toFixed(0)}k de R$ {(totalQuota / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Module Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Settings className="mr-2 h-5 w-5 text-blue-500" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Módulo Propostas</span>
                <Badge className="bg-green-100 text-green-800">Ativo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Integração WhatsApp</span>
                <Badge className="bg-green-100 text-green-800">Conectado</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sistema de Aprovações</span>
                <Badge className="bg-green-100 text-green-800">Funcionando</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cálculo de Comissões</span>
                <Badge className="bg-green-100 text-green-800">Ativo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <BarChart3 className="mr-2 h-5 w-5 text-purple-500" />
              Resumo de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Propostas hoje</span>
                <span className="font-semibold">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Valor médio</span>
                <span className="font-semibold">R$ 47.2k</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tempo médio resposta</span>
                <span className="font-semibold">2.5h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Satisfação cliente</span>
                <span className="font-semibold">4.8/5</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}