
# Plano: Página "Insights IA" como "Em Breve"

## Resumo

Substituir o conteúdo atual da página de Insights IA (rota `/crm/leads-quentes`) por uma página simples de placeholder mostrando que o recurso está "em breve".

---

## Mudança Necessária

### Arquivo: `src/modules/crm/pages/LeadsQuentes.tsx`

Substituir todo o conteúdo atual (558 linhas) por uma página simples de placeholder com:

- Ícone centralizado (Lightbulb ou Sparkles)
- Título "Insights IA"
- Mensagem "Em breve"
- Descrição explicativa curta
- Visual limpo e centralizado

---

## Estrutura da Nova Página

```text
+-----------------------------------------------+
|                                               |
|                                               |
|               💡 (ícone grande)               |
|                                               |
|              Insights IA                      |
|                                               |
|               Em Breve                        |
|                                               |
|   Estamos desenvolvendo recursos avançados    |
|   de inteligência artificial para ajudá-lo   |
|   a identificar as melhores oportunidades.   |
|                                               |
|              [Voltar ao Pipeline]             |
|                                               |
+-----------------------------------------------+
```

---

## Código Simplificado

```tsx
import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function LeadsQuentes() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center max-w-md px-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Lightbulb className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Insights IA
        </h1>
        
        <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary font-semibold rounded-full text-sm mb-4">
          Em Breve
        </span>
        
        <p className="text-muted-foreground mb-8">
          Estamos desenvolvendo recursos avançados de inteligência artificial 
          para ajudá-lo a identificar as melhores oportunidades e tomar 
          decisões mais inteligentes.
        </p>
        
        <Button onClick={() => navigate('/crm/pipeline')}>
          Voltar ao Pipeline
        </Button>
      </div>
    </div>
  );
}
```

---

## Estilo Visual

| Elemento | Estilo |
|----------|--------|
| Container | Centralizado vertical e horizontalmente |
| Ícone | `w-20 h-20` em círculo `bg-primary/10` |
| Badge "Em Breve" | `bg-primary/10 text-primary` pill shape |
| Texto descritivo | `text-muted-foreground` |
| Botão | Primary, navega para `/crm/pipeline` |

---

## Benefícios

1. **Código limpo**: De ~558 linhas para ~35 linhas
2. **Sem dependências desnecessárias**: Remove hooks e componentes não utilizados
3. **Expectativa clara**: Usuário sabe que o recurso virá em breve
4. **Navegação fácil**: Botão para voltar ao Pipeline

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/modules/crm/pages/LeadsQuentes.tsx` | Substituir conteúdo completo |

Nenhum outro arquivo precisa ser alterado, pois a rota e o item de menu já estão configurados corretamente.
