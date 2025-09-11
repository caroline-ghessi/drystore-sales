import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Layers, 
  Settings, 
  Home,
  ChevronLeft,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const propostasItems: MenuItem[] = [
  { title: 'Lista de Propostas', url: '/propostas/lista', icon: FileText },
  { title: 'Nova Proposta', url: '/propostas/nova', icon: Plus },
  { title: 'Templates', url: '/propostas/templates', icon: Layers },
  { title: 'Configurações', url: '/propostas/configuracoes', icon: Settings },
];

export function PropostasSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/propostas') {
      return currentPath === '/propostas' || currentPath === '/propostas/';
    }
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  return (
    <div 
      className={cn(
        'h-screen bg-slate-900 border-r border-slate-800 text-white transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-72'
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-orange-500">Dry</span>
              <span className="text-slate-400">Store</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">Sistema de Propostas</p>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <ChevronLeft className={cn(
            'h-4 w-4 transition-transform',
            collapsed && 'rotate-180'
          )} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Back to Home */}
        <div>
          <div className="space-y-1">
            <NavLink
              to="/home"
              className={({ isActive: linkActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group',
                  linkActive || isActive('/home')
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                )
              }
            >
              <Home className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <span className="font-medium">Voltar ao Home</span>
              )}
            </NavLink>
          </div>
        </div>

        {/* Propostas Section */}
        <div>
          {!collapsed && (
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              PROPOSTAS
            </h3>
          )}
          
          <div className="space-y-1">
            {propostasItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.exact}
                className={({ isActive: linkActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group',
                    linkActive || isActive(item.url)
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium">{item.title}</span>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-slate-800">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-slate-400">Sistema Online</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
}