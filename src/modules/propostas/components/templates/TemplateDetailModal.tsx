import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProductTemplateConfig } from '../../types/product-templates.types';
import { TemplatePreview } from './TemplatePreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Code, Settings, Palette } from 'lucide-react';

interface TemplateDetailModalProps {
  template: ProductTemplateConfig;
  isOpen: boolean;
  onClose: () => void;
}

export function TemplateDetailModal({ template, isOpen, onClose }: TemplateDetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{template.displayName}</DialogTitle>
              <DialogDescription>
                Template específico para produtos do tipo {template.productType}
              </DialogDescription>
            </div>
            <Badge variant="outline" className="ml-2">
              {template.productType.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="mr-2 h-4 w-4" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="colors">
              <Palette className="mr-2 h-4 w-4" />
              Cores & Estilo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            <TemplatePreview template={template} />
          </TabsContent>

          <TabsContent value="config" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* KPIs Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{template.kpiSection.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {template.kpiSection.kpis.map((kpi, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{kpi.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {kpi.unit || 'Valor'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Benefits Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{template.benefitsSection.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {template.benefitsSection.benefits.map((benefit, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        • {benefit}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Warranty Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{template.warrantySection.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {template.warrantySection.warranties.map((warranty, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{warranty.component}</span>
                        <Badge variant="outline" className="text-xs">
                          {warranty.duration}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {warranty.details}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Technical Specs */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{template.technicalSection.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {template.technicalSection.specs.map((spec, index) => (
                    <div key={index}>
                      <div className="font-medium text-sm mb-1">{spec.category}</div>
                      <div className="space-y-1">
                        {spec.specifications.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{item.name}</span>
                            <span>{item.value} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="colors" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Paleta de Cores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Cor Primária</span>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: template.primaryColor }}
                        />
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {template.primaryColor}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Cor de Destaque</span>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: template.accentColor }}
                        />
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {template.accentColor}
                        </code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Informações Adicionais</CardTitle>
                </CardHeader>
                <CardContent>
                  {template.additionalInfo ? (
                    <div className="space-y-3">
                      {template.additionalInfo.certifications && (
                        <div>
                          <div className="font-medium text-sm mb-1">Certificações</div>
                          <div className="flex flex-wrap gap-1">
                            {template.additionalInfo.certifications.map((cert, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {template.additionalInfo.compliance && (
                        <div>
                          <div className="font-medium text-sm mb-1">Conformidade</div>
                          <div className="flex flex-wrap gap-1">
                            {template.additionalInfo.compliance.map((comp, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {comp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma informação adicional configurada
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}