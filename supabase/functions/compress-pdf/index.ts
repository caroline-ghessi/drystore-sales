import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompressPDFRequest {
  pdfUrl: string;
  compressionLevel?: 'low' | 'medium' | 'high';
  options?: {
    name?: string;
  };
}

interface CompressPDFResult {
  success: boolean;
  compressedUrl?: string;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
  error?: string;
}

serve(async (req) => {
  console.log('=== COMPRESS PDF FUNCTION STARTED ===');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfUrl, compressionLevel = 'medium', options = {} }: CompressPDFRequest = await req.json();
    console.log('Compress PDF request:', { pdfUrl, compressionLevel });

    if (!pdfUrl) {
      throw new Error('PDF URL is required');
    }

    // Get PDF.co API key
    const pdfCoApiKey = Deno.env.get('PDFCO_API_KEY');
    if (!pdfCoApiKey) {
      throw new Error('PDFCO_API_KEY not configured');
    }

    // Configure compression settings based on level
    const compressionSettings = {
      low: { imageQuality: 80, compressImages: true },
      medium: { imageQuality: 60, compressImages: true },
      high: { imageQuality: 40, compressImages: true }
    };

    const settings = compressionSettings[compressionLevel];

    // Call PDF.co Compress API
    const compressResponse = await fetch('https://api.pdf.co/v1/pdf/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': pdfCoApiKey,
      },
      body: JSON.stringify({
        url: pdfUrl,
        name: options.name || 'compressed-proposal.pdf',
        ...settings,
        async: false,
      }),
    });

    const compressResult = await compressResponse.json();
    console.log('PDF.co compress response:', compressResult);

    if (!compressResponse.ok || compressResult.error) {
      throw new Error(compressResult.message || 'PDF compression failed');
    }

    // Get file sizes for comparison
    let originalSize = 0;
    let compressedSize = 0;
    
    try {
      const originalResponse = await fetch(pdfUrl, { method: 'HEAD' });
      originalSize = parseInt(originalResponse.headers.get('content-length') || '0');
      
      const compressedResponse = await fetch(compressResult.url, { method: 'HEAD' });
      compressedSize = parseInt(compressedResponse.headers.get('content-length') || '0');
    } catch (error) {
      console.warn('Could not get file sizes:', error);
    }

    const compressionRatio = originalSize > 0 ? ((originalSize - compressedSize) / originalSize * 100) : 0;

    console.log('✅ PDF compression successful:', {
      originalSize,
      compressedSize,
      compressionRatio: compressionRatio.toFixed(1) + '%'
    });

    const result: CompressPDFResult = {
      success: true,
      compressedUrl: compressResult.url,
      originalSize,
      compressedSize,
      compressionRatio: Math.round(compressionRatio)
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ PDF compression error:', error);
    
    const result: CompressPDFResult = {
      success: false,
      error: error.message || 'Unknown error during PDF compression'
    };

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});