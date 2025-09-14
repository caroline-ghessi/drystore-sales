import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductTemplateConfig } from '../../types/product-templates.types';
import { Eye, Settings, Palette } from 'lucide-react';

interface TemplateCardProps {
  template: ProductTemplateConfig;
  onView: () => void;
}

export function TemplateCard({ template, onView }: TemplateCardProps) {
  const getProductTypeColor = (type: string) => {
    switch (type) {
      case 'shingle':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'solar':
      case 'solar_advanced':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'forro_drywall':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold">
              {template.displayName}
            </CardTitle>
            <Badge 
              variant="outline" 
              className={getProductTypeColor(template.productType)}
            >
              {template.productType.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <div 
            className="w-4 h-4 rounded-full border-2"
            style={{ 
              backgroundColor: template.primaryColor,
              borderColor: template.accentColor 
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-2">Prévia</h4>
          <div className="text-sm space-y-1">
            <div className="font-medium">{template.heroTitle}</div>
            <div className="text-muted-foreground line-clamp-2">
              {template.heroSubtitle}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="font-medium text-muted-foreground">KPIs:</span>
            <div className="text-foreground">{template.kpiSection.kpis.length}</div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Garantias:</span>
            <div className="text-foreground">{template.warrantySection.warranties.length}</div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Specs:</span>
            <div className="text-foreground">{template.technicalSection.specs.length}</div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Benefícios:</span>
            <div className="text-foreground">{template.benefitsSection.benefits.length}</div>
          </div>
        </div>

        <div className="flex space-x-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onView}
            className="flex-1"
          >
            <Eye className="mr-2 h-3 w-3" />
            Visualizar
          </Button>
          <Button size="sm" variant="ghost" className="px-2">
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}