import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { ProposalGenerator } from '../components/generator/ProposalGenerator';

export default function Propostas() {
  return (
    <div className="min-h-full bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Nova Proposta
            </h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              ✨ Powered by IA
            </Badge>
          </div>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Crie propostas profissionais em segundos com nossa tecnologia de inteligência artificial avançada
          </p>
        </div>

        {/* Generator */}
        <div className="max-w-4xl mx-auto">
          <ProposalGenerator />
        </div>
      </div>
    </div>
  );
}