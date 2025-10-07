import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Database, Search, FileText, BarChart3, Upload, 
  Folder, File, Trash2, Download, RefreshCw,
  Brain, Zap, Target, TrendingUp, AlertCircle 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCategory } from '@/types/bot.types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmbeddingsManager } from './EmbeddingsManager';

export function RAGSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    // Simular busca
    setTimeout(() => {
      setSearchResults([
        {
          id: 1,
          content: "Energia solar é uma fonte renovável de energia obtida através da luz do sol...",
          score: 0.95,
          source: "Manual Energia Solar - Página 12",
          category: "energia_solar"
        },
        {
          id: 2,
          content: "O sistema fotovoltaico converte a luz solar diretamente em eletricidade...",
          score: 0.87,
          source: "Guia Técnico - Seção 3.2",
          category: "energia_solar"
        }
      ]);
      setIsSearching(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sistema RAG
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              Retrieval-Augmented Generation
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Busca semântica e análise da base de conhecimento
          </p>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Busca Semântica
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="patterns" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                FAQ Patterns
              </TabsTrigger>
              <TabsTrigger value="embeddings" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Embeddings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="search" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-background text-foreground text-sm"
                  >
                    <option value="all">Todas as Categorias</option>
                    <option value="energia_solar">☀️ Energia Solar</option>
                    <option value="telhas_shingle">🏠 Telhas Shingle</option>
                    <option value="steel_frame">🏗️ Steel Frame</option>
                    <option value="ferramentas">🔧 Ferramentas</option>
                  </select>
                  
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Digite sua pergunta para testar a busca semântica..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={isSearching}>
                      {isSearching ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Resultados da Busca</h4>
                      <Badge variant="secondary">{searchResults.length} resultado(s)</Badge>
                    </div>
                    {searchResults.map(result => (
                      <div key={result.id} className="p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {Math.round(result.score * 100)}% relevância
                          </Badge>
                          <span className="text-xs text-muted-foreground">{result.source}</span>
                        </div>
                        <p className="text-sm">{result.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-lg bg-muted/30 border-2 border-dashed text-center">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Digite uma pergunta para testar o sistema de busca semântica
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Total Queries</span>
                  </div>
                  <p className="text-2xl font-bold">1,234</p>
                  <p className="text-xs text-muted-foreground">+12% este mês</p>
                </div>
                
                <div className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Taxa de Sucesso</span>
                  </div>
                  <p className="text-2xl font-bold">94.2%</p>
                  <Progress value={94.2} className="mt-2 h-2" />
                </div>
                
                <div className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Confiança Média</span>
                  </div>
                  <p className="text-2xl font-bold">0.87</p>
                  <Progress value={87} className="mt-2 h-2" />
                </div>
                
                <div className="p-4 bg-card rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Base Conhecimento</span>
                  </div>
                  <p className="text-2xl font-bold">89 docs</p>
                  <p className="text-xs text-muted-foreground">3.2MB total</p>
                </div>
              </div>

              {/* Usage Charts Area */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Consultas por Categoria</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>☀️ Energia Solar</span>
                      <span className="font-medium">67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span>🏠 Telhas Shingle</span>
                      <span className="font-medium">23%</span>
                    </div>
                    <Progress value={23} className="h-2" />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span>🏗️ Steel Frame</span>
                      <span className="font-medium">10%</span>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Performance Temporal</h4>
                  <div className="h-24 flex items-end justify-between gap-1">
                    {[65, 78, 82, 75, 89, 94, 91].map((value, i) => (
                      <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{height: `${value}%`}}>
                        <div className="w-full bg-primary rounded-t" style={{height: '20%'}}></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Seg</span>
                    <span>Dom</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="patterns" className="space-y-4 mt-6">
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Perguntas Mais Frequentes</h4>
                  <div className="space-y-3">
                    {[
                      { question: "Quanto custa um sistema solar?", count: 127, category: "energia_solar" },
                      { question: "Como funciona a compensação elétrica?", count: 98, category: "energia_solar" },
                      { question: "Qual a vida útil das telhas shingle?", count: 76, category: "telhas_shingle" }
                    ].map((faq, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                        <div>
                          <p className="text-sm font-medium">{faq.question}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {faq.category}
                          </Badge>
                        </div>
                        <Badge variant="secondary">{faq.count}x</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="embeddings" className="space-y-4 mt-6">
              <div className="flex items-center gap-3 mb-6">
                <label className="text-sm font-medium text-foreground">Categoria:</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="all">Todas as Categorias</option>
                  <option value="energia_solar">☀️ Energia Solar</option>
                  <option value="telhas_shingle">🏠 Telhas Shingle</option>
                  <option value="steel_frame">🏗️ Steel Frame</option>
                  <option value="ferramentas">🔧 Ferramentas</option>
                </select>
              </div>
              <EmbeddingsManager selectedCategory={selectedCategory} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}