import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUTMTracking, UTMParams } from './useUTMTracking';

export interface LeadFormData {
  name: string;
  whatsapp: string;
  email?: string;
  city?: string;
  state?: string;
  productInterest: string;
  landingPageId?: string;
}

interface SubmissionResult {
  success: boolean;
  conversationId: string;
  message: string;
}

// Declarar tipos para gtag e fbq
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function useLeadSubmission() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const utmParams = useUTMTracking();

  const mutation = useMutation({
    mutationFn: async (formData: LeadFormData): Promise<SubmissionResult> => {
      const payload = {
        ...formData,
        ...utmParams,
      };

      const { data, error } = await supabase.functions.invoke('submit-landing-page', {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || 'Erro ao enviar formulário');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao processar cadastro');
      }

      return data as SubmissionResult;
    },
    onSuccess: (data, variables) => {
      // Disparar eventos de conversão
      fireConversionEvents(variables.productInterest, data.conversationId);

      // Redirecionar para página de agradecimento
      navigate('/lp/obrigado', {
        state: {
          conversationId: data.conversationId,
          productInterest: variables.productInterest,
          name: variables.name,
        },
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar',
        description: error.message || 'Tente novamente em alguns instantes',
        variant: 'destructive',
      });
    },
  });

  return mutation;
}

function fireConversionEvents(productInterest: string, conversationId: string) {
  // Google Ads Conversion (se configurado)
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', {
      send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL', // Substituir pelos IDs reais
      value: 1.0,
      currency: 'BRL',
      transaction_id: conversationId,
    });

    // Evento personalizado para Analytics
    window.gtag('event', 'lead_captured', {
      event_category: 'Landing Page',
      event_label: productInterest,
      value: 1,
    });
  }

  // Meta Pixel Lead Event (se configurado)
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Lead', {
      content_name: productInterest,
      content_category: 'landing_page',
      value: 1.0,
      currency: 'BRL',
    });
  }

  console.log('[Conversion] Events fired:', { productInterest, conversationId });
}
