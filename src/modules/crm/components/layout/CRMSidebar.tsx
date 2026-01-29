import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Kanban, 
  Lightbulb, 
  Calendar, 
  Users, 
  FileText, 
  Settings, 
  Home,
  Brain,
  ChevronRight,
  Bot
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
import { Badge } from '@/components/ui/badge';
import { AIStatusIndicator } from './AIStatusIndicator';
import { useOpportunitiesCount } from '../../hooks/useOpportunities';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { cn } from '@/lib/utils';

const mainMenuItems = [
  { title: 'Dashboard', url: '/crm', icon: LayoutDashboard, end: true },
  { title: 'Pipeline (Kanban)', url: '/crm/pipeline', icon: Kanban },
  { title: 'Insights IA', url: '/crm/leads-quentes', icon: Lightbulb, badge: true },
  { title: 'Agenda', url: '/crm/agenda', icon: Calendar },
  { title: 'Contatos', url: '/crm/customers', icon: Users },
];

const managementItems = [
  { title: 'Relatórios', url: '/crm/reports', icon: FileText },
  { title: 'Configurações', url: '/crm/settings', icon: Settings },
];

const adminItems = [
  { title: 'Agentes IA', url: '/crm/agentes', icon: Bot },
];

export function CRMSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { data: aiOpportunitiesCount } = useOpportunitiesCount();
  const { isAdmin } = useUserPermissions();
  const collapsed = state === "collapsed";

  const isActive = (path: string, end?: boolean) => {
    if (end) {
      return location.pathname === path || location.pathname === path + '/';
    }
    return location.pathname.startsWith(path);
  };

  const getNavCls = (active: boolean) =>
    cn(
      'transition-colors',
      active 
        ? 'bg-primary/10 text-primary font-medium' 
        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
    );

  return (
    <Sidebar className={cn(
      'border-r bg-background',
      collapsed ? 'w-14' : 'w-64'
    )}>
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent>
        {/* Logo / Brand */}
        <div className="px-3 py-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg text-foreground">NeuroCRM</span>
            )}
          </div>
        </div>

        {/* AI Status Indicator */}
        {!collapsed && (
          <AIStatusIndicator variant="sidebar" className="mb-4" />
        )}

        {/* Back to Home */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink 
                  to="/home" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Home className="h-4 w-4" />
                  {!collapsed && <span>Voltar ao Home</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Main Menu */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
              Menu Principal
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => {
                const active = isActive(item.url, item.end);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url}
                        end={item.end}
                        className={getNavCls(active)}
                      >
                        <item.icon className={cn(
                          'h-4 w-4 mr-2',
                          active ? 'text-primary' : 'text-muted-foreground'
                        )} />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.title}</span>
                            {item.badge && aiOpportunitiesCount && aiOpportunitiesCount > 0 && (
                              <Badge 
                                variant="default" 
                                className="h-5 min-w-[20px] px-1.5 text-xs bg-primary"
                              >
                                {aiOpportunitiesCount}
                              </Badge>
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management Section */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
              Gestão
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url}
                        className={getNavCls(active)}
                      >
                        <item.icon className={cn(
                          'h-4 w-4 mr-2',
                          active ? 'text-primary' : 'text-muted-foreground'
                        )} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Only for admins */}
        {isAdmin && (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                Administração
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url}
                          className={getNavCls(active)}
                        >
                          <item.icon className={cn(
                            'h-4 w-4 mr-2',
                            active ? 'text-primary' : 'text-muted-foreground'
                          )} />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
