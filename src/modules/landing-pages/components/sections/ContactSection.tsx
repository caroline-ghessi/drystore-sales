import { Phone, Mail, Clock } from 'lucide-react';
import { LeadCaptureForm } from '../forms/LeadCaptureForm';
interface ContactSectionProps {
  productInterest: string;
  landingPageId: string;
}
export function ContactSection({
  productInterest,
  landingPageId
}: ContactSectionProps) {
  return <section id="contato" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Solicite seu <span className="text-drystore-orange">Orçamento Grátis</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Preencha o formulário e receba um orçamento personalizado sem compromisso. 
            Nossa equipe entrará em contato em até 24 horas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Form */}
          <div className="bg-card rounded-2xl shadow-xl p-6 md:p-8 border border-border">
            <LeadCaptureForm productInterest={productInterest} landingPageId={landingPageId} buttonText="Solicitar Orçamento Grátis" />
          </div>

          {/* Contact Info */}
          <div className="flex flex-col justify-center gap-8">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-6">
                Outras formas de contato
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-drystore-orange/10 p-3 rounded-full">
                    <Phone className="w-5 h-5 text-drystore-orange" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">WhatsApp</p>
                    <a target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-drystore-orange transition-colors" href="https://wa.me/5551991422784">
                      (51) 99142-2784
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-drystore-orange/10 p-3 rounded-full">
                    <Mail className="w-5 h-5 text-drystore-orange" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">E-mail</p>
                    <a href="mailto:contato@drystore.com.br" className="text-muted-foreground hover:text-drystore-orange transition-colors">
                      contato@drystore.com.br
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-drystore-orange/10 p-3 rounded-full">
                    <Phone className="w-5 h-5 text-drystore-orange" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Telefone</p>
                    <p className="text-muted-foreground">(51) 3061-4300</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-drystore-orange/10 p-3 rounded-full">
                    <Clock className="w-5 h-5 text-drystore-orange" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Horário de Atendimento</p>
                    <p className="text-muted-foreground">
                      Porto Alegre - RS 
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Elements */}
            <div className="bg-drystore-orange/5 rounded-xl p-6 border border-drystore-orange/20">
              <p className="text-sm text-muted-foreground mb-3">
                ✓ Orçamento sem compromisso
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                ✓ Resposta em até 24 horas
              </p>
              <p className="text-sm text-muted-foreground">
                ✓ Atendimento especializado
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>;
}