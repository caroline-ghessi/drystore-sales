import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Plus, Filter, DollarSign, Calendar, TrendingUp, Zap } from 'lucide-react';

export default function Opportunities() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Oportunidades</h1>
          <p className="text-muted-foreground">
            Gerencie negócios em andamento e oportunidades futuras
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Oportunidades</SelectItem>
              <SelectItem value="hot">🔥 Quentes</SelectItem>
              <SelectItem value="warm">🟠 Mornas</SelectItem>
              <SelectItem value="cold">❄️ Frias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Oportunidade
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">R$ 1.2M</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+18%</span> vs. mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Oportunidades Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">67</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+5</span> novas hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa Fechamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">28.5%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+3.2%</span> vs. mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">R$ 28k</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+2.1k</span> vs. mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities by Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Oportunidades por Estágio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">Prospecção</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">23</div>
                  <div className="text-xs text-muted-foreground">R$ 345k</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium">Qualificação</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">18</div>
                  <div className="text-xs text-muted-foreground">R$ 287k</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="font-medium">Proposta</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">15</div>
                  <div className="text-xs text-muted-foreground">R$ 423k</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Negociação</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">11</div>
                  <div className="text-xs text-muted-foreground">R$ 198k</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Ações Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 border border-red-200 bg-red-50 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Follow-up Urgente</div>
                  <div className="text-xs text-muted-foreground">3 oportunidades sem contato há mais de 5 dias</div>
                </div>
                <Badge variant="destructive" className="text-xs">Crítico</Badge>
              </div>
              
              <div className="flex items-start gap-3 p-3 border border-orange-200 bg-orange-50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Propostas Vencendo</div>
                  <div className="text-xs text-muted-foreground">5 propostas vencem nos próximos 3 dias</div>
                </div>
                <Badge variant="outline" className="text-xs">Alta</Badge>
              </div>
              
              <div className="flex items-start gap-3 p-3 border border-blue-200 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="font-medium text-sm">Reuniões Agendadas</div>
                  <div className="text-xs text-muted-foreground">7 reuniões marcadas para hoje</div>
                </div>
                <Badge variant="outline" className="text-xs">Info</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Opportunities List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Lista de Oportunidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Gestão de Oportunidades em Desenvolvimento
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Em breve você terá acesso completo a:<br/>
              • Lista detalhada de todas as oportunidades<br/>
              • Filtros avançados por valor, estágio e probabilidade<br/>
              • Acompanhamento de ações e próximos passos<br/>
              • Histórico completo de interações<br/>
              • Relatórios de performance por vendedor
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Valor
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Fechamento
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Probabilidade
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}