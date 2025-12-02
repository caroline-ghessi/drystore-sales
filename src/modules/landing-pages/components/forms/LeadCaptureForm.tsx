import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Loader2 } from 'lucide-react';
import { useLeadSubmission } from '../../hooks/useLeadSubmission';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const formSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100, 'Nome muito longo'),
  whatsapp: z
    .string()
    .min(14, 'WhatsApp inválido')
    .max(15, 'WhatsApp inválido')
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Formato: (00) 00000-0000'),
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email muito longo')
    .optional()
    .or(z.literal('')),
  city: z.string().max(100, 'Cidade muito longa').optional(),
  state: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LeadCaptureFormProps {
  productInterest: string;
  landingPageId?: string;
  buttonText?: string;
  className?: string;
}

export function LeadCaptureForm({
  productInterest,
  landingPageId,
  buttonText = 'Quero um orçamento',
  className = '',
}: LeadCaptureFormProps) {
  const { mutate: submitLead, isPending } = useLeadSubmission();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      whatsapp: '',
      email: '',
      city: '',
      state: '',
    },
  });

  const selectedState = watch('state');

  const onSubmit = (data: FormValues) => {
    submitLead({
      name: data.name,
      whatsapp: data.whatsapp,
      email: data.email || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      productInterest,
      landingPageId,
    });
  };

  // Máscara de WhatsApp
  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
      value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
      value = value.replace(/(\d{5})(\d)/, '$1-$2');
    }
    
    setValue('whatsapp', value);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 ${className}`}>
      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-foreground font-medium">
          Nome completo *
        </Label>
        <Input
          id="name"
          placeholder="Seu nome"
          {...register('name')}
          className="h-12 bg-background border-border"
          disabled={isPending}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* WhatsApp */}
      <div className="space-y-2">
        <Label htmlFor="whatsapp" className="text-foreground font-medium">
          WhatsApp *
        </Label>
        <Input
          id="whatsapp"
          placeholder="(00) 00000-0000"
          {...register('whatsapp')}
          onChange={handleWhatsappChange}
          className="h-12 bg-background border-border"
          disabled={isPending}
          maxLength={15}
        />
        {errors.whatsapp && (
          <p className="text-sm text-destructive">{errors.whatsapp.message}</p>
        )}
      </div>

      {/* Email (opcional) */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground font-medium">
          Email <span className="text-muted-foreground text-sm">(opcional)</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          {...register('email')}
          className="h-12 bg-background border-border"
          disabled={isPending}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Cidade e Estado (lado a lado) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-foreground font-medium">
            Cidade
          </Label>
          <Input
            id="city"
            placeholder="Sua cidade"
            {...register('city')}
            className="h-12 bg-background border-border"
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state" className="text-foreground font-medium">
            Estado
          </Label>
          <Select
            value={selectedState}
            onValueChange={(value) => setValue('state', value)}
            disabled={isPending}
          >
            <SelectTrigger className="h-12 bg-background border-border">
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {BRAZILIAN_STATES.map((uf) => (
                <SelectItem key={uf} value={uf}>
                  {uf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Botão Submit */}
      <Button
        type="submit"
        size="lg"
        className="w-full h-14 text-lg font-semibold"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Enviando...
          </>
        ) : (
          buttonText
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Ao enviar, você concorda em receber contato da nossa equipe via WhatsApp.
      </p>
    </form>
  );
}
