import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProposalGenerationRequest {
  calculationId?: string;
  clientData: {
    name: string;
    phone: string;
    email?: string;
    address?: any;
  };
  productType?: string;
  calculationInput?: any;
  templatePreferences: {
    tone: 'professional' | 'friendly' | 'technical';
    includeWarranty: boolean;
    includeTestimonials: boolean;
    includeTechnicalSpecs: boolean;
    logoUrl?: string;
    primaryColor?: string;
  };
  pricing?: {
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

interface ProductKPI {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}

interface ProductTemplate {
  displayName: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryColor: string;
  accentColor: string;
  benefits: string[];
  warranties: Array<{
    component: string;
    duration: string;
    details: string;
  }>;
}

// Função para mapear ProductType do frontend para product_category do banco
function mapProductTypeToDbCategory(productType: string): string {
  const mapping: Record<string, string> = {
    'acoustic_mineral_ceiling': 'forro_mineral_acustico',
    'waterproofing_mapei': 'impermeabilizacao_mapei',
    'floor_preparation_mapei': 'preparacao_piso_mapei',
    'shingle': 'telha_shingle',
    'solar': 'energia_solar',
    'solar_advanced': 'energia_solar',
    'drywall': 'drywall',
    'steel_frame': 'steel_frame',
    'ceiling': 'forro_drywall',
    'forro_drywall': 'forro_drywall',
    'battery_backup': 'energia_solar'
  };
  
  console.log('Mapping product type:', { original: productType, mapped: mapping[productType] || productType });
  
  return mapping[productType] || productType;
}

function getProductTemplate(productType: string): ProductTemplate {
  const templates: Record<string, ProductTemplate> = {
    'shingle': {
      displayName: 'Telha Shingle',
      heroTitle: 'Sistema de Cobertura Telha Shingle',
      heroSubtitle: 'Solução completa para sua cobertura com tecnologia americana',
      primaryColor: '#8B4513',
      accentColor: '#D2691E',
      benefits: [
        'Resistência superior a ventos e intempéries',
        'Isolamento térmico e acústico excelente',
        'Baixa manutenção e alta durabilidade',
        'Design moderno e variadas opções de cores',
        'Sistema de ventilação natural integrado',
        'Instalação rápida e eficiente'
      ],
      warranties: [
        {
          component: 'Telhas Shingle',
          duration: '30 anos',
          details: 'Garantia contra defeitos de fabricação e resistência ao vento até 180 km/h'
        },
        {
          component: 'Manta Subcobertura',
          duration: '15 anos',
          details: 'Proteção contra infiltrações e umidade'
        },
        {
          component: 'Instalação',
          duration: '5 anos',
          details: 'Garantia de mão de obra especializada'
        }
      ]
    },
    'solar': {
      displayName: 'Energia Solar',
      heroTitle: 'Sistema de Energia Solar Fotovoltaica',
      heroSubtitle: 'Economia garantida e sustentabilidade para sua casa ou empresa',
      primaryColor: '#FF8C00',
      accentColor: '#FFD700',
      benefits: [
        'Redução de até 95% na conta de energia',
        'Valorização do imóvel',
        'Contribuição para sustentabilidade',
        'Tecnologia de ponta',
        'Monitoramento em tempo real'
      ],
      warranties: [
        {
          component: 'Painéis Solares',
          duration: '25 anos',
          details: 'Garantia de performance linear de 25 anos'
        },
        {
          component: 'Inversor',
          duration: '12 anos',
          details: 'Garantia total do fabricante'
        },
        {
          component: 'Instalação',
          duration: '5 anos',
          details: 'Garantia completa de instalação e funcionamento'
        }
      ]
    },
    'forro_drywall': {
      displayName: 'Forro de Drywall',
      heroTitle: 'Sistema de Forro em Drywall',
      heroSubtitle: 'Acabamento perfeito com isolamento térmico e acústico',
      primaryColor: '#708090',
      accentColor: '#B0C4DE',
      benefits: [
        'Instalação limpa e rápida',
        'Excelente isolamento acústico',
        'Facilita passagem de fiação',
        'Acabamento profissional',
        'Material sustentável e reciclável'
      ],
      warranties: [
        {
          component: 'Placas de Drywall',
          duration: '10 anos',
          details: 'Garantia contra defeitos de fabricação'
        },
        {
          component: 'Sistema de Fixação',
          duration: '5 anos',
          details: 'Perfis e parafusos certificados'
        },
        {
          component: 'Instalação',
          duration: '3 anos',
          details: 'Garantia de execução e acabamento'
        }
      ]
    }
  };

  return templates[productType] || {
    displayName: 'Sistema Personalizado',
    heroTitle: 'Proposta Técnica Especializada',
    heroSubtitle: 'Solução profissional para sua necessidade',
    primaryColor: '#2563EB',
    accentColor: '#60A5FA',
    benefits: [
      'Qualidade garantida',
      'Atendimento especializado',
      'Suporte pós-venda'
    ],
    warranties: [
      {
        component: 'Materiais',
        duration: '2 anos',
        details: 'Garantia contra defeitos de fabricação'
      },
      {
        component: 'Instalação',
        duration: '1 ano',
        details: 'Garantia de execução'
      }
    ]
  };
}

function generateProductKPIs(productType: string, calculationData: any): ProductKPI[] {
  switch (productType) {
    case 'shingle':
      return [
        { label: 'Área Total Coberta', value: calculationData?.totalRealArea || 0, unit: 'm²', highlight: true },
        { label: 'Fardos de Telha', value: calculationData?.shingleBundles || 0, unit: 'unidades' },
        { label: 'Placas OSB', value: calculationData?.osbSheets || 0, unit: 'placas' },
        { label: 'Resistência ao Vento', value: '180', unit: 'km/h', highlight: true },
        { label: 'Vida Útil', value: '30+', unit: 'anos', highlight: true }
      ];
    
    case 'solar':
      return [
        { label: 'Potência Instalada', value: calculationData?.systemPower || 0, unit: 'kWp', highlight: true },
        { label: 'Geração Mensal', value: calculationData?.monthlyGeneration || 0, unit: 'kWh' },
        { label: 'Economia Mensal', value: calculationData?.monthlySavings || 0, unit: 'R$', highlight: true },
        { label: 'Payback', value: calculationData?.paybackYears || 0, unit: 'anos' },
        { label: 'ROI 25 anos', value: calculationData?.roi25Years || 0, unit: '%', highlight: true }
      ];
    
    case 'forro_drywall':
      return [
        { label: 'Área do Forro', value: calculationData?.totalArea || 0, unit: 'm²', highlight: true },
        { label: 'Placas de Drywall', value: calculationData?.drywallSheets || 0, unit: 'placas' },
        { label: 'Perfis Metálicos', value: calculationData?.metalProfiles || 0, unit: 'm' },
        { label: 'Redução Ruído', value: '45', unit: 'dB', highlight: true }
      ];
    
    default:
      return [];
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log('=== GENERATE PROPOSAL FUNCTION STARTED ===');
  console.log('Request method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Raw request received:', JSON.stringify(body, null, 2));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let calculationData = null;

    // Try to fetch existing calculation if calculationId is provided
    if (body.calculationId) {
      console.log('Fetching calculation for ID:', body.calculationId);
      const { data, error } = await supabase
        .from('saved_calculations')
        .select('*')
        .eq('id', body.calculationId)
        .single();

      if (error) {
        console.error('Error fetching calculation:', error);
      } else {
        calculationData = data?.calculation_data;
        console.log('Calculation fetched successfully');
      }
    }

    // Use direct calculationInput if no saved calculation found
    if (!calculationData && body.calculationInput) {
      calculationData = body.calculationInput;
      console.log('Using direct calculation input');
    }

    console.log('Generating proposal for calculation:', body.calculationId || 'direct calculation');

    // Generate unique proposal number and acceptance link
    const proposalNumber = `PROP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Get the app URL from environment or detect from request headers
    const origin = req.headers.get('origin') || req.headers.get('referer');
    let appUrl = 'https://groqsnnytvjabgeaekkw.lovableproject.com';
    
    // If we can detect the origin from the request, use it
    if (origin) {
      try {
        const url = new URL(origin);
        appUrl = `${url.protocol}//${url.host}`;
      } catch (e) {
        console.log('Could not parse origin, using default app URL');
      }
    }
    
    const acceptanceLink = `${appUrl}/proposta/${proposalNumber}`;

    // Map product type to database category
    const productCategory = mapProductTypeToDbCategory(body.productType || 'generic');

    console.log('Pricing data received:', JSON.stringify(body.pricing, null, 2));

    // Insert proposal record - using only existing columns
    const proposalData = {
      proposal_number: proposalNumber,
      title: `${body.clientData.name} - ${body.productType || 'Proposta'}`,
      description: `Proposta para ${body.clientData.name} - ${productCategory}`,
      project_type: productCategory,
      total_value: body.pricing?.totalCost || body.pricing?.total || 0,
      discount_value: body.pricing?.discount || 0,
      discount_percentage: body.pricing?.discountPercentage || 0,
      final_value: (body.pricing?.totalCost || body.pricing?.total || 0) - (body.pricing?.discount || 0),
      valid_until: new Date(Date.now() + (body.pricing?.validityDays || 30) * 24 * 60 * 60 * 1000).toISOString(),
      acceptance_link: acceptanceLink,
      status: 'draft',
      created_by: body.userId || null
    };

    const { data: proposalResult, error: proposalError } = await supabase
      .from('proposals')
      .insert(proposalData)
      .select()
      .single();

    if (proposalError) {
      console.error('Error inserting proposal:', proposalError);
      throw new Error('Failed to create proposal');
    }

    console.log('=== PROPOSAL GENERATION DEBUG ===');
    console.log('Client Data:', JSON.stringify(body.clientData, null, 2));
    console.log('Product Type:', body.productType);
    console.log('Calculation Input:', JSON.stringify(body.calculationInput, null, 2));

    // Insert proposal items
    console.log('=== INSERTING PROPOSAL ITEMS ===');
    console.log('Pricing items array:', body.pricing?.items);
    console.log('Pricing items length:', body.pricing?.items?.length);
    console.log('Pricing items available:', !!body.pricing?.items);
    console.log('Items array length:', body.pricing?.items?.length || 0);

    const items = body.pricing?.items || [];
    console.log('Items to insert:', JSON.stringify(items, null, 2));

    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any, index: number) => {
        const mappedItem = {
          proposal_id: proposalResult.id,
          custom_name: item.name,
          description: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice || 0,
          total_price: item.totalPrice || 0,
          specifications: {
            unit: item.unit,
            category: body.productType,
            originalId: item.id,
            specifications: item.specifications || {}
          },
          sort_order: index
        };
        
        console.log(`Mapped item ${item.id}:`, JSON.stringify(mappedItem, null, 2));
        return mappedItem;
      });

      const { error: itemsError } = await supabase
        .from('proposal_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error inserting proposal items:', itemsError);
        throw new Error('Failed to insert proposal items');
      }

      console.log(`Successfully inserted ${itemsToInsert.length} proposal items`);
    }

    // Generate HTML content with product-specific template
    const htmlContent = generateProposalHTML({
      proposal: proposalResult,
      items: items,
      clientData: body.clientData,
      templatePreferences: body.templatePreferences,
      pricing: body.pricing,
      calculationData: calculationData
    });

    const response = {
      success: true,
      proposalId: proposalResult.id,
      proposalNumber: proposalNumber,
      acceptanceLink,
      htmlContent,
      message: 'Proposta gerada com sucesso! Link único criado para compartilhar com o cliente.'
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

function generateProposalHTML(data: {
  proposal: any;
  items: any[];
  clientData: any;
  templatePreferences: any;
  pricing: any;
  calculationData: any;
}): string {
  // Obter template específico do produto
  const productType = data.pricing?.items?.[0]?.product || data.proposal.product_category || 'generic';
  
  // Para telhas shingle, usar template premium personalizado
  if (productType === 'shingle') {
    return generatePremiumShingleHTML(data);
  }
  
  const template = getProductTemplate(productType);
  const kpis = generateProductKPIs(productType, data.calculationData);

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Proposta - ${data.proposal.proposal_number}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f8f9fa;
        }
        
        .proposal-container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        .header {
          background: linear-gradient(135deg, ${template.primaryColor}, ${template.accentColor});
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 2.5rem;
          margin-bottom: 10px;
          font-weight: 700;
        }
        
        .header p {
          font-size: 1.2rem;
          opacity: 0.9;
        }
        
        .section {
          padding: 30px;
          border-bottom: 1px solid #eee;
        }
        
        .section h2 {
          color: ${template.primaryColor};
          margin-bottom: 20px;
          font-size: 1.8rem;
          border-bottom: 3px solid ${template.accentColor};
          padding-bottom: 10px;
        }
        
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        
        .kpi-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          border-left: 4px solid ${template.primaryColor};
        }
        
        .kpi-card.highlight {
          background: linear-gradient(135deg, ${template.primaryColor}15, ${template.accentColor}15);
          border-left-color: ${template.accentColor};
        }
        
        .kpi-value {
          font-size: 2rem;
          font-weight: bold;
          color: ${template.primaryColor};
        }
        
        .kpi-label {
          font-size: 0.9rem;
          color: #666;
          margin-top: 5px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        .items-table th,
        .items-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        .items-table th {
          background: ${template.primaryColor};
          color: white;
          font-weight: 600;
        }
        
        .items-table tr:hover {
          background: #f5f5f5;
        }
        
        .financial-summary {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .total-row {
          font-size: 1.2rem;
          font-weight: bold;
          color: ${template.primaryColor};
          border-top: 2px solid ${template.primaryColor};
          padding-top: 10px;
        }
        
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        
        .benefit-item {
          display: flex;
          align-items: center;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 5px;
        }
        
        .benefit-item::before {
          content: '✓';
          color: ${template.primaryColor};
          font-weight: bold;
          margin-right: 10px;
        }
        
        .warranty-grid {
          display: grid;
          gap: 20px;
          margin: 20px 0;
        }
        
        .warranty-item {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid ${template.primaryColor};
        }
        
        .warranty-component {
          font-weight: bold;
          color: ${template.primaryColor};
          margin-bottom: 5px;
        }
        
        .warranty-duration {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 5px;
        }
        
        .footer {
          background: #333;
          color: white;
          padding: 30px;
          text-align: center;
        }
        
        @media print {
          body { background: white !important; }
          .proposal-container { box-shadow: none !important; }
          .section { page-break-inside: avoid; }
          .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .benefits-grid { grid-template-columns: 1fr !important; }
        }
      </style>
    </head>
    <body>
      <div class="proposal-container">
        <div class="header">
          <h1>${template.heroTitle}</h1>
          <p>${template.heroSubtitle}</p>
          <div style="margin-top: 20px; font-size: 1rem;">
            <strong>Proposta Nº:</strong> ${data.proposal.proposal_number}<br>
            <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
        
        <div class="section">
          <h2>Informações do Cliente</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
            <div><strong>Nome:</strong> ${data.clientData.name}</div>
            <div><strong>Telefone:</strong> ${data.clientData.phone}</div>
            ${data.clientData.email ? `<div><strong>Email:</strong> ${data.clientData.email}</div>` : ''}
          </div>
        </div>
        
        ${kpis.length > 0 ? `
        <div class="section">
          <h2>Destaques do Projeto</h2>
          <div class="kpi-grid">
            ${kpis.map(kpi => `
              <div class="kpi-card ${kpi.highlight ? 'highlight' : ''}">
                <div class="kpi-value">${kpi.value}${kpi.unit ? kpi.unit : ''}</div>
                <div class="kpi-label">${kpi.label}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        <div class="section">
          <h2>Itens da Proposta</h2>
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Descrição</th>
                <th>Qtd</th>
                <th>Valor Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.description || item.name}</td>
                  <td>${item.quantity}</td>
                  <td>R$ ${item.unitPrice?.toFixed(2) || '0,00'}</td>
                  <td>R$ ${item.totalPrice?.toFixed(2) || '0,00'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Resumo Financeiro</h2>
          <div class="financial-summary">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Subtotal:</span>
              <span>R$ ${data.proposal.total_value?.toFixed(2) || '0,00'}</span>
            </div>
            ${data.proposal.discount_value > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #dc3545;">
                <span>Desconto (${data.proposal.discount_percentage}%):</span>
                <span>- R$ ${data.proposal.discount_value?.toFixed(2) || '0,00'}</span>
              </div>
            ` : ''}
            <div class="total-row" style="display: flex; justify-content: space-between;">
              <span>Total:</span>
              <span>R$ ${data.proposal.final_value?.toFixed(2) || data.proposal.total_value?.toFixed(2) || '0,00'}</span>
            </div>
            <div style="margin-top: 15px; font-size: 0.9rem; color: #666;">
              <strong>Validade:</strong> ${new Date(data.proposal.valid_until).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>
        
        ${template.benefits.length > 0 ? `
        <div class="section">
          <h2>Benefícios</h2>
          <div class="benefits-grid">
            ${template.benefits.map(benefit => `
              <div class="benefit-item">${benefit}</div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        <div class="section">
          <h2>Garantias</h2>
          <div class="warranty-grid">
            ${template.warranties.map(warranty => `
              <div class="warranty-item">
                <div class="warranty-component">${warranty.component}</div>
                <div class="warranty-duration">${warranty.duration}</div>
                <div>${warranty.details}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="section">
          <h2>Termos e Condições</h2>
          <div style="font-size: 0.9rem; line-height: 1.6;">
            <p><strong>Condições de Pagamento:</strong> ${data.proposal.payment_terms}</p>
            <p><strong>Prazo de Execução:</strong> ${data.proposal.delivery_time}</p>
            <p><strong>Validade da Proposta:</strong> ${new Date(data.proposal.valid_until).toLocaleDateString('pt-BR')}</p>
            <p><strong>Observações:</strong> Esta proposta está sujeita à aprovação técnica e disponibilidade de materiais.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>Proposta gerada em ${new Date().toLocaleDateString('pt-BR')}</p>
          <p>Proposta Nº: ${data.proposal.proposal_number}</p>
          <p style="margin-top: 10px; font-size: 0.9rem;">
            Esta é uma proposta automatizada. Para dúvidas, entre em contato conosco.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Template Premium HTML para Telhas Shingle
function generatePremiumShingleHTML(data: {
  proposal: any;
  items: any[];
  clientData: any;
  templatePreferences: any;
  pricing: any;
  calculationData: any;
}): string {
  const calc = data.calculationData || data.pricing;
  const totalArea = calc?.totalRealArea || calc?.totalProjectedArea || 0;
  const shingleBundles = calc?.shingleBundles || 0;
  const osbSheets = calc?.osbSheets || 0;
  const rhinoroofRolls = calc?.rhinoroofRolls || 0;
  const ridgeCapBundles = calc?.ridgeCapBundles || 0;
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposta Comercial - Telhas Shingle Premium | Drystore</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            color: #1a1a1a;
        }

        .container {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            position: relative;
            display: flex;
            flex-direction: column;
        }

        .header {
            background: linear-gradient(135deg, #FF6B00 0%, #ff8533 100%);
            color: white;
            padding: 30px;
            position: relative;
            overflow: hidden;
        }

        .header::after {
            content: '';
            position: absolute;
            bottom: -20px;
            right: -20px;
            width: 100px;
            height: 100px;
            background: rgba(255, 255, 255, 0.1);
            transform: rotate(45deg);
        }

        .logo-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .logo {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: -1px;
        }

        .proposta-numero {
            text-align: right;
            font-size: 12px;
            opacity: 0.9;
        }

        .header-title {
            font-size: 24px;
            font-weight: 300;
            margin-bottom: 10px;
        }

        .header-subtitle {
            font-size: 14px;
            opacity: 0.9;
        }

        .badge-premium {
            position: absolute;
            top: 20px;
            right: 200px;
            background: #D4AF37;
            color: #1a1a1a;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .cliente-info {
            padding: 25px 30px;
            background: #fafafa;
            border-left: 4px solid #FF6B00;
        }

        .cliente-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
        }

        .info-label {
            font-size: 11px;
            color: #707070;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }

        .info-value {
            font-size: 14px;
            font-weight: 600;
            color: #1a1a1a;
        }

        .solucao-section {
            padding: 30px;
            flex: 1;
        }

        .section-title {
            font-size: 18px;
            color: #FF6B00;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #FF6B00;
            font-weight: 600;
        }

        .sistema-camadas {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }

        .camadas-titulo {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
            color: #1a1a1a;
        }

        .camadas-legenda {
            margin-top: 30px;
            padding: 15px;
            background: white;
            border-radius: 8px;
        }

        .legenda-item {
            display: flex;
            align-items: start;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e0e0e0;
        }

        .legenda-item:last-child {
            border-bottom: none;
        }

        .legenda-numero {
            width: 30px;
            height: 30px;
            background: #FF6B00;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 15px;
            flex-shrink: 0;
        }

        .legenda-texto {
            flex: 1;
        }

        .legenda-nome {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 3px;
        }

        .legenda-funcao {
            font-size: 11px;
            color: #707070;
        }

        .produto-destaque {
            background: linear-gradient(to right, #f9f9f9, #fff);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #D4AF37;
        }

        .produto-nome {
            font-size: 18px;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 10px;
        }

        .produto-origem {
            font-size: 12px;
            color: #707070;
            margin-bottom: 15px;
        }

        .specs-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 20px 0;
        }

        .spec-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e0e0e0;
        }

        .spec-icon {
            font-size: 24px;
            margin-bottom: 5px;
        }

        .spec-value {
            font-size: 16px;
            font-weight: bold;
            color: #FF6B00;
        }

        .spec-label {
            font-size: 10px;
            color: #707070;
            margin-top: 3px;
        }

        .componentes-list {
            margin: 20px 0;
        }

        .componente-item {
            display: flex;
            justify-content: space-between;
            padding: 12px;
            background: white;
            margin-bottom: 8px;
            border-left: 3px solid #FF6B00;
            border-radius: 4px;
        }

        .componente-nome {
            font-size: 13px;
            flex: 1;
        }

        .componente-qtd {
            font-size: 13px;
            color: #707070;
            margin: 0 20px;
        }

        .componente-valor {
            font-size: 13px;
            font-weight: bold;
            min-width: 100px;
            text-align: right;
        }

        .diferenciais-box {
            background: #fafafa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }

        .diferencial-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }

        .diferencial-item {
            display: flex;
            align-items: center;
            font-size: 13px;
        }

        .check-icon {
            color: #4CAF50;
            margin-right: 10px;
            font-size: 18px;
        }

        .investimento-section {
            padding: 30px;
            background: #1a1a1a;
            color: white;
        }

        .valores-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 30px;
            align-items: center;
        }

        .valor-total {
            font-size: 32px;
            font-weight: bold;
            color: #FF6B00;
            margin: 10px 0;
        }

        .forma-pagamento {
            font-size: 13px;
            margin-top: 10px;
            line-height: 1.6;
        }

        .valor-m2 {
            text-align: center;
            padding: 15px;
            background: rgba(255, 107, 0, 0.1);
            border-radius: 8px;
            border: 1px solid #FF6B00;
        }

        .nota-instalacao {
            background: #fff3e0;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
            border-left: 4px solid #FF6B00;
            font-size: 12px;
        }

        .garantias-section {
            padding: 25px 30px;
            background: #fafafa;
        }

        .garantia-principal {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 8px;
            border: 2px solid #D4AF37;
        }

        .garantia-anos {
            font-size: 36px;
            font-weight: bold;
            color: #D4AF37;
        }

        .garantia-texto {
            font-size: 14px;
            margin-top: 5px;
        }

        .footer-section {
            padding: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }

        .assinatura-box {
            flex: 1;
            margin-right: 30px;
        }

        .assinatura-linha {
            border-bottom: 1px solid #ccc;
            margin-bottom: 5px;
            min-width: 200px;
        }

        .assinatura-label {
            font-size: 11px;
            color: #707070;
        }

        .aceite-digital {
            text-align: center;
            padding: 15px;
            background: #FF6B00;
            color: white;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.3s;
        }

        .aceite-digital:hover {
            background: #e55a00;
        }

        .validade {
            text-align: center;
            font-size: 11px;
            color: #707070;
            margin-top: 20px;
        }

        @media print {
            body {
                background: white;
            }
            .container {
                width: 100%;
                margin: 0;
                box-shadow: none;
            }
            .aceite-digital {
                display: none;
            }
            .header {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }

        @media screen and (max-width: 800px) {
            .container {
                width: 100%;
                min-height: auto;
            }
            .specs-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            .valores-grid {
                grid-template-columns: 1fr;
            }
            .diferencial-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="badge-premium">Premium Quality</div>
            <div class="logo-section">
                <div class="logo">DRYSTORE</div>
                <div class="proposta-numero">
                    <div>PROPOSTA Nº ${data.proposal.proposal_number}</div>
                    <div>Data: ${new Date().toLocaleDateString('pt-BR')}</div>
                </div>
            </div>
            <h1 class="header-title">Telhas Shingle Premium Owens Corning</h1>
            <p class="header-subtitle">A telha que valoriza seu imóvel - Importada dos EUA com garantia real de 50 anos</p>
        </div>

        <div class="cliente-info">
            <div class="cliente-grid">
                <div>
                    <div class="info-label">Cliente</div>
                    <div class="info-value">${data.clientData.name}</div>
                </div>
                <div>
                    <div class="info-label">Telefone</div>
                    <div class="info-value">${data.clientData.phone}</div>
                </div>
                <div>
                    <div class="info-label">Email</div>
                    <div class="info-value">${data.clientData.email || 'Não informado'}</div>
                </div>
                <div>
                    <div class="info-label">Área do Telhado</div>
                    <div class="info-value">${totalArea.toFixed(1)} m²</div>
                </div>
            </div>
        </div>

        <div class="solucao-section">
            <h2 class="section-title">SISTEMA COMPLETO DE COBERTURA</h2>
            
            <div class="sistema-camadas">
                <h3 class="camadas-titulo">🏗️ ANATOMIA DO SISTEMA SHINGLE PREMIUM</h3>
                
                <div class="camadas-legenda">
                    <div class="legenda-item">
                        <div class="legenda-numero">1</div>
                        <div class="legenda-texto">
                            <div class="legenda-nome">Telha Shingle Owens Corning Duration®</div>
                            <div class="legenda-funcao">PROTEÇÃO PRINCIPAL: Resistência a ventos de 130mph, granizo e raios UV. Tecnologia SureNail® exclusiva com faixa de fixação reforçada. Vida útil de 50 anos.</div>
                        </div>
                    </div>
                    <div class="legenda-item">
                        <div class="legenda-numero">2</div>
                        <div class="legenda-texto">
                            <div class="legenda-nome">Cumeeira ProEdge® Hip & Ridge</div>
                            <div class="legenda-funcao">VENTILAÇÃO E ACABAMENTO: Permite saída do ar quente, evitando condensação. Protege pontos críticos contra infiltração.</div>
                        </div>
                    </div>
                    <div class="legenda-item">
                        <div class="legenda-numero">3</div>
                        <div class="legenda-texto">
                            <div class="legenda-nome">Manta Asfáltica WeatherLock®</div>
                            <div class="legenda-funcao">IMPERMEABILIZAÇÃO: Barreira 100% impermeável. Auto-adesiva e auto-selante ao redor dos pregos. Proteção extra em vales e beirais.</div>
                        </div>
                    </div>
                    <div class="legenda-item">
                        <div class="legenda-numero">4</div>
                        <div class="legenda-texto">
                            <div class="legenda-nome">Deck OSB Estrutural 18mm</div>
                            <div class="legenda-funcao">BASE SÓLIDA: Superfície uniforme para fixação. Distribuição de cargas. Isolamento térmico adicional.</div>
                        </div>
                    </div>
                    <div class="legenda-item">
                        <div class="legenda-numero">5</div>
                        <div class="legenda-texto">
                            <div class="legenda-nome">Estrutura de Suporte</div>
                            <div class="legenda-funcao">SUSTENTAÇÃO: Caibros e ripas dimensionados para suportar o sistema. Inclinação mínima de 15° para perfeito escoamento.</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="produto-destaque">
                <div class="produto-nome">OWENS CORNING TruDefinition® Duration®</div>
                <div class="produto-origem">Fabricada nos EUA • Tecnologia SureNail® Exclusiva</div>
                
                <div class="specs-grid">
                    <div class="spec-card">
                        <div class="spec-icon">🛡️</div>
                        <div class="spec-value">130</div>
                        <div class="spec-label">MPH RESISTÊNCIA</div>
                    </div>
                    <div class="spec-card">
                        <div class="spec-icon">⏱️</div>
                        <div class="spec-value">50</div>
                        <div class="spec-label">ANOS GARANTIA</div>
                    </div>
                    <div class="spec-card">
                        <div class="spec-icon">🎨</div>
                        <div class="spec-value">15</div>
                        <div class="spec-label">CORES DISPONÍVEIS</div>
                    </div>
                    <div class="spec-card">
                        <div class="spec-icon">🏠</div>
                        <div class="spec-value">A+</div>
                        <div class="spec-label">VALORIZAÇÃO</div>
                    </div>
                </div>
            </div>

            <div class="componentes-list">
                ${data.items.map(item => `
                    <div class="componente-item">
                        <span class="componente-nome">${item.custom_name || item.name}</span>
                        <span class="componente-qtd">${item.quantity} ${item.specifications?.unit || 'un'}</span>
                        <span class="componente-valor">R$ ${(item.total_price || 0).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>

            <div class="nota-instalacao">
                <strong>📦 FORNECIMENTO DE MATERIAIS PREMIUM</strong><br>
                A Drystore fornece todos os componentes do sistema Owens Corning, importados diretamente dos EUA. 
                Recomendamos instaladores certificados para garantir a correta aplicação e validação da garantia de 50 anos. 
                Podemos indicar profissionais especializados em sua região.
            </div>

            <div class="diferenciais-box">
                <h3 style="font-size: 14px; margin-bottom: 15px; color: #FF6B00;">Por que Owens Corning é superior?</h3>
                <div class="diferencial-grid">
                    <div class="diferencial-item">
                        <span class="check-icon">✓</span>
                        <span>Tecnologia SureNail® - Resistência extra na fixação</span>
                    </div>
                    <div class="diferencial-item">
                        <span class="check-icon">✓</span>
                        <span>130 mph vs 110 mph da IKO - 18% mais resistente</span>
                    </div>
                    <div class="diferencial-item">
                        <span class="check-icon">✓</span>
                        <span>Garantia real de 50 anos com documento oficial</span>
                    </div>
                    <div class="diferencial-item">
                        <span class="check-icon">✓</span>
                        <span>Valorização de até R$ 100.000 no imóvel</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="investimento-section">
            <h2 class="section-title" style="color: white; border-color: white;">INVESTIMENTO</h2>
            <div class="valores-grid">
                <div>
                    <div class="info-label" style="color: #ccc;">Investimento Total em Materiais</div>
                    <div class="valor-total">R$ ${(data.proposal.final_value || data.proposal.total_value || 0).toFixed(2)}</div>
                    <div class="forma-pagamento">
                        • Entrada: R$ ${((data.proposal.final_value || data.proposal.total_value || 0) * 0.2).toFixed(2)}<br>
                        • Saldo em até 10x sem juros<br>
                        • Desconto de 5% à vista
                    </div>
                </div>
                <div class="valor-m2">
                    <div style="font-size: 20px; font-weight: bold; color: #FF6B00;">R$ ${totalArea > 0 ? ((data.proposal.final_value || data.proposal.total_value || 0) / totalArea).toFixed(2) : '0,00'}</div>
                    <div style="font-size: 11px; color: #ccc; margin-top: 5px;">por m² de material</div>
                </div>
                <div class="valor-m2" style="background: rgba(212, 175, 55, 0.1); border-color: #D4AF37;">
                    <div style="font-size: 16px; font-weight: bold; color: #D4AF37;">IKO: R$ 75/m²</div>
                    <div style="font-size: 11px; color: #ccc; margin-top: 5px;">47% mais valor</div>
                </div>
            </div>
        </div>

        <div class="garantias-section">
            <div class="garantia-principal">
                <div class="garantia-anos">50 ANOS</div>
                <div class="garantia-texto">
                    Garantia Limitada Owens Corning<br>
                    <span style="font-size: 12px; color: #707070;">Documento oficial emitido pelo fabricante nos EUA</span>
                </div>
            </div>
        </div>

        <div class="footer-section">
            <div class="assinatura-box">
                <div class="assinatura-linha"></div>
                <div class="assinatura-label">Drystore Soluções Inteligentes</div>
            </div>
            <div class="assinatura-box">
                <div class="assinatura-linha"></div>
                <div class="assinatura-label">Cliente</div>
            </div>
        </div>

        <div class="validade">
            Esta proposta é válida por 15 dias | Drystore - Parceira exclusiva Owens Corning no Sul do Brasil
        </div>
    </div>
</body>
</html>
  `;
}

serve(handler);