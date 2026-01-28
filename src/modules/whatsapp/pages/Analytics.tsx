import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Clock, 
  Target,
  Download,
  Flame,
  Bot,
  ArrowLeft
} from 'lucide-react';
import { AnalyticsOverview } from '@/modules/whatsapp/components/analytics/AnalyticsOverview';
import { ConversationMetrics } from '@/modules/whatsapp/components/analytics/ConversationMetrics';
import { VendorPerformance } from '@/modules/whatsapp/components/analytics/VendorPerformance';
import { LeadAnalytics } from '@/modules/whatsapp/components/analytics/LeadAnalytics';
import { QualityMetrics } from '@/modules/whatsapp/components/analytics/QualityMetrics';
import { BotMetrics } from '@/modules/whatsapp/components/analytics/BotMetrics';

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: 'custom', label: 'Período personalizado' }
];

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedTab, setSelectedTab] = useState('overview');

  return (
    <div className="p-6 space-y-8 bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Analytics WhatsApp</h1>
            <p className="text-muted-foreground text-base">
              Monitoramento de KPIs e métricas de performance do atendimento
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" className="shadow-none">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Total de Conversas
            </CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">1,247</div>
            <p className="text-sm text-muted-foreground">
              <span className="text-drystore-orange font-medium">+12%</span> vs. período anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Leads Quentes
            </CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Flame className="w-5 h-5 text-drystore-orange" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-drystore-orange mb-1">89</div>
            <p className="text-sm text-muted-foreground">
              <span className="text-drystore-orange font-medium">+8%</span> vs. período anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Tempo Médio Resposta
            </CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">2.3m</div>
            <p className="text-sm text-muted-foreground">
              <span className="text-red-600 font-medium">+15s</span> vs. período anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">7.2%</div>
            <p className="text-sm text-muted-foreground">
              <span className="text-drystore-orange font-medium">+0.5%</span> vs. período anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 h-12 bg-muted rounded-lg p-1">
          <TabsTrigger value="overview" className="font-medium">Visão Geral</TabsTrigger>
          <TabsTrigger value="bot" className="font-medium flex items-center gap-1">
            <Bot className="w-4 h-4" />
            Bot
          </TabsTrigger>
          <TabsTrigger value="vendors" className="font-medium">Vendedores</TabsTrigger>
          <TabsTrigger value="conversations" className="font-medium">Conversas</TabsTrigger>
          <TabsTrigger value="leads" className="font-medium">Leads</TabsTrigger>
          <TabsTrigger value="quality" className="font-medium">Qualidade</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AnalyticsOverview period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="bot" className="space-y-6">
          <BotMetrics period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <VendorPerformance period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          <ConversationMetrics period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <LeadAnalytics period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <QualityMetrics period={selectedPeriod} />
        </TabsContent>
      </Tabs>
    </div>
  );
}