import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, MessageCircle, ExternalLink, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProposalResultProps {
  proposal: {
    id: string;
    number: string;
    title: string;
    total: number;
    validUntil: string;
    status: string;
    acceptanceLink?: string;
    uniqueId?: string;
  };
  generatedContent?: {
    executiveSummary: string;
    benefitsHighlights: string[];
  };
}

export function ProposalResult({ proposal, generatedContent }: ProposalResultProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = async () => {
    if (!proposal.acceptanceLink) {
      toast({
        title: "Erro",
        description: "Link da proposta não disponível",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(proposal.acceptanceLink);
      setLinkCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link da proposta foi copiado para a área de transferência",
      });
      
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link",
        variant: "destructive",
      });
    }
  };

  const handleSendWhatsApp = () => {
    if (!proposal.acceptanceLink) {
      toast({
        title: "Erro",
        description: "Link da proposta não disponível",
        variant: "destructive",
      });
      return;
    }

    const message = `Olá! 👋

Segue sua proposta personalizada:

📋 *Proposta Nº:* ${proposal.number}
💰 *Valor:* R$ ${proposal.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
📅 *Válida até:* ${new Date(proposal.validUntil).toLocaleDateString('pt-BR')}

🔗 *Visualizar proposta completa:*
${proposal.acceptanceLink}

A proposta está formatada para impressão e contém todos os detalhes do seu projeto.

Qualquer dúvida, estou à disposição! 😊`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleViewProposal = () => {
    if (proposal.acceptanceLink) {
      window.open(proposal.acceptanceLink, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                Proposta Gerada com Sucesso!
              </h3>
              <p className="text-green-600">
                Sua proposta foi criada e está pronta para ser compartilhada com o cliente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposal Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>Proposta {proposal.number}</span>
                <Badge variant="default">{proposal.status}</Badge>
              </CardTitle>
              <CardDescription>{proposal.title}</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                R$ {proposal.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-muted-foreground">
                Válida até {new Date(proposal.validUntil).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Link único */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">🔗 Link Único da Proposta</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Compartilhe este link com seu cliente. A proposta estará formatada perfeitamente para visualização e impressão em A4.
            </p>
            
            {proposal.acceptanceLink && (
              <div className="flex items-center space-x-2">
                <code className="flex-1 px-3 py-2 bg-background border rounded text-sm">
                  {proposal.acceptanceLink}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className={linkCopied ? 'bg-green-50 border-green-200' : ''}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {linkCopied ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button onClick={handleViewProposal} variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Visualizar Proposta
            </Button>
            
            <Button onClick={handleCopyLink} variant="outline">
              <Share className="h-4 w-4 mr-2" />
              Copiar Link
            </Button>
            
            <Button onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700">
              <MessageCircle className="h-4 w-4 mr-2" />
              Enviar WhatsApp
            </Button>
          </div>

          {/* AI Generated Content Preview */}
          {generatedContent && (
            <div className="mt-6 space-y-4">
              <h4 className="font-semibold">Conteúdo Gerado pela IA:</h4>
              
              {generatedContent.executiveSummary && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">Resumo Executivo:</h5>
                  <p className="text-blue-700 text-sm">{generatedContent.executiveSummary}</p>
                </div>
              )}
              
              {generatedContent.benefitsHighlights && generatedContent.benefitsHighlights.length > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h5 className="font-medium text-green-800 mb-2">Principais Benefícios:</h5>
                  <ul className="text-green-700 text-sm space-y-1">
                    {generatedContent.benefitsHighlights.map((benefit, index) => (
                      <li key={index}>• {benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}