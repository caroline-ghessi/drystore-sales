import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MessageCircle, Bot, Users, UserCheck, BarChart3, Home } from 'lucide-react';
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

const whatsappItems = [
  { title: 'Conversas', url: '/whatsapp', icon: MessageCircle },
  { title: 'Bot', url: '/whatsapp/bot', icon: Bot },
  { title: 'Vendedores', url: '/whatsapp/vendedores', icon: Users },
  { title: 'Atendentes', url: '/whatsapp/atendentes', icon: UserCheck },
  { title: 'Analytics', url: '/whatsapp/analytics', icon: BarChart3 },
];

export function WhatsAppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === '/whatsapp') {
      return currentPath === '/whatsapp' || currentPath === '/whatsapp/';
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

        {/* WhatsApp Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>WhatsApp</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {whatsappItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/whatsapp'}
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