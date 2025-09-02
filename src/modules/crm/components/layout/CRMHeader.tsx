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
import { BarChart3, Home, LogOut } from 'lucide-react';

export function CRMHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/crm' || path === '/crm/') return 'Dashboard';
    if (path.includes('/leads-quentes')) return 'Leads Quentes';
    if (path.includes('/pipeline')) return 'Pipeline';
    if (path.includes('/customers')) return 'Clientes';
    if (path.includes('/opportunities')) return 'Oportunidades';
    if (path.includes('/reports')) return 'Relatórios';
    if (path.includes('/tasks')) return 'Tarefas';
    if (path.includes('/settings')) return 'Configurações';
    return 'CRM';
  };

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-blue-600">CRM</span>
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
                  onClick={() => navigate('/crm')}
                  className="cursor-pointer hover:text-primary"
                >
                  CRM
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