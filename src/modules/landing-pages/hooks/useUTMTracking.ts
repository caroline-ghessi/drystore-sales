import { useEffect, useState } from 'react';

export interface UTMParams {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  gclid: string | null;
  fbclid: string | null;
}

const STORAGE_KEY = 'lp_utm_params';

export function useUTMTracking(): UTMParams {
  const [utmParams, setUtmParams] = useState<UTMParams>({
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    gclid: null,
    fbclid: null,
  });

  useEffect(() => {
    // Tentar recuperar do sessionStorage primeiro
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUtmParams(parsed);
        return;
      } catch {
        // Ignorar erro de parse
      }
    }

    // Capturar da URL
    const searchParams = new URLSearchParams(window.location.search);
    
    const params: UTMParams = {
      utmSource: searchParams.get('utm_source'),
      utmMedium: searchParams.get('utm_medium'),
      utmCampaign: searchParams.get('utm_campaign'),
      utmContent: searchParams.get('utm_content'),
      utmTerm: searchParams.get('utm_term'),
      gclid: searchParams.get('gclid'),
      fbclid: searchParams.get('fbclid'),
    };

    // Salvar no sessionStorage se tiver algum parâmetro
    const hasAnyParam = Object.values(params).some(v => v !== null);
    if (hasAnyParam) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    }

    setUtmParams(params);
  }, []);

  return utmParams;
}
