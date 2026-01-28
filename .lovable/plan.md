
# Plano: Implementar Pagina de Detalhes da Negociacao

## 1. Resumo

Criar uma pagina completa de detalhes de negociacao que sera acessada ao clicar em um card no Kanban. A pagina mostrara todos os dados da negociacao, cliente, timeline de atividades, historico de WhatsApp e insights da IA.

---

## 2. Estrutura Visual

```text
+-----------------------------------------------------------------------+
|  [<-] Health Corp - Sistema ERP         [Risco Alto] ID:#NC-2024-001  |
|                                         [Compartilhar] [Salvar]       |
+-----------------------------------------------------------------------+
|                                                                       |
|  +------------------------------------------+ +---------------------+ |
|  | RESUMO DA NEGOCIACAO                     | | INFORMACOES CLIENTE | |
|  | Valor: R$ 90.000,00                      | | Health Corp         | |
|  | Estagio: [Proposta][Negociacao][...]     | | Saude e Medicina    | |
|  | Probabilidade: 25%                       | | CNPJ: 12.345.678/.. | |
|  | Previsao: 15/02/2024                     | | Funcionarios: 150   | |
|  | Origem: WhatsApp Business                | | Faturamento: R$25M  | |
|  | Responsavel: Carlos Mendes               | | Localizacao: SP     | |
|  +------------------------------------------+ +---------------------+ |
|  | TIMELINE DA NEGOCIACAO                   | | CONTATO PRINCIPAL   | |
|  | + Nova Atividade                         | | Marina Silva        | |
|  | [!] Cliente mencionou cancelamento       | | Diretora de TI      | |
|  |     Hoje, 14:30 - IA Detectou            | | (11) 99999-8888     | |
|  | [✓] Proposta enviada - Carlos            | | marina@health.com   | |
|  |     Ontem, 16:45                         | | [Abrir WhatsApp]    | |
|  | [📅] Reuniao realizada                   | +---------------------+ |
|  |     25/01/2024, 10:00                    | | INSIGHTS DA IA      | |
|  +------------------------------------------+ | [!] Risco Detectado | |
|  | HISTORICO WHATSAPP                       | | Cliente hesitou...  | |
|  | [Ver Conversa Completa]                  | | [💡] Sugestao       | |
|  | Cliente: "Ola Carlos, preciso..."        | | Oferecer parcela... | |
|  | Voce: "Entendo sua preocupacao..."       | | [⏰] Timing         | |
|  | Cliente: "Seria interessante sim..."     | | Melhor horario...   | |
|  +------------------------------------------+ +---------------------+ |
|                                              | PROXIMAS ACOES      | |
|                                              | 1. Ligar urgente    | |
|                                              | 2. Enviar proposta  | |
|                                              | 3. Agendar reuniao  | |
|                                              +---------------------+ |
+-----------------------------------------------------------------------+
```

---

## 3. Componentes a Criar

### 3.1 Estrutura de Diretorios

```
src/modules/crm/
├── pages/
│   └── NegotiationDetail.tsx         # Pagina principal
├── components/
│   └── negotiation/
│       ├── index.ts                  # Barrel export
│       ├── NegotiationHeader.tsx     # Cabecalho com titulo e acoes
│       ├── NegotiationSummary.tsx    # Resumo: valor, estagio, prob, etc
│       ├── NegotiationTimeline.tsx   # Timeline de atividades
│       ├── TimelineItem.tsx          # Item individual da timeline
│       ├── WhatsAppHistory.tsx       # Preview do historico WhatsApp
│       ├── WhatsAppMessage.tsx       # Bolha de mensagem
│       ├── CustomerInfo.tsx          # Card de informacoes do cliente
│       ├── ContactInfo.tsx           # Card do contato principal
│       ├── AIInsights.tsx            # Insights gerados pela IA
│       ├── NextActions.tsx           # Lista de proximas acoes
│       └── StagePipeline.tsx         # Visualizacao do estagio (steps)
```

### 3.2 Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/modules/crm/components/layout/CRMLayout.tsx` | Adicionar rota `/opportunities/:id` |
| `src/modules/crm/components/pipeline/PipelineKanban.tsx` | Ja esta navegando para a rota correta |
| `src/modules/crm/hooks/index.ts` | Exportar novo hook |

---

## 4. Novo Hook: useOpportunityDetail

```typescript
// src/modules/crm/hooks/useOpportunityDetail.ts

interface OpportunityDetail {
  id: string;
  title: string;
  description: string | null;
  value: number;
  stage: OpportunityStage;
  probability: number | null;
  temperature: string | null;
  validation_status: string | null;
  product_category: string | null;
  expected_close_date: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  next_step: string | null;
  objections: string[] | null;
  ai_confidence: number | null;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    city: string | null;
    state: string | null;
    company: string | null;
    segment: string | null;
  } | null;
  vendor: {
    id: string;
    name: string;
  } | null;
  conversation: {
    id: string;
    whatsapp_number: string;
  } | null;
}

function useOpportunityDetail(id: string) {
  // Busca oportunidade com dados expandidos
  return useQuery({...});
}
```

---

## 5. Detalhes de Implementacao

### 5.1 NegotiationDetail.tsx - Pagina Principal

Layout responsivo em 2 colunas:
- Coluna esquerda (60%): Resumo + Timeline + WhatsApp
- Coluna direita (40%): Cliente + Contato + IA + Acoes

```tsx
export default function NegotiationDetail() {
  const { id } = useParams();
  const { data: opportunity, isLoading } = useOpportunityDetail(id);
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <NegotiationHeader opportunity={opportunity} onBack={() => navigate(-1)} />
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - 3/5 */}
        <div className="lg:col-span-3 space-y-6">
          <NegotiationSummary opportunity={opportunity} />
          <NegotiationTimeline opportunityId={id} />
          <WhatsAppHistory conversationId={opportunity?.conversation?.id} />
        </div>
        
        {/* Right Column - 2/5 */}
        <div className="lg:col-span-2 space-y-6">
          <CustomerInfo customer={opportunity?.customer} />
          <ContactInfo customer={opportunity?.customer} />
          <AIInsights opportunity={opportunity} />
          <NextActions opportunity={opportunity} />
        </div>
      </div>
    </div>
  );
}
```

### 5.2 NegotiationHeader.tsx

Header com:
- Botao voltar (<-)
- Titulo: "Nome Cliente - Titulo Oportunidade"
- Badge de risco (baseado em temperatura/validacao)
- ID da negociacao (#NC-2024-XXX)
- Botoes: Compartilhar, Salvar Alteracoes

### 5.3 NegotiationSummary.tsx

Card com grid de informacoes:
- **Valor**: Input editavel com formatacao R$
- **Estagio**: Visualizacao em steps (StagePipeline)
- **Probabilidade**: Slider ou percentual visual
- **Previsao de Fechamento**: DatePicker
- **Origem**: Badge com icone (WhatsApp, Email, etc)
- **Responsavel**: Avatar + nome do vendedor

### 5.4 StagePipeline.tsx

Componente visual de steps horizontais:
```tsx
// Mostra os estagios como botoes/badges conectados
[Proposta Enviada] --> [Negociacao] --> [Aprovacao] --> [Fechamento]
        ✓                  ●
```

### 5.5 NegotiationTimeline.tsx

Timeline vertical com atividades:
- Botao "+ Nova Atividade" no topo
- Lista de eventos ordenada por data (mais recente primeiro)
- Cada item tem: icone, titulo, badge (pessoa/IA), timestamp, descricao
- Cores diferenciadas:
  - Vermelho: Alertas/Riscos
  - Laranja: Propostas
  - Verde: Reunioes
  - Azul: Contatos normais

### 5.6 TimelineItem.tsx

Item individual:
```tsx
interface TimelineItemProps {
  type: 'alert' | 'proposal' | 'meeting' | 'call' | 'email' | 'ai_detected';
  title: string;
  timestamp: Date;
  author: string;
  description?: string;
}
```

### 5.7 WhatsAppHistory.tsx

Preview das ultimas mensagens:
- Header: "Historico WhatsApp" + icone + link "Ver Conversa Completa"
- Lista de 3-5 ultimas mensagens
- Bolhas estilizadas (cliente esquerda, vendedor direita)
- Click abre modal ou navega para conversa

### 5.8 WhatsAppMessage.tsx

Bolha de mensagem:
```tsx
interface WhatsAppMessageProps {
  content: string;
  timestamp: Date;
  isFromCustomer: boolean;
  hasAvatar?: boolean;
}
```

### 5.9 CustomerInfo.tsx

Card com dados da empresa:
- Avatar/Logo placeholder com inicial
- Nome da empresa
- Segmento
- CNPJ (se disponivel, placeholder por enquanto)
- Numero de funcionarios (placeholder)
- Faturamento (placeholder)
- Localizacao (cidade, estado)

### 5.10 ContactInfo.tsx

Card do contato principal:
- Avatar com inicial
- Nome
- Cargo
- Telefone (clicavel)
- Email (clicavel)
- Botao "Abrir WhatsApp" (principal)

### 5.11 AIInsights.tsx

Card com insights da IA:
- **Risco Detectado**: Badge vermelho + descricao
- **Sugestao**: Badge amarelo + recomendacao
- **Timing**: Badge azul + melhor horario para contato

Dados derivados de:
- `validation_status` 
- `objections` array
- `ai_confidence`
- `temperature`

### 5.12 NextActions.tsx

Lista ordenada de proximas acoes:
- Numeros em circulos (1, 2, 3)
- Titulo da acao
- Data/prazo
- Derivado do campo `next_step` e eventos pendentes

---

## 6. Dados e Integracoes

### 6.1 Fontes de Dados

| Secao | Fonte |
|-------|-------|
| Resumo | `crm_opportunities` |
| Cliente | `crm_customers` via FK |
| Timeline | Por enquanto placeholder (tabela futura) |
| WhatsApp | `messages` via `conversation_id` |
| IA Insights | Campos `objections`, `ai_confidence`, `temperature` |
| Proximas Acoes | Campo `next_step` |

### 6.2 Campos Placeholder

Alguns dados do design HTML nao existem no banco:
- CNPJ
- Numero de funcionarios
- Faturamento anual
- Cargo do contato

Esses serao exibidos como "Nao informado" ou ocultados quando vazios.

---

## 7. Cores e Estilos (NeuroCRM)

| Elemento | Cor/Estilo |
|----------|------------|
| Risco Alto | `bg-red-50 border-red-400 text-red-700` |
| Badge estagio ativo | `bg-primary text-white` |
| Badge estagio inativo | `bg-gray-100 text-gray-600` |
| Timeline alerta | `border-l-red-500` |
| Timeline proposta | `border-l-orange-500` |
| Timeline reuniao | `border-l-green-500` |
| WhatsApp cliente | `bg-gray-100` alinhado esquerda |
| WhatsApp vendedor | `bg-primary/10` alinhado direita |
| Insight risco | `text-red-600 bg-red-50` |
| Insight sugestao | `text-amber-600 bg-amber-50` |
| Insight timing | `text-blue-600 bg-blue-50` |

---

## 8. Responsividade

| Viewport | Layout |
|----------|--------|
| Desktop (lg+) | 2 colunas (60% / 40%) |
| Tablet (md) | 2 colunas menores |
| Mobile (sm) | 1 coluna empilhada |

---

## 9. Ordem de Implementacao

| Passo | Acao |
|-------|------|
| 1 | Criar hook `useOpportunityDetail` |
| 2 | Criar pagina base `NegotiationDetail.tsx` |
| 3 | Implementar `NegotiationHeader.tsx` |
| 4 | Implementar `NegotiationSummary.tsx` + `StagePipeline.tsx` |
| 5 | Implementar `CustomerInfo.tsx` + `ContactInfo.tsx` |
| 6 | Implementar `AIInsights.tsx` + `NextActions.tsx` |
| 7 | Implementar `NegotiationTimeline.tsx` + `TimelineItem.tsx` |
| 8 | Implementar `WhatsAppHistory.tsx` + `WhatsAppMessage.tsx` |
| 9 | Criar barrel export `index.ts` |
| 10 | Adicionar rota em `CRMLayout.tsx` |
| 11 | Testar navegacao do Kanban para a pagina |

---

## 10. Interacoes Planejadas

| Acao Usuario | Comportamento |
|--------------|---------------|
| Click em card Kanban | Navega para `/crm/opportunities/:id` |
| Click botao voltar | `navigate(-1)` retorna ao Pipeline |
| Click "Salvar Alteracoes" | Atualiza opportunity no banco |
| Click "Ver Conversa Completa" | Navega para modulo WhatsApp |
| Click "Abrir WhatsApp" | Abre link whatsapp api |
| Click num estagio | Atualiza estagio da oportunidade |

---

## 11. Notas Importantes

1. **Timeline Placeholder**: A timeline usara dados simulados inicialmente. Uma tabela dedicada de `crm_activities` pode ser criada futuramente.

2. **WhatsApp Condicional**: Se `conversation_id` for null, a secao WhatsApp mostra estado vazio.

3. **Campos Ausentes**: CNPJ, funcionarios, faturamento nao existem no banco - exibir "Nao informado" ou ocultar.

4. **Risco Calculado**: Badge de risco baseado em:
   - `temperature === 'cold'` = Risco Alto
   - `objections.length > 0` = Risco Medio
   - AI insights sobre cancelamento

5. **Sem Hardcode de Produtos**: Todos os dados vem do banco, conforme solicitado.
