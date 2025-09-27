import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PDFGenerationRequest {
  proposalId?: string;
  proposalData?: {
    client: any;
    items: any[];
    calculations: any;
    pricing: any;
    proposal?: any;
  };
  templateId: string;
  options?: {
    async?: boolean;
    name?: string;
    orientation?: 'Portrait' | 'Landscape';
    margins?: string;
  };
}

interface PDFGenerationResult {
  success: boolean;
  pdfUrl?: string;
  error?: string;
  jobId?: string;
  isCompressed?: boolean;
  originalSize?: number;
  finalSize?: number;
  compressionRatio?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const pdfcoApiKey = Deno.env.get('PDFCO_API_KEY');
    
    if (!pdfcoApiKey) {
      throw new Error('PDF.co API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      proposalId,
      proposalData,
      templateId,
      options = {}
    }: PDFGenerationRequest = await req.json();

    console.log(`📄 Starting PDF generation for template ${templateId}`);

    // Get proposal data from database if proposalId provided
    let dataToSend = proposalData;
    if (proposalId && !proposalData) {
      const { data: proposal, error } = await supabase
        .from('proposals')
        .select(`
          *,
          proposal_items (*),
          profiles!created_by (
            display_name
          )
        `)
        .eq('id', proposalId)
        .single();

      if (error) {
        throw new Error(`Proposta não encontrada: ${error.message}`);
      }

      // Pass the full proposal data for template mapping
      dataToSend = proposal;
    }

    if (!dataToSend) {
      throw new Error('No proposal data provided');
    }

    // Map data to PDF.co template variables
    const templateData = mapDataToPDFTemplate(dataToSend, templateId);
    const proposalNumber = (dataToSend as any).proposal_number || generateProposalNumber();

    console.log('📋 Template data prepared:', Object.keys(templateData));

    // Call PDF.co API
    const pdfcoResponse = await fetch('https://api.pdf.co/v1/pdf/convert/from/html', {
      method: 'POST',
      headers: {
        'x-api-key': pdfcoApiKey,   
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        templateId: parseInt(templateId),
        templateData: JSON.stringify(templateData),
        name: options.name || `Proposta_${proposalId || Date.now()}.pdf`,
        mediaType: 'print',
        paperSize: 'Letter',
        orientation: options.orientation || 'Portrait',
        printBackground: true,
        header: '',
        footer: '',
        margins: options.margins || '40px 20px 20px 20px',
        async: options.async !== false
      })
    });

    const pdfcoResult = await pdfcoResponse.json();

    if (!pdfcoResponse.ok) {
      console.error('❌ PDF.co API error:', pdfcoResult);
      throw new Error(`PDF.co API error: ${pdfcoResult.message || 'Unknown error'}`);
    }

    console.log('✅ PDF.co response received:', pdfcoResult);

    // Wait for PDF to be ready with enhanced retries
    console.log('🔍 Verifying PDF readiness with enhanced validation:', pdfcoResult.url);
    let pdfReadyForSave = false;
    
    try {
      await waitForPDFReadiness(pdfcoResult.url, 5, 2000); // 5 attempts, 2s intervals
      pdfReadyForSave = true;
      console.log('✅ PDF verified as accessible and ready for save');
    } catch (error) {
      console.warn('⚠️ PDF readiness check failed, will attempt save anyway with fallback');
      pdfReadyForSave = false;
    }

    // Save PDF to permanent storage with robust error handling
    console.log('💾 Attempting to save PDF to permanent storage...');
    let finalPdfUrl = pdfcoResult.url; // fallback to temporary URL
    let isCompressed = false;
    let originalSize = 0;
    let finalSize = 0;
    let compressionRatio = 0;
    let saveSuccess = false;
    
    if (pdfReadyForSave && proposalId) {
      try {
        // Additional delay to ensure PDF is fully available
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const saveResult = await supabase.functions.invoke('save-proposal-pdf', {
          body: {
            pdfUrl: pdfcoResult.url,
            proposalId: proposalId,
            proposalNumber: proposalNumber,
            shouldCompress: true,
            compressionLevel: 'medium'
          }
        });
        
        if (saveResult.error) {
          throw new Error(`Save PDF function error: ${saveResult.error.message}`);
        }
        
        if (saveResult.data?.success && saveResult.data?.finalUrl) {
          finalPdfUrl = saveResult.data.finalUrl;
          isCompressed = saveResult.data.isCompressed || false;
          originalSize = saveResult.data.originalSize || 0;
          finalSize = saveResult.data.finalSize || 0;
          compressionRatio = saveResult.data.compressionRatio || 0;
          saveSuccess = true;
          console.log('✅ PDF saved permanently with compression info:', {
            finalPdfUrl,
            isCompressed,
            originalSize,
            finalSize,
            compressionRatio
          });
        } else {
          throw new Error('Save PDF function returned invalid response');
        }
      } catch (saveError: any) {
        console.warn('⚠️ PDF save failed, using temporary URL as fallback:', saveError);
        saveSuccess = false;
        // Continue with temporary URL as fallback
      }
    } else {
      console.log('⚠️ Skipping permanent save due to PDF readiness issues or missing proposalId, using temporary URL');
    }

    // Store PDF generation record in database with permanent URL
    if (proposalId) {
      const pdfStatus = saveSuccess ? 'completed' : 'temporary';
      const { error: logError } = await supabase
        .from('proposal_pdfs')
        .insert({
          proposal_id: proposalId,
          template_id: templateId,
          pdf_url: finalPdfUrl,
          job_id: pdfcoResult.jobId,
          status: pdfStatus,
          is_compressed: isCompressed,
          original_size: originalSize,
          final_size: finalSize,
          compression_ratio: compressionRatio,
          generated_at: new Date().toISOString()
        });

      if (logError) {
        console.warn('⚠️ Failed to log PDF generation:', logError);
      } else {
        console.log(`✅ PDF generation logged with status: ${pdfStatus}`);
      }
    }

    const result: PDFGenerationResult = {
      success: true,
      pdfUrl: finalPdfUrl,
      isCompressed,
      originalSize,
      finalSize,
      compressionRatio,
      jobId: pdfcoResult.jobId
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('❌ PDF generation error:', error);
    
    const result: PDFGenerationResult = {
      success: false,
      error: error.message
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

// Enhanced helper function to wait for PDF readiness
async function waitForPDFReadiness(pdfUrl: string, maxRetries: number = 5, baseWaitTime: number = 1000): Promise<void> {
  console.log(`🔄 Starting PDF readiness check with ${maxRetries} max retries...`);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per attempt
      
      const response = await fetch(pdfUrl, { 
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Supabase-Edge-Function'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok && response.headers.get('content-type')?.includes('pdf')) {
        console.log(`✅ PDF is ready on attempt ${i + 1}`);
        return; // PDF is ready and valid
      }
      
      console.log(`❌ Attempt ${i + 1}/${maxRetries}: PDF not ready (status: ${response.status}, content-type: ${response.headers.get('content-type')})`);
    } catch (error: any) {
      console.log(`❌ Attempt ${i + 1}/${maxRetries}: PDF check failed - ${error.message}`);
    }
    
    if (i < maxRetries - 1) {
      const waitTime = baseWaitTime * Math.pow(1.5, i); // Exponential backoff: 1s, 1.5s, 2.25s, 3.375s
      console.log(`⏳ Waiting ${Math.round(waitTime)}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error(`PDF not ready after ${maxRetries} attempts with enhanced validation`);
}

function mapDataToPDFTemplate(data: any, templateId: string): Record<string, any> {
  // Template-specific mappings
  switch (templateId) {
    case '14564': // Shingle template - exact variables mapping
      return {
        nome_do_cliente: getClientName(data),
        data_proposta: formatDate(data.created_at),
        necessidades_do_projeto: data.description || 'Projeto de cobertura com telhas shingle de alta qualidade',
        modelagem_telhado: inferModelingFromItems(data.proposal_items || []),
        linha_shingle: inferShingleLineFromItems(data.proposal_items || []),
        listagem_dos_produtos: formatItemsToHTML(data.proposal_items || []),
        valor_total: formatCurrency(data.final_value || data.total_value || 0),
        nome_vendedor: data.profiles?.display_name || 'Equipe Drystore'
      };
      
    default:
      // Generic template mapping (fallback)
      return {
        clientName: getClientName(data),
        proposalDate: formatDate(data.created_at),
        proposalNumber: data.proposal_number || generateProposalNumber(),
        total: formatCurrency(data.final_value || data.total_value || 0),
        items: formatItems(data.proposal_items || [])
      };
  }
}

function formatAddress(address: any): string {
  if (!address) return '';
  
  return [
    address.street,
    address.number,
    address.complement,
    address.neighborhood,
    `${address.city} - ${address.state}`,
    address.zipCode
  ].filter(Boolean).join(', ');
}

function formatDate(date: string | Date): string {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR');
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function getClientName(data: any): string {
  // Use client_data from proposal, which contains customer information
  if (data.client_data) {
    return data.client_data.name || 
           data.client_data.customerName || 
           data.client_data.clientName || 
           'Cliente';
  }
  
  // Fallback to other sources
  return data.customer_name || 
         data.title?.split(' - ')[1] || 
         'Cliente';
}

function inferModelingFromItems(items: any[]): string {
  if (!items.length) return 'Área: A definir | Inclinação: Padrão | Estrutura: Conforme projeto';
  
  // Try to extract area information from items
  const totalArea = items.reduce((sum, item) => {
    if (item.unit === 'm²' || item.unit === 'm2') {
      return sum + (item.quantity || 0);
    }
    return sum;
  }, 0);
  
  return `Área total: ${totalArea}m² | Inclinação: Conforme projeto | Estrutura: Madeira/metálica`;
}

function inferShingleLineFromItems(items: any[]): string {
  // Look for shingle products in items to determine line
  const shingleItem = items.find(item => 
    item.name?.toLowerCase().includes('shingle') ||
    item.name?.toLowerCase().includes('telha')
  );
  
  if (shingleItem?.name) {
    if (shingleItem.name.toLowerCase().includes('supreme')) return 'Linha Supreme';
    if (shingleItem.name.toLowerCase().includes('premium')) return 'Linha Premium';
    if (shingleItem.name.toLowerCase().includes('classic')) return 'Linha Classic';
  }
  
  return 'Linha Premium';
}

function formatItemsToHTML(items: any[]): string {
  if (!items.length) {
    return '<div style="padding: 15px; background: white;"><div style="text-align: center; color: #666;">Nenhum item adicionado</div></div>';
  }
  
  const itemsHTML = items.map(item => {
    const itemName = `${item.name} - ${item.quantity} ${item.unit || 'un'}`;
    const itemPrice = formatCurrency(item.total_price || item.price || 0);
    
    return `<div style='display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd;'>
      <span>${itemName}</span>
      <span style='font-weight: bold;'>${itemPrice}</span>
    </div>`;
  }).join('');
  
  return `<div style='padding: 15px; background: white;'>${itemsHTML}</div>`;
}

function formatItems(items: any[]): string {
  if (!items.length) return '';
  
  return items.map(item => {
    return `${item.name} - Qtd: ${item.quantity} ${item.unit} - ${formatCurrency(item.total_price || item.price || 0)}`;
  }).join('\n');
}

function generateProposalNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PROP-${year}${month}-${random}`;
}