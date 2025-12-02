import { useLocation } from 'react-router-dom';
import { CheckCircle, MessageCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversionTracking } from '../components/tracking/ConversionTracking';

interface ThankYouState {
  conversationId?: string;
  productInterest?: string;
  name?: string;
}

export function ThankYouPage() {
  const location = useLocation();
  const state = (location.state as ThankYouState) || {};

  const { conversationId, productInterest, name } = state;

  // Número do WhatsApp da Drystore para contato direto
  const drystoreWhatsapp = '5511999999999'; // Substituir pelo número real
  const whatsappMessage = encodeURIComponent(
    `Olá! Me cadastrei pelo site e gostaria de mais informações sobre ${productInterest || 'produtos Drystore'}.`
  );
  const whatsappLink = `https://wa.me/${drystoreWhatsapp}?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      {/* Tracking de conversão */}
      <ConversionTracking
        eventName="lead_captured"
        eventData={{
          productInterest,
          conversationId,
          page: 'thank_you',
        }}
      />

      <div className="max-w-lg w-full text-center space-y-8">
        {/* Ícone de sucesso */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Mensagem principal */}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Obrigado{name ? `, ${name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Seu cadastro foi realizado com sucesso.
          </p>
        </div>

        {/* Próximos passos */}
        <div className="bg-card rounded-xl p-6 border border-border text-left space-y-4">
          <h2 className="font-semibold text-card-foreground text-center">
            O que acontece agora?
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-card-foreground">
                  Análise em até 24h
                </p>
                <p className="text-sm text-muted-foreground">
                  Nossa equipe irá analisar seu pedido e preparar um orçamento personalizado.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-card-foreground">
                  Contato via WhatsApp
                </p>
                <p className="text-sm text-muted-foreground">
                  Um especialista entrará em contato pelo WhatsApp informado para tirar suas dúvidas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA WhatsApp */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Prefere falar agora? Chame no WhatsApp:
          </p>
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
            asChild
          >
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-5 w-5" />
              Falar no WhatsApp
            </a>
          </Button>
        </div>

        {/* Footer minimalista */}
        <p className="text-xs text-muted-foreground pt-4">
          © {new Date().getFullYear()} Drystore. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
