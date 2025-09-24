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
          proposal_items (*),
          crm_customers!conversation_id (
            name,
            email,
            phone,
            city,
            state
          ),
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
  // Try different sources for client name
  return data.client_data?.name || 
         data.crm_customers?.name || 
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