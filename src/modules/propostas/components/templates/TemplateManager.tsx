import React, { useState } from 'react';
import { useAllProductTemplates } from '../../hooks/useProductTemplates';
import { TemplateCard } from './TemplateCard';
import { TemplateDetailModal } from './TemplateDetailModal';
import { ProductTemplateConfig } from '../../types/product-templates.types';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function TemplateManager() {
  const { data: templates, isLoading } = useAllProductTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplateConfig | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const templateArray = templates ? Array.from(templates.values()) : [];
  
  const filteredTemplates = templateArray.filter(template =>
    template.config.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.config.productType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewTemplate = (template: ProductTemplateConfig) => {
    setSelectedTemplate(template);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header com busca */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Templates de Produto</h2>
          <p className="text-muted-foreground">
            Gerencie e visualize templates específicos para cada tipo de produto
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {filteredTemplates.length} templates
        </Badge>
      </div>

      {/* Busca e filtros */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* Grid de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.config.productType}
            template={template.config}
            onView={() => handleViewTemplate(template.config)}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum template encontrado</p>
        </div>
      )}

      {/* Modal de detalhes */}
      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
    </div>
  );
}