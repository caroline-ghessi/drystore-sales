import { ReactNode } from 'react';
import { Shield, Award, Check, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface HeroSectionProps {
  headline: string;
  subheadline?: string;
  heroImage?: string;
  ctaPrimaryText?: string;
  ctaSecondaryText?: string;
  onCtaPrimaryClick?: () => void;
  onCtaSecondaryClick?: () => void;
  children?: ReactNode;
}
export function HeroSection({
  headline,
  subheadline,
  heroImage,
  ctaPrimaryText = 'Solicitar Orçamento',
  ctaSecondaryText = 'Ver Catálogo',
  onCtaPrimaryClick,
  onCtaSecondaryClick,
  children
}: HeroSectionProps) {
  const scrollToContact = () => {
    const element = document.getElementById('contato');
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  const handlePrimaryClick = () => {
    if (onCtaPrimaryClick) {
      onCtaPrimaryClick();
    } else {
      scrollToContact();
    }
  };
  return <section className="relative bg-background py-12 md:py-20 lg:py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left side - Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              {headline.includes('Sonhos') ? <>
                  Descubra o Telhado dos Seus{' '}
                  <span className="text-drystore-orange">Sonhos</span>
                </> : headline}
            </h1>

            {subheadline && <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                {subheadline}
              </p>}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Button size="lg" onClick={handlePrimaryClick} className="bg-drystore-orange hover:bg-drystore-orange/90 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                {ctaPrimaryText}
              </Button>
              {ctaSecondaryText && onCtaSecondaryClick && <Button size="lg" variant="outline" onClick={onCtaSecondaryClick} className="border-drystore-orange text-drystore-orange hover:bg-drystore-orange/10 px-8 py-6 text-lg font-semibold">
                  {ctaSecondaryText}
                </Button>}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="bg-drystore-orange/10 p-2 rounded-full">
                  <Check className="h-5 w-5 text-drystore-orange" />
                </div>
                <span className="text-muted-foreground text-sm md:text-base">Garantia de até 30 anos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-drystore-orange/10 p-2 rounded-full">
                  <CreditCard className="h-5 w-5 text-drystore-orange" />
                </div>
                <span className="text-muted-foreground text-sm md:text-base">Até 24X nos cartôes</span>
              </div>
            </div>

            {/* Additional badges */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              <span className="inline-flex items-center gap-1.5 bg-drystore-orange/10 text-drystore-orange px-3 py-1.5 rounded-full text-sm font-medium">
                <Shield className="w-4 h-4" />
                Qualidade Americana
              </span>
              <span className="inline-flex items-center gap-1.5 bg-drystore-orange/10 text-drystore-orange px-3 py-1.5 rounded-full text-sm font-medium">
                <Award className="w-4 h-4" />
                Forbes Home #2
              </span>
            </div>

            {children}
          </div>

          {/* Right side - Hero Image */}
          <div className="relative order-1 lg:order-2">
            {heroImage ? <div className="relative">
                <img src={heroImage} alt="Casa com telhas shingle Owens Corning" className="rounded-2xl shadow-2xl w-full object-cover aspect-[4/3]" loading="eager" />
                {/* Badge overlay */}
                <div className="absolute -bottom-4 -left-4 md:bottom-6 md:-left-6 bg-drystore-orange text-white px-4 md:px-6 py-3 md:py-4 rounded-xl shadow-lg">
                  <span className="font-bold text-sm md:text-base">Telhas Shingle</span>
                  <p className="text-xs md:text-sm opacity-90">Qualidade americana</p>
                </div>
              </div> : <div className="bg-muted rounded-2xl aspect-[4/3] flex items-center justify-center">
                <span className="text-muted-foreground">Imagem do produto</span>
              </div>}
          </div>
        </div>
      </div>
    </section>;
}