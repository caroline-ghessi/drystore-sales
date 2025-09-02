import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Download, Calendar, FileText, TrendingUp, Users } from 'lucide-react';

export default function Reports() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises detalhadas e insights sobre performance de vendas
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select defaultValue="30d">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="custom">Período personalizado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Quick Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <Button variant="ghost" size="sm">
                <FileText className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-foreground mb-2">Análise de Performance</h3>
            <p className="text-sm text-muted-foreground mb-4">
              KPIs de conversão, tempo de ciclo e eficiência de vendas
            </p>
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 mr-1" />
              Atualizado há 5 min
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <Button variant="ghost" size="sm">
                <FileText className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-foreground mb-2">Análise de Leads</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Origem, qualidade e distribuição de leads por fonte
            </p>
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 mr-1" />
              Atualizado há 10 min
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <Button variant="ghost" size="sm">
                <FileText className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-foreground mb-2">Funil de Vendas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Análise detalhada do pipeline e pontos de escape
            </p>
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 mr-1" />
              Atualizado em tempo real
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Relatórios Avançados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Relatórios Detalhados em Desenvolvimento
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Em breve você terá acesso a relatórios avançados com:<br/>
              • Dashboards interativos<br/>
              • Análises preditivas<br/>
              • Comparativos históricos<br/>
              • Exportação em múltiplos formatos
            </p>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Agendar Notificação
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}