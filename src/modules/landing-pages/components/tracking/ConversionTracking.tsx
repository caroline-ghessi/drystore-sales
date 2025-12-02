import { useEffect } from 'react';

interface ConversionTrackingProps {
  eventName: string;
  eventData?: Record<string, unknown>;
  googleAdsConversionId?: string;
  googleAdsConversionLabel?: string;
}

// Declarar tipos globais
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function ConversionTracking({
  eventName,
  eventData = {},
  googleAdsConversionId,
  googleAdsConversionLabel,
}: ConversionTrackingProps) {
  useEffect(() => {
    // Google Analytics / GA4 Event
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        event_category: 'Landing Page',
        ...eventData,
      });

      // Google Ads Conversion (se configurado)
      if (googleAdsConversionId && googleAdsConversionLabel) {
        window.gtag('event', 'conversion', {
          send_to: `${googleAdsConversionId}/${googleAdsConversionLabel}`,
          value: eventData.value || 1.0,
          currency: 'BRL',
          transaction_id: eventData.transaction_id,
        });
      }
    }

    // Meta Pixel Event
    if (typeof window.fbq === 'function') {
      window.fbq('track', eventName === 'lead_captured' ? 'Lead' : eventName, {
        content_name: eventData.productInterest,
        content_category: 'landing_page',
        value: eventData.value || 1.0,
        currency: 'BRL',
      });
    }

    // Data Layer para GTM
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: eventName,
        ...eventData,
      });
    }

    console.log('[ConversionTracking] Event fired:', eventName, eventData);
  }, [eventName, eventData, googleAdsConversionId, googleAdsConversionLabel]);

  // Componente não renderiza nada visualmente
  return null;
}
