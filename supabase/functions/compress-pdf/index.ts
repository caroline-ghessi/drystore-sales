import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

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
  skipAvailabilityCheck?: boolean;
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
    const { pdfUrl, compressionLevel = 'medium', options = {}, skipAvailabilityCheck = false }: CompressPDFRequest = await req.json();
    console.log('Compress PDF request:', { pdfUrl, compressionLevel, skipAvailabilityCheck });

    if (!pdfUrl) {
      throw new Error('PDF URL is required');
    }

    // Get PDF.co API key
    const pdfCoApiKey = Deno.env.get('PDFCO_API_KEY');
    if (!pdfCoApiKey) {
      throw new Error('PDFCO_API_KEY not configured');
    }

    // Check PDF availability with retry logic
    if (!skipAvailabilityCheck) {
      await waitForPDFAvailability(pdfUrl);
    }

    // Configure compression settings based on level  
    const compressionConfigs = {
      low: {
        images: {
          color: {
            compression: {
              compression_format: 'jpeg',
              compression_params: { quality: 80 }
            }
          },
          grayscale: {
            compression: {
              compression_format: 'jpeg', 
              compression_params: { quality: 80 }
            }
          }
        }
      },
      medium: {
        images: {
          color: {
            compression: {
              compression_format: 'jpeg',
              compression_params: { quality: 60 }
            }
          },
          grayscale: {
            compression: {
              compression_format: 'jpeg',
              compression_params: { quality: 60 }
            }
          }
        }
      },
      high: {
        images: {
          color: {
            compression: {
              compression_format: 'jpeg',
              compression_params: { quality: 40 }
            }
          },
          grayscale: {
            compression: {
              compression_format: 'jpeg',
              compression_params: { quality: 40 }
            }
          }
        }
      }
    };

    const config = compressionConfigs[compressionLevel];

    console.log('🗜️ Calling PDF.co compress API with config:', JSON.stringify(config, null, 2));

    // Call PDF.co Compress API with correct endpoint and structure
    const compressResponse = await fetch('https://api.pdf.co/v1/pdf/compress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': pdfCoApiKey,
      },
      body: JSON.stringify({
        url: pdfUrl,
        name: options.name || 'compressed-proposal.pdf',
        async: false,
        config: config
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

// Helper function to wait for PDF availability with retry logic
async function waitForPDFAvailability(pdfUrl: string, maxRetries: number = 5): Promise<void> {
  console.log(`🔍 Checking PDF availability: ${pdfUrl}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(pdfUrl, { method: 'HEAD' });
      
      if (response.ok) {
        console.log(`✅ PDF is available after ${attempt} attempt(s)`);
        return;
      }
      
      console.log(`❌ Attempt ${attempt}/${maxRetries}: PDF not ready (status: ${response.status})`);
    } catch (error) {
      console.log(`❌ Attempt ${attempt}/${maxRetries}: Network error -`, (error as Error).message || error);
    }
    
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`PDF not available after ${maxRetries} attempts. The PDF might still be processing on PDF.co servers.`);
}