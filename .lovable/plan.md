
# Plano: Atualizar mapToProjectContextFields para Project Extractor v1.0

## Resumo

Atualizar a função `mapToProjectContextFields()` no `crm-agent-executor.ts` para processar a estrutura aninhada rica do novo prompt Project Extractor v1.0, mantendo retrocompatibilidade com schemas anteriores.

---

## Estrutura do Novo Prompt vs Banco de Dados

O prompt Project Extractor v1.0 organiza dados em blocos aninhados, mas a tabela `project_contexts` tem campos em estrutura plana. O mapper precisa "achatar" os dados:

```text
PROMPT (aninhado)                    →  BANCO (plano)
────────────────────────────────────────────────────────────
location.city                        →  (via conversation)
location.neighborhood                →  location_neighborhood
property.category + project.nature   →  project_type_detailed
project.phase                        →  project_phase
project.has_architectural_project    →  has_architectural_project
professionals.has_professionals      →  has_professional
professionals.professionals_list[0]  →  professional_name
technical_data.energy_solar.*        →  technical_specs (JSONB)
technical_data.*.roof.area_m2        →  roof_size_m2
technical_data.*.energy_consumption  →  energy_consumption, energy_bill_value
products_needed[]                    →  products_needed (JSONB)
timeline.deadline_urgency            →  deadline_urgency, urgency
timeline.desired_start_date          →  start_date
```

---

## Mudanças no crm-agent-executor.ts

### Função Atualizada

```typescript
export function mapToProjectContextFields(
  extractions: Record<AgentType, Record<string, unknown>>
): Partial<Record<string, unknown>> {
  const fields: Record<string, unknown> = {};
  const project = extractions.project_extractor;
  
  if (!project) return fields;

  // Helper para acessar dados aninhados
  const get = (obj: any, ...paths: string[]): any => {
    for (const path of paths) {
      const keys = path.split('.');
      let value = obj;
      for (const key of keys) {
        value = value?.[key];
      }
      if (value !== undefined) return value;
    }
    return undefined;
  };

  // 1. LOCALIZAÇÃO
  const neighborhood = get(project, 'location.neighborhood', 'neighborhood');
  if (neighborhood) fields.location_neighborhood = neighborhood;

  // 2. TIPO DE PROJETO (combinar category + nature)
  const propCategory = get(project, 'property.category');
  const projNature = get(project, 'project.nature');
  const propSubtype = get(project, 'property.subtype');
  if (propCategory || projNature) {
    const parts = [propCategory, propSubtype, projNature].filter(Boolean);
    fields.project_type_detailed = parts.join(' - ');
  }
  // Fallback para formato antigo
  const oldType = get(project, 'project_type_detailed');
  if (oldType && !fields.project_type_detailed) {
    fields.project_type_detailed = oldType;
  }

  // 3. FASE DO PROJETO
  const phase = get(project, 'project.phase', 'project_phase');
  if (phase) fields.project_phase = phase;

  // 4. PROJETO ARQUITETÔNICO
  const hasArchProject = get(project, 'project.has_architectural_project', 'has_architectural_project');
  if (typeof hasArchProject === 'boolean') {
    fields.has_architectural_project = hasArchProject;
  }

  // 5. PROFISSIONAIS
  const hasPro = get(project, 'professionals.has_professionals', 'has_professional');
  if (typeof hasPro === 'boolean') fields.has_professional = hasPro;

  const professionals = get(project, 'professionals.professionals_list');
  if (Array.isArray(professionals) && professionals.length > 0) {
    const first = professionals[0];
    const name = first?.name || first?.company;
    const role = first?.role;
    if (name) {
      fields.professional_name = role ? `${name} (${role})` : name;
    }
  }
  // Fallback
  const oldProName = get(project, 'professional_name');
  if (oldProName && !fields.professional_name) {
    fields.professional_name = oldProName;
  }

  // 6. DADOS TÉCNICOS (JSONB completo)
  const techData = get(project, 'technical_data');
  if (techData && typeof techData === 'object') {
    fields.technical_specs = techData;

    // Extrair campos específicos para colunas dedicadas
    const category = techData.category;
    
    // Solar
    if (category === 'energia_solar' || techData.energy_solar) {
      const solar = techData.energy_solar || techData;
      const consumption = solar.energy_consumption;
      
      if (consumption?.monthly_kwh) {
        fields.energy_consumption = String(consumption.monthly_kwh);
      }
      if (consumption?.monthly_value_brl) {
        fields.energy_bill_value = consumption.monthly_value_brl;
      }
      if (solar.roof?.area_m2) {
        fields.roof_size_m2 = solar.roof.area_m2;
      }
      if (solar.roof?.condition) {
        fields.roof_status = solar.roof.condition;
      }
    }
    
    // Shingle
    if (category === 'telhas_shingle' || techData.telhas_shingle) {
      const shingle = techData.telhas_shingle || techData;
      if (shingle.roof?.area_m2) {
        fields.roof_size_m2 = shingle.roof.area_m2;
      }
      if (shingle.roof?.current_condition) {
        fields.roof_status = shingle.roof.current_condition;
      }
    }
    
    // LSF
    if (category === 'light_steel_frame' || techData.light_steel_frame) {
      const lsf = techData.light_steel_frame || techData;
      if (lsf.construction?.total_area_m2) {
        fields.construction_size_m2 = lsf.construction.total_area_m2;
      }
    }
  }
  // Fallback para formato antigo
  const oldTechSpecs = get(project, 'technical_specs');
  if (oldTechSpecs && !fields.technical_specs) {
    fields.technical_specs = oldTechSpecs;
  }

  // 7. PRODUTOS NECESSÁRIOS
  const products = get(project, 'products_needed');
  if (Array.isArray(products) && products.length > 0) {
    fields.products_needed = products;
    // Também popular materials_list (array de strings)
    fields.materials_list = products.map(p => 
      typeof p === 'string' ? p : p.product || p.name || JSON.stringify(p)
    );
  }

  // 8. QUANTIDADES ESTIMADAS (derivar de products se não existir)
  const quantities = get(project, 'estimated_quantities');
  if (quantities) {
    fields.estimated_quantities = quantities;
  } else if (Array.isArray(products)) {
    const derived: Record<string, string> = {};
    products.forEach(p => {
      if (p.product && p.quantity) {
        derived[p.product] = `${p.quantity} ${p.unit || 'un'}`;
      }
    });
    if (Object.keys(derived).length > 0) {
      fields.estimated_quantities = derived;
    }
  }

  // 9. TIMELINE
  const timeline = get(project, 'timeline');
  if (timeline) {
    if (timeline.deadline_urgency) {
      fields.deadline_urgency = timeline.deadline_urgency;
      fields.urgency = timeline.deadline_urgency;
    }
    if (timeline.desired_start_date) {
      fields.start_date = timeline.desired_start_date;
    }
    if (timeline.desired_completion_date) {
      fields.timeline = timeline.desired_completion_date;
    }
  }
  // Fallbacks
  const oldUrgency = get(project, 'deadline_urgency');
  if (oldUrgency && !fields.deadline_urgency) {
    fields.deadline_urgency = oldUrgency;
  }
  const oldStartDate = get(project, 'start_date');
  if (oldStartDate && !fields.start_date) {
    fields.start_date = oldStartDate;
  }

  return fields;
}
```

---

## Resumo das Mudanças

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Estrutura suportada | Plana | Aninhada + plana (fallback) |
| Dados técnicos | Objeto simples | Objeto por categoria (solar, shingle, LSF) |
| Profissionais | String simples | Array de objetos com role/name |
| Timeline | Campos separados | Objeto estruturado |
| Produtos | Array de strings | Array de objetos com quantidade/unidade |
| Localização | Campos diretos | Objeto aninhado |

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/_shared/crm-agent-executor.ts` | Atualizar `mapToProjectContextFields()` |
| `supabase/functions/crm-process-opportunity/index.ts` | Nenhuma mudança necessária |

---

## Benefícios

1. **Dados técnicos ricos**: Sistema agora captura orientação do telhado, tipo de conexão, sombreamento, etc.
2. **Profissionais detalhados**: Role, empresa, nível de envolvimento - não só o nome
3. **Timeline estruturado**: Urgência com motivo, bloqueadores, datas específicas
4. **Produtos com contexto**: Quantidade, unidade, especificações, urgência por item
5. **Retrocompatibilidade**: Agentes com formato antigo continuam funcionando
