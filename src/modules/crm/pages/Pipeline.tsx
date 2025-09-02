import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Filter, MoreVertical, TrendingUp } from 'lucide-react';

export default function Pipeline() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pipeline de Vendas</h1>
          <p className="text-muted-foreground">
            Acompanhe o progresso dos seus leads através do funil de vendas
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">R$ 847k</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+12%</span> vs. mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">24.5%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+2.1%</span> vs. mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tempo Médio Ciclo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">18 dias</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">+2 dias</span> vs. mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">89</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+5</span> novos hoje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Board */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Kanban do Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Pipeline em Desenvolvimento
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              O Kanban interativo do pipeline será implementado em breve.<br/>
              Inclirá drag & drop, filtros avançados e métricas em tempo real.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline">Prospecção</Badge>
              <Badge variant="outline">Qualificação</Badge>
              <Badge variant="outline">Proposta</Badge>
              <Badge variant="outline">Negociação</Badge>
              <Badge variant="outline">Fechamento</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}