import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  FileText, 
  CheckSquare, 
  Settings, 
  Home,
  PieChart
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

const crmItems = [
  { title: 'Dashboard', url: '/crm', icon: BarChart3 },
  { title: 'Leads Quentes', url: '/crm/leads-quentes', icon: TrendingUp },
  { title: 'Pipeline', url: '/crm/pipeline', icon: Target },
  { title: 'Clientes', url: '/crm/customers', icon: Users },
  { title: 'Oportunidades', url: '/crm/opportunities', icon: PieChart },
  { title: 'Relatórios', url: '/crm/reports', icon: FileText },
  { title: 'Tarefas', url: '/crm/tasks', icon: CheckSquare },
  { title: 'Configurações', url: '/crm/settings', icon: Settings },
];

export function CRMSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === '/crm') {
      return currentPath === '/crm' || currentPath === '/crm/';
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

        {/* CRM Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>CRM</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {crmItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/crm'}
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