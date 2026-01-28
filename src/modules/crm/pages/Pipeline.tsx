import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Filter, Search, Kanban, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { KanbanStats } from '../components/pipeline/KanbanStats';
import { PipelineKanban } from '../components/pipeline/PipelineKanban';

export default function Pipeline() {
  const [view, setView] = React.useState<'kanban' | 'list'>('kanban');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline de Vendas</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o progresso das suas oportunidades através do funil de vendas
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'list')}>
            <TabsList className="grid w-[160px] grid-cols-2">
              <TabsTrigger value="kanban" className="flex items-center gap-1">
                <Kanban className="h-4 w-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-1">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar oportunidades..." 
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Novo Deal
          </Button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <KanbanStats />

      {/* Pipeline Board */}
      {view === 'kanban' ? (
        <div className="bg-muted/30 rounded-lg p-4">
          <PipelineKanban />
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Visualização em lista em desenvolvimento</p>
        </div>
      )}
    </div>
  );
}
