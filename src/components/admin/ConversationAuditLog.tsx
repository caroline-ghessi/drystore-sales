import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useConversationAccessLogs } from '@/hooks/useConversationAnalytics';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Shield, Eye, User, Clock } from 'lucide-react';

interface ConversationAuditLogProps {
  conversationId?: string;
}

export function ConversationAuditLog({ conversationId }: ConversationAuditLogProps) {
  const { data: accessLogs, isLoading, error } = useConversationAccessLogs(conversationId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Log de Acessos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="h-4 bg-muted rounded animate-pulse w-32" />
                <div className="h-4 bg-muted rounded animate-pulse w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !accessLogs || accessLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Log de Acessos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum acesso registrado</p>
            <p className="text-sm">
              {error ? 'Erro ao carregar logs ou sem permissão' : 'Dados protegidos por RLS funcionando corretamente'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAccessTypeColor = (accessType: string) => {
    switch (accessType) {
      case 'SELECT': return 'default';
      case 'UPDATE': return 'secondary';
      case 'INSERT': return 'secondary';
      case 'DELETE': return 'destructive';
      default: return 'outline';
    }
  };

  const getAccessTypeIcon = (accessType: string) => {
    switch (accessType) {
      case 'SELECT': return <Eye className="h-3 w-3" />;
      case 'UPDATE': return <User className="h-3 w-3" />;
      default: return <Shield className="h-3 w-3" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Log de Acessos ({accessLogs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accessLogs.map((log: any) => (
            <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Badge variant={getAccessTypeColor(log.access_type)} className="flex items-center gap-1">
                  {getAccessTypeIcon(log.access_type)}
                  {log.access_type}
                </Badge>
                <div>
                  <p className="font-medium text-sm">
                    {log.profiles?.display_name || 'Usuário'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.profiles?.email}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                </div>
                {log.ip_address && (
                  <p className="text-xs text-muted-foreground mt-1">
                    IP: {log.ip_address}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            🔒 Dados protegidos por Row Level Security (RLS)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}