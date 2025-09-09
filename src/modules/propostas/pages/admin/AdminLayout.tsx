import React, { useState } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
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
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MetasPage from './MetasPage';
import ApprovacoesPage from './ApprovacoesPage';
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
          <Route index element={<AdminDashboard 
            vendors={vendors || []} 
            quotas={quotas || []} 
            approvals={approvals || []}
            onOpenVendorMapping={() => setShowVendorMapping(true)}
            onOpenEmailSetup={() => setShowEmailSetup(true)}
            onOpenAccountCreation={() => setShowAccountCreation(true)}
            onOpenPermissionsSetup={(vendor) => {
              setSelectedVendorForPermissions(vendor);
              setShowPermissionsSetup(true);
            }}
          />} />
          <Route path="metas" element={<MetasPage />} />
          <Route path="aprovacoes" element={<ApprovacoesPage />} />
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
  vendors, 
  quotas, 
  approvals, 
  onOpenVendorMapping,
  onOpenEmailSetup,
  onOpenAccountCreation,
  onOpenPermissionsSetup
}: { 
  vendors: any[]; 
  quotas: any[]; 
  approvals: any[]; 
  onOpenVendorMapping: () => void;
  onOpenEmailSetup: () => void;
  onOpenAccountCreation: () => void;
  onOpenPermissionsSetup: (vendor: any) => void;
}) {
  const totalVendors = vendors.length;
  const vendorsWithEmail = vendors.filter(v => v.email).length;
  const vendorsWithAccount = vendors.filter(v => v.profile?.user_id).length;
  const vendorsWithPermissions = vendors.filter(v => v.permissions_configured).length;
  const vendorsNeedingEmail = totalVendors - vendorsWithEmail;
  const vendorsNeedingAccount = vendorsWithEmail - vendorsWithAccount;
  const vendorsNeedingPermissions = vendorsWithAccount - vendorsWithPermissions;
  const pendingApprovals = approvals.filter(a => a.status === 'pending').length;
  
  const totalQuota = quotas.reduce((sum, q) => sum + (q.quota_amount || 0), 0);
  const totalAchieved = quotas.reduce((sum, q) => sum + (q.achieved_amount || 0), 0);
  const generalPercentage = totalQuota > 0 ? Math.round(totalAchieved / totalQuota * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-drystore-orange">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-drystore-medium-gray">
                Aprovações Pendentes
              </span>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-drystore-dark-gray">{pendingApprovals}</div>
            <p className="text-xs text-drystore-medium-gray mt-1">
              Descontos aguardando
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-drystore-medium-gray">
                Total Vendedores
              </span>
              <Users className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-drystore-dark-gray">{totalVendors}</div>
            <p className="text-xs text-drystore-medium-gray mt-1">
              Cadastrados no WhatsApp
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-drystore-medium-gray">
                Com Conta Sistema
              </span>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-drystore-dark-gray">{vendorsWithAccount}</div>
            <p className="text-xs text-drystore-medium-gray mt-1">
              de {totalVendors} vendedores
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium text-drystore-medium-gray">
                Meta do Mês
              </span>
              <Target className="h-4 w-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-drystore-dark-gray">{generalPercentage}%</div>
            <p className="text-xs text-drystore-medium-gray mt-1">
              R$ {(totalAchieved / 1000).toFixed(0)}k de R$ {(totalQuota / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Adicionar Emails */}
        {vendorsNeedingEmail > 0 && (
          <Card className="border-l-4 border-l-orange-500 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Mail className="h-5 w-5" />
                Adicionar Emails
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-700 mb-4">
                {vendorsNeedingEmail} vendedor(es) precisam de email para criar conta
              </p>
              <Button 
                onClick={onOpenEmailSetup}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Configurar Emails
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Configurar Permissões */}
        {vendorsNeedingPermissions > 0 && (
          <Card className="border-l-4 border-l-purple-500 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Settings className="h-5 w-5" />
                Configurar Permissões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-700 mb-4">
                {vendorsNeedingPermissions} vendedor(es) precisam de permissões configuradas
              </p>
              <div className="space-y-2">
                {vendors
                  .filter(v => v.profile?.user_id && !v.permissions_configured)
                  .slice(0, 3)
                  .map(vendor => (
                    <Button
                      key={vendor.id}
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenPermissionsSetup(vendor)}
                      className="w-full justify-start text-sm"
                    >
                      {vendor.name}
                    </Button>
                  ))}
                {vendorsNeedingPermissions > 3 && (
                  <p className="text-xs text-purple-600 text-center">
                    +{vendorsNeedingPermissions - 3} mais vendedores
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Criar Contas */}
        {vendorsNeedingAccount > 0 && (
          <Card className="border-l-4 border-l-blue-500 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <UserPlus className="h-5 w-5" />
                Criar Contas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700 mb-4">
                {vendorsNeedingAccount} vendedor(es) podem receber convite (após configurar permissões)
              </p>
              <Button 
                onClick={onOpenAccountCreation}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={vendorsNeedingPermissions > 0}
              >
                {vendorsNeedingPermissions > 0 ? 'Configure Permissões Primeiro' : 'Enviar Convites'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Status Geral */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-drystore-dark-gray">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Status da Integração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-drystore-medium-gray">Total:</span>
                <span className="font-medium">{totalVendors} vendedores</span>
              </div>
              <div className="flex justify-between">
                <span className="text-drystore-medium-gray">Com email:</span>
                <span className="font-medium">{vendorsWithEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-drystore-medium-gray">Com conta:</span>
                <span className="font-medium text-blue-600">{vendorsWithAccount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-drystore-medium-gray">Com permissões:</span>
                <span className="font-medium text-green-600">{vendorsWithPermissions}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Administrative Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-drystore-dark-gray">Ações Administrativas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="text-sm text-drystore-medium-gray">{pendingApprovals} pendentes</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto py-4 border-drystore-orange/20 hover:bg-drystore-light-orange/10"
              onClick={onOpenVendorMapping}
            >
              <LinkIcon className="h-5 w-5 mr-3 text-drystore-orange" />
              <div className="text-left">
                <div className="font-medium text-drystore-dark-gray">Mapeamento Manual</div>
                <div className="text-sm text-drystore-medium-gray">Casos especiais</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}