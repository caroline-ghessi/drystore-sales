import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type OpportunityStage = Database['public']['Enums']['opportunity_stage'];

export interface OpportunityDetail {
  id: string;
  title: string;
  description: string | null;
  value: number;
  stage: OpportunityStage;
  probability: number | null;
  temperature: string | null;
  validation_status: string | null;
  product_category: Database['public']['Enums']['product_category'] | null;
  expected_close_date: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  next_step: string | null;
  objections: string[] | null;
  ai_confidence: number | null;
  conversation_id: string | null;
  vendor_conversation_id: number | null;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    city: string | null;
    state: string | null;
    company: string | null;
    segment: string | null;
  } | null;
  vendor: {
    id: string;
    name: string;
  } | null;
}

export function useOpportunityDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['crm-opportunity-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Opportunity ID is required');

      const { data, error } = await supabase
        .from('crm_opportunities')
        .select(`
          id,
          title,
          description,
          value,
          stage,
          probability,
          temperature,
          validation_status,
          product_category,
          expected_close_date,
          source,
          created_at,
          updated_at,
          next_step,
          objections,
          ai_confidence,
          conversation_id,
          vendor_conversation_id,
          customer:crm_customers(id, name, phone, email, city, state, company, segment),
          vendor:vendors(id, name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Opportunity not found');

      // Process nested objects
      const opportunity: OpportunityDetail = {
        ...data,
        customer: Array.isArray(data.customer) ? data.customer[0] || null : data.customer,
        vendor: Array.isArray(data.vendor) ? data.vendor[0] || null : data.vendor,
      };

      return opportunity;
    },
    enabled: !!id,
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<{
        title: string;
        value: number;
        stage: OpportunityStage;
        probability: number;
        expected_close_date: string;
        next_step: string;
        description: string;
      }>;
    }) => {
      const { error } = await supabase
        .from('crm_opportunities')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm-opportunity-detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['crm-opportunities'] });
    },
  });
}

export function useConversationMessages(conversationId: string | null | undefined) {
  return useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('id, content, sender_type, created_at, sender_name')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!conversationId,
  });
}

export function useVendorConversationMessages(vendorConversationId: number | null | undefined) {
  return useQuery({
    queryKey: ['vendor-conversation-messages', vendorConversationId],
    queryFn: async () => {
      if (!vendorConversationId) return [];

      const { data, error } = await supabase
        .from('vendor_messages')
        .select('id, content, from_me, from_name, created_at')
        .eq('conversation_id', vendorConversationId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!vendorConversationId,
  });
}
