import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateVendorAccountParams {
  vendorId: string;
  vendorName: string;
  email: string;
}

export function useCreateVendorAccount() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, vendorName, email }: CreateVendorAccountParams) => {
      // 1. Enviar convite usando a edge function existente
      const { data: inviteData, error: inviteError } = await supabase.functions.invoke('send-invite-email', {
        body: {
          email,
          displayName: vendorName,
          department: 'Vendas',
          role: 'vendedor'
        }
      });

      if (inviteError) {
        console.error('Erro ao enviar convite:', inviteError);
        throw new Error(`Erro ao enviar convite: ${inviteError.message}`);
      }

      // 2. Atualizar o vendor com email se ainda não foi feito
      const { error: updateError } = await supabase
        .from('vendors')
        .update({ email })
        .eq('id', vendorId);

      if (updateError) {
        console.error('Erro ao atualizar vendor:', updateError);
        throw new Error(`Erro ao atualizar vendedor: ${updateError.message}`);
      }

      // 3. Aguardar um pouco para o profile ser criado pelo trigger
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 4. Buscar o profile criado pelo email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .limit(1);

      if (profileError) {
        console.error('Erro ao buscar profile:', profileError);
        throw new Error('Erro ao buscar profile criado');
      }

      if (!profiles || profiles.length === 0) {
        throw new Error('Profile não foi criado automaticamente. Tente novamente em alguns segundos.');
      }

      const createdProfile = profiles[0];

      // 5. Verificar se já existe um profile com o vendor ID
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', vendorId)
        .single();

      if (existingProfile) {
        // Se já existe um profile com o vendor ID, deletar o profile criado automaticamente
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('user_id', createdProfile.user_id);

        if (deleteError) {
          console.error('Erro ao deletar profile duplicado:', deleteError);
        }

        throw new Error('Já existe uma conta associada a este vendedor');
      }

      // 6. Atualizar o profile para usar o vendor ID
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ user_id: vendorId })
        .eq('user_id', createdProfile.user_id);

      if (updateProfileError) {
        console.error('Erro ao sincronizar profile:', updateProfileError);
        throw new Error('Erro ao sincronizar conta do vendedor');
      }

      // 7. Criar role de vendedor
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: vendorId,
          role: 'vendedor',
          assigned_by: vendorId
        });

      if (roleError && !roleError.message.includes('duplicate')) {
        console.error('Erro ao criar role:', roleError);
        // Não falhar por causa da role, é secundário
      }

      return { inviteData, vendorId, email };
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['vendors-proposta'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      
      toast({
        title: "Conta criada com sucesso",
        description: `Convite enviado para ${data.email}. O vendedor receberá um email para definir a senha.`,
      });
    },
    onError: (error: any) => {
      console.error('Erro ao criar conta do vendedor:', error);
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Não foi possível criar a conta do vendedor.",
        variant: "destructive",
      });
    },
  });
}