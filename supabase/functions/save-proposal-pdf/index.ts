import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SavePDFRequest {
  pdfUrl: string;
  proposalId: string;
  proposalNumber?: string;
  shouldCompress?: boolean;
  compressionLevel?: 'low' | 'medium' | 'high';
}

interface SavePDFResult {
  success: boolean;
  finalUrl?: string;
  isCompressed?: boolean;
  originalSize?: number;
  finalSize?: number;
  compressionRatio?: number;
  error?: string;
}

serve(async (req) => {
  console.log('=== SAVE PROPOSAL PDF FUNCTION STARTED ===');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfUrl, proposalId, proposalNumber, shouldCompress = true, compressionLevel = 'medium' }: SavePDFRequest = await req.json();
    
    console.log('Save PDF request:', { pdfUrl, proposalId, proposalNumber, shouldCompress });

    if (!pdfUrl || !proposalId) {
      throw new Error('PDF URL and Proposal ID are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the PDF with retry logic
    console.log('📥 Downloading PDF from temporary URL with retry logic...');
    let pdfBuffer: ArrayBuffer | null = null;
    let downloadAttempts = 0;
    const maxDownloadAttempts = 3;
    
    while (downloadAttempts < maxDownloadAttempts && !pdfBuffer) {
      try {
        downloadAttempts++;
        console.log(`📥 Download attempt ${downloadAttempts}/${maxDownloadAttempts}...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
        
        const downloadResponse = await fetch(pdfUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Supabase-Edge-Function'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!downloadResponse.ok) {
          throw new Error(`HTTP ${downloadResponse.status}: ${downloadResponse.statusText}`);
        }
        
        pdfBuffer = await downloadResponse.arrayBuffer();
        console.log(`✅ PDF downloaded successfully on attempt ${downloadAttempts}`);
        
      } catch (error: any) {
        console.error(`❌ Download attempt ${downloadAttempts} failed:`, error.message);
        
        if (downloadAttempts >= maxDownloadAttempts) {
          throw new Error(`Failed to download PDF after ${maxDownloadAttempts} attempts: ${error.message}`);
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, downloadAttempts) * 1000;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    if (!pdfBuffer) {
      throw new Error('Failed to download PDF - buffer is null');
    }

    let originalSize = pdfBuffer.byteLength;
    let isCompressed = false;
    let compressionRatio = 0;

    console.log(`📊 Original PDF size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

    // Compress if needed and size is large
    if (shouldCompress && originalSize > 5 * 1024 * 1024) { // Only compress if > 5MB
      try {
        console.log('🗜️ Starting PDF compression...');
        
        const pdfCoApiKey = Deno.env.get('PDFCO_API_KEY');
        if (!pdfCoApiKey) {
          throw new Error('PDFCO_API_KEY not configured');
        }

        // Convert buffer to blob for compression
        const formData = new FormData();
        formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }));
        formData.append('async', 'false');
        
        // Set compression level based on file size
        const compressionConfig = {
          low: { quality: 80 },
          medium: { quality: 60 },
          high: { quality: 40 }
        };

        const config = {
          images: {
            color: {
              compression: {
                compression_format: 'jpeg',
                compression_params: compressionConfig[compressionLevel]
              }
            },
            grayscale: {
              compression: {
                compression_format: 'jpeg', 
                compression_params: compressionConfig[compressionLevel]
              }
            }
          }
        };

        formData.append('config', JSON.stringify(config));

        const compressResponse = await fetch('https://api.pdf.co/v1/pdf/compress', {
          method: 'POST',
          headers: {
            'x-api-key': pdfCoApiKey,
          },
          body: formData,
        });

        const compressResult = await compressResponse.json();
        
        if (compressResponse.ok && compressResult.url) {
          // Download compressed PDF
          const compressedResponse = await fetch(compressResult.url);
          if (compressedResponse.ok) {
            pdfBuffer = await compressedResponse.arrayBuffer();
            isCompressed = true;
            compressionRatio = Math.round(((originalSize - pdfBuffer.byteLength) / originalSize) * 100);
            console.log(`✅ PDF compressed successfully! Saved ${compressionRatio}% space`);
            console.log(`📊 Compressed size: ${(pdfBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
          }
        }
      } catch (compressionError) {
        console.warn('⚠️ PDF compression failed, using original:', compressionError);
        // Continue with original PDF
      }
    }

    // Generate file path
    const now = new Date();
    const year = now.getFullYear();
    const fileName = proposalNumber ? 
      `${proposalNumber}.pdf` : 
      `PROP-${proposalId.slice(-8)}.pdf`;
    const filePath = `propostas/${year}/${fileName}`;

    console.log(`💾 Uploading PDF to: ${filePath}`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('proposal-assets')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('proposal-assets')
      .getPublicUrl(filePath);

    const finalUrl = urlData.publicUrl;
    console.log(`✅ PDF saved successfully: ${finalUrl}`);

    const result: SavePDFResult = {
      success: true,
      finalUrl,
      isCompressed,
      originalSize,
      finalSize: pdfBuffer.byteLength,
      compressionRatio: compressionRatio || 0
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Save PDF error:', error);
    
    const result: SavePDFResult = {
      success: false,
      error: error.message || 'Unknown error during PDF save'
    };

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});