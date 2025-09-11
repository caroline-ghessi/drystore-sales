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
    <div className={`bg-slate-900 border-r border-slate-800 flex flex-col h-full transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-60'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm">Drystore</h2>
                <p className="text-slate-400 text-xs">Sistema de Atendimento</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* WHATSAPP Section */}
        <div className="mb-6">
          {!collapsed && (
            <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wide px-4 mb-2">
              WHATSAPP
            </h3>
          )}
          <nav className="space-y-1">
            {/* Voltar ao Home - Always at top of WhatsApp section */}
            <NavLink
              to="/home"
              className="flex items-center px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group"
            >
              <Home className="w-4 h-4 mr-3 flex-shrink-0" />
              {!collapsed && <span className="text-sm">Voltar ao Home</span>}
            </NavLink>
            
            {whatsappItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                end={item.exact}
                className={({ isActive: navIsActive }) =>
                  `flex items-center px-4 py-2 transition-colors group ${
                    navIsActive || isActive(item.url, item.exact)
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.title}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* ATENDIMENTO Section */}
        <div className="mb-6">
          {!collapsed && (
            <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wide px-4 mb-2">
              ATENDIMENTO
            </h3>
          )}
          <nav className="space-y-1">
            {atendimentoItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive: navIsActive }) =>
                  `flex items-center px-4 py-2 transition-colors group ${
                    navIsActive || isActive(item.url)
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.title}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* SISTEMA Section */}
        <div className="mb-6">
          {!collapsed && (
            <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wide px-4 mb-2">
              SISTEMA
            </h3>
          )}
          <nav className="space-y-1">
            {sistemaItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive: navIsActive }) =>
                  `flex items-center px-4 py-2 transition-colors group ${
                    navIsActive || isActive(item.url)
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.title}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Status Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            {!collapsed && (
              <div>
                <p className="text-slate-400 text-xs">Sistema Online</p>
                <p className="text-slate-500 text-xs">Última sync: agora</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="flex space-x-1">
              <div className="w-1 h-4 bg-green-500 rounded-full"></div>
              <div className="w-1 h-4 bg-green-500 rounded-full"></div>
              <div className="w-1 h-4 bg-yellow-500 rounded-full"></div>
              <div className="w-1 h-4 bg-slate-600 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}