import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Filter, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

export default function Tasks() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tarefas e Follow-ups</h1>
          <p className="text-muted-foreground">
            Gerencie suas atividades e acompanhamentos de leads
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tarefas Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">23</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">5 atrasadas</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Para Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">8</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">2 concluídas</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Esta Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">34</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">15 concluídas</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">78%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">+5%</span> vs. semana anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Tarefas Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 border border-red-200 bg-red-50 rounded-lg">
                <Checkbox className="mt-1" />
                <div className="flex-1">
                  <div className="font-medium text-sm">Ligar para João Silva</div>
                  <div className="text-xs text-muted-foreground">Lead quente - interesse em energia solar</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="destructive" className="text-xs">Venceu ontem</Badge>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      15:00
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 border border-orange-200 bg-orange-50 rounded-lg">
                <Checkbox className="mt-1" />
                <div className="flex-1">
                  <div className="font-medium text-sm">Enviar proposta - Maria Santos</div>
                  <div className="text-xs text-muted-foreground">Projeto steel frame - R$ 85k</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">Hoje 16:00</Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                <Checkbox className="mt-1" />
                <div className="flex-1">
                  <div className="font-medium text-sm">Follow-up Carlos Lima</div>
                  <div className="text-xs text-muted-foreground">Aguardando decisão da proposta</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">Amanhã 10:00</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Concluídas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Checkbox checked className="mt-1" />
                <div className="flex-1">
                  <div className="font-medium text-sm line-through text-muted-foreground">
                    Reunião com Pedro Oliveira
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Apresentação do projeto - fechou negócio
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Concluída às 14:30
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Checkbox checked className="mt-1" />
                <div className="flex-1">
                  <div className="font-medium text-sm line-through text-muted-foreground">
                    Enviar orçamento telhas shingle
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ana Costa - projeto residencial
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Concluída às 11:15
                  </div>
                </div>
              </div>
              
              <div className="text-center py-4">
                <div className="text-sm text-muted-foreground">
                  🎉 Ótimo trabalho! 2 tarefas concluídas hoje
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Todas as Tarefas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Sistema de Tarefas em Desenvolvimento
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Em breve você terá um sistema completo de tarefas com:<br/>
              • Agenda integrada com leads e oportunidades<br/>
              • Lembretes automáticos e notificações<br/>
              • Templates de follow-up personalizáveis<br/>
              • Integração com WhatsApp e email<br/>
              • Relatórios de produtividade
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Lembretes
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Follow-ups
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Urgentes
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}