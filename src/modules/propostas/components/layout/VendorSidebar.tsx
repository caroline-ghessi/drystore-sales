import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import {
  Calculator,
  FileText,
  TrendingUp,
  Save,
  Bell,
  User,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  badge?: string;
  description?: string;
  permission?: keyof ReturnType<typeof useUserPermissions>;
}

const vendorMenuItems: MenuItem[] = [
  {
    title: 'Calculadoras',
    url: '/propostas/calculos',
    icon: Calculator,
    description: 'Ferramentas de cálculo',
    permission: 'canAccessCalculator',
  },
  {
    title: 'Minhas Propostas',
    url: '/propostas/lista',
    icon: FileText,
    description: 'Propostas criadas por mim',
    permission: 'canGenerateProposals',
  },
  {
    title: 'Ranking',
    url: '/propostas/ranking',
    icon: TrendingUp,
    description: 'Ranking geral de vendas',
    permission: 'canViewRanking',
  },
  {
    title: 'Cálculos Salvos',
    url: '/propostas/calculos-salvos',
    icon: Save,
    description: 'Meus cálculos salvos',
    permission: 'canSaveCalculations',
  },
  {
    title: 'Notificações',
    url: '/propostas/notificacoes',
    icon: Bell,
    description: 'Alertas e avisos',
  },
];

export function VendorSidebar() {
  const location = useLocation();
  const permissions = useUserPermissions();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const filteredMenuItems = vendorMenuItems.filter(item => {
    if (!item.permission) return true;
    return permissions[item.permission];
  });

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-drystore-orange rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-drystore-dark-gray">
              Portal do Vendedor
            </h2>
            <Badge variant="secondary" className="text-xs">
              {permissions.vendorPermissions?.access_level || 'basic'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6">
        <nav className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.url);
            
            return (
              <NavLink
                key={item.url}
                to={item.url}
                className={cn(
                  'mx-3 px-3 py-2 rounded-lg flex items-center space-x-3 transition-colors text-sm',
                  active
                    ? 'bg-drystore-orange text-white shadow-sm'
                    : 'text-drystore-medium-gray hover:text-drystore-orange hover:bg-drystore-light-orange/10'
                )}
              >
                <Icon className="w-5 h-5" />
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  {item.description && (
                    <div className={cn(
                      'text-xs mt-0.5',
                      active ? 'text-white/80' : 'text-drystore-medium-gray'
                    )}>
                      {item.description}
                    </div>
                  )}
                </div>
                {item.badge && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      'text-xs',
                      active ? 'bg-white/20 text-white' : 'bg-drystore-light-orange/20 text-drystore-orange'
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Limits */}
      {permissions.vendorPermissions && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="text-xs text-drystore-medium-gray space-y-1">
            <div className="font-medium mb-2">Seus Limites:</div>
            <div className="flex justify-between">
              <span>Desconto máx:</span>
              <span>{permissions.maxDiscountPercentage}%</span>
            </div>
            <div className="flex justify-between">
              <span>Valor máx:</span>
              <span>R$ {(permissions.maxProposalValue / 1000).toFixed(0)}k</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-6 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair do Sistema
        </Button>
      </div>
    </div>
  );
}