import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Bot, MessageSquare, ArrowRightLeft, Target, Zap, Tag } from 'lucide-react';
import { useBotAnalytics } from '@/modules/whatsapp/hooks/useBotAnalytics';

interface BotMetricsProps {
  period: string;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--lead-hot))',
  'hsl(var(--lead-warm))',
  'hsl(var(--lead-cold))',
  'hsl(var(--muted-foreground))'
];

export function BotMetrics({ period }: BotMetricsProps) {
  const { data, isLoading } = useBotAnalytics(period);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border">
            <CardHeader>
              <div className="h-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversas Atendidas
            </CardTitle>
            <Bot className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.totalConversations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.activeConversations} ativas agora
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mensagens do Bot
            </CardTitle>
            <MessageSquare className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.totalBotMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ~{Math.round(data.totalBotMessages / Math.max(data.totalConversations, 1))} msgs/conversa
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Handoff
            </CardTitle>
            <ArrowRightLeft className="w-4 h-4 text-lead-warm" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.handoffRate}%</div>
            <p className="text-xs text-muted-foreground">
              Transferidas para vendedor
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Classificação
            </CardTitle>
            <Target className="w-4 h-4 text-lead-hot" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data.classificationAccuracy}%</div>
            <p className="text-xs text-muted-foreground">
              Conversas classificadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversas por Dia */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Atividade do Bot</CardTitle>
            <CardDescription>
              Conversas e mensagens do bot por dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.dailyMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="conversations" 
                  fill="hsl(var(--primary))" 
                  name="Conversas"
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey="handoffs" 
                  fill="hsl(var(--lead-warm))" 
                  name="Handoffs"
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Categoria */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Conversas por Categoria</CardTitle>
            <CardDescription>
              Distribuição por tipo de produto/interesse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.conversationsByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                  nameKey="category"
                  label={({ category, percentage }) => `${category}: ${percentage}%`}
                >
                  {data.conversationsByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Status */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Status das Conversas</CardTitle>
            <CardDescription>
              Distribuição por estado atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.conversationsByStatus.map((item, index) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-sm text-foreground">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{item.count}</span>
                    <Badge variant="secondary" className="text-xs">
                      {((item.count / data.totalConversations) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Tipo de Agente */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-foreground">Tipos de Agente IA</CardTitle>
              <CardDescription>
                Mensagens por tipo de agente especializado
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.agentTypeDistribution.map((item, index) => (
                <div key={item.agentType} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{item.agentType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{item.count.toLocaleString()}</span>
                    <Badge variant="secondary" className="text-xs">
                      {((item.count / data.totalBotMessages) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="border-border bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Resumo do Bot</p>
                <p className="text-lg font-semibold text-foreground">
                  {data.totalBotMessages.toLocaleString()} mensagens em {data.totalConversations.toLocaleString()} conversas
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">&lt;1s</p>
                <p className="text-xs text-muted-foreground">Tempo resposta</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-lead-hot">{data.handoffRate}%</p>
                <p className="text-xs text-muted-foreground">Taxa handoff</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{data.classificationAccuracy}%</p>
                <p className="text-xs text-muted-foreground">Classificação</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
