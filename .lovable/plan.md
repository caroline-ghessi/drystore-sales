

# Plano: Adicionar Acesso à Página de Contatos Excluídos

## Problema Identificado

A página de Contatos Excluídos foi criada e a rota está configurada corretamente (`/whatsapp/vendedores/contatos-excluidos`), porém não existe nenhum botão ou link visível na página de Vendedores para acessá-la.

## Solução

Adicionar um botão de acesso na página de Vendedores, ao lado do botão "Adicionar Vendedor".

## Mudança Visual

**Antes:**
- Apenas o botão "Adicionar Vendedor"

**Depois:**
- Botão "Contatos Excluídos" (com ícone de escudo) → abre a página de gerenciamento
- Botão "Adicionar Vendedor" (mantido)

## Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/modules/whatsapp/pages/Vendedores.tsx` | Adicionar botão/link para `/whatsapp/vendedores/contatos-excluidos` |

## Código Proposto

```tsx
// No header da página, adicionar ao lado do botão "Adicionar Vendedor":
<div className="flex items-center gap-2">
  <Link to="/whatsapp/vendedores/contatos-excluidos">
    <Button variant="outline">
      <Shield className="h-4 w-4 mr-2" />
      Contatos Excluídos
    </Button>
  </Link>
  
  <Button onClick={() => setShowAddDialog(true)} className="shadow-sm">
    <Plus className="h-4 w-4 mr-2" />
    Adicionar Vendedor
  </Button>
</div>
```

## Resultado Esperado

O usuário verá um botão "Contatos Excluídos" na página de Vendedores que, ao ser clicado, navega para a página de gerenciamento onde pode adicionar números de colaboradores.

