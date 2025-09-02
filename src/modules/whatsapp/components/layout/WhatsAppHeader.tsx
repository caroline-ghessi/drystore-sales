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
import { MessageCircle, Home, LogOut } from 'lucide-react';

export function WhatsAppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/whatsapp' || path === '/whatsapp/') return 'Conversas';
    if (path.includes('/bot')) return 'Bot';
    if (path.includes('/vendedores')) return 'Vendedores';
    if (path.includes('/atendentes')) return 'Atendentes';
    if (path.includes('/analytics')) return 'Analytics';
    return 'WhatsApp';
  };

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-green-600">WhatsApp</span>
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
                  onClick={() => navigate('/whatsapp')}
                  className="cursor-pointer hover:text-primary"
                >
                  WhatsApp
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