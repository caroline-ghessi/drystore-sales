import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductTemplateConfig } from '../../types/product-templates.types';
import { CheckCircle, Award, Info, Zap } from 'lucide-react';

interface TemplatePreviewProps {
  template: ProductTemplateConfig;
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  // Dados fictícios para preview
  const mockData = {
    client: { name: 'João Silva', email: 'joao@example.com' },
    project: { area: 100, location: 'São Paulo, SP' }
  };

  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto">
      {/* Hero Section */}
      <Card 
        className="relative overflow-hidden border-2"
        style={{ borderColor: template.accentColor }}
      >
        <div 
          className="absolute inset-0 opacity-5"
          style={{ backgroundColor: template.primaryColor }}
        />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle 
                className="text-2xl font-bold"
                style={{ color: template.primaryColor }}
              >
                {template.heroTitle}
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                {template.heroSubtitle}
              </p>
            </div>
            <Badge 
              className="text-white"
              style={{ backgroundColor: template.primaryColor }}
            >
              Preview
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* KPIs Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Zap className="mr-2 h-5 w-5" style={{ color: template.accentColor }} />
            {template.kpiSection.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {template.kpiSection.kpis.map((kpi, index) => (
              <div key={index} className="text-center p-3 rounded-lg bg-muted/50">
                <div 
                  className="text-2xl font-bold"
                  style={{ color: kpi.highlight ? template.primaryColor : 'inherit' }}
                >
                  {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                  {kpi.unit && <span className="text-sm ml-1">{kpi.unit}</span>}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {kpi.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Benefits Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <CheckCircle className="mr-2 h-5 w-5" style={{ color: template.accentColor }} />
              {template.benefitsSection.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {template.benefitsSection.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircle 
                    className="h-4 w-4 mt-0.5 flex-shrink-0" 
                    style={{ color: template.primaryColor }}
                  />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Warranty Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Award className="mr-2 h-5 w-5" style={{ color: template.accentColor }} />
              {template.warrantySection.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {template.warrantySection.warranties.map((warranty, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm">{warranty.component}</span>
                    <Badge 
                      variant="outline"
                      style={{ borderColor: template.primaryColor, color: template.primaryColor }}
                    >
                      {warranty.duration}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {warranty.details}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technical Specs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Info className="mr-2 h-5 w-5" style={{ color: template.accentColor }} />
            {template.technicalSection.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {template.technicalSection.specs.map((spec, index) => (
              <div key={index} className="space-y-2">
                <h4 
                  className="font-medium text-sm"
                  style={{ color: template.primaryColor }}
                >
                  {spec.category}
                </h4>
                <div className="space-y-1">
                  {spec.specifications.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium">
                        {item.value} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      {template.additionalInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {template.additionalInfo.certifications && (
              <div>
                <h4 className="font-medium text-sm mb-2">Certificações</h4>
                <div className="flex flex-wrap gap-2">
                  {template.additionalInfo.certifications.map((cert, index) => (
                    <Badge key={index} variant="secondary">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {template.additionalInfo.recommendations && (
              <div>
                <h4 className="font-medium text-sm mb-2">Recomendações</h4>
                <div className="space-y-1">
                  {template.additionalInfo.recommendations.map((rec, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      • {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}