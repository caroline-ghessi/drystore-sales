import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MessageCircle, Bot, Users, UserCheck, BarChart3, Home, Flame, ChevronLeft, ChevronRight, Activity, Settings, FileText } from 'lucide-react';

const whatsappItems = [
  { title: 'Dashboard WhatsApp', url: '/whatsapp', icon: BarChart3, exact: true },
  { title: 'Conversas', url: '/whatsapp/conversations', icon: MessageCircle },
  { title: 'Bot Inteligente', url: '/whatsapp/bot', icon: Bot },
  { title: 'Vendedores', url: '/whatsapp/vendedores', icon: Users },
];

const atendimentoItems = [
  { title: 'Leads Quentes', url: '/whatsapp/leads-quentes', icon: Flame },
  { title: 'Analytics', url: '/whatsapp/analytics', icon: BarChart3 },
  { title: 'Atendentes', url: '/whatsapp/atendentes', icon: UserCheck },
];

const sistemaItems = [
  { title: 'Templates', url: '/whatsapp/templates', icon: FileText },
  { title: 'Configurações', url: '/whatsapp/settings', icon: Settings },
  { title: 'Logs', url: '/whatsapp/logs', icon: Activity },
];

export function WhatsAppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return currentPath === path || currentPath === path + '/';
    }
    return currentPath.startsWith(path);
  };

  return (
    <div className={`bg-background border-r border-border flex flex-col h-full transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-drystore-orange to-drystore-orange/80 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <div>
                <h2 className="text-foreground font-semibold text-base">Drystore</h2>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">WhatsApp Business</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6">
        {/* WHATSAPP Section */}
        <div className="mb-8">
          {!collapsed && (
            <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider px-6 mb-4">
              WHATSAPP
            </h3>
          )}
          <nav className="space-y-2 px-3">
            {/* Voltar ao Home - Always at top of WhatsApp section */}
            <NavLink
              to="/home"
              className="flex items-center px-3 py-3 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-all group"
            >
              <Home className="w-5 h-5 mr-3 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">Voltar ao Home</span>}
            </NavLink>
            
            {whatsappItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                end={item.exact}
                className={({ isActive: navIsActive }) =>
                  `flex items-center px-3 py-3 rounded-lg transition-all group ${
                    navIsActive || isActive(item.url, item.exact)
                      ? 'bg-drystore-orange text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* ATENDIMENTO Section */}
        <div className="mb-8">
          {!collapsed && (
            <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider px-6 mb-4">
              ATENDIMENTO
            </h3>
          )}
          <nav className="space-y-2 px-3">
            {atendimentoItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive: navIsActive }) =>
                  `flex items-center px-3 py-3 rounded-lg transition-all group ${
                    navIsActive || isActive(item.url)
                      ? 'bg-drystore-orange text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* SISTEMA Section */}
        <div className="mb-8">
          {!collapsed && (
            <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider px-6 mb-4">
              SISTEMA
            </h3>
          )}
          <nav className="space-y-2 px-3">
            {sistemaItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive: navIsActive }) =>
                  `flex items-center px-3 py-3 rounded-lg transition-all group ${
                    navIsActive || isActive(item.url)
                      ? 'bg-drystore-orange text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Status Footer */}
      <div className="p-6 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-sm"></div>
            {!collapsed && (
              <div>
                <p className="text-foreground text-xs font-medium">Sistema Online</p>
                <p className="text-muted-foreground text-xs">Última sync: agora</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="flex space-x-1">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
              <div className="w-1.5 h-4 bg-yellow-500 rounded-full"></div>
              <div className="w-1.5 h-4 bg-muted rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}