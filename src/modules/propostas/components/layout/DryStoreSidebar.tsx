import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3,
  Building2,
  FileText, 
  Home,
  Bell,
  Settings, 
  Trophy,
  Users,
  ShoppingBag,
  Menu,
  X,
  CheckCircle2,
  TrendingUp,
  FileDown,
  Target,
  CheckCircle,
  Percent,
  Image,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useVendedoresProposta } from '../../hooks/useVendedoresProposta';
import { useVendorApprovals } from '../../hooks/useVendorApprovals';

const dryStoreItems = [
  { title: 'Dashboard', url: '/propostas', icon: BarChart3, exact: true },
  { title: 'Propostas', url: '/propostas/lista', icon: FileText },
  { title: 'Clientes', url: '/propostas/clientes', icon: Users },
  { title: 'Ranking', url: '/propostas/ranking', icon: Trophy },
  { title: 'Notificações', url: '/propostas/notificacoes', icon: Bell, badge: '3' },
];

const getAdminItems = (vendorsCount: number, pendingApprovalsCount: number) => [
  { title: 'Visão Geral', url: '/propostas/administracao', icon: BarChart3, exact: true },
  { title: 'Vendedores', url: '/propostas/administracao/vendedores', icon: Users, badge: vendorsCount > 0 ? `${vendorsCount}` : undefined },
  { title: 'Metas de Vendas', url: '/propostas/administracao/metas', icon: Target },
  { title: 'Aprovações', url: '/propostas/administracao/aprovacoes', icon: CheckCircle, badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined },
  { title: 'Comissões', url: '/propostas/administracao/comissoes', icon: Percent },
  { title: 'Order Bumps', url: '/propostas/administracao/order-bumps', icon: Target },
  { title: 'Templates', url: '/propostas/administracao/templates', icon: Image },
  { title: 'Produtos', url: '/propostas/produtos', icon: ShoppingBag },
  { title: 'Relatórios', url: '/propostas/relatorios/geral', icon: FileDown },
  { title: 'Analytics', url: '/propostas/analytics', icon: TrendingUp },
  { title: 'Debug', url: '/propostas/administracao/debug', icon: AlertTriangle }
];

export function DryStoreSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAdmin } = useUserPermissions();
  
  // Fetch admin stats for badges
  const { data: vendors } = useVendedoresProposta();
  const { data: approvals } = useVendorApprovals();
  
  const vendorsCount = vendors?.length || 0;
  const pendingApprovalsCount = approvals?.filter(a => a.status === 'pending').length || 0;
  
  const adminItems = getAdminItems(vendorsCount, pendingApprovalsCount);

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) {
      if (path === '/propostas') {
        return currentPath === '/propostas' || currentPath === '/propostas/';
      }
      return currentPath === path;
    }
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  return (
    <div className={cn(
      "h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-sm",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-drystore-orange rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-drystore-dark-gray">DryStore</h1>
                <p className="text-sm text-drystore-medium-gray">Soluções Inteligentes</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-drystore-medium-gray hover:text-drystore-dark-gray p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {/* Back to Home */}
        <NavLink
          to="/home"
          className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-drystore-medium-gray hover:bg-gray-50 hover:text-drystore-dark-gray transition-all duration-200"
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="ml-3">Voltar ao Home</span>}
        </NavLink>

        {/* Section Label */}
        {!collapsed && (
          <div className="px-4 py-4">
            <h3 className="text-xs font-semibold text-drystore-medium-gray uppercase tracking-wider">
              Portal DryStore
            </h3>
          </div>
        )}

        {/* DryStore Items */}
        {dryStoreItems.map((item) => {
          const active = isActive(item.url, item.exact);
          return (
            <NavLink
              key={item.title}
              to={item.url}
              end={item.exact}
              className={cn(
                "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                active 
                  ? "bg-drystore-orange text-white shadow-lg shadow-drystore-orange/20" 
                  : "text-drystore-medium-gray hover:bg-gray-50 hover:text-drystore-dark-gray"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <div className="ml-3 flex items-center justify-between w-full">
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}

        {/* Admin Section */}
        {isAdmin && (
          <>
            {!collapsed && (
              <div className="px-4 py-4">
                <h3 className="text-xs font-semibold text-drystore-medium-gray uppercase tracking-wider">
                  Administração
                </h3>
              </div>
            )}
            
            {adminItems.map((item) => {
              const active = isActive(item.url, item.exact);
              return (
                <NavLink
                  key={item.title}
                  to={item.url}
                  end={item.exact}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    active 
                      ? "bg-drystore-orange text-white shadow-lg shadow-drystore-orange/20" 
                      : "text-drystore-medium-gray hover:bg-gray-50 hover:text-drystore-dark-gray"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <div className="ml-3 flex items-center justify-between w-full">
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* Status Footer */}
      <div className="p-6 border-t border-gray-100">
        <div className="flex items-center justify-between">
          {!collapsed ? (
            <>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-sm text-drystore-medium-gray">Sistema Online</span>
              </div>
            </>
          ) : (
            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
          )}
        </div>
      </div>
    </div>
  );
}