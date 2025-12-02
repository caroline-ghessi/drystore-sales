import { ReactNode } from 'react';
import { LeadCaptureForm } from '../forms/LeadCaptureForm';

interface HeroSectionProps {
  headline: string;
  subheadline?: string;
  productInterest: string;
  landingPageId: string;
  backgroundImage?: string;
  children?: ReactNode;
}

export function HeroSection({
  headline,
  subheadline,
  productInterest,
  landingPageId,
  backgroundImage,
  children,
}: HeroSectionProps) {
  return (
    <section
      className="relative min-h-screen flex items-center py-12 px-4 md:px-8"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay para legibilidade */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      )}

      <div className="relative z-10 container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Conteúdo */}
          <div className="text-center lg:text-left space-y-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              {headline}
            </h1>
            
            {subheadline && (
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0">
                {subheadline}
              </p>
            )}

            {/* Conteúdo extra (bullets, badges, etc) */}
            {children}
          </div>

          {/* Formulário */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <div className="bg-card rounded-2xl shadow-xl p-6 md:p-8 border border-border">
              <h2 className="text-xl font-semibold text-card-foreground mb-6 text-center">
                Solicite seu orçamento grátis
              </h2>
              
              <LeadCaptureForm
                productInterest={productInterest}
                landingPageId={landingPageId}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
