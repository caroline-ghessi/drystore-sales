import { supabase } from '@/lib/supabase';
import { Database } from '@/integrations/supabase/types';

export interface CustomerData {
  name?: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  company?: string;
}

type ProjectType = Database['public']['Enums']['product_category'];
type ProposalStatus = Database['public']['Enums']['proposal_status'];

/**
 * Busca ou cria um cliente na tabela crm_customers baseado no telefone.
 * IMPORTANTE: Sempre use esta função antes de criar uma proposta para garantir
 * que o customer_id seja preenchido corretamente.
 * 
 * @param customerData - Dados do cliente
 * @returns ID do cliente (UUID)
 */
export async function ensureCustomerExists(customerData: CustomerData): Promise<string> {
  const { phone, name, email, city, state, company } = customerData;

  if (!phone) {
    throw new Error('Telefone é obrigatório para criar/buscar cliente');
  }

  // Normalizar telefone (remover caracteres especiais)
  const normalizedPhone = phone.replace(/\D/g, '');

  // Buscar cliente existente pelo telefone
  const { data: existingCustomer, error: searchError } = await supabase
    .from('crm_customers')
    .select('id')
    .eq('phone', normalizedPhone)
    .maybeSingle();

  if (searchError) {
    console.error('Erro ao buscar cliente:', searchError);
    throw new Error('Erro ao verificar cliente existente');
  }

  // Se cliente já existe, retornar o ID
  if (existingCustomer) {
    console.log('Cliente existente encontrado:', existingCustomer.id);
    return existingCustomer.id;
  }

  // Criar novo cliente
  const { data: newCustomer, error: insertError } = await supabase
    .from('crm_customers')
    .insert({
      name: name || `Cliente ${normalizedPhone.slice(-4)}`,
      phone: normalizedPhone,
      email: email || null,
      city: city || null,
      state: state || null,
      company: company || null,
      source: 'proposal',
      status: 'lead',
      last_interaction_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Erro ao criar cliente:', insertError);
    throw new Error('Erro ao criar novo cliente');
  }

  if (!newCustomer) {
    throw new Error('Cliente não foi criado corretamente');
  }

  console.log('Novo cliente criado:', newCustomer.id);
  return newCustomer.id;
}

/**
 * Cria uma proposta garantindo que o customer_id seja sempre preenchido.
 * 
 * @param proposalData - Dados da proposta
 * @param clientData - Dados do cliente (deve conter ao menos o telefone)
 * @returns Proposta criada
 */
export async function createProposalWithCustomer(
  proposalData: {
    title: string;
    description?: string;
    project_type?: ProjectType | null;
    total_value?: number;
    discount_value?: number;
    discount_percentage?: number;
    final_value?: number;
    status?: ProposalStatus;
    valid_until?: string;
    created_by: string;
  },
  clientData: CustomerData
) {
  // Garantir que o cliente existe e obter o ID
  const customerId = await ensureCustomerExists(clientData);

  // Gerar número da proposta
  const proposalNumber = `PROP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // Criar a proposta com customer_id
  const { data: proposal, error } = await supabase
    .from('proposals')
    .insert([{
      ...proposalData,
      proposal_number: proposalNumber,
      customer_id: customerId,
      client_data: clientData as any, // Manter client_data por compatibilidade
      status: proposalData.status || 'draft',
    }])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar proposta:', error);
    throw new Error('Erro ao criar proposta');
  }

  return proposal;
}
