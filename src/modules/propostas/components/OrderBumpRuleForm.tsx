import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { OrderBumpRule } from '@/hooks/useOrderBumps';

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  bump_title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  bump_description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  bump_image_url: z.string().url('URL inválida').optional().or(z.literal('')),
  bump_price: z.string().optional(),
  bump_discount_percentage: z.string().optional(),
  is_active: z.boolean().default(true),
  priority: z.string().default('0'),
  max_displays: z.string().optional(),
  min_value: z.string().optional(),
  max_value: z.string().optional(),
  product_categories: z.string().optional(),
});

interface OrderBumpRuleFormProps {
  rule?: OrderBumpRule | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function OrderBumpRuleForm({ rule, onSuccess, onCancel }: OrderBumpRuleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: rule?.name || '',
      description: rule?.description || '',
      bump_title: rule?.bump_title || '',
      bump_description: rule?.bump_description || '',
      bump_image_url: rule?.bump_image_url || '',
      bump_price: rule?.bump_price?.toString() || '',
      bump_discount_percentage: rule?.bump_discount_percentage?.toString() || '',
      is_active: rule?.is_active ?? true,
      priority: rule?.priority?.toString() || '0',
      max_displays: rule?.max_displays?.toString() || '',
      min_value: rule?.trigger_conditions?.min_value?.toString() || '',
      max_value: rule?.trigger_conditions?.max_value?.toString() || '',
      product_categories: Array.isArray(rule?.trigger_conditions?.product_category)
        ? rule.trigger_conditions.product_category.join(', ')
        : '',
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const triggerConditions: any = {};
      
      if (values.min_value) triggerConditions.min_value = parseFloat(values.min_value);
      if (values.max_value) triggerConditions.max_value = parseFloat(values.max_value);
      if (values.product_categories) {
        triggerConditions.product_category = values.product_categories
          .split(',')
          .map(c => c.trim())
          .filter(Boolean);
      }

      const data = {
        name: values.name,
        description: values.description || null,
        bump_title: values.bump_title,
        bump_description: values.bump_description,
        bump_image_url: values.bump_image_url || null,
        bump_price: values.bump_price ? parseFloat(values.bump_price) : null,
        bump_discount_percentage: values.bump_discount_percentage
          ? parseFloat(values.bump_discount_percentage)
          : null,
        is_active: values.is_active,
        priority: parseInt(values.priority),
        max_displays: values.max_displays ? parseInt(values.max_displays) : null,
        trigger_conditions: triggerConditions,
      };

      if (rule) {
        const { error } = await supabase
          .from('order_bump_rules')
          .update(data)
          .eq('id', rule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('order_bump_rules')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-bump-rules'] });
      toast({
        title: rule ? 'Regra atualizada' : 'Regra criada',
        description: 'A regra de order bump foi salva com sucesso.',
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a regra.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    saveMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informações Básicas</h3>
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Regra</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Oferta Solar Plus" {...field} />
                </FormControl>
                <FormDescription>Nome interno para identificação</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descrição interna da regra" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Conteúdo do Bump */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Conteúdo da Oferta</h3>
          
          <FormField
            control={form.control}
            name="bump_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título da Oferta</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Adicione um Sistema de Backup!" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bump_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição da Oferta</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva os benefícios da oferta..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bump_image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL da Imagem (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bump_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço (opcional)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bump_discount_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desconto % (opcional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Condições de Exibição */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Condições de Exibição</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="min_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Mínimo da Proposta</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Máximo da Proposta</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="999999.99" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="product_categories"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categorias de Produto (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="solar, drywall, gesso (separado por vírgula)" {...field} />
                </FormControl>
                <FormDescription>
                  Deixe em branco para aplicar a todas as categorias
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Controles */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Controles</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription>Maior = mais prioridade</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_displays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limite de Exibições (opcional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ilimitado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Regra Ativa</FormLabel>
                  <FormDescription>
                    Ative ou desative esta regra
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
