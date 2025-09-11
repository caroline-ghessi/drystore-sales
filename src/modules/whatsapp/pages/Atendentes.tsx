import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AtendenteList } from '@/modules/whatsapp/components/atendentes/AtendenteList';
import { AddAtendenteDialog } from '@/modules/whatsapp/components/atendentes/AddAtendenteDialog';
import { useAtendentes, type Atendente } from '@/hooks/useAtendentes';
import { Users, UserPlus, TrendingUp, Clock, Star, ArrowLeft } from 'lucide-react';

export default function AtendentesPage() {
  const [selectedAtendente, setSelectedAtendente] = useState<Atendente | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('atendentes');
  const { atendentes, isLoading } = useAtendentes();

  const handleSelectAtendente = (atendente: Atendente) => {
    setSelectedAtendente(atendente);
    setActiveTab('detalhes');
  };

  const stats = {
    total: atendentes.length,
    active: atendentes.filter(a => a.is_active).length,
    avgResponseTime: 0, // TODO: Calcular quando tivermos dados
    avgQualityScore: 0, // TODO: Calcular quando tivermos dados
  };

  return (
    <div className="container mx-auto p-6 space-y-8 bg-background">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Atendentes</h1>
            <p className="text-muted-foreground text-base">
              Gerencie sua equipe de atendimento e acompanhe a performance
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="gap-2 shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          Convidar Atendente
        </Button>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">{stats.total}</div>
            <p className="text-sm text-muted-foreground">atendentes</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Ativos</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 mb-1">{stats.active}</div>
            <p className="text-sm text-muted-foreground">online agora</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Tempo Médio</CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">{stats.avgResponseTime}min</div>
            <p className="text-sm text-muted-foreground">resposta</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Qualidade</CardTitle>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">{stats.avgQualityScore}%</div>
            <p className="text-sm text-muted-foreground">média geral</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted rounded-lg p-1 h-11">
          <TabsTrigger value="atendentes" className="font-medium">Atendentes</TabsTrigger>
          {selectedAtendente && (
            <TabsTrigger value="detalhes" className="font-medium">
              Detalhes - {selectedAtendente.display_name}
            </TabsTrigger>
          )}
          <TabsTrigger value="performance" className="font-medium">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="atendentes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Atendentes</CardTitle>
              <CardDescription>
                Gerencie perfis, permissões e status da sua equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AtendenteList
                onSelectAtendente={handleSelectAtendente}
                selectedAtendente={selectedAtendente}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {selectedAtendente && (
          <TabsContent value="detalhes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Atendente</CardTitle>
                <CardDescription>
                  Informações detalhadas e histórico de {selectedAtendente.display_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informações Pessoais</h3>
                    <div className="space-y-2">
                      <p><strong>Nome:</strong> {selectedAtendente.display_name}</p>
                      <p><strong>Email:</strong> {selectedAtendente.email}</p>
                      <p><strong>Telefone:</strong> {selectedAtendente.phone || 'Não informado'}</p>
                      <p><strong>Departamento:</strong> {selectedAtendente.department || 'Não informado'}</p>
                      <p><strong>Cargo:</strong> {selectedAtendente.role}</p>
                      <p><strong>Status:</strong> {selectedAtendente.is_active ? 'Ativo' : 'Inativo'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Estatísticas</h3>
                    <div className="space-y-2">
                      <p><strong>Conversas Atendidas:</strong> {selectedAtendente.stats?.total_conversations || 0}</p>
                      <p><strong>Tempo Médio de Resposta:</strong> {selectedAtendente.stats?.avg_response_time || 0} min</p>
                      <p><strong>Score de Qualidade:</strong> {selectedAtendente.stats?.quality_score || 0}%</p>
                      <p><strong>Data de Cadastro:</strong> {new Date(selectedAtendente.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>

                {/* TODO: Adicionar gráficos de performance, histórico de conversas, etc. */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    📊 Métricas detalhadas e histórico de conversas serão implementadas quando 
                    o sistema de atribuição de conversas estiver configurado.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance da Equipe</CardTitle>
              <CardDescription>
                Análise geral de performance e produtividade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Dashboard em Desenvolvimento</h3>
                <p className="text-sm text-muted-foreground">
                  Relatórios de performance, gráficos de produtividade e métricas 
                  detalhadas serão implementados em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Atendente Dialog */}
      <AddAtendenteDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          // Refresh data
          window.location.reload();
        }}
      />
    </div>
  );
}