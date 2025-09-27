import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PDFGenerationRequest {
  proposalData: any;
  templateId: string;
  shouldSaveToPermanentStorage?: boolean;
  templatePreferences?: {
    tone: string;
    includeWarranty: boolean;
    includeTechnicalSpecs: boolean;
  };
}

interface PDFGenerationResult {
  success: boolean;
  pdfUrl?: string;
  error?: string;
  proposalId?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { proposalData, templateId, shouldSaveToPermanentStorage = true, templatePreferences } = await req.json() as PDFGenerationRequest;

    console.log('🚀 Starting async PDF generation for proposal:', proposalData?.id);

    // Generate PDF using PDF.co API
    const pdfCoApiKey = Deno.env.get('PDFCO_API_KEY');
    if (!pdfCoApiKey) {
      throw new Error('PDF.co API key not configured');
    }

    // Map data to PDF template format
    const templateData = mapDataToPDFTemplate(proposalData, templateId);

    // Call PDF.co API
    const pdfResponse = await fetch('https://api.pdf.co/v1/pdf/convert/from/html', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': pdfCoApiKey,
      },
      body: JSON.stringify({
        html: generateHTMLContent(templateData),
        name: `proposta-${proposalData.proposal_number || 'temp'}.pdf`,
        async: false,
        margins: "10mm",
        orientation: "Portrait"
      }),
    });

    if (!pdfResponse.ok) {
      throw new Error(`PDF.co API error: ${pdfResponse.statusText}`);
    }

    const pdfResult = await pdfResponse.json();
    
    if (!pdfResult.url) {
      throw new Error('PDF generation failed: no URL returned');
    }

    // Save proposal to database immediately
    const proposalNumber = generateProposalNumber();
    const { data: savedProposal, error: saveError } = await supabase
      .from('proposals')
      .insert({
        proposal_number: proposalNumber,
        title: proposalData.title || `Proposta ${proposalNumber}`,
        description: proposalData.description || '',
        project_type: proposalData.project_type || 'shingle',
        total_value: proposalData.total_value || 0,
        discount_value: proposalData.discount_value || 0,
        discount_percentage: proposalData.discount_percentage || 0,
        final_value: proposalData.final_value || proposalData.total_value || 0,
        status: 'draft',
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        acceptance_link: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/proposal/${proposalNumber}`,
        client_data: proposalData.client_data || {},
        created_by: proposalData.created_by,
        pdf_status: 'processing',
        pdf_url: pdfResult.url
      })
      .select()
      .single();

    if (saveError) {
      throw new Error(`Database save error: ${saveError.message}`);
    }

    console.log('✅ Proposal saved, starting background PDF processing');

    // Start background processing
    if (shouldSaveToPermanentStorage) {
      processPDFInBackground(savedProposal.id, pdfResult.url, supabase);
    }

    // Send immediate success notification
    await supabase.from('user_notifications').insert({
      user_id: proposalData.created_by,
      type: 'pdf_processing',
      title: 'Proposta Criada',
      message: 'Sua proposta foi criada com sucesso. O PDF está sendo processado.',
      data: { proposalId: savedProposal.id, proposalNumber }
    });

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: pdfResult.url,
        proposalId: savedProposal.id,
        proposalNumber: proposalNumber
      } as PDFGenerationResult),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('❌ PDF generation failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      } as PDFGenerationResult),
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

async function processPDFInBackground(proposalId: string, pdfUrl: string, supabase: any) {
  try {
    console.log('🔄 Processing PDF in background for proposal:', proposalId);
    
    // Wait a bit to ensure PDF is available
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Save PDF to permanent storage
    const { data: saveResult, error: saveError } = await supabase.functions.invoke('save-proposal-pdf', {
      body: {
        pdfUrl,
        proposalId,
        shouldCompress: true
      }
    });

    if (saveError) {
      throw new Error(`PDF save failed: ${saveError.message}`);
    }

    // Update proposal status
    await supabase
      .from('proposals')
      .update({
        pdf_status: 'ready',
        pdf_url: saveResult?.finalPdfUrl || pdfUrl,
        pdf_processing_started_at: null
      })
      .eq('id', proposalId);

    // Send success notification
    await supabase.from('user_notifications').insert({
      user_id: (await supabase.from('proposals').select('created_by').eq('id', proposalId).single()).data?.created_by,
      type: 'pdf_ready',
      title: 'PDF Pronto!',
      message: 'Sua proposta em PDF está pronta para download.',
      data: { 
        proposalId, 
        pdfUrl: saveResult?.finalPdfUrl || pdfUrl 
      }
    });

    console.log('✅ Background PDF processing completed for proposal:', proposalId);

  } catch (error: any) {
    console.error('❌ Background PDF processing failed:', error);
    
    // Update proposal with error status
    await supabase
      .from('proposals')
      .update({
        pdf_status: 'error',
        pdf_error: error.message,
        pdf_processing_started_at: null
      })
      .eq('id', proposalId);

    // Send error notification
    await supabase.from('user_notifications').insert({
      user_id: (await supabase.from('proposals').select('created_by').eq('id', proposalId).single()).data?.created_by,
      type: 'pdf_error',
      title: 'Erro no PDF',
      message: 'Ocorreu um erro ao processar seu PDF. Tente novamente.',
      data: { proposalId, error: error.message }
    });
  }
}

function generateProposalNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PROP-${year}${month}-${random}`;
}

function mapDataToPDFTemplate(data: any, templateId: string): Record<string, any> {
  const clientName = getClientName(data);
  
  return {
    // Client information
    client_name: clientName,
    client_email: data.client_data?.email || data.customer_email || '',
    client_phone: data.client_data?.phone || data.whatsapp_number || '',
    client_address: formatAddress(data.client_data?.address || data.address),
    
    // Proposal details
    proposal_number: data.proposal_number || generateProposalNumber(),
    proposal_date: formatDate(new Date()),
    valid_until: formatDate(data.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    
    // Financial information
    total_value: formatCurrency(data.total_value || 0),
    discount_value: formatCurrency(data.discount_value || 0),
    discount_percentage: data.discount_percentage || 0,
    final_value: formatCurrency(data.final_value || data.total_value || 0),
    
    // Project information
    project_type: data.project_type || 'shingle',
    description: data.description || '',
    
    // Items
    items_html: formatItemsToHTML(data.items || []),
    items_text: formatItems(data.items || [])
  };
}

function getClientName(data: any): string {
  return data.client_data?.name || 
         data.customer_name || 
         data.whatsapp_name || 
         'Cliente';
}

function formatAddress(address: any): string {
  if (typeof address === 'string') return address;
  if (!address) return '';
  
  const parts = [
    address.street,
    address.number,
    address.neighborhood,
    address.city,
    address.state,
    address.zipCode
  ].filter(Boolean);
  
  return parts.join(', ');
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR');
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatItemsToHTML(items: any[]): string {
  if (!items || items.length === 0) return '';
  
  let html = '<table style="width: 100%; border-collapse: collapse;">';
  html += '<thead><tr><th>Item</th><th>Qtd</th><th>Valor Unit.</th><th>Total</th></tr></thead>';
  html += '<tbody>';
  
  items.forEach(item => {
    html += `<tr>
      <td>${item.custom_name || item.name || 'Item'}</td>
      <td>${item.quantity || 1}</td>
      <td>${formatCurrency(item.unit_price || 0)}</td>
      <td>${formatCurrency(item.total_price || 0)}</td>
    </tr>`;
  });
  
  html += '</tbody></table>';
  return html;
}

function formatItems(items: any[]): string {
  if (!items || items.length === 0) return '';
  
  return items.map(item => 
    `${item.custom_name || item.name || 'Item'} - Qtd: ${item.quantity || 1} - ${formatCurrency(item.total_price || 0)}`
  ).join('\n');
}

function generateHTMLContent(data: Record<string, any>): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 40px; }
        .proposal-number { font-size: 24px; font-weight: bold; color: #2563eb; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #1f2937; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #f9fafb; font-weight: bold; }
        .total-section { background-color: #f0f9ff; padding: 20px; margin-top: 30px; }
        .total-value { font-size: 24px; font-weight: bold; color: #2563eb; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PROPOSTA COMERCIAL</h1>
        <div class="proposal-number">${data.proposal_number}</div>
        <p>Data: ${data.proposal_date} | Válida até: ${data.valid_until}</p>
      </div>

      <div class="section">
        <div class="section-title">Dados do Cliente</div>
        <p><strong>Nome:</strong> ${data.client_name}</p>
        <p><strong>E-mail:</strong> ${data.client_email}</p>
        <p><strong>Telefone:</strong> ${data.client_phone}</p>
        <p><strong>Endereço:</strong> ${data.client_address}</p>
      </div>

      <div class="section">
        <div class="section-title">Descrição do Projeto</div>
        <p>${data.description}</p>
      </div>

      <div class="section">
        <div class="section-title">Itens da Proposta</div>
        ${data.items_html}
      </div>

      <div class="total-section">
        <p><strong>Valor Total:</strong> ${data.total_value}</p>
        ${data.discount_value > 0 ? `<p><strong>Desconto:</strong> ${data.discount_value} (${data.discount_percentage}%)</p>` : ''}
        <p class="total-value">Valor Final: ${data.final_value}</p>
      </div>

      <div class="section">
        <p><em>Esta proposta é válida até ${data.valid_until}.</em></p>
      </div>
    </body>
    </html>
  `;
}