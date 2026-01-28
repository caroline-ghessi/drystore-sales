import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizePhone, type ContactType } from '../utils/phoneUtils';
import { useToast } from '@/hooks/use-toast';

export interface ExcludedContact {
  id: string;
  phone_number: string;
  name: string;
  department: string | null;
  contact_type: ContactType;
  reason: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExcludedContactInput {
  phone_number: string;
  name: string;
  department?: string;
  contact_type?: ContactType;
  reason?: string;
}

export interface UpdateExcludedContactInput {
  name?: string;
  department?: string;
  contact_type?: ContactType;
  reason?: string;
  is_active?: boolean;
}

export function useExcludedContacts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query para listar todos os contatos excluídos
  const query = useQuery({
    queryKey: ['excluded-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('excluded_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ExcludedContact[];
    },
  });

  // Mutation para adicionar contato
  const addContact = useMutation({
    mutationFn: async (input: CreateExcludedContactInput) => {
      const normalizedPhone = normalizePhone(input.phone_number);
      
      const { data, error } = await supabase
        .from('excluded_contacts')
        .insert({
          phone_number: normalizedPhone,
          name: input.name,
          department: input.department || null,
          contact_type: input.contact_type || 'employee',
          reason: input.reason || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ExcludedContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['excluded-contacts'] });
      toast({
        title: 'Contato adicionado',
        description: 'O contato foi adicionado à lista de exclusão.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao adicionar contato',
        description: error.message.includes('duplicate')
          ? 'Este número de telefone já está na lista.'
          : error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar contato
  const updateContact = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateExcludedContactInput }) => {
      const { data: updated, error } = await supabase
        .from('excluded_contacts')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated as ExcludedContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['excluded-contacts'] });
      toast({
        title: 'Contato atualizado',
        description: 'As informações do contato foram atualizadas.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar contato',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para desativar/ativar contato
  const toggleContactStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('excluded_contacts')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ExcludedContact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['excluded-contacts'] });
      toast({
        title: data.is_active ? 'Contato reativado' : 'Contato desativado',
        description: data.is_active
          ? 'O contato voltará a ser filtrado.'
          : 'O contato não será mais filtrado.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao alterar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para remover contato permanentemente
  const removeContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('excluded_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['excluded-contacts'] });
      toast({
        title: 'Contato removido',
        description: 'O contato foi removido permanentemente da lista.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover contato',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    contacts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    addContact,
    updateContact,
    toggleContactStatus,
    removeContact,
  };
}
