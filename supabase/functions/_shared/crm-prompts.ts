/**
 * CRM Agent Prompts - Prompts e schemas para os 8 agentes do CRM
 */

export type AgentType = 
  | 'client_profiler'
  | 'project_extractor'
  | 'deal_extractor'
  | 'spin_analyzer'
  | 'bant_qualifier'
  | 'objection_analyzer'
  | 'pipeline_classifier'
  | 'coaching_generator';

export interface AgentPromptConfig {
  name: string;
  description: string;
  instructions: string;
  outputSchema: Record<string, unknown>;
}

// Mapeia nome do agente no banco para tipo interno
export const AGENT_NAME_TO_TYPE: Record<string, AgentType> = {
  'Client Profiler': 'client_profiler',
  'Project Extractor': 'project_extractor',
  'Deal Extractor': 'deal_extractor',
  'SPIN Analyzer': 'spin_analyzer',
  'BANT Qualifier': 'bant_qualifier',
  'Objection Analyzer': 'objection_analyzer',
  'Pipeline Classifier': 'pipeline_classifier',
  'Coaching Generator': 'coaching_generator',
};

export const CRM_AGENT_PROMPTS: Record<AgentType, AgentPromptConfig> = {
  // ============================================================
  // AGENTES DE EXTRAÇÃO (Paralelo 1)
  // ============================================================

  client_profiler: {
    name: 'Client Profiler',
    description: 'Extrai perfil completo do cliente',
    instructions: `Analise a conversa e extraia o PERFIL DO CLIENTE.

EXTRAIA APENAS informações EXPLICITAMENTE mencionadas. Use null para dados não disponíveis.

Foque em:
1. QUEM É: Tipo (pessoa física, técnico, empresa), profissão, nível técnico
2. DE ONDE VEIO: Canal de origem, quem indicou, o que motivou o contato
3. O QUE QUER: Motivação principal, dores identificadas
4. QUEM DECIDE: É decisor? Há outros envolvidos? Como é o processo de decisão?

NÃO INVENTE dados. Se não foi mencionado, use null.`,
    outputSchema: {
      profile_type: "cliente_final | tecnico | empresa | null",
      profession: "string | null",
      is_technical: "boolean",
      knowledge_level: "leigo | basico | intermediario | avancado | null",
      origin_channel: "instagram | whatsapp | indicacao | site | outro | null",
      origin_source: "string | null",
      referred_by: "string | null",
      trigger_event: "string | null",
      main_motivation: "string | null",
      pain_points: [{ pain: "string", intensity: "high|medium|low", impact: "string" }],
      is_decision_maker: "boolean",
      decision_makers: ["string"],
      decision_process: "string | null",
      confidence: "number 0.0-1.0"
    }
  },

  project_extractor: {
    name: 'Project Extractor',
    description: 'Extrai dados técnicos do projeto/obra',
    instructions: `Analise a conversa e extraia informações sobre o PROJETO/OBRA.

Foque em:
1. LOCALIZAÇÃO: Cidade, bairro, estado
2. TIPO DE PROJETO: Residencial, comercial, industrial, rural
3. FASE: Planejamento, execução, reforma
4. PROFISSIONAIS: Tem arquiteto/engenheiro envolvido?
5. ESPECIFICAÇÕES TÉCNICAS: Área do telhado, consumo de energia, tipo de cobertura
6. PRODUTOS: O que precisa comprar? Quantidades estimadas?
7. PRAZO: Urgência, data prevista de início

Números devem ser valores numéricos, não strings. Use null para dados não mencionados.`,
    outputSchema: {
      location: { city: "string", neighborhood: "string", state: "string" },
      project_type_detailed: "string",
      project_phase: "planejamento | execucao | finalizado | null",
      has_professional: "boolean",
      professional_name: "string | null",
      technical_specs: {
        roof_m2: "number | null",
        consumption_kwh: "number | null",
        roof_type: "string | null",
        construction_m2: "number | null",
        energy_bill: "number | null"
      },
      products_needed: ["string"],
      estimated_quantities: { "produto": "quantidade" },
      deadline_urgency: "high | medium | low | null",
      start_date: "YYYY-MM-DD | null",
      timeline_description: "string | null",
      confidence: "number 0.0-1.0"
    }
  },

  deal_extractor: {
    name: 'Deal Extractor',
    description: 'Extrai dados comerciais da negociação',
    instructions: `Analise a conversa e extraia informações da NEGOCIAÇÃO COMERCIAL.

Foque em:
1. PROPOSTA: Foi solicitada? Foi enviada? Qual valor?
2. ORÇAMENTO: Valor mencionado pelo cliente, faixa de orçamento
3. CONCORRÊNCIA: Outros fornecedores mencionados, valores comparados
4. DESCONTOS: Pedido de desconto, desconto oferecido
5. PAGAMENTO: Preferência (à vista, parcelado, financiamento)
6. VISITAS: Visita técnica oferecida/realizada
7. INTERAÇÕES: Quando foi o primeiro contato, quantas interações

Valores monetários devem ser números SEM "R$". Percentuais como números (10 = 10%).`,
    outputSchema: {
      proposal_requested: "boolean",
      proposal_sent: "boolean",
      proposal_value: "number | null",
      client_mentioned_value: "number | null",
      budget_range: "string | null",
      competitors: [{ name: "string", value: "number|null", pros: ["string"], cons: ["string"] }],
      discount_requested: "number | null",
      discount_offered: "number | null",
      payment_preference: "à vista | parcelado | financiamento | null",
      visit_offered: "boolean",
      visits_done: "number",
      first_contact_at: "YYYY-MM-DD | null",
      total_interactions: "number",
      last_interaction_at: "YYYY-MM-DD | null",
      confidence: "number 0.0-1.0"
    }
  },

  // ============================================================
  // AGENTES DE ANÁLISE (Paralelo 2)
  // ============================================================

  spin_analyzer: {
    name: 'SPIN Analyzer',
    description: 'Analisa progresso na metodologia SPIN Selling',
    instructions: `Analise a conversa usando a metodologia SPIN Selling.

ESTÁGIOS SPIN:
1. SITUATION (Situação): O vendedor fez perguntas para entender a situação atual?
2. PROBLEM (Problema): Identificou problemas/dores do cliente?
3. IMPLICATION (Implicação): Explorou consequências dos problemas?
4. NEED-PAYOFF (Necessidade): Fez o cliente visualizar benefícios da solução?

Para cada fase:
- completed: true se a fase foi bem executada
- score: 0-100 baseado na qualidade das perguntas/respostas
- evidence: citações da conversa que comprovam

O spin_stage indica a FASE ATUAL (onde a negociação está).
O spin_score é a média ponderada do progresso.`,
    outputSchema: {
      spin_stage: "situation | problem | implication | need_payoff",
      spin_score: "number 0-100",
      spin_progress: {
        situation: { completed: "boolean", score: "number", evidence: ["string"] },
        problem: { completed: "boolean", score: "number", evidence: ["string"] },
        implication: { completed: "boolean", score: "number", evidence: ["string"] },
        need_payoff: { completed: "boolean", score: "number", evidence: ["string"] }
      },
      indicators: ["string - principais indicadores"],
      next_spin_actions: ["string - próximas perguntas recomendadas"],
      confidence: "number 0.0-1.0"
    }
  },

  bant_qualifier: {
    name: 'BANT Qualifier',
    description: 'Qualifica lead usando metodologia BANT',
    instructions: `Analise a conversa usando a metodologia BANT de qualificação.

CRITÉRIOS BANT:
1. BUDGET (Orçamento): O cliente tem verba? Qual valor/faixa?
2. AUTHORITY (Autoridade): É o decisor? Precisa de aprovação?
3. NEED (Necessidade): Qual a urgência/intensidade da necessidade?
4. TIMELINE (Prazo): Quando pretende decidir/iniciar?

Para cada critério:
- identified: se foi possível identificar
- valor/descrição específica
- confidence: confiança nessa identificação
- evidence: citação que comprova

bant_qualified = true se pelo menos 3 de 4 critérios estão identificados com boa confiança.`,
    outputSchema: {
      bant_score: "number 0-100",
      bant_qualified: "boolean",
      bant_details: {
        budget: { identified: "boolean", value: "number|null", range: "string|null", confidence: "number", evidence: "string" },
        authority: { identified: "boolean", decision_maker: "string|null", other_stakeholders: ["string"], confidence: "number", evidence: "string" },
        need: { identified: "boolean", urgency: "high|medium|low|null", pain_level: "number 0-10", confidence: "number", evidence: "string" },
        timeline: { identified: "boolean", expected_date: "YYYY-MM|null", flexibility: "rigid|flexible|unknown", confidence: "number", evidence: "string" }
      },
      qualification_gaps: ["string - critérios faltantes"],
      next_qualification_questions: ["string - perguntas para qualificar"],
      confidence: "number 0.0-1.0"
    }
  },

  objection_analyzer: {
    name: 'Objection Analyzer',
    description: 'Identifica e analisa objeções do cliente',
    instructions: `Analise a conversa e identifique TODAS as OBJEÇÕES levantadas pelo cliente.

TIPOS DE OBJEÇÃO:
- price: Preço alto, fora do orçamento
- timing: Não é o momento, precisa esperar
- trust: Desconfiança, quer referências
- competition: Comparando com concorrentes
- technical: Dúvidas técnicas não resolvidas
- authority: Não é o decisor
- need: Não vê necessidade clara

Para cada objeção:
- client_quote: frase exata do cliente (se possível)
- treatment_status: como o vendedor tratou
- vendor_response: o que respondeu
- effectiveness: se a resposta foi eficaz

objection_handling_score: nota geral de 0-100 para como o vendedor lidou com objeções.`,
    outputSchema: {
      objections: [{
        type: "price|timing|trust|competition|technical|authority|need|other",
        description: "string",
        client_quote: "string | null",
        treatment_status: "not_addressed | partially_addressed | fully_addressed",
        vendor_response: "string | null",
        effectiveness: "ineffective | neutral | effective"
      }],
      objection_handling_score: "number 0-100",
      main_blockers: ["string"],
      suggestions: ["string - como tratar objeções pendentes"],
      confidence: "number 0.0-1.0"
    }
  },

  // ============================================================
  // AGENTES DE DECISÃO (Sequencial)
  // ============================================================

  pipeline_classifier: {
    name: 'Pipeline Classifier',
    description: 'Classifica estágio correto no pipeline',
    instructions: `Com base na conversa E nas análises anteriores, classifique o ESTÁGIO no pipeline.

ESTÁGIOS (em ordem):
1. prospecting (5-15%): Primeiro contato, conhecendo o cliente
2. qualification (15-35%): Entendendo necessidades, qualificando BANT
3. proposal (35-55%): Elaborando ou enviando proposta
4. negotiation (55-75%): Negociando termos, preços, condições
5. closing (75-95%): Fechando negócio, detalhes finais
6. won (100%): Venda fechada
7. lost (0%): Oportunidade perdida

Analise:
- O que já aconteceu na negociação
- Resultados do BANT e SPIN
- Objeções pendentes
- Se proposta foi enviada/aceita

Considere BLOCKERS (impedimentos) e ACCELERATORS (aceleradores).`,
    outputSchema: {
      stage: "prospecting | qualification | proposal | negotiation | closing | won | lost",
      probability: "number 0-100",
      stage_reasoning: "string - explicação detalhada",
      recommended_next_stage: "string | null",
      days_in_current_stage: "number | null",
      blockers: ["string"],
      accelerators: ["string"],
      risk_level: "low | medium | high",
      risk_factors: ["string"],
      confidence: "number 0.0-1.0"
    }
  },

  coaching_generator: {
    name: 'Coaching Generator',
    description: 'Gera recomendações práticas para o vendedor',
    instructions: `Com base em TODAS as análises anteriores, gere RECOMENDAÇÕES PRÁTICAS.

Você é um coach de vendas experiente no mercado brasileiro de energia solar e materiais de construção.

Forneça:
1. AÇÕES RECOMENDADAS (máx 5): O que o vendedor deve fazer, com prioridade e scripts
2. ALERTAS DE RISCO: Situações que podem fazer perder a venda
3. PRÓXIMO FOLLOW-UP: Quando e como fazer contato
4. PONTOS FORTES: O que está indo bem
5. MELHORIAS: O que pode melhorar

Scripts devem ser naturais, em português brasileiro, prontos para copiar e usar.
Considere o contexto: mercado solar, telhas, pisos, construção civil.`,
    outputSchema: {
      recommended_actions: [{
        priority: "high | medium | low",
        action: "string",
        reasoning: "string",
        script: "string - texto pronto para usar",
        timing: "agora | em_24h | em_48h | proxima_semana"
      }],
      coaching_priority: "high | medium | low",
      next_follow_up_date: "YYYY-MM-DD",
      follow_up_message: "string - mensagem sugerida",
      risk_alerts: [{
        type: "competition | inactivity | objection | timing | authority",
        severity: "low | medium | high",
        description: "string",
        mitigation: "string"
      }],
      strengths: ["string"],
      improvements: ["string"],
      win_probability_factors: {
        positive: ["string"],
        negative: ["string"]
      },
      confidence: "number 0.0-1.0"
    }
  }
};

/**
 * Retorna a ordem de execução dos agentes
 * Paralelo 1: Extração
 * Paralelo 2: Análise
 * Sequencial: Decisão
 */
export function getAgentExecutionOrder(): {
  parallel1: AgentType[];
  parallel2: AgentType[];
  sequential: AgentType[];
} {
  return {
    parallel1: ['client_profiler', 'project_extractor', 'deal_extractor'],
    parallel2: ['spin_analyzer', 'bant_qualifier', 'objection_analyzer'],
    sequential: ['pipeline_classifier', 'coaching_generator']
  };
}
