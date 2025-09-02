import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Layers, 
  Settings, 
  Home
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

const propostasItems = [
  { title: 'Lista de Propostas', url: '/propostas', icon: FileText },
  { title: 'Nova Proposta', url: '/propostas/nova', icon: Plus },
  { title: 'Templates', url: '/propostas/templates', icon: Layers },
  { title: 'Configurações', url: '/propostas/configuracoes', icon: Settings },
];

export function PropostasSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === '/propostas') {
      return currentPath === '/propostas' || currentPath === '/propostas/';
    }
    return currentPath === path;
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'hover:bg-sidebar-accent/50';

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-60'}>
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent>
        {/* Back to Home */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/home" className="hover:bg-sidebar-accent/50">
                  <Home className="mr-2 h-4 w-4" />
                  {!collapsed && <span>Voltar ao Home</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Propostas Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Propostas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {propostasItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/propostas'}
                      className={getNavCls}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}