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
          proposal_items (*)
        `)
        .eq('id', proposalId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch proposal: ${error.message}`);
      }

      // Transform database data to PDF template format
      dataToSend = {
        client: proposal.client_data,
        items: proposal.proposal_items || [],
        calculations: proposal.calculations_data || {},
        pricing: {
          subtotal: proposal.total_value,
          discount: proposal.discount_value,
          discountPercent: proposal.discount_percentage,
          total: proposal.final_value
        },
        proposal: {
          number: proposal.proposal_number,
          validUntil: proposal.valid_until,
          createdAt: proposal.created_at
        }
      };
    }

    if (!dataToSend) {
      throw new Error('No proposal data provided');
    }

    // Map data to PDF.co template variables
    const templateData = mapDataToPDFTemplate(dataToSend, templateId);

    console.log('📋 Template data prepared:', Object.keys(templateData));

    // Call PDF.co API
    const pdfcoResponse = await fetch('https://api.pdf.co/v1/pdf/convert/from/html-template', {
      method: 'POST',
      headers: {
        'x-api-key': pdfcoApiKey,   
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        templateId: parseInt(templateId),
        templateData: templateData,
        name: options.name || `Proposta_${proposalId || Date.now()}`,
        async: options.async !== false,
        orientation: options.orientation || 'Portrait',
        margins: options.margins || '10px'
      })
    });

    const pdfcoResult = await pdfcoResponse.json();

    if (!pdfcoResponse.ok) {
      console.error('❌ PDF.co API error:', pdfcoResult);
      throw new Error(`PDF.co API error: ${pdfcoResult.message || 'Unknown error'}`);
    }

    console.log('✅ PDF.co response received:', pdfcoResult);

    // Store PDF generation record in database
    if (proposalId) {
      const { error: logError } = await supabase
        .from('proposal_pdfs')
        .insert({
          proposal_id: proposalId,
          template_id: templateId,
          pdf_url: pdfcoResult.url,
          job_id: pdfcoResult.jobId,
          status: pdfcoResult.url ? 'completed' : 'processing',
          generated_at: new Date().toISOString()
        });

      if (logError) {
        console.warn('⚠️ Failed to log PDF generation:', logError);
      }
    }

    const result: PDFGenerationResult = {
      success: true,
      pdfUrl: pdfcoResult.url,
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

function mapDataToPDFTemplate(data: any, templateId: string): Record<string, any> {
  // Base mapping for all templates
  const baseMapping = {
    // Client information
    clientName: data.client?.name || 'Cliente',
    clientPhone: data.client?.phone || '',
    clientEmail: data.client?.email || '',
    clientAddress: formatAddress(data.client?.address),
    
    // Proposal information
    proposalNumber: data.proposal?.number || generateProposalNumber(),
    proposalDate: formatDate(data.proposal?.createdAt || new Date()),
    validUntil: formatDate(data.proposal?.validUntil),
    
    // Pricing
    subtotal: formatCurrency(data.pricing?.subtotal || 0),
    discount: formatCurrency(data.pricing?.discount || 0),
    discountPercent: data.pricing?.discountPercent || 0,
    total: formatCurrency(data.pricing?.total || 0),
    
    // Items
    items: formatItems(data.items || []),
    
    // Company information
    companyName: 'Drystore',
    companyPhone: '(11) 9999-9999',
    companyEmail: 'contato@drystore.com.br',
    companyWebsite: 'www.drystore.com.br'
  };

  // Template-specific mappings
  switch (templateId) {
    case '14564': // Shingle template
      return {
        ...baseMapping,
        // Shingle-specific variables
        roofArea: data.calculations?.totalRealArea || 0,
        shingleType: data.calculations?.shingleType || 'Oakridge',
        shingleBundles: data.calculations?.shingleBundles || 0,
        warrantyYears: 15,
        installationTime: '7-10 dias úteis'
      };
      
    default:
      return baseMapping;
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

function formatItems(items: any[]): string {
  if (!items.length) return '';
  
  return items.map(item => {
    return `${item.name} - Qtd: ${item.quantity} ${item.unit} - ${formatCurrency(item.totalPrice)}`;
  }).join('\n');
}

function generateProposalNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PROP-${year}${month}-${random}`;
}