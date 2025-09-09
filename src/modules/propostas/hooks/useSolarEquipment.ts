import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SolarEquipment {
  id: string;
  category: 'panel' | 'inverter' | 'battery';
  brand: string;
  model: string;
  specifications: Record<string, any>;
  price: number;
  is_active: boolean;
}

export function useSolarEquipment(category?: 'panel' | 'inverter' | 'battery') {
  const [equipment, setEquipment] = useState<SolarEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEquipment();
  }, [category]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('solar_equipment')
        .select('*')
        .eq('is_active', true)
        .order('brand', { ascending: true })
        .order('model', { ascending: true });
        
      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      setEquipment((data || []).map(item => ({
        ...item,
        category: item.category as 'panel' | 'inverter' | 'battery',
        specifications: item.specifications as Record<string, any>
      })));
    } catch (error) {
      console.error('Error fetching solar equipment:', error);
      toast({
        title: 'Erro ao carregar equipamentos',
        description: 'Não foi possível carregar os equipamentos solares.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getEquipmentByModel = (model: string) => {
    return equipment.find(eq => eq.model === model);
  };

  const getEquipmentsByCategory = (cat: 'panel' | 'inverter' | 'battery') => {
    return equipment.filter(eq => eq.category === cat);
  };

  return {
    equipment,
    loading,
    fetchEquipment,
    getEquipmentByModel,
    getEquipmentsByCategory
  };
}