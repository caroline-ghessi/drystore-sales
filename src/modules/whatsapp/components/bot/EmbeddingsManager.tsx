import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCategory } from '@/types/bot.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { File, Trash2, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EmbeddingsManagerProps {
  selectedCategory: string;
}

export function EmbeddingsManager({ selectedCategory }: EmbeddingsManagerProps) {
  const queryClient = useQueryClient();

  // Fetch all knowledge files
  const { data: files, isLoading } = useQuery({
    queryKey: ['all-knowledge-files'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_knowledge_files')
        .select(`
          *,
          chunks_count:knowledge_chunks(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(file => ({
        ...file,
        chunks_count: file.chunks_count?.[0]?.count || 0
      })) || [];
    },
    refetchInterval: 5000 // Auto-refresh every 5 seconds
  });

  // Filter files by category if needed
  const filteredFiles = selectedCategory === 'all' 
    ? files 
    : files?.filter(f => f.agent_category === selectedCategory);

  // Reprocess file mutation
  const reprocessMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const { error } = await supabase.functions.invoke('process-knowledge-file', {
        body: { fileId }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-knowledge-files'] });
      toast({
        title: "Reprocessamento Iniciado",
        description: "O arquivo está sendo reprocessado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Reprocessar",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (file: any) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('agent-knowledge')
        .remove([file.storage_path]);

      if (storageError) console.warn('Storage deletion error:', storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from('agent_knowledge_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-knowledge-files'] });
      toast({
        title: "Arquivo Removido",
        description: "O arquivo foi removido da base de conhecimento.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Remover",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getAccurateStatus = (file: any) => {
    const hasChunks = file.chunks_count > 0;
    const metadata = file.metadata as Record<string, any> | null;
    const failedChunks = metadata?.failed_chunks || 0;
    const status = file.processing_status;
    
    // Se tem chunks que falharam ou status error
    if (status === 'error' || failedChunks > 0) {
      return 'error';
    }
    
    // Se diz que tem embeddings mas não tem chunks
    if (status === 'completed_with_embeddings' && !hasChunks) {
      return 'error_no_chunks';
    }
    
    // Se tem chunks e embeddings
    if (status === 'completed_with_embeddings' && hasChunks) {
      return 'processed';
    }
    
    // Se processou mas ainda não tem embeddings
    if (status === 'completed') {
      return 'processed_no_embeddings';
    }
    
    // Se está processando
    if (status === 'processing') {
      return 'processing';
    }
    
    // Não processado
    return 'not_processed';
  };

  const getStatusBadge = (file: any) => {
    const status = getAccurateStatus(file);
    
    switch (status) {
      case 'processed':
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="w-3 h-3" />
            Processado
          </Badge>
        );
      case 'processed_no_embeddings':
        return (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle className="w-3 h-3" />
            Sem Embeddings
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="gap-1 bg-blue-600 text-white">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Processando
          </Badge>
        );
      case 'error':
      case 'error_no_chunks':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Erro
          </Badge>
        );
      case 'not_processed':
        return (
          <Badge variant="outline" className="gap-1 text-gray-500">
            <Clock className="w-3 h-3" />
            Não Processado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            Pendente
          </Badge>
        );
    }
  };

  const getCategoryEmoji = (category: string) => {
    const map: Record<string, string> = {
      'energia_solar': '☀️',
      'telhas_shingle': '🏠',
      'steel_frame': '🏗️',
      'ferramentas': '🔧',
      'geral': '📋'
    };
    return map[category] || '📄';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!filteredFiles || filteredFiles.length === 0) {
    return (
      <div className="p-8 rounded-lg bg-muted/30 border-2 border-dashed text-center">
        <File className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Nenhum arquivo processado ainda. Faça upload de arquivos na aba "Arquivos".
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Arquivos Processados ({filteredFiles.length})</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="w-3 h-3" />
            Atualiza a cada 5s
          </div>
        </div>

        <div className="space-y-3">
          {filteredFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 border rounded bg-card">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <span className="text-xs">{getCategoryEmoji(file.agent_category)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.file_size)} • {file.chunks_count} chunks
                    {file.processed_at && (
                      <> • {formatDistanceToNow(new Date(file.processed_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}</>
                    )}
                  </p>
                  
                  {/* Integridade dos chunks */}
                  {file.chunks_count > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {file.chunks_count} chunk(s) processado(s) com sucesso
                    </p>
                  )}
                  
                  {/* Failed chunks warning */}
                  {file.metadata && typeof file.metadata === 'object' && (file.metadata as any).failed_chunks > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ {(file.metadata as any).failed_chunks} chunk(s) falharam no processamento
                    </p>
                  )}
                  
                  {/* Error message */}
                  {file.metadata && typeof file.metadata === 'object' && 'error' in file.metadata && (
                    <p className="text-xs text-destructive mt-1">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      {String((file.metadata as any).error)}
                    </p>
                  )}
                  
                  {/* No chunks warning */}
                  {file.processing_status === 'completed_with_embeddings' && file.chunks_count === 0 && (
                    <p className="text-xs text-destructive mt-1">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      Status indica embeddings, mas nenhum chunk foi criado
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {getStatusBadge(file)}
                
                {/* Botão Reprocessar - agora visível para TODOS os arquivos */}
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => reprocessMutation.mutate(file.id)}
                  disabled={reprocessMutation.isPending || file.processing_status === 'processing'}
                  title="Reprocessar arquivo"
                >
                  <RefreshCw className={`w-3 h-3 ${reprocessMutation.isPending ? 'animate-spin' : ''}`} />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" disabled={deleteMutation.isPending}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover Arquivo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja remover "{file.file_name}"? 
                        Esta ação não pode ser desfeita e todos os embeddings serão excluídos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(file)}>
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
