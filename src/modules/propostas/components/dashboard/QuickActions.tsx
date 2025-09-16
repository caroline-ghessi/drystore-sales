import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DryStoreButton } from '../ui/DryStoreButton';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  FileText,
  ClipboardList,
  CheckCircle,
  XCircle,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  DollarSign,
  Settings
} from 'lucide-react';

interface QuickAction {
  title: string;
  description?: string;
  icon: React.ElementType;
  onClick: () => void;
  color: 'orange' | 'blue' | 'green' | 'red' | 'purple' | 'gray';
  permission?: string;
}

export function QuickActions() {
  const { isAdmin, isVendor } = useUserPermissions();
  const navigate = useNavigate();

  const vendorActions: QuickAction[] = [
    {
      title: 'Nova Proposta',
      description: 'Criar proposta personalizada',
      icon: FileText,
      onClick: () => navigate('/propostas/nova'),
      color: 'orange'
    },
    {
      title: 'Em Andamento',
      description: 'Propostas abertas',
      icon: ClipboardList,
      onClick: () => navigate('/propostas/lista?status=aberta'),
      color: 'blue'
    },
    {
      title: 'Aceitas',
      description: 'Propostas aprovadas',
      icon: CheckCircle,
      onClick: () => navigate('/propostas/lista?status=aceita'),
      color: 'green'
    },
    {
      title: 'Recusadas',
      description: 'Análise de perdas',
      icon: XCircle,
      onClick: () => navigate('/propostas/lista?status=recusada'),
      color: 'red'
    },
    {
      title: 'Meu Relatório',
      description: 'Performance pessoal',
      icon: BarChart3,
      onClick: () => navigate('/propostas/relatorios/pessoal'),
      color: 'purple'
    }
  ];

  const adminActions: QuickAction[] = [
    {
      title: 'Nova Proposta',
      description: 'Criar proposta personalizada',
      icon: FileText,
      onClick: () => navigate('/propostas/nova'),
      color: 'orange'
    },
    {
      title: 'Gerenciar Equipe',
      description: 'Vendedores e metas',
      icon: Users,
      onClick: () => navigate('/propostas/administracao/vendedores'),
      color: 'blue'
    },
    {
      title: 'Relatório Geral',
      description: 'Visão consolidada',
      icon: TrendingUp,
      onClick: () => navigate('/propostas/relatorios/geral'),
      color: 'green'
    },
    {
      title: 'Configurar Metas',
      description: 'Definir objetivos',
      icon: Target,
      onClick: () => navigate('/propostas/administracao/metas'),
      color: 'orange'
    },
    {
      title: 'Analytics',
      description: 'Dados avançados',
      icon: BarChart3,
      onClick: () => navigate('/propostas/analytics'),
      color: 'purple'
    },
    {
      title: 'Comissões',
      description: 'Cálculo de pagamentos',
      icon: DollarSign,
      onClick: () => navigate('/propostas/administracao/comissoes'),
      color: 'green'
    },
    {
      title: 'Configurações',
      description: 'Sistema e permissões',
      icon: Settings,
      onClick: () => navigate('/propostas/administracao/configuracoes'),
      color: 'gray'
    }
  ];

  const actions = isAdmin ? adminActions : vendorActions;

  const getButtonVariant = (color: string) => {
    switch (color) {
      case 'orange':
        return 'drystore';
      default:
        return 'drystore-outline';
    }
  };

  const getButtonColorClass = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-600 text-white hover:bg-blue-700 border-0 shadow-lg shadow-blue-600/20';
      case 'green':
        return 'bg-emerald-600 text-white hover:bg-emerald-700 border-0 shadow-lg shadow-emerald-600/20';
      case 'red':
        return 'bg-red-600 text-white hover:bg-red-700 border-0 shadow-lg shadow-red-600/20';
      case 'purple':
        return 'bg-violet-600 text-white hover:bg-violet-700 border-0 shadow-lg shadow-violet-600/20';
      case 'gray':
        return 'bg-slate-600 text-white hover:bg-slate-700 border-0 shadow-lg shadow-slate-600/20';
      default:
        return '';
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl font-bold text-drystore-dark-gray flex items-center">
          <BarChart3 className="mr-3 h-6 w-6 text-drystore-orange" />
          Ações Rápidas
        </CardTitle>
        <CardDescription className="text-drystore-medium-gray text-base">
          {isAdmin 
            ? 'Acesse rapidamente as funcionalidades de administração'
            : 'Acesse rapidamente as funcionalidades mais utilizadas'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className={cn(
          "grid gap-4",
          isAdmin ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )}>
          {actions.map((action, index) => (
            <DryStoreButton
              key={index}
              variant={getButtonVariant(action.color)}
              className={cn(
                "h-32 flex-col p-6 text-center min-w-0 transition-all duration-300 hover:scale-[1.02] rounded-xl",
                action.color !== 'orange' && getButtonColorClass(action.color)
              )}
              onClick={action.onClick}
            >
              <action.icon className="h-10 w-10 mb-4 mx-auto flex-shrink-0" />
              <span className="text-sm font-semibold mb-2 leading-tight">{action.title}</span>
              {action.description && (
                <span className="text-xs opacity-90 leading-tight">{action.description}</span>
              )}
            </DryStoreButton>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}