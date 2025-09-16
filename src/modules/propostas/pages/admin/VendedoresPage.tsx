import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import { useVendedoresProposta } from '../../hooks/useVendedoresProposta';
import { useVendorApprovals } from '../../hooks/useVendorApprovals';
import VendorMappingModal from '../../components/admin/VendorMappingModal';
import { VendorEmailSetupModal } from '../../components/admin/VendorEmailSetupModal';
import { VendorAccountCreationModal } from '../../components/admin/VendorAccountCreationModal';
import { VendorPermissionsSetupModal } from '../../components/admin/VendorPermissionsSetupModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function VendedoresPage() {
  const [showVendorMapping, setShowVendorMapping] = useState(false);
  const [showEmailSetup, setShowEmailSetup] = useState(false);
  const [showAccountCreation, setShowAccountCreation] = useState(false);
  const [showPermissionsSetup, setShowPermissionsSetup] = useState(false);
  const [selectedVendorForPermissions, setSelectedVendorForPermissions] = useState<any>(null);
  
  const { data: vendors } = useVendedoresProposta();
  const { data: approvals } = useVendorApprovals();

  const mappedVendors = vendors?.filter(v => v.profile) || [];
  const unmappedVendors = vendors?.filter(v => !v.profile) || [];
  const vendorsWithEmail = vendors?.filter(v => v.email) || [];
  const vendorsWithoutEmail = vendors?.filter(v => !v.email) || [];

  const handlePermissionsSetup = (vendor: any) => {
    setSelectedVendorForPermissions(vendor);
    setShowPermissionsSetup(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Vendedores</p>
                <p className="text-2xl font-bold">{vendors?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Com Conta</p>
                <p className="text-2xl font-bold">{mappedVendors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Com Email</p>
                <p className="text-2xl font-bold">{vendorsWithEmail.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Configurados</p>
                <p className="text-2xl font-bold">{vendors?.filter(v => v.token_configured).length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5" />
            Ações de Gestão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={() => setShowAccountCreation(true)}
              className="h-20 flex-col bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserPlus className="h-6 w-6 mb-2" />
              <span className="text-sm">Novo Vendedor</span>
            </Button>

            <Button 
              onClick={() => setShowEmailSetup(true)}
              variant="outline"
              className="h-20 flex-col border-orange-200 hover:bg-orange-50"
              disabled={vendorsWithoutEmail.length === 0}
            >
              <Mail className="h-6 w-6 mb-2 text-orange-600" />
              <span className="text-sm">Configurar E-mails</span>
            </Button>

            <Button 
              onClick={() => setShowVendorMapping(true)}
              variant="outline"
              className="h-20 flex-col border-green-200 hover:bg-green-50"
              disabled={unmappedVendors.length === 0}
            >
              <CheckCircle className="h-6 w-6 mb-2 text-green-600" />
              <span className="text-sm">Mapear Contas</span>
            </Button>

            <Button 
              variant="outline"
              className="h-20 flex-col border-purple-200 hover:bg-purple-50"
              disabled={mappedVendors.length === 0}
            >
              <Settings className="h-6 w-6 mb-2 text-purple-600" />
              <span className="text-sm">Configurações</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vendors List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Lista de Vendedores
            </div>
            <Badge variant="outline">{vendors?.length || 0} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Nome</th>
                  <th className="text-left p-4 font-medium">Telefone</th>
                  <th className="text-left p-4 font-medium">E-mail</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Integração</th>
                  <th className="text-left p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {vendors?.map((vendor) => (
                  <tr key={vendor.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        {vendor.profile && (
                          <p className="text-sm text-gray-500">{vendor.profile.display_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm">{vendor.phone_number}</td>
                    <td className="p-4 text-sm">
                      {vendor.email ? (
                        <span className="text-green-600">{vendor.email}</span>
                      ) : (
                        <span className="text-gray-400">Não cadastrado</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant={vendor.is_active ? "default" : "secondary"}
                        className={vendor.is_active ? "bg-green-100 text-green-800" : ""}
                      >
                        {vendor.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {vendor.profile ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Conta criada
                          </Badge>
                        ) : vendor.email ? (
                          <Badge variant="outline" className="border-orange-200 text-orange-700">
                            <Mail className="h-3 w-3 mr-1" />
                            Email configurado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-red-200 text-red-700">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePermissionsSetup(vendor)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar Permissões
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <VendorMappingModal 
        open={showVendorMapping}
        onClose={() => setShowVendorMapping(false)}
      />

      <VendorEmailSetupModal 
        open={showEmailSetup}
        onClose={() => setShowEmailSetup(false)}
      />

      <VendorAccountCreationModal 
        open={showAccountCreation}
        onClose={() => setShowAccountCreation(false)}
      />

      <VendorPermissionsSetupModal 
        open={showPermissionsSetup}
        onClose={() => setShowPermissionsSetup(false)}
        vendor={selectedVendorForPermissions}
      />
    </div>
  );
}