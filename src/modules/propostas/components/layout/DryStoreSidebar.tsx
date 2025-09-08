import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3,
  Building2,
  FileText, 
  Home,
  Layers, 
  Bell,
  Settings, 
  Crown,
  Trophy,
  Users,
  ShoppingBag
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { DryStoreBadge } from '../ui/DryStoreBadge';

const dryStoreItems = [
  { title: 'Dashboard', url: '/propostas', icon: BarChart3, exact: true },
  { title: 'Propostas', url: '/propostas/lista', icon: FileText },
  { title: 'Clientes', url: '/propostas/clientes', icon: Users },
  { title: 'Ranking', url: '/propostas/ranking', icon: Trophy },
  { title: 'Produtos', url: '/propostas/produtos', icon: ShoppingBag },
  { title: 'Notificações', url: '/propostas/notificacoes', icon: Bell, badge: '3' },
  { title: 'Administração', url: '/propostas/administracao', icon: Settings },
];

export function DryStoreSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return currentPath === '/propostas' || currentPath === '/propostas/';
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (itemUrl: string, exact: boolean = false) => {
    const active = isActive(itemUrl, exact);
    return active 
      ? 'bg-drystore-orange text-drystore-white font-medium shadow-sm' 
      : 'text-drystore-dark-gray hover:bg-drystore-orange/10 hover:text-drystore-orange';
  };

  return (
    <Sidebar className={`${collapsed ? 'w-16' : 'w-60'} border-r border-gray-200 bg-drystore-white`}>
      <SidebarTrigger className="m-2 self-end text-drystore-dark-gray" />
      
      <SidebarContent className="px-3">
        {/* Back to Home */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/home" className="text-drystore-medium-gray hover:bg-drystore-orange/10 hover:text-drystore-orange">
                  <Home className="mr-2 h-4 w-4" />
                  {!collapsed && <span>Voltar ao Home</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* DryStore Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-drystore-dark-gray font-semibold">
            Portal DryStore
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {dryStoreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.exact}
                      className={getNavCls(item.url, item.exact)}
                    >
                      <item.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                      {!collapsed && (
                        <div className="flex items-center justify-between w-full">
                          <span>{item.title}</span>
                          {item.badge && (
                            <DryStoreBadge variant="drystore" className="text-xs">
                              {item.badge}
                            </DryStoreBadge>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Upgrade Section */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="mt-8 p-4 bg-gradient-to-br from-drystore-orange/10 to-drystore-orange/5 rounded-lg border border-drystore-orange/20">
                <div className="flex items-center mb-2">
                  <Crown className="h-5 w-5 text-drystore-orange mr-2" />
                  <span className="font-semibold text-drystore-dark-gray">Upgrade Pro</span>
                </div>
                <p className="text-sm text-drystore-medium-gray mb-3">
                  Acesse recursos avançados e aumente sua produtividade
                </p>
                <button className="w-full bg-drystore-orange text-drystore-white text-sm py-2 px-4 rounded-md hover:bg-drystore-orange-hover transition-colors">
                  Fazer Upgrade
                </button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}