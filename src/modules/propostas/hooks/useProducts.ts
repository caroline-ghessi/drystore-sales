import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductCategory } from '@/types/conversation.types';
import { Database } from '@/integrations/supabase/types';

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: ProductCategory;
  subcategory?: string;
  unit: Database['public']['Enums']['product_unit'];
  base_price: number;
  cost: number;
  supplier?: string;
  specifications?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useProducts(category?: ProductCategory) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', category],
    queryFn: async () => {
      let query = supabase.from('products').select('*').eq('is_active', true);
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data as Product[];
    }
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar produto",
        description: "Não foi possível atualizar o produto.",
        variant: "destructive",
      });
    }
  });

  return {
    products: products || [],
    isLoading,
    error,
    updateProduct: updateProduct.mutate,
    isUpdating: updateProduct.isPending
  };
}