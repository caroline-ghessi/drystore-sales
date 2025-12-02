import { ReactNode } from 'react';
import { Shield, Award, Check, CreditCard } from 'lucide-react';
import { LeadCaptureForm } from '../forms/LeadCaptureForm';

interface HeroSectionProps {
  headline: string;
  subheadline?: string;
  productInterest: string;
  landingPageId: string;
  backgroundImage?: string;
  heroImage?: string;
  children?: ReactNode;
}

export function HeroSection({
  headline,
  subheadline,
  productInterest,
  landingPageId,
  backgroundImage,
  heroImage,
  children,
}: HeroSectionProps) {
  return (
    <section
      className={`relative min-h-screen flex items-center ${backgroundImage ? 'hero-pattern' : ''}`}
      style={
        backgroundImage && !backgroundImage.includes('hero-pattern')
          ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/70" />

      <div className="container mx-auto px-4 z-10 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              {headline.includes('Sonhos') ? (
                <>
                  Descubra o Telhado dos Seus{' '}
                  <span className="text-primary">Sonhos</span>
                </>
              ) : (
                headline
              )}
            </h1>

            {subheadline && (
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
                {subheadline}
              </p>
            )}

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <span className="text-muted-foreground">Garantia de até 30 anos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <span className="text-muted-foreground">Até 12x sem juros</span>
              </div>
            </div>

            {/* Badges adicionais */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
                <Shield className="w-4 h-4" />
                Qualidade Americana
              </span>
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
                <Award className="w-4 h-4" />
                Forbes Home #2
              </span>
            </div>

            {children}
          </div>

          {/* Right side - Form or Hero Image */}
          <div className="flex flex-col items-center gap-8">
            {heroImage && (
              <div className="relative hidden lg:block">
                <img
                  src={heroImage}
                  alt="Casa com telhas shingle Owens Corning"
                  className="rounded-lg shadow-xl w-full object-cover h-[400px] max-w-md"
                  width="600"
                  height="400"
                  loading="eager"
                />
                <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg">
                  <span className="font-bold">Telhas Shingle</span>
                  <p className="text-sm opacity-90">Qualidade americana</p>
                </div>
              </div>
            )}

            {/* Lead Form */}
            <div className="w-full max-w-md" id="contato">
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
      </div>
    </section>
  );
}
