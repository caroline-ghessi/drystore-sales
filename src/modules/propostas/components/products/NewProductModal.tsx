import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Database } from '@/integrations/supabase/types';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewProductData) => void;
  isCreating: boolean;
}

export interface NewProductData {
  code: string;
  name: string;
  description?: string;
  category: Database['public']['Enums']['product_category'];
  subcategory?: string;
  unit: Database['public']['Enums']['product_unit'];
  base_price: number;
  cost: number;
  supplier?: string;
  is_active: boolean;
}

const categories: { value: Database['public']['Enums']['product_category']; label: string }[] = [
  { value: 'energia_solar', label: 'Energia Solar' },
  { value: 'telha_shingle', label: 'Telhas Shingle' },
  { value: 'drywall_divisorias', label: 'Drywall' },
  { value: 'steel_frame', label: 'Steel Frame' },
  { value: 'forro_drywall', label: 'Forro Drywall' },
  { value: 'forro_mineral_acustico', label: 'Forro Mineral Acústico' },
  { value: 'forros', label: 'Forros' },
  { value: 'ferramentas', label: 'Ferramentas' },
  { value: 'pisos', label: 'Pisos' },
  { value: 'acabamentos', label: 'Acabamentos' },
  { value: 'geral', label: 'Geral' }
];

const units: { value: Database['public']['Enums']['product_unit']; label: string }[] = [
  { value: 'm2', label: 'm² (metros quadrados)' },
  { value: 'ml', label: 'ml (metros lineares)' },
  { value: 'peca', label: 'peça' },
  { value: 'unidade', label: 'unidade' },
  { value: 'conjunto', label: 'conjunto' },
  { value: 'pacote', label: 'pacote' },
  { value: 'kg', label: 'kg (quilogramas)' },
  { value: 'litro', label: 'litro' }
];

export function NewProductModal({ isOpen, onClose, onSubmit, isCreating }: NewProductModalProps) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<NewProductData>({
    defaultValues: {
      is_active: true,
      base_price: 0,
      cost: 0
    }
  });

  const handleFormSubmit = (data: NewProductData) => {
    onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Produto</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Código*</Label>
              <Input
                id="code"
                {...register('code', { required: 'Código é obrigatório' })}
                placeholder="Ex: SOL001"
              />
              {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="name">Nome*</Label>
              <Input
                id="name"
                {...register('name', { required: 'Nome é obrigatório' })}
                placeholder="Nome do produto"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descrição detalhada do produto"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Categoria*</Label>
              <Select onValueChange={(value) => setValue('category', value as Database['public']['Enums']['product_category'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-500">Categoria é obrigatória</p>}
            </div>

            <div>
              <Label htmlFor="unit">Unidade*</Label>
              <Select onValueChange={(value) => setValue('unit', value as Database['public']['Enums']['product_unit'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && <p className="text-sm text-red-500">Unidade é obrigatória</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="base_price">Preço Base (R$)*</Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                {...register('base_price', { 
                  required: 'Preço é obrigatório',
                  min: { value: 0, message: 'Preço deve ser positivo' }
                })}
                placeholder="0.00"
              />
              {errors.base_price && <p className="text-sm text-red-500">{errors.base_price.message}</p>}
            </div>

            <div>
              <Label htmlFor="cost">Custo (R$)*</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                {...register('cost', { 
                  required: 'Custo é obrigatório',
                  min: { value: 0, message: 'Custo deve ser positivo' }
                })}
                placeholder="0.00"
              />
              {errors.cost && <p className="text-sm text-red-500">{errors.cost.message}</p>}
            </div>

            <div>
              <Label htmlFor="subcategory">Subcategoria</Label>
              <Input
                id="subcategory"
                {...register('subcategory')}
                placeholder="Ex: Residencial"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="supplier">Fornecedor</Label>
            <Input
              id="supplier"
              {...register('supplier')}
              placeholder="Nome do fornecedor"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Criando...' : 'Criar Produto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}