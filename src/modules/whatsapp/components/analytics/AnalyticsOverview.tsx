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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  MessageCircle, 
  Users, 
  Target,
  Bot,
  ArrowRightLeft,
  Clock,
  Star
} from 'lucide-react';
import { useConversationAnalytics } from '@/hooks/useConversationAnalytics';
import { useVendorPerformance } from '@/modules/whatsapp/hooks/useVendorPerformance';
import { useLeadAnalytics } from '@/hooks/useLeadAnalytics';
import { useBotAnalytics } from '@/modules/whatsapp/hooks/useBotAnalytics';

interface AnalyticsOverviewProps {
  period: string;
}

const COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  hot: 'hsl(var(--lead-hot))',
  warm: 'hsl(var(--lead-warm))',
  cold: 'hsl(var(--lead-cold))'
};

export function AnalyticsOverview({ period }: AnalyticsOverviewProps) {
  const { data: conversationData, isLoading: conversationLoading } = useConversationAnalytics(period);
  const { data: vendorData, isLoading: vendorLoading } = useVendorPerformance(period);
  const { data: leadData, isLoading: leadLoading } = useLeadAnalytics(period);
  const { data: botData, isLoading: botLoading } = useBotAnalytics(period);

  if (conversationLoading || vendorLoading || leadLoading || botLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border">
            <CardHeader>
              <div className="h-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const temperatureData = leadData?.temperatureDistribution.map(item => ({
    name: item.temperature === 'hot' ? 'Quente' : item.temperature === 'warm' ? 'Morno' : 'Frio',
    value: item.count,
    color: item.temperature === 'hot' ? COLORS.hot : 
           item.temperature === 'warm' ? COLORS.warm : COLORS.cold
  })) || [];

  return (
    <div className="space-y-6">
      {/* Comparison Cards: Bot vs Vendedores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bot Performance Card */}
        <Card className="border-border bg-primary/5">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-foreground">Atendimento Bot (IA)</CardTitle>
              <CardDescription>WhatsApp da empresa - Atendimento automatizado</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Conversas</p>
                <p className="text-2xl font-bold text-foreground">
                  {botData?.totalConversations.toLocaleString() || 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Mensagens Bot</p>
                <p className="text-2xl font-bold text-foreground">
                  {botData?.totalBotMessages.toLocaleString() || 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tempo Resposta</p>
                <p className="text-2xl font-bold text-primary">&lt;1s</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Taxa Handoff</p>
                <p className="text-2xl font-bold text-lead-warm">{botData?.handoffRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Performance Card */}
        <Card className="border-border bg-lead-warm/5">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className="p-2 bg-lead-warm/10 rounded-lg">
              <Users className="w-6 h-6 text-lead-warm" />
            </div>
            <div>
              <CardTitle className="text-foreground">Atendimento Vendedores</CardTitle>
              <CardDescription>WhatsApps individuais - Atendimento humano</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Conversas</p>
                <p className="text-2xl font-bold text-foreground">
                  {vendorData?.vendors.reduce((sum, v) => sum + v.totalConversations, 0) || 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Vendedores Ativos</p>
                <p className="text-2xl font-bold text-foreground">
                  {vendorData?.totalVendors || 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tempo Resposta</p>
                <p className="text-2xl font-bold text-lead-warm">{vendorData?.avgResponseTime || 0}min</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Score Qualidade</p>
                <p className="text-2xl font-bold text-primary">{vendorData?.avgQualityScore || 0}/10</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Conversas (Todos)
            </CardTitle>
            <MessageCircle className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {conversationData?.totalConversations || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads Quentes
            </CardTitle>
            <Target className="w-4 h-4 text-lead-hot" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-lead-hot">
              {leadData?.hotLeads || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa Conversão
            </CardTitle>
            <ArrowRightLeft className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {leadData?.overallConversionRate || 0}%
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bot Ativas Agora
            </CardTitle>
            <Bot className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {botData?.activeConversations || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversas Diárias */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Conversas Diárias</CardTitle>
            <CardDescription>
              Evolução do número de conversas ao longo do período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversationData?.dailyConversations || []}>
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
                <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Leads */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Distribuição de Leads</CardTitle>
            <CardDescription>
              Proporção de leads por temperatura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={temperatureData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {temperatureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Timeline */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Tempo de Resposta</CardTitle>
          <CardDescription>
            Evolução do tempo médio de resposta dos vendedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={vendorData?.performanceComparison || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="period" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value.toFixed(1)}min`, 'Tempo de Resposta']}
              />
              <Line 
                type="monotone" 
                dataKey="responseTime" 
                stroke={COLORS.primary}
                strokeWidth={2}
                dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Top Performers</CardTitle>
          <CardDescription>
            Vendedores com melhor performance no período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vendorData?.topPerformers.slice(0, 5).map((vendor, index) => (
              <div key={vendor.vendorId} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium text-foreground">{vendor.vendorName}</p>
                    <p className="text-sm text-muted-foreground">
                      {vendor.totalConversations} conversas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    {vendor.qualityScore}/10
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {vendor.avgResponseTime}min
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}