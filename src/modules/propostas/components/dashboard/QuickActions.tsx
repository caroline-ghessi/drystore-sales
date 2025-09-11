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
      title: 'Gerenciar Equipe',
      description: 'Vendedores e metas',
      icon: Users,
      onClick: () => navigate('/propostas/administracao/equipe'),
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
        return 'border-blue-200 text-blue-700 hover:bg-blue-50';
      case 'green':
        return 'border-green-200 text-green-700 hover:bg-green-50';
      case 'red':
        return 'border-red-200 text-red-700 hover:bg-red-50';
      case 'purple':
        return 'border-purple-200 text-purple-700 hover:bg-purple-50';
      case 'gray':
        return 'border-gray-200 text-gray-700 hover:bg-gray-50';
      default:
        return '';
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-foreground flex items-center">
          <BarChart3 className="mr-2 h-5 w-5 text-drystore-orange" />
          Ações Rápidas
        </CardTitle>
        <CardDescription>
          {isAdmin 
            ? 'Acesse rapidamente as funcionalidades de administração'
            : 'Acesse rapidamente as funcionalidades mais utilizadas'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className={cn(
          "grid gap-4",
          isAdmin ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6" : "grid-cols-2 md:grid-cols-5"
        )}>
          {actions.map((action, index) => (
            <DryStoreButton
              key={index}
              variant={getButtonVariant(action.color)}
              className={cn(
                "h-20 flex-col p-4 text-center",
                action.color !== 'orange' && getButtonColorClass(action.color)
              )}
              onClick={action.onClick}
            >
              <action.icon className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">{action.title}</span>
              {action.description && (
                <span className="text-xs opacity-70 mt-1">{action.description}</span>
              )}
            </DryStoreButton>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}