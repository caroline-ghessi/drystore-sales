import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Send } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Digite um email válido'),
  displayName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  department: z.string().optional(),
  role: z.enum(['atendente', 'supervisor', 'admin']),
});

type FormData = z.infer<typeof formSchema>;

interface AddAtendenteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddAtendenteDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: AddAtendenteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      displayName: '',
      department: '',
      role: 'atendente',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    console.log('🚀 Iniciando envio de convite para novo atendente:', {
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      department: data.department || 'N/A'
    });
    
    try {
      // Chamar a edge function para enviar o convite real
      console.log('📡 Invocando edge function send-invite-email...');
      
      const { data: result, error } = await supabase.functions.invoke('send-invite-email', {
        body: {
          email: data.email,
          displayName: data.displayName,
          department: data.department,
          role: data.role
        }
      });

      console.log('📥 Resposta da edge function recebida:', {
        success: result?.success,
        error: error?.message,
        requestId: result?.requestId
      });

      if (error) {
        console.error('❌ Erro retornado pela edge function:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Melhorar mensagem de erro baseada no tipo
        let userMessage = error.message || 'Erro ao enviar convite';
        
        if (error.message?.includes('535') || error.message?.includes('API key')) {
          userMessage = 'Erro de configuração do sistema de email. Entre em contato com o suporte técnico.';
        } else if (error.message?.includes('SMTP')) {
          userMessage = 'Problema no envio do email. Tente novamente em alguns minutos.';
        } else if (error.message?.includes('already exists') || error.message?.includes('já existe')) {
          userMessage = 'Este email já possui um convite pendente ou está cadastrado no sistema.';
        }
        
        throw new Error(userMessage);
      }

      if (result?.error) {
        console.error('❌ Erro retornado no resultado:', result.error);
        throw new Error(result.error);
      }

      if (!result?.success) {
        console.error('❌ Edge function não retornou sucesso:', result);
        throw new Error('Falha no processamento do convite');
      }
      
      console.log('✅ Convite enviado com sucesso!', {
        email: data.email,
        inviteId: result.inviteId,
        requestId: result.requestId,
        attempts: result.attempts
      });
      
      toast({
        title: "Convite Enviado com Sucesso! ✅",
        description: `Convite enviado para ${data.email}. O usuário receberá instruções por email para configurar sua conta.${result?.attempts > 1 ? ` (Enviado após ${result.attempts} tentativas)` : ''}`,
      });
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
      onSuccess?.();

    } catch (error: any) {
      console.error('❌ Erro final no envio do convite:', {
        email: data.email,
        error: error.message,
        stack: error.stack
      });
      
      toast({
        title: "Erro ao Enviar Convite ❌",
        description: error.message || "Erro inesperado ao enviar convite. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    } finally {
      console.log('🏁 Finalizando processo de convite');
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Convidar Novo Atendente
          </DialogTitle>
          <DialogDescription>
            Envie um convite por email para adicionar um novo membro à equipe.
            As credenciais de acesso serão enviadas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="atendente@empresa.com" 
                      type="email"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Maria Silva" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Atendimento, Vendas, Suporte..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permissão *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma permissão" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="atendente">
                        <div className="flex flex-col">
                          <span>Atendente</span>
                          <span className="text-xs text-muted-foreground">
                            Acesso básico ao sistema de conversas
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="supervisor">
                        <div className="flex flex-col">
                          <span>Supervisor</span>
                          <span className="text-xs text-muted-foreground">
                            Gerencia atendentes + métricas
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex flex-col">
                          <span>Administrador</span>
                          <span className="text-xs text-muted-foreground">
                            Acesso total ao sistema
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Convite
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}