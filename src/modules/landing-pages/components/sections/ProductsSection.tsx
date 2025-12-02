import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const products = [
  {
    name: 'Supreme',
    image: '/lovable-uploads/bce69d9a-6175-4c61-9f1b-daf198bcca45.png',
    warranty: '25 anos',
    features: [
      'Design clássico e durável',
      'Resistente a ventos fortes',
      '5 cores disponíveis',
      'Fácil manutenção',
      'Tecnologia anti-mofo',
    ],
  },
  {
    name: 'Oakridge',
    image: '/lovable-uploads/706a6911-05af-4edc-8db9-252b311151be.png',
    warranty: '30 anos',
    features: [
      'Design premium laminado',
      'Resistência superior a impactos',
      '5 cores sofisticadas',
      'Máxima proteção UV',
      'Tecnologia anti-mofo avançada',
    ],
    featured: true,
  },
];

interface ProductsSectionProps {
  onRequestQuote?: () => void;
}

export function ProductsSection({ onRequestQuote }: ProductsSectionProps) {
  const scrollToContact = () => {
    if (onRequestQuote) {
      onRequestQuote();
      return;
    }
    const contactSection = document.getElementById('contato');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="products" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Conheça nossas linhas de <span className="text-primary">telhas</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Oferecemos duas linhas premium de telhas shingle Owens Corning para atender às suas necessidades.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {products.map((product, index) => (
            <div
              key={index}
              className={`bg-card rounded-lg overflow-hidden border ${
                product.featured
                  ? 'border-primary shadow-lg relative'
                  : 'border-border'
              }`}
            >
              {product.featured && (
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-sm font-bold py-1 px-3 rounded-full z-10">
                  Mais Popular
                </div>
              )}
              <div className="h-48 bg-muted flex items-center justify-center">
                <img
                  src={product.image}
                  alt={`Telha Shingle Owens Corning ${product.name}`}
                  className="h-full w-full object-cover"
                  width="400"
                  height="192"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
                <p className="text-primary font-bold mb-4">
                  Garantia de {product.warranty}
                </p>
                <ul className="space-y-2 mb-6">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA sem preços */}
                <div className="mt-auto">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Preço inclui sistema completo: OSB, manta de subcobertura, pregos e telhas
                    </p>
                    <p className="text-center font-semibold text-primary mt-2">
                      Parcelamos em até 12x sem juros
                    </p>
                  </div>
                  <Button
                    className={`w-full ${
                      product.featured
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        : 'bg-card border-primary text-primary hover:bg-primary/10'
                    }`}
                    variant={product.featured ? 'default' : 'outline'}
                    onClick={scrollToContact}
                  >
                    Solicitar Orçamento Personalizado
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
