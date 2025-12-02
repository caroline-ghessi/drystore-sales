import { Shield, Droplets, Palette, Award, Truck, Headphones } from 'lucide-react';
import { HeroSection } from '../components/sections/HeroSection';
import { BenefitsSection, Benefit } from '../components/sections/BenefitsSection';
import { FAQSection, FAQItem } from '../components/sections/FAQSection';

const BENEFITS: Benefit[] = [
  {
    icon: Shield,
    title: 'Garantia de 30 Anos',
    description: 'Telhas Shingle com garantia estendida do fabricante, assegurando proteção duradoura para seu telhado.',
  },
  {
    icon: Droplets,
    title: 'Impermeabilidade Total',
    description: 'Sistema de camadas que garante 100% de proteção contra infiltrações e vazamentos.',
  },
  {
    icon: Palette,
    title: 'Variedade de Cores',
    description: 'Mais de 20 opções de cores e estilos para combinar perfeitamente com sua arquitetura.',
  },
  {
    icon: Award,
    title: 'Qualidade Premium',
    description: 'Trabalhamos apenas com as melhores marcas do mercado: GAF, Owens Corning e CertainTeed.',
  },
  {
    icon: Truck,
    title: 'Entrega em Todo Brasil',
    description: 'Logística própria com entrega rápida e segura para todas as regiões do país.',
  },
  {
    icon: Headphones,
    title: 'Suporte Especializado',
    description: 'Equipe técnica disponível para orientar na escolha e aplicação do produto ideal.',
  },
];

const FAQS: FAQItem[] = [
  {
    question: 'Qual a durabilidade da Telha Shingle?',
    answer: 'As telhas Shingle possuem vida útil de 25 a 50 anos, dependendo da linha escolhida. As versões premium chegam a durar mais de 50 anos com manutenção adequada. Oferecemos garantias de até 30 anos do fabricante.',
  },
  {
    question: 'A Telha Shingle é mais cara que outras opções?',
    answer: 'O investimento inicial pode ser maior que telhas convencionais, porém o custo-benefício a longo prazo é superior. Não há necessidade de manutenção frequente, possui menor peso estrutural e maior durabilidade.',
  },
  {
    question: 'Posso instalar Telha Shingle sobre meu telhado atual?',
    answer: 'Em muitos casos sim! A Telha Shingle pode ser instalada sobre telhados existentes de fibrocimento ou compensado. Nossa equipe técnica avalia cada caso para garantir a melhor solução.',
  },
  {
    question: 'Quanto tempo leva para receber o orçamento?',
    answer: 'Após enviar seus dados, nossa equipe entra em contato em até 24 horas úteis com um orçamento personalizado baseado nas suas necessidades.',
  },
  {
    question: 'Vocês fazem a instalação?',
    answer: 'Trabalhamos com uma rede de instaladores credenciados em todo o Brasil. Podemos indicar profissionais qualificados na sua região ou fornecer suporte técnico para sua equipe.',
  },
];

export function TelhaShingleLP() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <HeroSection
        headline="Telha Shingle: Beleza e Proteção que Duram Décadas"
        subheadline="Transforme seu telhado com a telha mais moderna do mercado. Garantia de até 30 anos e resistência incomparável."
        productInterest="telha_shingle"
        landingPageId="telha-shingle-main"
      >
        {/* Badges de confiança */}
        <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-6">
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
            <Shield className="w-4 h-4" />
            30 Anos de Garantia
          </span>
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
            <Award className="w-4 h-4" />
            Marcas Premium
          </span>
        </div>
      </HeroSection>

      {/* Benefícios */}
      <BenefitsSection
        title="Por que escolher Telha Shingle?"
        subtitle="Descubra as vantagens que fazem da Telha Shingle a escolha preferida de arquitetos e construtores."
        benefits={BENEFITS}
      />

      {/* FAQ */}
      <FAQSection
        title="Dúvidas Frequentes sobre Telha Shingle"
        subtitle="Respondemos as principais perguntas sobre nossos produtos."
        faqs={FAQS}
      />

      {/* Footer minimalista */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Drystore - Materiais de Construção. CNPJ: XX.XXX.XXX/0001-XX
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Todos os direitos reservados. Imagens meramente ilustrativas.
          </p>
        </div>
      </footer>
    </div>
  );
}
