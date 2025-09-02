import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { FileText, Home, LogOut } from 'lucide-react';

export function PropostasHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/propostas' || path === '/propostas/') return 'Lista de Propostas';
    if (path.includes('/nova')) return 'Nova Proposta';
    if (path.includes('/templates')) return 'Templates';
    if (path.includes('/configuracoes')) return 'Configurações';
    return 'Propostas';
  };

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-purple-600">Propostas</span>
          </div>
          
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={() => navigate('/home')}
                  className="cursor-pointer hover:text-primary"
                >
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={() => navigate('/propostas')}
                  className="cursor-pointer hover:text-primary"
                >
                  Propostas
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{getPageTitle()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}