import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Building2,
  ChevronDown,
  LogOut,
  Plus,
  Settings,
  User
} from 'lucide-react';
import { DryStoreButton } from '../ui/DryStoreButton';

export function DryStoreHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/nova')) return 'Nova Proposta';
    if (path.includes('/clientes')) return 'Clientes';
    if (path.includes('/templates')) return 'Templates';
    if (path.includes('/configuracoes')) return 'Configurações';
    if (path.includes('/ranking')) return 'Ranking';
    if (path.includes('/produtos')) return 'Produtos';
    if (path.includes('/administracao')) return 'Administração';
    return 'Dashboard';
  };

  return (
    <header className="h-16 bg-gradient-to-r from-drystore-orange to-drystore-dark-gray shadow-lg">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo and Welcome */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-drystore-white rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-drystore-orange" />
            </div>
            <div className="text-drystore-white">
              <h1 className="text-lg font-bold">DryStore</h1>
            </div>
          </div>
          
          <div className="text-drystore-white">
            <h2 className="text-xl font-bold">Bem-vindo ao Portal de Propostas</h2>
            <p className="text-sm opacity-90">{getPageTitle()}</p>
          </div>
        </div>

        {/* Actions and User */}
        <div className="flex items-center space-x-4">
          {/* Create Proposal Button */}
          <DryStoreButton
            variant="drystore-secondary"
            onClick={() => navigate('/propostas/nova')}
            className="bg-drystore-white text-drystore-orange hover:bg-drystore-white/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Nova Proposta
          </DryStoreButton>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-drystore-white hover:bg-drystore-white/10">
                <User className="mr-2 h-4 w-4" />
                {user?.email || 'Usuário'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}