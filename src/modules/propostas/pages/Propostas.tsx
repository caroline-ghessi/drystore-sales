import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, FileText, Zap, Plus, Search } from 'lucide-react';
import { ProposalGenerator } from '../components/generator/ProposalGenerator';

export default function Propostas() {
  const [activeTab, setActiveTab] = useState('generator');

  return (
    <div className="p-6 space-y-6 bg-drystore-light-gray min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-drystore-dark-gray">Criar Nova Proposta</h1>
          <p className="text-drystore-medium-gray mt-1">
            Sistema inteligente para geração automática de propostas com IA
          </p>
        </div>
        <Badge variant="default" className="bg-drystore-orange text-drystore-white">
          ✨ Com IA
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generator" className="flex items-center">
            <Zap className="mr-2 h-4 w-4" />
            Gerador IA
          </TabsTrigger>
          <TabsTrigger value="list">
            <FileText className="mr-2 h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Search className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <Calculator className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <ProposalGenerator />
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Propostas</CardTitle>
              <CardDescription>Gerencie todas as propostas criadas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>Gerencie templates personalizados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Métricas e relatórios de propostas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}