import React, { useState } from 'react';
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
  ShoppingBag,
  Menu,
  X,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return currentPath === '/propostas' || currentPath === '/propostas/';
    }
    return currentPath.startsWith(path);
  };

  return (
    <div className={cn(
      "h-full bg-slate-900 text-white border-r border-slate-800 flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">DryStore</h1>
                <p className="text-xs text-slate-400">Sistema de Propostas</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Back to Home */}
        <NavLink
          to="/home"
          className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="ml-3">Voltar ao Home</span>}
        </NavLink>

        {/* Section Label */}
        {!collapsed && (
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active 
                  ? "bg-orange-500 text-white shadow-lg" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <div className="ml-3 flex items-center justify-between w-full">
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Upgrade Section */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800">
          <div className="p-3 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-lg border border-orange-500/20">
            <div className="flex items-center mb-2">
              <Crown className="h-4 w-4 text-orange-400 mr-2" />
              <span className="font-medium text-white">Upgrade Pro</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Acesse recursos avançados e aumente sua produtividade
            </p>
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs py-2 px-3 rounded-md transition-colors">
              Fazer Upgrade
            </button>
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          {!collapsed ? (
            <>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-xs text-slate-400">Sistema Online</span>
              </div>
            </>
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />
          )}
        </div>
      </div>
    </div>
  );
}