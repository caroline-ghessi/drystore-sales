

# Plano: Tornar Todas as Configurações dos Agentes Editáveis

## Resumo

Permitir a edição completa das configurações dos agentes CRM, incluindo o **Output Schema** que atualmente é read-only. O schema será armazenado no banco de dados e usado tanto pelo frontend quanto pelo executor de agentes.

---

## Mudanças Necessárias

### 1. Migração do Banco de Dados

Adicionar coluna `output_schema` na tabela `agent_configs`:

```sql
ALTER TABLE agent_configs 
ADD COLUMN output_schema JSONB DEFAULT '{}';
```

---

### 2. Atualizar Interface do Editor (CRMAgentEditor.tsx)

**Antes:** Output Schema exibido em `<pre>` read-only vindo de `CRM_AGENT_DEFINITIONS`

**Depois:** 
- Adicionar `Textarea` editável para o Output Schema
- Validação JSON em tempo real
- Botão "Restaurar padrão" para resetar ao schema original
- Feedback visual se JSON for inválido

---

### 3. Atualizar Hook de Persistência (useCRMAgentConfigs.ts)

- Adicionar `output_schema` ao tipo `CRMAgentConfig`
- Incluir campo no `useCreateCRMAgent` e `useUpdateCRMAgent`
- Carregar schema do banco quando existir, fallback para default

---

### 4. Atualizar Executor de Agentes (crm-agent-executor.ts)

Modificar para buscar o `output_schema` da configuração do agente no banco ao invés de usar o hardcoded:

```text
ANTES:
buildAgentPrompt() -> CRM_AGENT_PROMPTS[agentType].outputSchema

DEPOIS:  
buildAgentPrompt() -> agentConfig.output_schema (vindo do banco)
```

---

### 5. Atualizar Edge Function (crm-process-opportunity)

Modificar query para incluir `output_schema` ao buscar configurações dos agentes.

---

## Fluxo de Dados Atualizado

```text
┌─────────────────────────────────────────────────────────────┐
│                     UI (CRMAgentEditor)                      │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Nome/Desc   │  │ System      │  │ Output Schema       │  │
│  │ Model/Temp  │  │ Prompt      │  │ (JSONB editável)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     agent_configs                            │
│                                                              │
│  id | agent_name | system_prompt | output_schema | ...      │
│                                    ▲ NOVO CAMPO              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              crm-process-opportunity (Edge)                  │
│                                                              │
│  1. Busca agent_configs com output_schema                   │
│  2. Monta prompt usando agentConfig.output_schema           │
│  3. Executa LLM e valida resposta                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/xxx.sql` | Criar coluna output_schema |
| `src/modules/crm/components/agents/CRMAgentEditor.tsx` | Tornar schema editável |
| `src/modules/crm/hooks/useCRMAgentConfigs.ts` | Adicionar output_schema ao tipo e operações |
| `supabase/functions/_shared/crm-agent-executor.ts` | Usar schema do banco |
| `supabase/functions/crm-process-opportunity/index.ts` | Incluir output_schema na query |

---

## Detalhes Técnicos

### Validação JSON no Frontend

```typescript
const [schemaError, setSchemaError] = useState<string | null>(null);

const handleSchemaChange = (value: string) => {
  try {
    JSON.parse(value);
    setSchemaError(null);
    setFormData(prev => ({ ...prev, output_schema: value }));
  } catch (e) {
    setSchemaError('JSON inválido');
  }
};
```

### Fallback para Schema Padrão

Se o agente não tiver `output_schema` no banco, usar o default do `CRM_AGENT_DEFINITIONS`:

```typescript
const effectiveSchema = existingConfig?.output_schema 
  || definition.outputSchema;
```

### Atualização do Executor

```typescript
// crm-agent-executor.ts
function buildAgentPrompt(
  agentConfig: AgentConfig, // agora inclui output_schema
  agentType: AgentType,
  conversationText: string,
  ...
): string {
  // Usar schema do agentConfig ao invés do hardcoded
  const outputSchema = agentConfig.output_schema 
    || CRM_AGENT_PROMPTS[agentType].outputSchema;
    
  prompt += `## FORMATO DE SAÍDA\n${JSON.stringify(outputSchema, null, 2)}`;
}
```

---

## Benefícios

1. **Flexibilidade Total**: Cada agente pode ter seu schema customizado
2. **Sem Deploy**: Alterações de schema não exigem redeploy de código
3. **Retrocompatibilidade**: Agentes sem schema customizado usam o default
4. **Validação**: JSON inválido não pode ser salvo
5. **Histórico**: Schema fica versionado junto com outras configs do agente

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Schema inválido quebrar execução | Validação JSON obrigatória antes de salvar |
| Schema incompatível com mapeamento | Documentar campos esperados pelo `mapToOpportunityFields` |
| Perda de schema customizado | Botão "Restaurar padrão" sempre disponível |

