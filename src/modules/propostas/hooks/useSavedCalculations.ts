import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { ProductType, ClientData } from '../types/proposal.types';
import { CalculationInput, CalculationResult } from '../types/calculation.types';
import { Database } from '@/integrations/supabase/types';

type DatabaseProductType = Database['public']['Enums']['product_category'];

export interface SavedCalculation {
  id: string;
  user_id: string;
  product_type: ProductType;
  client_data: ClientData;
  calculation_input: CalculationInput;
  calculation_result: CalculationResult;
  name: string;
  status: 'draft' | 'ready_to_propose' | 'aguardando_revisao' | 'aprovado' | 'rejeitado' | 'alteracoes_solicitadas';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SaveCalculationData {
  name: string;
  product_type: ProductType;
  client_data: ClientData;
  calculation_input: CalculationInput;
  calculation_result: CalculationResult;
  notes?: string;
  status?: 'draft' | 'ready_to_propose' | 'aguardando_revisao' | 'aprovado' | 'rejeitado' | 'alteracoes_solicitadas';
}

// Mapping functions between our ProductType and database product_category
function mapToDbProductType(productType: ProductType): DatabaseProductType {
  const mapping: Record<ProductType, DatabaseProductType> = {
    'solar': 'energia_solar',
    'shingle': 'telha_shingle',
    'drywall': 'drywall_divisorias',
    'steel_frame': 'steel_frame',
    'ceiling': 'forros',
    'forro_drywall': 'forro_drywall'
  };
  return mapping[productType];
}

function mapFromDbProductType(dbType: DatabaseProductType): ProductType {
  const mapping: Record<DatabaseProductType, ProductType> = {
    'energia_solar': 'solar',
    'telha_shingle': 'shingle',
    'drywall_divisorias': 'drywall',
    'steel_frame': 'steel_frame',
    'forros': 'ceiling',
    'forro_drywall': 'forro_drywall',
    // Default mappings for other categories
    'ferramentas': 'drywall',
    'pisos': 'drywall',
    'acabamentos': 'drywall',
    'saudacao': 'solar',
    'institucional': 'solar',
    'indefinido': 'solar',
    'geral': 'solar'
  };
  return mapping[dbType] || 'solar';
}

export function useSavedCalculations() {
  const queryClient = useQueryClient();

  // Fetch all saved calculations for the current user
  const {
    data: calculations = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['saved-calculations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_calculations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data?.map(item => ({
        ...item,
        product_type: mapFromDbProductType(item.product_type),
        status: (item.status as 'draft' | 'ready_to_propose' | 'aguardando_revisao' | 'aprovado' | 'rejeitado' | 'alteracoes_solicitadas') || 'draft',
        client_data: (item.client_data as unknown) as ClientData,
        calculation_input: (item.calculation_input as unknown) as CalculationInput,
        calculation_result: (item.calculation_result as unknown) as CalculationResult,
      })) || [];
    }
  });

  // Save a new calculation
  const saveCalculation = useMutation({
    mutationFn: async (calculationData: SaveCalculationData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('saved_calculations')
        .insert({
          user_id: user.id,
          name: calculationData.name,
          product_type: mapToDbProductType(calculationData.product_type),
          client_data: calculationData.client_data as any,
          calculation_input: calculationData.calculation_input as any,
          calculation_result: calculationData.calculation_result as any,
          notes: calculationData.notes,
          status: calculationData.status || 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        product_type: mapFromDbProductType(data.product_type),
        status: (data.status as 'draft' | 'ready_to_propose' | 'aguardando_revisao' | 'aprovado' | 'rejeitado' | 'alteracoes_solicitadas') || 'draft',
        client_data: (data.client_data as unknown) as ClientData,
        calculation_input: (data.calculation_input as unknown) as CalculationInput,
        calculation_result: (data.calculation_result as unknown) as CalculationResult,
      } as SavedCalculation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-calculations'] });
      toast({
        title: "Cálculo Salvo",
        description: "Seu cálculo foi salvo com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao Salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  });

  // Update an existing calculation
  const updateCalculation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SaveCalculationData> }) => {
      const { data, error } = await supabase
        .from('saved_calculations')
        .update({
          name: updates.name,
          product_type: updates.product_type ? mapToDbProductType(updates.product_type) : undefined,
          client_data: updates.client_data as any,
          calculation_input: updates.calculation_input as any,
          calculation_result: updates.calculation_result as any,
          notes: updates.notes,
          status: updates.status
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        product_type: mapFromDbProductType(data.product_type),
        status: (data.status as 'draft' | 'ready_to_propose' | 'aguardando_revisao' | 'aprovado' | 'rejeitado' | 'alteracoes_solicitadas') || 'draft',
        client_data: (data.client_data as unknown) as ClientData,
        calculation_input: (data.calculation_input as unknown) as CalculationInput,
        calculation_result: (data.calculation_result as unknown) as CalculationResult,
      } as SavedCalculation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-calculations'] });
      toast({
        title: "Cálculo Atualizado",
        description: "Alterações salvas com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao Atualizar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  });

  // Delete a calculation
  const deleteCalculation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_calculations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-calculations'] });
      toast({
        title: "Cálculo Excluído",
        description: "Cálculo removido com sucesso!"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao Excluir",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  });

  // Convert calculation to proposal
  const convertToProposal = useCallback(async (calculation: SavedCalculation) => {
    try {
      // Update status to ready_to_propose
      await updateCalculation.mutateAsync({
        id: calculation.id,
        updates: { status: 'ready_to_propose' }
      });

      toast({
        title: "Pronto para Proposta",
        description: "Cálculo marcado como pronto para gerar proposta!"
      });

      return calculation;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao preparar para proposta",
        variant: "destructive"
      });
    }
  }, [updateCalculation]);

  return {
    calculations,
    isLoading,
    error,
    saveCalculation: saveCalculation.mutate,
    updateCalculation: updateCalculation.mutate,
    deleteCalculation: deleteCalculation.mutate,
    convertToProposal,
    isSaving: saveCalculation.isPending,
    isUpdating: updateCalculation.isPending,
    isDeleting: deleteCalculation.isPending
  };
}