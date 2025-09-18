import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ProductCategory = 
  | 'telha_shingle'
  | 'energia_solar' 
  | 'steel_frame'
  | 'drywall_divisorias'
  | 'ferramentas'
  | 'pisos'
  | 'acabamentos'
  | 'forros'
  | 'saudacao'
  | 'institucional'
  | 'indefinido'
  | 'impermeabilizacao_mapei'
  | 'preparacao_piso_mapei';

export interface TemplateAsset {
  id: string;
  file_path: string;
  file_name: string;
  template_category: ProductCategory;
  asset_type: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadAssetData {
  file: File;
  template_category: ProductCategory;
  asset_type: string;
  description?: string;
  display_order?: number;
}

export const useTemplateAssets = (category?: ProductCategory, assetType?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar assets
  const { data: assets, isLoading, error } = useQuery({
    queryKey: ['template-assets', category, assetType],
    queryFn: async () => {
      let query = supabase
        .from('proposal_template_assets')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (category) {
        query = query.eq('template_category', category);
      }

      if (assetType) {
        query = query.eq('asset_type', assetType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching template assets:', error);
        throw error;
      }

      return data as TemplateAsset[];
    },
  });

        // Upload de asset
  const uploadAsset = useMutation({
    mutationFn: async ({ file, template_category, asset_type, description, display_order = 0 }: UploadAssetData) => {
      try {
        // Gerar nome único para o arquivo
        const fileExt = file.name.split('.').pop();
        const fileName = `${template_category}/${asset_type}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Upload do arquivo para o Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('proposal-assets')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }

        // Salvar metadata na tabela
        const { data: assetData, error: assetError } = await supabase
          .from('proposal_template_assets')
          .insert({
            file_path: uploadData.path,
            file_name: file.name,
            template_category,
            asset_type,
            description,
            display_order,
            file_size: file.size,
            mime_type: file.type
          })
          .select()
          .single();

        if (assetError) {
          // Se falhou ao salvar metadata, limpar o arquivo do storage
          await supabase.storage
            .from('proposal-assets')
            .remove([uploadData.path]);
          
          console.error('Database insert error:', assetError);
          throw assetError;
        }

        return assetData as TemplateAsset;
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['template-assets'] });
      toast({
        title: "Upload realizado com sucesso",
        description: `Imagem "${data.file_name}" foi adicionada aos templates.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
    },
  });

  // Atualizar asset
  const updateAsset = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TemplateAsset> }) => {
      const { data, error } = await supabase
        .from('proposal_template_assets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      return data as TemplateAsset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-assets'] });
      toast({
        title: "Asset atualizado",
        description: "As informações foram atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na atualização",
        description: error.message || "Não foi possível atualizar o asset.",
        variant: "destructive",
      });
    },
  });

  // Deletar asset
  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      // Buscar o asset para obter o file_path
      const { data: asset, error: fetchError } = await supabase
        .from('proposal_template_assets')
        .select('file_path')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Deletar arquivo do storage
      const { error: storageError } = await supabase.storage
        .from('proposal-assets')
        .remove([asset.file_path]);

      if (storageError) {
        console.warn('Storage delete error:', storageError);
      }

      // Deletar registro da tabela
      const { error: deleteError } = await supabase
        .from('proposal_template_assets')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-assets'] });
      toast({
        title: "Asset removido",
        description: "A imagem foi removida dos templates.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover",
        description: error.message || "Não foi possível remover o asset.",
        variant: "destructive",
      });
    },
  });

  // Gerar URL pública para um asset
  const getAssetUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('proposal-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  return {
    assets: assets || [],
    isLoading,
    error,
    uploadAsset: uploadAsset.mutate,
    isUploading: uploadAsset.isPending,
    updateAsset: updateAsset.mutate,
    isUpdating: updateAsset.isPending,
    deleteAsset: deleteAsset.mutate,
    isDeleting: deleteAsset.isPending,
    getAssetUrl,
  };
};