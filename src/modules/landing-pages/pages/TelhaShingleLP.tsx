import { HeroSection } from '../components/sections/HeroSection';
import { FeaturesSection } from '../components/sections/FeaturesSection';
import { ComparisonSection } from '../components/sections/ComparisonSection';
import { ProductsSection } from '../components/sections/ProductsSection';
import { AboutSection } from '../components/sections/AboutSection';
import { FAQSection, FAQItem } from '../components/sections/FAQSection';
import { FooterSection } from '../components/sections/FooterSection';

const FAQS: FAQItem[] = [
  {
    question: 'Qual a durabilidade da Telha Shingle?',
    answer:
      'As telhas Shingle possuem vida útil de 25 a 50 anos, dependendo da linha escolhida. As versões premium chegam a durar mais de 50 anos com manutenção adequada. Oferecemos garantias de até 30 anos do fabricante.',
  },
  {
    question: 'A Telha Shingle é mais cara que outras opções?',
    answer:
      'O investimento inicial pode ser maior que telhas convencionais, porém o custo-benefício a longo prazo é superior. Não há necessidade de manutenção frequente, possui menor peso estrutural e maior durabilidade.',
  },
  {
    question: 'Posso instalar Telha Shingle sobre meu telhado atual?',
    answer:
      'Em muitos casos sim! A Telha Shingle pode ser instalada sobre telhados existentes de fibrocimento ou compensado. Nossa equipe técnica avalia cada caso para garantir a melhor solução.',
  },
  {
    question: 'Quanto tempo leva para receber o orçamento?',
    answer:
      'Após enviar seus dados, nossa equipe entra em contato em até 24 horas úteis com um orçamento personalizado baseado nas suas necessidades.',
  },
  {
    question: 'Vocês fazem a instalação?',
    answer:
      'Trabalhamos com uma rede de instaladores credenciados em todo o Brasil. Podemos indicar profissionais qualificados na sua região ou fornecer suporte técnico para sua equipe.',
  },
];

export function TelhaShingleLP() {
  const scrollToContact = () => {
    const contactSection = document.getElementById('contato');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero com background e formulário */}
      <HeroSection
        headline="Descubra o Telhado dos Seus Sonhos"
        subheadline="Telhas Shingle Owens Corning de alto desempenho em até 12 vezes sem juros. Qualidade americana com resistência de mais de 50 anos."
        productInterest="telha_shingle"
        landingPageId="telha-shingle-main"
        backgroundImage="/lovable-uploads/87af5c0d-f530-41ee-81fe-2a70286ac8af.png"
        heroImage="/lovable-uploads/87af5c0d-f530-41ee-81fe-2a70286ac8af.png"
      />

      {/* Features - Por que escolher Owens Corning */}
      <FeaturesSection />

      {/* Comparação - Shingle vs Outras Telhas */}
      <ComparisonSection />

      {/* Produtos - Supreme e Oakridge (sem preços) */}
      <ProductsSection onRequestQuote={scrollToContact} />

      {/* Sobre a Drystore */}
      <AboutSection />

      {/* FAQ */}
      <FAQSection
        title="Dúvidas Frequentes sobre Telha Shingle"
        subtitle="Respondemos as principais perguntas sobre nossos produtos."
        faqs={FAQS}
      />

      {/* Footer completo */}
      <FooterSection />
    </div>
  );
}
