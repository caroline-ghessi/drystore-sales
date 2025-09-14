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
    const acceptanceLink = `https://groqsnnytvjabgeaekkw.supabase.co/proposal/${proposalNumber}`;

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

serve(handler);