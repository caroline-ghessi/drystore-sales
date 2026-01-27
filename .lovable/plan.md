
# Plano de Refatoração Arquitetural

## Resumo Executivo

Este plano organiza a refatoração em **3 fases incrementais**, cada uma com zero impacto funcional e baixo risco. Todas as mudanças são puramente organizacionais, utilizando re-exports para manter compatibilidade com imports existentes.

**Tempo estimado total:** 3-4 horas de desenvolvimento
**Risco:** Baixo (apenas reorganização de arquivos)
**Impacto em usuários:** Nenhum

---

## Fase 1: Completar Estrutura do Módulo WhatsApp

**Objetivo:** Igualar a estrutura do módulo `/whatsapp` ao padrão estabelecido no `/crm`

### Situação Atual

```text
src/modules/crm/          src/modules/whatsapp/
├── components/           ├── components/
├── hooks/               ├── hooks/
├── pages/               ├── pages/
├── services/     ←      ├── (faltando)
├── types/        ←      ├── (faltando)
├── utils/        ←      ├── (faltando)
└── index.ts             └── index.ts
```

### Ações

1. **Criar pastas faltantes:**
   - `src/modules/whatsapp/services/`
   - `src/modules/whatsapp/types/`
   - `src/modules/whatsapp/utils/`

2. **Mover arquivos globais relacionados:**
   - `src/services/whatsapp/whatsapp-business.service.ts` → `src/modules/whatsapp/services/`
   - `src/services/whatsapp/whatsapp-integration.service.ts` → `src/modules/whatsapp/services/`
   - `src/types/conversation.types.ts` → `src/modules/whatsapp/types/`
   - `src/types/bot.types.ts` → `src/modules/whatsapp/types/`

3. **Criar re-exports para compatibilidade:**
   ```typescript
   // src/services/whatsapp/whatsapp-business.service.ts (mantido como re-export)
   export { whatsappService } from '@/modules/whatsapp/services/whatsapp-business.service';
   ```

4. **Atualizar barrel export:**
   ```typescript
   // src/modules/whatsapp/index.ts - adicionar:
   export * from './services';
   export * from './types';
   export * from './utils';
   ```

### Arquivos Afetados
- 4 arquivos movidos
- 4 re-exports criados
- 1 barrel export atualizado

---

## Fase 2: Migrar Hooks Globais para Módulos

**Objetivo:** Mover 25+ hooks de `/src/hooks/` para seus módulos de domínio apropriados

### Mapeamento de Migração

| Hook Atual | Destino | Justificativa |
|------------|---------|---------------|
| `useConversations.ts` | `/whatsapp/hooks/` | Gerencia conversas WhatsApp |
| `useMessages.ts` | `/whatsapp/hooks/` | Gerencia mensagens |
| `useRealtimeSubscription.ts` | `/whatsapp/hooks/` | Realtime para chat |
| `useConversationActions.ts` | `/whatsapp/hooks/` | Ações de conversa |
| `useConversationAnalytics.ts` | `/whatsapp/hooks/` | Analytics de conversa |
| `useClassificationLogs.ts` | `/whatsapp/hooks/` | Logs do classificador |
| `useClassificationKeywords.ts` | `/whatsapp/hooks/` | Keywords do classificador |
| `useAgentConfigs.ts` | `/whatsapp/hooks/` | Configuração de agentes |
| `useAgentPrompts.ts` | `/whatsapp/hooks/` | Prompts de agentes |
| `useRAGSystem.ts` | `/whatsapp/hooks/` | Sistema RAG do bot |
| `useSemanticSearch.ts` | `/whatsapp/hooks/` | Busca semântica |
| `useKnowledgeFiles.ts` | `/whatsapp/hooks/` | Base de conhecimento |
| `useFirecrawl.ts` | `/whatsapp/hooks/` | Web scraping |
| `useHotLeads.ts` | `/crm/hooks/` | Leads quentes |
| `useLeadAnalytics.ts` | `/crm/hooks/` | Analytics de leads |
| `useLeadSummary.ts` | `/crm/hooks/` | Resumo de leads |
| `useRealQualityMetrics.ts` | `/crm/hooks/` | Métricas de qualidade |
| `useVendors.ts` | `/crm/hooks/` | Gestão de vendedores |
| `useAtendentes.ts` | `/crm/hooks/` | Gestão de atendentes |
| `useNotifications.ts` | `/crm/hooks/` | Notificações CRM |
| `useOrderBumps.ts` | `/propostas/hooks/` | Order bumps |
| `useProposalActions.ts` | `/propostas/hooks/` | Ações de proposta |

### Hooks que Permanecem Globais

| Hook | Motivo |
|------|--------|
| `use-mobile.tsx` | Utilitário UI global |
| `use-toast.ts` | Utilitário UI global |
| `useDebounce.ts` | Utilitário genérico |
| `useUserPermissions.ts` | Autenticação global |
| `useVendorPermissions.ts` | Autenticação global |
| `useSystemConfigs.ts` | Configuração global |
| `useInviteManagement.ts` | Gestão de acesso global |
| `useBufferWorker.ts` | Worker global |
| `useStorageCleanup.ts` | Utilitário global |

### Estratégia de Re-export

Para cada hook migrado, manter arquivo original com re-export:

```typescript
// src/hooks/useConversations.ts (arquivo original - mantido)
export { 
  useConversations, 
  useConversation, 
  useCreateConversation,
  useUpdateConversation,
  useDeleteConversation 
} from '@/modules/whatsapp/hooks/useConversations';
```

### Arquivos Afetados
- 22 hooks movidos para módulos
- 22 re-exports criados
- 3 barrel exports atualizados

---

## Fase 3: Atualizar Barrel Exports dos Módulos

**Objetivo:** Garantir que todos os módulos exportem corretamente seus recursos

### WhatsApp Module - index.ts Atualizado

```typescript
// src/modules/whatsapp/index.ts

// Pages
export { default as Dashboard } from './pages/Dashboard';
export { default as Conversas } from './pages/Conversas';
// ... outras páginas

// Components (mantém exports existentes)
export { AgentList } from './components/bot/AgentList';
// ... outros componentes

// Hooks - NOVO
export * from './hooks';

// Services - NOVO
export * from './services';

// Types - NOVO  
export * from './types';

// Utils - NOVO
export * from './utils';
```

---

## Ordem de Execução

```text
┌─────────────────────────────────────────────────────────────┐
│  FASE 1: Estrutura WhatsApp (30 min)                       │
│  ├── Criar pastas services/, types/, utils/                │
│  ├── Mover arquivos de src/services/whatsapp/              │
│  ├── Mover arquivos de src/types/                          │
│  └── Criar re-exports e atualizar barrel                   │
├─────────────────────────────────────────────────────────────┤
│  FASE 2: Migrar Hooks (2h)                                 │
│  ├── Mover hooks WhatsApp (13 arquivos)                    │
│  ├── Mover hooks CRM (6 arquivos)                          │
│  ├── Mover hooks Propostas (2 arquivos)                    │
│  └── Criar todos os re-exports                             │
├─────────────────────────────────────────────────────────────┤
│  FASE 3: Barrel Exports (30 min)                           │
│  ├── Atualizar whatsapp/index.ts                           │
│  ├── Atualizar crm/hooks/index.ts                          │
│  └── Atualizar propostas/hooks/index.ts                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Validação e Testes

Após cada fase:

1. **Build Check:** `npm run build` deve passar sem erros
2. **Import Check:** Verificar que imports existentes continuam funcionando
3. **Functional Test:** Navegar pelas páginas principais para confirmar funcionamento

---

## Resultado Final

### Antes
```text
src/
├── hooks/           (31 arquivos misturados)
├── services/        (arquivos soltos)
├── types/           (tipos globais)
└── modules/
    ├── crm/         (estrutura completa)
    ├── whatsapp/    (estrutura incompleta)
    └── propostas/   (estrutura completa)
```

### Depois
```text
src/
├── hooks/           (9 hooks globais + re-exports)
├── services/        (re-exports apenas)
├── types/           (re-exports apenas)
└── modules/
    ├── crm/         (estrutura completa + hooks migrados)
    ├── whatsapp/    (estrutura completa + hooks migrados)
    └── propostas/   (estrutura completa + hooks migrados)
```

---

## Seção Técnica

### Padrão de Re-export

```typescript
// Arquivo original mantido como proxy
// src/hooks/useConversations.ts
export { 
  useConversations,
  useConversation,
  useCreateConversation,
  useUpdateConversation,
  useDeleteConversation
} from '@/modules/whatsapp/hooks/useConversations';
```

### Benefícios Técnicos

1. **Tree-shaking melhorado:** Imports diretos do módulo permitem melhor eliminação de código morto
2. **Code splitting natural:** Módulos podem ser carregados sob demanda
3. **Encapsulamento:** Dependências internas do módulo não vazam para o escopo global
4. **Facilidade de teste:** Módulos isolados são mais fáceis de mockar

### Riscos Mitigados

| Risco | Mitigação |
|-------|-----------|
| Imports quebrados | Re-exports mantêm compatibilidade |
| Conflitos de merge | Mudanças são aditivas, não destrutivas |
| Regressões | Build check após cada fase |
