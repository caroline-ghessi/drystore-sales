import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Database, Search, FileText, BarChart3 } from 'lucide-react';

export function RAGSection() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sistema RAG (Retrieval-Augmented Generation)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="search">Busca Semântica</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="patterns">FAQ Patterns</TabsTrigger>
              <TabsTrigger value="embeddings">Embeddings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="search" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua pergunta para testar a busca..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground text-center">
                  Digite uma pergunta para testar o sistema de busca semântica
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Total Queries</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">1,234</p>
                </div>
                
                <div className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Taxa de Sucesso</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">94.2%</p>
                </div>
                
                <div className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Confiança Média</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">0.87</p>
                </div>
                
                <div className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Conhecimento Usado</span>
                  </div>
                  <p className="text-2xl font-bold mt-2">76%</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="patterns" className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground text-center">
                  Padrões de FAQ serão exibidos aqui
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="embeddings" className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground text-center">
                  Gerenciamento de embeddings em desenvolvimento
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}