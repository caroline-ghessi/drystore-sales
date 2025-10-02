import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  CheckCircle, 
  BarChart3, 
  Settings,
  AlertTriangle
} from 'lucide-react';
import MetasPage from './MetasPage';
import ApprovacoesPage from './ApprovacoesPage';
import ComissoesPage from './ComissoesPage';
import VendedoresPage from './VendedoresPage';
import DebugPage from './DebugPage';
import OrderBumpsPage from './OrderBumpsPage';
import { TemplateAssetsPage } from '../TemplateAssetsPage';
import VendorMappingModal from '../../components/admin/VendorMappingModal';
import { VendorEmailSetupModal } from '../../components/admin/VendorEmailSetupModal';
import { VendorAccountCreationModal } from '../../components/admin/VendorAccountCreationModal';
import { VendorPermissionsSetupModal } from '../../components/admin/VendorPermissionsSetupModal';
import { useVendedoresProposta } from '../../hooks/useVendedoresProposta';
import { useSalesQuotas } from '../../hooks/useSalesQuotas';
import { useVendorApprovals } from '../../hooks/useVendorApprovals';

export default function AdminLayout() {
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

  return (
    <div className="p-6 bg-drystore-light-gray min-h-full">
      <div className="max-w-7xl mx-auto">
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
          <Route path="order-bumps" element={<OrderBumpsPage />} />
          <Route path="templates" element={<TemplateAssetsPage />} />
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