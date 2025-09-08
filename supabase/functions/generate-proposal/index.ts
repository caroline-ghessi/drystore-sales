import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIGenerationRequest {
  projectContextId?: string;
  clientData: {
    name: string;
    phone: string;
    email?: string;
  };
  productType: string;
  calculationInput: any;
  customRequirements?: string[];
  templatePreferences?: {
    tone: 'formal' | 'friendly' | 'technical';
    includeWarranty: boolean;
    includeTestimonials: boolean;
    includeTechnicalSpecs: boolean;
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get request body
    const requestData: AIGenerationRequest = await req.json()

    // If we have a project context ID, get client data from conversation
    let clientData = requestData.clientData
    if (requestData.projectContextId) {
      const { data: context } = await supabaseClient
        .from('project_contexts')
        .select('conversation_id')
        .eq('id', requestData.projectContextId)
        .single()

      if (context?.conversation_id) {
        const { data: conversation } = await supabaseClient
          .from('conversations')
          .select('*')
          .eq('id', context.conversation_id)
          .single()

        if (conversation) {
          clientData = {
            name: conversation.customer_name || 'Cliente',
            phone: conversation.customer_phone || '',
            email: conversation.customer_email || ''
          }
        }
      }
    }

    // Generate proposal content with AI
    const generatedContent = await generateProposalContent(requestData, clientData)

    // Create proposal data structure
    const proposalData = {
      id: crypto.randomUUID(),
      client: clientData,
      items: generateProposalItems(requestData.productType, requestData.calculationInput),
      subtotal: calculateSubtotal(requestData.calculationInput),
      discountPercent: 0,
      discountValue: 0,
      total: calculateSubtotal(requestData.calculationInput),
      validityDays: 30,
      paymentTerms: generatedContent.recommendedPaymentTerms,
      deliveryTime: generatedContent.deliverySchedule,
      notes: requestData.customRequirements?.join(', '),
      status: 'generated' as const,
      projectContextId: requestData.projectContextId,
      templateId: 'standard',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'ai-system'
    }

    const result = {
      proposalData,
      generatedContent,
      calculations: requestData.calculationInput,
      confidence: 85, // Mock confidence score
      suggestions: [
        'Considere adicionar sistema de monitoramento',
        'Ofereça opções de financiamento',
        'Inclua garantia estendida'
      ]
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error generating proposal:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

async function generateProposalContent(request: AIGenerationRequest, clientData: any) {
  // This would integrate with OpenAI GPT or another AI service
  // For now, return mock content based on product type
  
  const productDescriptions = {
    solar: {
      executiveSummary: `Prezado ${clientData.name}, apresentamos nossa proposta para instalação de sistema de energia solar fotovoltaica. Nossa solução irá reduzir significativamente sua conta de energia elétrica, proporcionando economia e sustentabilidade para sua propriedade.`,
      technicalDescription: 'Sistema fotovoltaico completo com painéis solares de alta eficiência, inversor de qualidade premium e estruturas de fixação robustas.',
      benefitsHighlights: [
        'Redução de até 95% na conta de energia',
        'Retorno do investimento em 4-6 anos', 
        'Valorização do imóvel em até 8%',
        'Contribuição para o meio ambiente'
      ]
    },
    shingle: {
      executiveSummary: `Prezado ${clientData.name}, apresentamos nossa proposta para instalação de telhas shingle de alta qualidade. Nossa solução oferece beleza, durabilidade e proteção superior para sua edificação.`,
      technicalDescription: 'Sistema de cobertura com telhas shingle premium, manta impermeabilizante de alta performance e acessórios complementares.',
      benefitsHighlights: [
        'Durabilidade superior a 50 anos',
        'Resistência a intempéries',
        'Beleza e valorização estética',
        'Garantia de 20 anos'
      ]
    },
    drywall: {
      executiveSummary: `Prezado ${clientData.name}, apresentamos nossa proposta para instalação de sistema drywall. Nossa solução oferece rapidez, limpeza e flexibilidade para seus ambientes.`,
      technicalDescription: 'Sistema construtivo a seco com placas de gesso e perfis metálicos, proporcionando divisórias e acabamentos de alta qualidade.',
      benefitsHighlights: [
        'Instalação rápida e limpa',
        'Flexibilidade de layout',
        'Excelente acabamento',
        'Menor desperdício de material'
      ]
    }
  }

  const content = productDescriptions[request.productType as keyof typeof productDescriptions] || productDescriptions.solar

  return {
    executiveSummary: content.executiveSummary,
    technicalDescription: content.technicalDescription,
    benefitsHighlights: content.benefitsHighlights,
    recommendedPaymentTerms: 'Entrada de 30% + parcelas mensais',
    deliverySchedule: '30 dias após aprovação do projeto',
    warrantyTerms: 'Garantia de 2 anos para instalação e serviços'
  }
}

function generateProposalItems(productType: string, calculationInput: any) {
  // Generate items based on calculation results
  // This is a simplified version - in production would use actual calculation results
  
  const items = []
  
  switch (productType) {
    case 'solar':
      items.push({
        id: '1',
        product: 'solar',
        description: `Sistema Fotovoltaico ${calculationInput.monthlyConsumption ? Math.ceil(calculationInput.monthlyConsumption / 150) : 3} kWp`,
        specifications: calculationInput,
        quantity: 1,
        unitPrice: 15000,
        totalPrice: 15000
      })
      break
    
    case 'shingle':
      items.push({
        id: '1', 
        product: 'shingle',
        description: `Telhado Shingle ${calculationInput.roofArea || 100} m²`,
        specifications: calculationInput,
        quantity: calculationInput.roofArea || 100,
        unitPrice: 85,
        totalPrice: (calculationInput.roofArea || 100) * 85
      })
      break
      
    case 'drywall':
      items.push({
        id: '1',
        product: 'drywall', 
        description: `Drywall ${calculationInput.wallArea || 50} m²`,
        specifications: calculationInput,
        quantity: calculationInput.wallArea || 50,
        unitPrice: 65,
        totalPrice: (calculationInput.wallArea || 50) * 65
      })
      break
  }
  
  return items
}

function calculateSubtotal(calculationInput: any): number {
  // Simplified calculation - in production would use actual calculation results
  if (calculationInput.monthlyConsumption) {
    return Math.ceil(calculationInput.monthlyConsumption / 150) * 15000
  }
  if (calculationInput.roofArea) {
    return calculationInput.roofArea * 85
  }
  if (calculationInput.wallArea) {
    return calculationInput.wallArea * 65
  }
  return 10000
}