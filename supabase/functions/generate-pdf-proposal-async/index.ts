import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PDFGenerationResult {
  success: boolean;
  pdfUrl?: string;
  proposalId?: string;
  templateId?: string;
  generatedAt?: string;
  error?: string;
  metadata?: any;
}

serve(async (req) => {
  console.log('=== ASYNC PDF GENERATION FUNCTION STARTED ===');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalData, templateId = 'default', shouldSaveToPermanentStorage = true } = await req.json();
    
    if (!proposalData) {
      throw new Error('No proposal data provided');
    }

    console.log('📄 Starting async PDF generation for template', templateId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se existe API key do PDF.co
    const pdfcoApiKey = Deno.env.get('PDFCO_API_KEY');
    if (!pdfcoApiKey) {
      throw new Error('PDFCO_API_KEY not configured');
    }

    // Mapear dados para template
    const templateData = mapDataToPDFTemplate(proposalData, templateId);
    const proposalNumber = generateProposalNumber();

    console.log('📋 Template data prepared:', Object.keys(templateData));

    // Chamar API do PDF.co para gerar PDF
    const pdfcoResponse = await fetch('https://api.pdf.co/v1/pdf/convert/from/html', {
      method: 'POST',
      headers: {
        'x-api-key': pdfcoApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        templateId: parseInt(templateId),
        templateData: JSON.stringify(templateData),
        name: `Proposta_${proposalNumber}.pdf`,
        mediaType: 'print',
        paperSize: 'Letter',
        orientation: 'Portrait',
        printBackground: true,
        header: '',
        footer: '',
        margins: '40px 20px 20px 20px',
        async: true
      })
    });

    const pdfcoResult = await pdfcoResponse.json();

    if (!pdfcoResponse.ok) {
      console.error('❌ PDF.co API error:', pdfcoResult);
      throw new Error(`PDF.co API error: ${pdfcoResult.message || 'Unknown error'}`);
    }

    console.log('✅ PDF.co response received:', pdfcoResult);

    const finalPdfUrl = pdfcoResult.url;
    console.log('📥 PDF.co URL obtained:', finalPdfUrl);

    // Salvar proposta imediatamente com status de processamento
    console.log('💾 Saving proposal with processing status...');
    
    const { data: savedProposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        proposal_number: proposalNumber,
        title: `Proposta ${proposalNumber}`,
        status: 'draft',
        project_type: proposalData.productType || 'shingle',
        total_value: proposalData.pricing?.finalValue || 0,
        final_value: proposalData.pricing?.finalValue || 0,
        created_by: proposalData.userId,
        pdf_status: 'processing',
        pdf_processing_started_at: new Date().toISOString(),
        pdf_url: finalPdfUrl, // URL temporária inicial
      })
      .select()
      .single();

    if (proposalError) {
      throw new Error(`Failed to save proposal: ${proposalError.message}`);
    }

    const finalProposalId = savedProposal.id;
    console.log('✅ Proposal saved with ID:', finalProposalId);

    // Processar PDF em background usando EdgeRuntime.waitUntil
    if (shouldSaveToPermanentStorage) {
      console.log('🔄 Starting background PDF processing...');
      
      // Usar setTimeout para processar em background (alternativa ao EdgeRuntime.waitUntil)
      setTimeout(() => {
        processPDFInBackground(finalPdfUrl, finalProposalId, proposalData.userId, supabase)
          .catch(error => console.error('Background processing failed:', error));
      }, 0);
    }

    const result: PDFGenerationResult = {
      success: true,
      pdfUrl: finalPdfUrl,
      proposalId: finalProposalId,
      templateId: templateId || 'default',
      generatedAt: new Date().toISOString(),
      metadata: {
        template: templateId || 'default',
        dataSource: 'direct',
        finalUrlType: 'temporary',
        pdfStatus: 'processing',
        message: 'PDF being processed in background. You will be notified when ready.'
      }
    };

    console.log('✅ Async PDF generation completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Async PDF generation error:', error);
    
    const result: PDFGenerationResult = {
      success: false,
      error: error.message || 'Unknown error during PDF generation'
    };

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Função para processar PDF em background
async function processPDFInBackground(
  pdfUrl: string, 
  proposalId: string, 
  userId: string,
  supabase: any
) {
  try {
    console.log('🔄 Background PDF processing started for proposal:', proposalId);
    
    // Aguardar um pouco para garantir que o PDF esteja disponível
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Chamar função de salvamento
    const saveResponse = await supabase.functions.invoke('save-proposal-pdf', {
      body: {
        pdfUrl,
        proposalId,
        proposalNumber: `PROP-${proposalId.slice(-8)}`,
        shouldCompress: true,
        compressionLevel: 'medium'
      }
    });

    if (saveResponse.data?.success) {
      console.log('✅ Background PDF save successful:', saveResponse.data.finalUrl);
      
      // Atualizar proposta com URL permanente
      await supabase
        .from('proposals')
        .update({
          pdf_status: 'ready',
          pdf_url: saveResponse.data.finalUrl,
          pdf_error: null
        })
        .eq('id', proposalId);

      // Enviar notificação ao usuário
      await supabase
        .from('user_notifications')
        .insert({
          user_id: userId,
          type: 'pdf_ready',
          title: 'PDF da Proposta Pronto',
          message: 'Seu PDF foi processado e está disponível para download.',
          data: {
            proposalId,
            pdfUrl: saveResponse.data.finalUrl,
            isCompressed: saveResponse.data.isCompressed,
            compressionRatio: saveResponse.data.compressionRatio
          }
        });

      console.log('📧 Notification sent to user:', userId);
      
    } else {
      throw new Error(saveResponse.error || 'Unknown error during PDF save');
    }
    
  } catch (error: any) {
    console.error('❌ Background PDF processing failed:', error);
    
    // Atualizar proposta com erro
    await supabase
      .from('proposals')
      .update({
        pdf_status: 'error',
        pdf_error: error.message
      })
      .eq('id', proposalId);

    // Enviar notificação de erro
    await supabase
      .from('user_notifications')
      .insert({
        user_id: userId,
        type: 'pdf_error',
        title: 'Erro no Processamento do PDF',
        message: 'Houve um problema ao processar seu PDF. Tente novamente.',
        data: {
          proposalId,
          error: error.message
        }
      });
  }
}

// Gerar número de proposta único
function generateProposalNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PROP-${timestamp}-${random}`;
}

// Mapear dados para template PDF.co
function mapDataToPDFTemplate(data: any, templateId: string): Record<string, any> {
  const templateData: Record<string, any> = {};

  // Dados básicos da proposta
  templateData.proposalNumber = generateProposalNumber();
  templateData.proposalDate = new Date().toLocaleDateString('pt-BR');
  templateData.clientName = getClientName(data);
  templateData.proposalTitle = `Proposta de ${data.productType || 'Produto'}`;
  
  // Dados do cliente
  if (data.clientData) {
    templateData.clientEmail = data.clientData.email || '';
    templateData.clientPhone = data.clientData.phone || '';
    templateData.clientCity = data.clientData.city || '';
    templateData.clientState = data.clientData.state || '';
  }

  // Dados do projeto
  if (data.calculationInput) {
    templateData.projectArea = data.calculationInput.roofSections?.[0]?.area || 0;
    templateData.shingleType = data.calculationInput.shingleType || 'Standard';
  }

  // Items da proposta
  if (data.pricing?.items) {
    templateData.items = formatItemsToHTML(data.pricing.items);
    templateData.itemsText = formatItems(data.pricing.items);
  }

  // Valores
  templateData.subtotal = formatCurrency(data.pricing?.subtotal || 0);
  templateData.discount = formatCurrency(data.pricing?.discountValue || 0);
  templateData.total = formatCurrency(data.pricing?.finalValue || 0);

  console.log('📋 Template data mapped for template', templateId, ':', Object.keys(templateData));
  
  return templateData;
}

// Helper functions
function getClientName(data: any): string {
  return data.clientData?.name || 
         data.customer_name || 
         data.whatsapp_name || 
         'Cliente';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function formatItemsToHTML(items: any[]): string {
  if (!items || items.length === 0) return '';
  
  return items.map(item => `
    <tr>
      <td>${item.name || item.custom_name}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.unit_price || 0)}</td>
      <td>${formatCurrency(item.total_price || 0)}</td>
    </tr>
  `).join('');
}

function formatItems(items: any[]): string {
  if (!items || items.length === 0) return '';
  
  return items.map(item => 
    `${item.name || item.custom_name}: ${item.quantity} un. - ${formatCurrency(item.total_price || 0)}`
  ).join('\n');
}