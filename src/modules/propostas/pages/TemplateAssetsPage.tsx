import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Layout } from 'lucide-react';
import { AssetGallery } from '../components/assets/AssetGallery';
import { TemplateManager } from '../components/templates/TemplateManager';

export const TemplateAssetsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('assets');

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Templates e Assets</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie templates de produtos e assets visuais do sistema
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assets" className="flex items-center">
              <Image className="mr-2 h-4 w-4" />
              Assets
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center">
              <Layout className="mr-2 h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assets">
            <AssetGallery />
          </TabsContent>

          <TabsContent value="templates">
            <TemplateManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};