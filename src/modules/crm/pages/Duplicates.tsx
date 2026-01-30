import React, { useState } from 'react';
import { 
  useDuplicateStats, 
  useDuplicateGroups, 
  useCleanupDuplicates,
  useMarkAsDuplicate
} from '../hooks/useDuplicateOpportunities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Trash2, 
  Eye, 
  Play,
  Users,
  GitMerge,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const categoryLabels: Record<string, string> = {
  energia_solar: 'Energia Solar',
  telhas_shingle: 'Telhas Shingle',
  light_steel_frame: 'Light Steel Frame',
  ferramentas: 'Ferramentas',
  drywall: 'Drywall',
  outros: 'Outros',
  indefinido: 'Indefinido'
};

export default function Duplicates() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDuplicateStats();
  const { data: groups, isLoading: groupsLoading, refetch: refetchGroups } = useDuplicateGroups();
  const cleanupMutation = useCleanupDuplicates();
  const markDuplicateMutation = useMarkAsDuplicate();
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const handlePreview = async () => {
    const result = await cleanupMutation.mutateAsync('preview');
    setPreviewData(result);
  };

  const handleExecute = async () => {
    await cleanupMutation.mutateAsync('execute');
    setShowConfirmDialog(false);
    setPreviewData(null);
  };

  const handleRefresh = () => {
    refetchStats();
    refetchGroups();
  };

  const handleMarkDuplicate = (duplicateId: string, keepId: string) => {
    markDuplicateMutation.mutate({ duplicateId, keepId });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Duplicatas</h1>
          <p className="text-muted-foreground">
            Identifique e limpe oportunidades duplicadas no CRM
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Oportunidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_opportunities || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Grupos com Duplicatas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-destructive">
                  {stats?.duplicate_groups || 0}
                </div>
                {(stats?.duplicate_groups || 0) > 0 && (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Duplicatas a Remover
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-orange-500">
                {stats?.total_duplicates || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads Paralelos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-blue-500">
                  {stats?.parallel_leads || 0}
                </div>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Mesmo cliente, vendedores diferentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Limpeza Automática
          </CardTitle>
          <CardDescription>
            Identifica automaticamente duplicatas reais (mesmo telefone + mesmo vendedor + mesma categoria) 
            e mantém a oportunidade mais antiga.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handlePreview}
              disabled={cleanupMutation.isPending}
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar Duplicatas
            </Button>
            <Button 
              variant="destructive"
              onClick={() => setShowConfirmDialog(true)}
              disabled={cleanupMutation.isPending || !stats?.duplicate_groups}
            >
              <Play className="h-4 w-4 mr-2" />
              Executar Limpeza
            </Button>
          </div>

          {/* Preview Results */}
          {previewData && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Prévia da Limpeza:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Grupos de duplicatas encontrados: <strong>{previewData.total_duplicate_groups}</strong></li>
                <li>• Duplicatas a remover: <strong>{previewData.total_duplicates_to_remove}</strong></li>
              </ul>
              {previewData.preview?.slice(0, 5).map((group: any, idx: number) => (
                <div key={idx} className="mt-2 p-2 bg-background rounded text-xs">
                  <span className="font-mono">{group.customer_phone}</span>
                  <span className="text-muted-foreground ml-2">
                    {group.total_in_group} oportunidades → manter 1, remover {group.will_remove_count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Duplicate Groups List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Grupos de Duplicatas ({groups?.length || 0})
          </CardTitle>
          <CardDescription>
            Revise manualmente cada grupo e escolha qual oportunidade manter
          </CardDescription>
        </CardHeader>
        <CardContent>
          {groupsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : groups?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="text-lg font-medium">Nenhuma duplicata encontrada!</p>
              <p className="text-sm">Todas as oportunidades estão únicas.</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {groups?.map((group, idx) => (
                <AccordionItem 
                  key={`${group.customer_phone}-${group.vendor_id}-${idx}`} 
                  value={`item-${idx}`}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-4 text-left">
                      <div>
                        <p className="font-medium">{group.customer_name}</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {group.customer_phone}
                        </p>
                      </div>
                      <Badge variant="outline">{group.vendor_name}</Badge>
                      {group.product_category && (
                        <Badge variant="secondary">
                          {categoryLabels[group.product_category] || group.product_category}
                        </Badge>
                      )}
                      <Badge variant="destructive">
                        {group.opportunities.length} duplicatas
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {group.opportunities.map((opp, oppIdx) => (
                        <div 
                          key={opp.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            oppIdx === 0 ? 'bg-green-50 dark:bg-green-950/20 border border-green-200' : 'bg-muted'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{opp.title}</span>
                              {oppIdx === 0 && (
                                <Badge variant="default" className="bg-green-600">
                                  Manter
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground flex gap-4">
                              <span>
                                Criado: {format(new Date(opp.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </span>
                              <span>
                                Valor: R$ {opp.value?.toLocaleString('pt-BR') || '0'}
                              </span>
                              <span className="capitalize">
                                Estágio: {opp.stage?.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          {oppIdx > 0 && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleMarkDuplicate(opp.id, group.opportunities[0].id)}
                              disabled={markDuplicateMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remover
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Limpeza Automática</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá marcar {stats?.total_duplicates || 0} oportunidades duplicadas 
              como removidas. As oportunidades não serão excluídas permanentemente, 
              apenas marcadas com o campo <code>duplicate_of_id</code>.
              <br /><br />
              <strong>Esta ação pode ser revertida manualmente.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleExecute}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Executar Limpeza
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
