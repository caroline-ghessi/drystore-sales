import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SavePDFRequest {
  pdfUrl: string;
  proposalId: string;
  shouldCompress?: boolean;
}

interface SavePDFResult {
  success: boolean;
  finalPdfUrl?: string;
  error?: string;
  isCompressed?: boolean;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration not found');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { pdfUrl, proposalId, shouldCompress = false } = await req.json() as SavePDFRequest;

    console.log('📥 Starting PDF save process for proposal:', proposalId);

    // Download the PDF from the provided URL
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfSize = pdfBuffer.byteLength;
    
    console.log(`📄 Downloaded PDF: ${pdfSize} bytes`);

    let finalPdfBuffer = pdfBuffer;
    let isCompressed = false;

    // Compress PDF if it's larger than 5MB and compression is requested
    if (shouldCompress && pdfSize > 5 * 1024 * 1024) {
      try {
        const compressedBuffer = await compressPDF(pdfBuffer);
        if (compressedBuffer && compressedBuffer.byteLength < pdfSize) {
          finalPdfBuffer = compressedBuffer;
          isCompressed = true;
          console.log(`🗜️ PDF compressed: ${compressedBuffer.byteLength} bytes (${Math.round((1 - compressedBuffer.byteLength / pdfSize) * 100)}% reduction)`);
        }
      } catch (compressError) {
        console.warn('⚠️ PDF compression failed, using original:', compressError);
      }
    }

    // Get proposal details for file naming
    const { data: proposal } = await supabase
      .from('proposals')
      .select('proposal_number')
      .eq('id', proposalId)
      .single();

    const fileName = `${proposal?.proposal_number || proposalId}.pdf`;
    const filePath = `proposals/${new Date().getFullYear()}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('proposals-documents')
      .upload(filePath, finalPdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('proposals-documents')
      .getPublicUrl(filePath);

    console.log('✅ PDF saved to storage:', publicUrlData.publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        finalPdfUrl: publicUrlData.publicUrl,
        isCompressed,
        filePath
      } as SavePDFResult),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('❌ PDF save failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      } as SavePDFResult),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

async function compressPDF(pdfBuffer: ArrayBuffer): Promise<ArrayBuffer | null> {
  const pdfCoApiKey = Deno.env.get('PDFCO_API_KEY');
  if (!pdfCoApiKey) {
    console.warn('PDF.co API key not found, skipping compression');
    return null;
  }

  try {
    // Convert ArrayBuffer to base64
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    // Call PDF.co compression API
    const response = await fetch('https://api.pdf.co/v1/pdf/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': pdfCoApiKey,
      },
      body: JSON.stringify({
        file: `data:application/pdf;base64,${base64Pdf}`,
        profiles: 'balanced' // Options: max, balanced, fast
      }),
    });

    if (!response.ok) {
      throw new Error(`PDF.co compression failed: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.url) {
      throw new Error('PDF compression failed: no URL returned');
    }

    // Download compressed PDF
    const compressedResponse = await fetch(result.url);
    if (!compressedResponse.ok) {
      throw new Error('Failed to download compressed PDF');
    }

    return await compressedResponse.arrayBuffer();

  } catch (error) {
    console.error('PDF compression error:', error);
    return null;
  }
}