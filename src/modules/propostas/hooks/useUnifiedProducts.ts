import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

export type UnifiedProductCategory = Database['public']['Enums']['product_category'] | 'energia_solar' | 'battery_backup';

export interface UnifiedProduct {
  id: string;
  code?: string;
  name: string;
  description?: string;
  category: UnifiedProductCategory;
  subcategory?: string;
  unit: string;
  base_price: number;
  cost?: number;
  supplier?: string;
  specifications?: any;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  source: 'products' | 'solar_equipment';
  
  // Solar-specific fields
  brand?: string;
  model?: string;
  solar_category?: 'panel' | 'inverter' | 'battery';
}

export function useUnifiedProducts(category?: UnifiedProductCategory) {
  console.log('📦 useUnifiedProducts chamado com categoria:', category);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: unifiedProducts = [], isLoading, error } = useQuery({
    queryKey: ['unified-products', category],
    queryFn: async () => {
      console.log('📦 useUnifiedProducts.queryFn executando para categoria:', category);
      const results: UnifiedProduct[] = [];
      
      // Fetch regular products
      let productsQuery = supabase.from('products').select('*').eq('is_active', true);
      if (category && !['energia_solar', 'battery_backup'].includes(category)) {
        productsQuery = productsQuery.eq('category', category);
      }
      
      console.log('📦 Buscando produtos da tabela products...');
      const { data: products, error: productsError } = await productsQuery.order('name');
      if (productsError) {
        console.error('❌ Erro ao buscar products:', productsError);
        throw productsError;
      }
      console.log('📦 Produtos encontrados na tabela products:', products?.length || 0);

      // Convert products to unified format
      if (products) {
        results.push(...products.map(product => ({
          id: product.id,
          code: product.code,
          name: product.name,
          description: product.description,
          category: product.category as UnifiedProductCategory,
          subcategory: product.subcategory,
          unit: product.unit,
          base_price: product.base_price,
          cost: product.cost,
          supplier: product.supplier,
          specifications: product.specifications,
          is_active: product.is_active,
          created_at: product.created_at,
          updated_at: product.updated_at,
          source: 'products' as const
        })));
      }
      
      // Fetch solar equipment
      let solarQuery = supabase.from('solar_equipment').select('*').eq('is_active', true);
      if (category === 'energia_solar') {
        solarQuery = solarQuery.in('category', ['panel', 'inverter']);
        console.log('📦 Filtrando solar_equipment para energia_solar: [panel, inverter]');
      } else if (category === 'battery_backup') {
        solarQuery = solarQuery.in('category', ['battery']);
        console.log('🔋 Filtrando solar_equipment para battery_backup: [battery] apenas');
      } else if (!category) {
        console.log('📦 Buscando todos os solar_equipment (sem filtro de categoria)');
        // Include all solar equipment when no specific category
      } else {
        console.log('📦 Não buscando solar_equipment para categoria:', category);
        // Don't fetch solar equipment for other categories
        solarQuery = solarQuery.eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
      }
      
      console.log('📦 Executando query solar_equipment...');
      const { data: solarEquipment, error: solarError } = await solarQuery
        .order('brand', { ascending: true })
        .order('model', { ascending: true });
        
      if (solarError) {
        console.error('❌ Erro ao buscar solar_equipment:', solarError);
        throw solarError;
      }
      
      console.log('📦 Solar equipment encontrado:', solarEquipment?.length || 0);
      console.log('📦 Solar equipment data:', solarEquipment);

      // Convert solar equipment to unified format
      if (solarEquipment) {
        const convertedSolarEquipment = solarEquipment.map(equipment => {
          // Check if it's a hybrid inverter by multiple criteria
          const isHybridInverter = equipment.category === 'inverter' && (() => {
            // Check specifications for hybrid type
            const specs = equipment.specifications;
            let isHybridBySpecs = false;
            
            if (specs && typeof specs === 'object' && !Array.isArray(specs)) {
              const specsObj = specs as { [key: string]: any };
              isHybridBySpecs = specsObj.type === 'hybrid' || specsObj.tipo === 'híbrido';
            }
            
            // Check model name for hybrid keywords
            const modelLower = (equipment.model || '').toLowerCase();
            const isHybridByModel = modelLower.includes('híbrido') || 
                                   modelLower.includes('hibrido') ||
                                   modelLower.includes('hybrid');
            
            // Check brand for known hybrid inverter manufacturers
            const brandLower = (equipment.brand || '').toLowerCase();
            const isHybridByBrand = brandLower.includes('growatt') ||
                                   brandLower.includes('deye') ||
                                   brandLower.includes('livoltek');
            
            const result = isHybridBySpecs || isHybridByModel || isHybridByBrand;
            
            console.log(`🔍 Hybrid Detection - ${equipment.brand} ${equipment.model}:`, {
              isHybridBySpecs,
              isHybridByModel, 
              isHybridByBrand,
              finalResult: result,
              specs
            });
            
            return result;
          })();
             
          const convertedCategory = equipment.category === 'battery' ? 'battery_backup' : 'energia_solar';
          
          console.log(`📦 Convertendo ${equipment.brand} ${equipment.model}:`, {
            original_category: equipment.category,
            isHybridInverter,
            final_category: convertedCategory,
            solar_category: equipment.category
          });
          
          return {
            id: equipment.id,
            name: `${equipment.brand} ${equipment.model}`,
            description: `${equipment.category === 'panel' ? 'Painel Solar' : 
                          equipment.category === 'inverter' ? 'Inversor Solar' : 
                          'Bateria'} - ${equipment.brand}`,
            category: convertedCategory as UnifiedProductCategory,
            unit: equipment.category === 'panel' ? 'unidade' : 
                  equipment.category === 'inverter' ? 'unidade' : 
                  'unidade',
            base_price: equipment.price,
            specifications: equipment.specifications,
            is_active: equipment.is_active,
            created_at: equipment.created_at || new Date().toISOString(),
            source: 'solar_equipment' as const,
            brand: equipment.brand,
            model: equipment.model,
            solar_category: equipment.category as 'panel' | 'inverter' | 'battery'
          };
        });
        
        console.log('📦 Solar equipment convertido:', convertedSolarEquipment);
        
        // Log específico para battery_backup
        if (category === 'battery_backup') {
          const batteryProducts = convertedSolarEquipment.filter(p => p.category === 'battery_backup');
          console.log('🔋 Produtos battery_backup encontrados:', batteryProducts.length);
          console.log('🔋 Detalhes dos produtos battery_backup:', batteryProducts.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            solar_category: p.solar_category
          })));
        }
        
        results.push(...convertedSolarEquipment);
      }
      
      console.log('📦 Total de produtos unificados:', results.length);
      console.log('📦 Produtos finais:', results);
      return results;
    }
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UnifiedProduct> }) => {
      // Find the product to determine which table to update
      const product = unifiedProducts.find(p => p.id === id);
      if (!product) throw new Error('Product not found');
      
      if (product.source === 'products') {
        // Update in products table
        const productUpdates: any = {};
        if (updates.name) productUpdates.name = updates.name;
        if (updates.description !== undefined) productUpdates.description = updates.description;
        if (updates.base_price !== undefined) productUpdates.base_price = updates.base_price;
        if (updates.unit) productUpdates.unit = updates.unit;
        if (updates.specifications !== undefined) productUpdates.specifications = updates.specifications;
        
        const { error } = await supabase
          .from('products')
          .update(productUpdates)
          .eq('id', id);
          
        if (error) throw error;
      } else {
        // Update in solar_equipment table
        const solarUpdates: any = {};
        if (updates.base_price !== undefined) solarUpdates.price = updates.base_price;
        if (updates.specifications !== undefined) solarUpdates.specifications = updates.specifications;
        if (updates.brand) solarUpdates.brand = updates.brand;
        if (updates.model) solarUpdates.model = updates.model;
        
        const { error } = await supabase
          .from('solar_equipment')
          .update(solarUpdates)
          .eq('id', id);
          
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-products'] });
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({
        title: "Erro ao atualizar produto",
        description: "Não foi possível atualizar o produto.",
        variant: "destructive",
      });
    }
  });

  const createProduct = useMutation({
    mutationFn: async (productData: Omit<UnifiedProduct, 'id' | 'created_at' | 'updated_at'>) => {
      if (productData.source === 'products') {
        const { error } = await supabase
          .from('products')
          .insert({
            code: productData.code || '',
            name: productData.name,
            description: productData.description,
            category: productData.category as Database['public']['Enums']['product_category'],
            subcategory: productData.subcategory,
            unit: productData.unit as Database['public']['Enums']['product_unit'],
            base_price: productData.base_price,
            cost: productData.cost || 0,
            supplier: productData.supplier,
            specifications: productData.specifications,
            is_active: productData.is_active
          });
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('solar_equipment')
          .insert({
            category: productData.solar_category!,
            brand: productData.brand!,
            model: productData.model!,
            specifications: productData.specifications || {},
            price: productData.base_price,
            is_active: productData.is_active
          });
          
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-products'] });
      toast({
        title: "Produto criado",
        description: "O produto foi criado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast({
        title: "Erro ao criar produto",
        description: "Não foi possível criar o produto.",
        variant: "destructive",
      });
    }
  });

  return {
    products: unifiedProducts,
    isLoading,
    error,
    updateProduct: updateProduct.mutate,
    isUpdating: updateProduct.isPending,
    createProduct: createProduct.mutate,
    isCreating: createProduct.isPending
  };
}