import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useExcludedContacts, type CreateExcludedContactInput } from '../../hooks/useExcludedContacts';
import { CONTACT_TYPES, isValidPhone, type ContactType } from '../../utils/phoneUtils';

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone_number: z.string().min(10, 'Telefone inválido').refine(
    (val) => isValidPhone(val),
    { message: 'Formato de telefone inválido. Use: (XX) XXXXX-XXXX' }
  ),
  department: z.string().optional(),
  contact_type: z.enum(['employee', 'vendor', 'test', 'supplier', 'partner', 'spam']).default('employee'),
  reason: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function AddExcludedContactDialog() {
  const [open, setOpen] = useState(false);
  const { addContact } = useExcludedContacts();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone_number: '',
      department: '',
      contact_type: 'employee',
      reason: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    const input: CreateExcludedContactInput = {
      name: data.name,
      phone_number: data.phone_number,
      department: data.department || undefined,
      contact_type: data.contact_type as ContactType,
      reason: data.reason || undefined,
    };

    await addContact.mutateAsync(input);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Contato
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Contato Excluído</DialogTitle>
          <DialogDescription>
            Adicione um número de telefone que não deve ser contabilizado como cliente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              placeholder="Nome do colaborador"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Telefone *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone_number"
                placeholder="(51) 99999-9999"
                className="pl-10"
                {...form.register('phone_number')}
              />
            </div>
            {form.formState.errors.phone_number && (
              <p className="text-sm text-destructive">{form.formState.errors.phone_number.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_type">Tipo de Contato</Label>
            <Select
              value={form.watch('contact_type')}
              onValueChange={(value) => form.setValue('contact_type', value as ContactType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Input
              id="department"
              placeholder="Ex: Comercial, Administrativo..."
              {...form.register('department')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Input
              id="reason"
              placeholder="Ex: Funcionário desde 2024"
              {...form.register('reason')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addContact.isPending}>
              {addContact.isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
