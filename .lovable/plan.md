

# Plano: Implementar Funcionalidade de Filtro no Pipeline

## Problema Identificado

O campo de busca "Buscar oportunidades..." é apenas visual - não está conectado a nenhuma lógica de filtragem. Quando você digita, nada acontece porque:

1. Não existe estado para armazenar o termo de busca
2. O Input não tem `onChange` para capturar a digitação
3. O `PipelineKanban` não recebe nenhum filtro
4. O hook `useOpportunities` retorna todos os dados sem filtrar

## Solução Proposta

Implementar filtro funcional que busca por nome do cliente, título da oportunidade ou cidade.

---

## Arquivos a Modificar

### 1. `src/modules/crm/pages/Pipeline.tsx`

Adicionar estado de busca e passar para o Kanban:

```tsx
export default function Pipeline() {
  const [view, setView] = React.useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = React.useState('');  // NOVO

  // ...

  <Input 
    placeholder="Buscar oportunidades..." 
    className="pl-9 bg-background"
    value={searchTerm}                        // NOVO
    onChange={(e) => setSearchTerm(e.target.value)}  // NOVO
  />

  // ...

  <PipelineKanban searchTerm={searchTerm} />  // PASSAR FILTRO
```

### 2. `src/modules/crm/components/pipeline/PipelineKanban.tsx`

Receber o filtro e aplicar nos dados:

```tsx
interface PipelineKanbanProps {
  onValidate?: (opportunity: Opportunity) => void;
  searchTerm?: string;  // NOVO
}

export function PipelineKanban({ onValidate, searchTerm = '' }: PipelineKanbanProps) {
  const { data, isLoading, error } = useOpportunities();
  
  // Filtrar oportunidades com base no termo de busca
  const filteredByStage = React.useMemo(() => {
    if (!data?.byStage || !searchTerm.trim()) {
      return data?.byStage;
    }
    
    const lowerSearch = searchTerm.toLowerCase().trim();
    
    // Filtrar cada estágio
    const filtered: typeof data.byStage = {
      prospecting: [],
      qualification: [],
      proposal: [],
      negotiation: [],
      closed_won: [],
      closed_lost: [],
    };
    
    Object.entries(data.byStage).forEach(([stage, opportunities]) => {
      filtered[stage as keyof typeof filtered] = opportunities.filter(opp => {
        const customerName = opp.customer?.name?.toLowerCase() || '';
        const title = opp.title?.toLowerCase() || '';
        const city = opp.customer?.city?.toLowerCase() || '';
        
        return customerName.includes(lowerSearch) || 
               title.includes(lowerSearch) || 
               city.includes(lowerSearch);
      });
    });
    
    return filtered;
  }, [data?.byStage, searchTerm]);

  // Usar filteredByStage em vez de data?.byStage
  // ...
}
```

---

## Campos que Serão Buscados

A busca funcionará nos seguintes campos:
- **Nome do cliente** (customer.name)
- **Título da oportunidade** (title)
- **Cidade do cliente** (customer.city)

---

## Comportamento Esperado

1. Usuário digita no campo de busca
2. A busca é aplicada em tempo real (sem debounce para resposta imediata)
3. Apenas os cards que correspondem ao filtro são exibidos em cada coluna
4. Se nenhum resultado for encontrado em uma coluna, ela mostrará "Nenhuma oportunidade"
5. Limpar o campo restaura todos os resultados

---

## Resultado Final

O filtro funcionará corretamente, permitindo encontrar negociações pelo nome do cliente, título ou cidade.

