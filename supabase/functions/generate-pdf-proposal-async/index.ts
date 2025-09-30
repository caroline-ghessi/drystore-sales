/**
 * ✨ Função Unificada de Geração de PDF para Propostas
 * 
 * Esta função é responsável por TODA geração de PDFs de propostas:
 * 
 * 🆕 CRIAR NOVA PROPOSTA:
 *    - Input: { proposalData, templateId }
 *    - Cria registro no banco
 *    - Gera PDF via template PDF.co
 *    - Salva no Storage
 * 
 * 🔄 REGENERAR PDF EXISTENTE:
 *    - Input: { proposalId, templateId }
 *    - Busca dados da proposta no banco
 *    - Regenera PDF via template PDF.co
 *    - Atualiza URL no banco
 * 
 * Template usado: 14564 (Shingle Drystore)
 * 
 * ⚠️ Esta é a ÚNICA função para geração de PDFs de propostas!
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PDFGenerationRequest {
  proposalId?: string; // Para regenerar PDF de proposta existente
  proposalData?: any; // Para criar nova proposta
  templateId?: string;
  shouldSaveToPermanentStorage?: boolean;
}

interface PDFGenerationResult {
  success: boolean;
  pdfUrl?: string;
  error?: string;
  proposalId?: string;
  proposalNumber?: string;
  isNewProposal?: boolean;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('📥 Received request:', req.method);

  try {
    // Verificar configuração do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase configuration missing');
      throw new Error('Configuração do Supabase não encontrada');
    }

    console.log('✅ Supabase configuration found');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request data
    let requestData;
    try {
      requestData = await req.json() as PDFGenerationRequest;
      console.log('✅ Request data parsed:', {
        hasProposalId: !!requestData.proposalId,
        hasProposalData: !!requestData.proposalData,
        templateId: requestData.templateId
      });
    } catch (error) {
      console.error('❌ Failed to parse request JSON:', error);
      throw new Error('Dados da requisição inválidos');
    }

    const { proposalId, proposalData, templateId = '14564', shouldSaveToPermanentStorage = true } = requestData;

    // Validar que pelo menos um dos dois foi fornecido
    if (!proposalId && !proposalData) {
      throw new Error('É necessário fornecer proposalId (regenerar) ou proposalData (criar nova)');
    }

    let proposal: any;
    let isNewProposal = false;
    
    // 🔄 REGENERAR: Se tem proposalId, buscar dados existentes
    if (proposalId) {
      console.log('🔄 Regenerating PDF for existing proposal:', proposalId);
      
      const { data: existingProposal, error: fetchError } = await supabase
        .from('proposals')
        .select(`
          *,
          proposal_items(*)
        `)
        .eq('id', proposalId)
        .single();
        
      if (fetchError || !existingProposal) {
        throw new Error(`Proposta não encontrada: ${fetchError?.message}`);
      }
      
      proposal = existingProposal;
      console.log('✅ Existing proposal loaded:', proposal.proposal_number);
    } 
    // 🆕 CRIAR: Se não tem proposalId, criar nova proposta
    else if (proposalData) {
      console.log('🆕 Creating new proposal');
      isNewProposal = true;
      proposal = proposalData; // Será salva após gerar PDF
    }

    console.log('🚀 Starting PDF generation:', isNewProposal ? 'NEW' : 'REGENERATE');

    // Verificar chave da API PDF.co
    const pdfCoApiKey = Deno.env.get('PDFCO_API_KEY');
    if (!pdfCoApiKey) {
      console.error('❌ PDF.co API key not configured');
      throw new Error('Chave da API PDF.co não configurada');
    }

    console.log('✅ PDF.co API key found, length:', pdfCoApiKey.length);

    // Determinar qual template usar
    const pdfCoTemplateId = templateId || '14564';
    console.log('🎨 Using PDF.co template ID:', pdfCoTemplateId);

    // Map data to PDF template format
    console.log('📊 Mapping data to template...');
    const templateData = mapDataToPDFTemplate(proposal, pdfCoTemplateId);
    console.log('✅ Template data mapped:', Object.keys(templateData));

    // Call PDF.co API usando o template
    console.log('📡 Calling PDF.co API with template...');
    console.log('📊 Template data to send:', {
      templateId: pdfCoTemplateId,
      templateDataKeys: Object.keys(templateData),
      templateDataSample: {
        nome_do_cliente: templateData.nome_do_cliente,
        data_proposta: templateData.data_proposta,
        valor_total: templateData.valor_total
      },
      filename: `proposta-${proposal.proposal_number || Date.now()}.pdf`
    });

    const pdfPayload = {
      templateId: pdfCoTemplateId,
      templateData: JSON.stringify(templateData), // ✅ Converter para string JSON
      name: `proposta-${proposal.proposal_number || Date.now()}.pdf`,
      async: false
    };

    const pdfResponse = await fetch('https://api.pdf.co/v1/pdf/convert/from/html', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': pdfCoApiKey,
      },
      body: JSON.stringify(pdfPayload),
    });

    console.log('📡 PDF.co API response status:', pdfResponse.status);

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('❌ PDF.co API error:', {
        status: pdfResponse.status,
        statusText: pdfResponse.statusText,
        body: errorText,
        sentPayload: {
          templateId: pdfCoTemplateId,
          templateDataType: typeof pdfPayload.templateData,
          filename: pdfPayload.name
        }
      });
      throw new Error(`Erro na API PDF.co: ${pdfResponse.status} - ${errorText}`);
    }

    const pdfResult = await pdfResponse.json();
    
    // Validar resposta segundo documentação PDF.co
    if (pdfResult.error === true || !pdfResult.url) {
      console.error('❌ PDF.co error:', pdfResult);
      throw new Error(`PDF.co API error: ${pdfResult.message || 'URL não retornada'}`);
    }

    console.log('✅ PDF gerado:', {
      url: pdfResult.url.substring(0, 50) + '...',
      pageCount: pdfResult.pageCount,
      status: pdfResult.status
    });

    let savedProposal: any;
    let proposalNumber: string;

    // 🆕 Se é nova proposta, salvar no banco
    if (isNewProposal) {
      console.log('💾 Saving new proposal to database...');
      proposalNumber = generateProposalNumber();
      
      const proposalToInsert = {
        proposal_number: proposalNumber,
        title: proposal.title || `Proposta ${proposalNumber}`,
        description: proposal.description || '',
        project_type: proposal.project_type || 'shingle',
        total_value: proposal.total_value || 0,
        discount_value: proposal.discount_value || 0,
        discount_percentage: proposal.discount_percentage || 0,
        final_value: proposal.final_value || proposal.total_value || 0,
        status: 'draft',
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        acceptance_link: `${supabaseUrl?.replace('/rest/v1', '')}/proposal/${proposalNumber}`,
        client_data: proposal.client_data || {},
        created_by: proposal.created_by,
        pdf_status: 'processing',
        pdf_url: pdfResult.url
      };

      const { data, error: saveError } = await supabase
        .from('proposals')
        .insert(proposalToInsert)
        .select()
        .single();

      if (saveError) {
        console.error('❌ Database save error:', saveError);
        throw new Error(`Erro ao salvar proposta: ${saveError.message}`);
      }

      savedProposal = data;
      console.log('✅ New proposal saved:', savedProposal.id);

      // Send notification
      try {
        await supabase.from('user_notifications').insert({
          user_id: proposal.created_by,
          type: 'pdf_processing',
          title: 'Proposta Criada',
          message: 'Sua proposta foi criada com sucesso. O PDF está sendo processado.',
          data: { proposalId: savedProposal.id, proposalNumber }
        });
      } catch (notifError) {
        console.error('⚠️ Failed to send notification:', notifError);
      }
    } 
    // 🔄 Se é regeneração, atualizar registro existente
    else {
      console.log('🔄 Updating existing proposal with new PDF...');
      proposalNumber = proposal.proposal_number;
      
      const { error: updateError } = await supabase
        .from('proposals')
        .update({
          pdf_url: pdfResult.url,
          pdf_status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', proposal.id);

      if (updateError) {
        console.error('❌ Database update error:', updateError);
        throw new Error(`Erro ao atualizar proposta: ${updateError.message}`);
      }

      savedProposal = proposal;
      console.log('✅ Proposal PDF regenerated:', proposal.id);
    }

    // Start background processing for permanent storage
    if (shouldSaveToPermanentStorage) {
      console.log('🔄 Scheduling background PDF processing...');
      processPDFInBackground(savedProposal.id, pdfResult.url, supabase);
    }

    console.log('✅ PDF generation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: pdfResult.url,
        proposalId: savedProposal.id,
        proposalNumber: proposalNumber,
        isNewProposal
      } as PDFGenerationResult),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('❌ PDF generation failed:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido durante geração do PDF'
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

async function processPDFInBackground(proposalId: string, pdfUrl: string, supabase: any, retries = 0) {
  try {
    console.log(`🔄 Processing PDF in background for proposal: ${proposalId} (attempt ${retries + 1}/3)`);
    
    // Wait a bit to ensure PDF is available (URL temporária)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Save PDF to permanent storage
    const { data: saveResult, error: saveError } = await supabase.functions.invoke('save-proposal-pdf', {
      body: {
        pdfUrl,
        proposalId,
        shouldCompress: true
      }
    });

    // Retry logic: até 3 tentativas com delay incremental
    if (saveError && retries < 2) {
      const delay = 5000 * (retries + 1); // 5s, 10s
      console.warn(`⚠️ PDF save failed (attempt ${retries + 1}), retrying in ${delay}ms...`, saveError);
      await new Promise(resolve => setTimeout(resolve, delay));
      return processPDFInBackground(proposalId, pdfUrl, supabase, retries + 1);
    }

    if (saveError) {
      throw new Error(`PDF save failed after ${retries + 1} attempts: ${saveError.message}`);
    }

    // Update proposal status with permanent URL
    await supabase
      .from('proposals')
      .update({
        pdf_status: 'ready',
        pdf_url: saveResult?.finalPdfUrl || pdfUrl, // URL permanente do Storage
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
  
  // Template 14564 - Shingle Drystore
  if (templateId === '14564') {
    return {
      nome_do_cliente: clientName,
      data_proposta: formatDate(new Date()),
      linha_shingle: data.product_line || 'Supreme',
      listagem_dos_produtos: formatItemsList(data.items || []),
      valor_total: formatValue(data.final_value || data.total_value || 0),
      nome_vendedor: data.seller_name || 'Equipe Drystore',
      whatsapp_vendedor: data.seller_whatsapp || '51 99999-9999'
    };
  }
  
  // Fallback para templates futuros ou formato genérico
  return {
    client_name: clientName,
    client_email: data.client_data?.email || data.customer_email || '',
    client_phone: data.client_data?.phone || data.whatsapp_number || '',
    proposal_date: formatDate(new Date()),
    total_value: formatCurrency(data.total_value || 0),
    final_value: formatCurrency(data.final_value || data.total_value || 0),
    items_html: formatItemsToHTML(data.items || [])
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

function formatValue(value: number): string {
  // Formatar valor sem símbolo de moeda (para template que já tem formatação própria)
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatItemsList(items: any[]): string {
  // Formatar produtos para o template 14564 da PDF.co
  if (!items || items.length === 0) {
    return '<div class="proposal-item"><span class="item-description">Produtos a definir</span></div>';
  }
  
  return items.map(item => {
    const name = item.custom_name || item.name || 'Item';
    const quantity = item.quantity || 1;
    const value = item.total_price || 0;
    
    return `<div class="proposal-item">
      <span class="item-description">${name} - Qtd: ${quantity}</span>
      <span class="item-value">${formatCurrency(value)}</span>
    </div>`;
  }).join('');
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