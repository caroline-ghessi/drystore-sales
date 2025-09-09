import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProposalGenerationRequest {
  calculationId: string;
  clientData: {
    name: string;
    phone: string;
    email?: string;
    address?: any;
  };
  templatePreferences: {
    tone: 'professional' | 'friendly' | 'technical';
    includeWarranty: boolean;
    includeTestimonials: boolean;
    includeTechnicalSpecs: boolean;
    logoUrl?: string;
    primaryColor?: string;
  };
  pricing: {
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      totalPrice: number;
      category: string;
    }>;
    subtotal: number;
    discount?: number;
    discountPercentage?: number;
    total: number;
    validityDays: number;
    paymentTerms: string;
    deliveryTime: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const requestData: ProposalGenerationRequest = await req.json();
    console.log('Generating proposal for calculation:', requestData.calculationId);

    // Get the saved calculation
    const { data: calculation, error: calcError } = await supabase
      .from('saved_calculations')
      .select('*')
      .eq('id', requestData.calculationId)
      .single();

    if (calcError) {
      throw new Error(`Failed to fetch calculation: ${calcError.message}`);
    }

    if (!calculation) {
      throw new Error('Calculation not found');
    }

    // Generate proposal number
    const proposalNumber = `PROP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create proposal record
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        proposal_number: proposalNumber,
        title: `Proposta - ${requestData.clientData.name}`,
        description: `Proposta para ${calculation.product_type} - ${requestData.clientData.name}`,
        project_type: calculation.product_type,
        status: 'generated',
        total_value: requestData.pricing.total,
        discount_value: requestData.pricing.discount || 0,
        discount_percentage: requestData.pricing.discountPercentage || 0,
        final_value: requestData.pricing.total - (requestData.pricing.discount || 0),
        valid_until: new Date(Date.now() + (requestData.pricing.validityDays * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        created_by: calculation.user_id
      })
      .select()
      .single();

    if (proposalError) {
      throw new Error(`Failed to create proposal: ${proposalError.message}`);
    }

    // Create proposal items
    const proposalItems = requestData.pricing.items.map((item, index) => ({
      proposal_id: proposal.id,
      custom_name: item.name,
      description: `${item.name} - ${item.category}`,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      specifications: {
        unit: item.unit,
        category: item.category,
        originalId: item.id
      },
      sort_order: index
    }));

    const { error: itemsError } = await supabase
      .from('proposal_items')
      .insert(proposalItems);

    if (itemsError) {
      throw new Error(`Failed to create proposal items: ${itemsError.message}`);
    }

    // Generate HTML content for the proposal
    const htmlContent = generateProposalHTML({
      proposal,
      items: requestData.pricing.items,
      clientData: requestData.clientData,
      templatePreferences: requestData.templatePreferences,
      pricing: requestData.pricing,
      calculationData: calculation
    });

    // For now, return the HTML content and proposal data
    // In the future, we could integrate with a PDF generation service
    const response = {
      success: true,
      proposal: {
        id: proposal.id,
        number: proposalNumber,
        title: proposal.title,
        total: requestData.pricing.total,
        validUntil: proposal.valid_until,
        status: proposal.status
      },
      htmlContent,
      downloadUrl: null, // Will be implemented with PDF generation
      message: 'Proposta gerada com sucesso!'
    };

    console.log('Proposal generated successfully:', proposalNumber);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error generating proposal:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

// Helper function to generate HTML content for the proposal
function generateProposalHTML(data: {
  proposal: any;
  items: any[];
  clientData: any;
  templatePreferences: any;
  pricing: any;
  calculationData: any;
}) {
  const { proposal, items, clientData, templatePreferences, pricing } = data;

  const logoSection = templatePreferences.logoUrl 
    ? `<img src="${templatePreferences.logoUrl}" alt="Logo" style="max-height: 80px;">`
    : '<div style="font-size: 24px; font-weight: bold; color: #2563eb;">SUA EMPRESA</div>';

  const primaryColor = templatePreferences.primaryColor || '#2563eb';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposta ${proposal.proposal_number}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding: 20px; 
            border-bottom: 3px solid ${primaryColor};
        }
        .client-info, .proposal-info { 
            background: #f8f9fa; 
            padding: 15px; 
            margin: 20px 0; 
            border-radius: 8px;
        }
        .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
        }
        .items-table th, .items-table td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left;
        }
        .items-table th { 
            background-color: ${primaryColor}; 
            color: white;
        }
        .items-table tr:nth-child(even) { 
            background-color: #f2f2f2;
        }
        .totals { 
            text-align: right; 
            margin: 20px 0;
        }
        .total-line { 
            display: flex; 
            justify-content: flex-end; 
            margin: 5px 0;
        }
        .total-label { 
            width: 150px; 
            font-weight: bold;
        }
        .total-value { 
            width: 120px; 
            text-align: right;
        }
        .final-total { 
            font-size: 1.2em; 
            color: ${primaryColor}; 
            border-top: 2px solid ${primaryColor}; 
            padding-top: 10px;
        }
        .terms { 
            margin-top: 30px; 
            padding: 15px; 
            background: #f8f9fa; 
            border-radius: 8px;
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <div class="header">
        ${logoSection}
        <h1 style="color: ${primaryColor}; margin: 10px 0;">PROPOSTA COMERCIAL</h1>
        <p style="margin: 0; color: #666;">Proposta Nº ${proposal.proposal_number}</p>
    </div>

    <div class="client-info">
        <h3 style="color: ${primaryColor};">DADOS DO CLIENTE</h3>
        <p><strong>Nome:</strong> ${clientData.name}</p>
        <p><strong>WhatsApp:</strong> ${clientData.phone}</p>
        ${clientData.email ? `<p><strong>E-mail:</strong> ${clientData.email}</p>` : ''}
    </div>

    <div class="proposal-info">
        <h3 style="color: ${primaryColor};">INFORMAÇÕES DA PROPOSTA</h3>
        <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        <p><strong>Validade:</strong> ${pricing.validityDays} dias</p>
        <p><strong>Condições de Pagamento:</strong> ${pricing.paymentTerms}</p>
        <p><strong>Prazo de Entrega:</strong> ${pricing.deliveryTime}</p>
    </div>

    <h3 style="color: ${primaryColor};">ITENS DA PROPOSTA</h3>
    <table class="items-table">
        <thead>
            <tr>
                <th>Item</th>
                <th>Descrição</th>
                <th>Qtd</th>
                <th>Unidade</th>
                <th>Valor Unit.</th>
                <th>Valor Total</th>
            </tr>
        </thead>
        <tbody>
            ${items.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}<br><small style="color: #666;">${item.category}</small></td>
                    <td>${item.quantity}</td>
                    <td>${item.unit}</td>
                    <td>R$ ${item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td>R$ ${item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals">
        <div class="total-line">
            <span class="total-label">Subtotal:</span>
            <span class="total-value">R$ ${pricing.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        ${pricing.discount ? `
        <div class="total-line">
            <span class="total-label">Desconto:</span>
            <span class="total-value">- R$ ${pricing.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        ` : ''}
        <div class="total-line final-total">
            <span class="total-label">TOTAL GERAL:</span>
            <span class="total-value">R$ ${pricing.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
    </div>

    ${templatePreferences.includeWarranty ? `
    <div class="terms">
        <h4 style="color: ${primaryColor};">GARANTIA</h4>
        <p>Oferecemos garantia de 12 meses para todos os produtos e serviços, conforme especificações técnicas de cada fabricante.</p>
    </div>
    ` : ''}

    <div class="terms">
        <h4 style="color: ${primaryColor};">TERMOS E CONDIÇÕES</h4>
        <ul>
            <li>Esta proposta tem validade de ${pricing.validityDays} dias a partir da data de emissão;</li>
            <li>Os preços estão sujeitos a alterações sem aviso prévio após o vencimento;</li>
            <li>O início dos trabalhos está condicionado à aprovação desta proposta;</li>
            <li>Condições de pagamento: ${pricing.paymentTerms};</li>
            <li>Prazo de entrega: ${pricing.deliveryTime}.</li>
        </ul>
    </div>

    <div class="footer">
        <p style="margin: 0; color: #666;">Obrigado pela oportunidade!</p>
        <p style="margin: 0; color: #666; font-size: 14px;">Proposta gerada automaticamente em ${new Date().toLocaleDateString('pt-BR')}</p>
    </div>
</body>
</html>
  `;
}

serve(handler);