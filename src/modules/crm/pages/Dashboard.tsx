import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, Filter, Plus, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  DashboardMetrics, 
  TopNegotiations, 
  PendingTasks, 
  MiniCalendar 
} from '../components/dashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  const lastUpdate = format(new Date(), 'HH:mm', { locale: ptBR });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Clock className="h-3.5 w-3.5" />
            Última atualização: {lastUpdate}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
          </Button>
          <Button 
            onClick={() => navigate('/crm/pipeline')}
            className="bg-primary hover:bg-primary/90 gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Novo Deal
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <DashboardMetrics />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Top Negotiations (60%) */}
        <div className="lg:col-span-3">
          <TopNegotiations />
        </div>

        {/* Right Column - Tasks and Calendar (40%) */}
        <div className="lg:col-span-2 space-y-6">
          <PendingTasks />
          <MiniCalendar />
        </div>
      </div>
    </div>
  );
}
