

# Plano: Exibir Agente Opportunity Matcher na Página /crm/agentes

## Problema Identificado

O agente "Opportunity Matcher" está:
- Criado no banco de dados (id: `b69b8c6d-dbfb-441a-8fd7-cb8d1c24fc59`) 
- Definido em `CRM_AGENT_DEFINITIONS` com categoria `'validation'`
- **NÃO aparece na interface** porque `CRMAgentsList.tsx` só renderiza 3 categorias: `analysis`, `extraction`, `decision`

---

## Correção Necessária

### Arquivo: `src/modules/crm/components/agents/CRMAgentsList.tsx`

**1. Adicionar cor para a categoria `validation` (linha 31-35):**

```typescript
const categoryColors: Record<string, string> = {
  analysis: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  extraction: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  decision: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  validation: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', // ADICIONAR
};
```

**2. Incluir a categoria `validation` no array de categorias (linha 52):**

```typescript
// Antes:
const categories = ['analysis', 'extraction', 'decision'];

// Depois:
const categories = ['analysis', 'extraction', 'decision', 'validation'];
```

---

## Também: Atualizar Contador no Header

### Arquivo: `src/modules/crm/pages/AgentManagement.tsx`

O header diz "8 agentes especializados", mas agora temos 9. Atualizar:

**Linha 83-84:**
```typescript
// Antes:
<p className="text-muted-foreground">
  Gerencie os 8 agentes especializados para análise e extração de dados
</p>

// Depois:
<p className="text-muted-foreground">
  Gerencie os 9 agentes especializados para análise, extração e validação de dados
</p>
```

**Linhas 90-91 e 107 (contadores):**
```typescript
// O alerta e contador dinâmico usam CRM_AGENT_DEFINITIONS.length,
// então vão funcionar automaticamente (agora são 9 definições)
```

---

## Resultado Esperado

Após a correção, na página `/crm/agentes`:

1. Aparecerá uma nova seção **"Validação de Dados"** com badge âmbar/amarelo
2. O agente **🔍 Opportunity Matcher** será listado nessa seção
3. Você poderá clicar em "Editar" para:
   - Alterar o **prompt do sistema** 
   - Mudar o **modelo LLM** (Claude, GPT-4o, Grok)
   - Ajustar **temperatura** e **max tokens**
   - Ativar/desativar o agente
   - Editar o **output schema** (formato JSON esperado)

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/crm/components/agents/CRMAgentsList.tsx` | Adicionar categoria `validation` + cor |
| `src/modules/crm/pages/AgentManagement.tsx` | Atualizar texto "8" → "9" agentes |

