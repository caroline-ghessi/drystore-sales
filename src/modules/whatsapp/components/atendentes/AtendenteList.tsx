import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAtendentes, type Atendente } from '@/hooks/useAtendentes';
import { UserActionsDropdown } from './UserActionsDropdown';
import { User, MessageCircle, Clock, Star, Shield, Users, UserCheck, Mail, Search, UserX, CheckCircle } from 'lucide-react';

interface AtendenteListProps {
  onSelectAtendente: (atendente: Atendente) => void;
  selectedAtendente: Atendente | null;
}

export function AtendenteList({ onSelectAtendente, selectedAtendente }: AtendenteListProps) {
  const { atendentes, isLoading, updateAtendente, updateRole, isUpdating } = useAtendentes();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const handleStatusChange = async (atendente: Atendente, isActive: boolean) => {
    setUpdatingId(atendente.id);
    try {
      await updateAtendente({
        id: atendente.id,
        updates: { is_active: isActive }
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (atendente: Atendente, role: 'admin' | 'supervisor' | 'atendente') => {
    setUpdatingId(atendente.id);
    try {
      await updateRole({
        userId: atendente.user_id,
        role
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtrar e organizar atendentes
  const filteredAtendentes = useMemo(() => {
    let filtered = atendentes;

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(atendente =>
        atendente.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        atendente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        atendente.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por status
    switch (activeTab) {
      case 'confirmed':
        filtered = filtered.filter(a => a.invite_status === 'confirmed');
        break;
      case 'pending':
        filtered = filtered.filter(a => a.invite_status === 'pending');
        break;
      case 'inactive':
        filtered = filtered.filter(a => !a.is_active);
        break;
      default:
        break;
    }

    return filtered;
  }, [atendentes, searchTerm, activeTab]);

  // Contar por status
  const statusCounts = useMemo(() => {
    return {
      all: atendentes.length,
      confirmed: atendentes.filter(a => a.invite_status === 'confirmed').length,
      pending: atendentes.filter(a => a.invite_status === 'pending').length,
      inactive: atendentes.filter(a => !a.is_active).length,
    };
  }, [atendentes]);

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'supervisor':
        return <Users className="h-4 w-4" />;
      case 'atendente':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'destructive' as const;
      case 'supervisor':
        return 'default' as const;
      case 'atendente':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const getInviteStatusBadge = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="gap-1"><UserCheck className="h-3 w-3" />Confirmado</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Mail className="h-3 w-3" />Pendente</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><User className="h-3 w-3" />Ativo</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!atendentes.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum atendente encontrado</h3>
          <p className="text-sm text-muted-foreground text-center">
            Adicione novos atendentes para começar a gerenciar sua equipe.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, email ou departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Todos ({statusCounts.all})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Confirmados ({statusCounts.confirmed})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Pendentes ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Inativos ({statusCounts.inactive})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4">
        {filteredAtendentes.map((atendente) => (
        <Card 
          key={atendente.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedAtendente?.id === atendente.id ? 'ring-2 ring-primary shadow-md' : ''
          }`}
          onClick={() => onSelectAtendente(atendente)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={atendente.avatar_url} />
                  <AvatarFallback>
                    {atendente.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{atendente.display_name}</h3>
                  <p className="text-sm text-muted-foreground">{atendente.email}</p>
                  {atendente.department && (
                    <p className="text-xs text-muted-foreground">{atendente.department}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={getRoleBadgeVariant(atendente.role)} className="gap-1">
                  {getRoleIcon(atendente.role)}
                  {atendente.role?.charAt(0).toUpperCase() + atendente.role?.slice(1)}
                </Badge>
                {getInviteStatusBadge(atendente.invite_status)}
                <UserActionsDropdown 
                  atendente={atendente}
                  isLoading={updatingId === atendente.id}
                  onAction={() => setUpdatingId(null)}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">{atendente.stats?.total_conversations || 0}</p>
                  <p className="text-xs text-muted-foreground">Conversas</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">{atendente.stats?.avg_response_time || 0}min</p>
                  <p className="text-xs text-muted-foreground">Tempo Médio</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">{atendente.stats?.quality_score || 0}%</p>
                  <p className="text-xs text-muted-foreground">Qualidade</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={atendente.is_active}
                    onCheckedChange={(checked) => handleStatusChange(atendente, checked)}
                    disabled={updatingId === atendente.id}
                  />
                  <span className="text-sm">Ativo</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Select
                  value={atendente.role}
                  onValueChange={(role: 'admin' | 'supervisor' | 'atendente') => 
                    handleRoleChange(atendente, role)
                  }
                  disabled={updatingId === atendente.id}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atendente">Atendente</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        ))}
      </div>
      
      {filteredAtendentes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || activeTab !== 'all' 
                ? 'Nenhum resultado encontrado' 
                : 'Nenhum atendente encontrado'
              }
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              {searchTerm || activeTab !== 'all'
                ? 'Tente ajustar os filtros ou termo de busca.'
                : 'Adicione novos atendentes para começar a gerenciar sua equipe.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}