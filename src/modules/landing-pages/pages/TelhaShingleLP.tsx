import { NavBar } from '../components/NavBar';
import { HeroSection } from '../components/sections/HeroSection';
import { FeaturesSection } from '../components/sections/FeaturesSection';
import { RoofingSystemSection } from '../components/sections/RoofingSystemSection';
import { ComparisonSection } from '../components/sections/ComparisonSection';
import { ProductsSection } from '../components/sections/ProductsSection';
import { ColorsSection } from '../components/sections/ColorsSection';
import { AboutSection } from '../components/sections/AboutSection';
import { ContactSection } from '../components/sections/ContactSection';
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
    <main className="min-h-screen bg-background">
      <NavBar onContactClick={scrollToContact} />

      <HeroSection
        headline="Descubra o Telhado dos Seus Sonhos"
        subheadline="Telhas Shingle Owens Corning: a escolha #1 nos EUA, agora no Brasil. Beleza, durabilidade e garantia de até 30 anos para sua casa."
        heroImage="/lovable-uploads/87af5c0d-f530-41ee-81fe-2a70286ac8af.png"
        ctaPrimaryText="Solicitar Orçamento"
        onCtaPrimaryClick={scrollToContact}
      />

      <div id="caracteristicas">
        <FeaturesSection />
      </div>

      <RoofingSystemSection />

      <ComparisonSection />

      <div id="produtos">
        <ProductsSection onRequestQuote={scrollToContact} />
      </div>

      <ColorsSection />

      <div id="sobre">
        <AboutSection />
      </div>

      <ContactSection
        productInterest="telha_shingle"
        landingPageId="telha-shingle-lp"
      />

      <FAQSection
        title="Dúvidas Frequentes sobre Telha Shingle"
        subtitle="Respondemos as principais perguntas sobre nossos produtos."
        faqs={FAQS}
      />

      <FooterSection />
    </main>
  );
}
