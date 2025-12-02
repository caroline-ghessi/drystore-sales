import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Construction, Shield, Layers, ArrowRight } from 'lucide-react';

const systemLayers = [
  {
    icon: Construction,
    title: '1. Placas OSB',
    description: 'Base estrutural resistente com certificação APA PLUS',
    highlight: 'Estrutura Premium',
  },
  {
    icon: Shield,
    title: '2. Membrana Impermeável',
    description: 'Barreira de vapor e proteção contra infiltrações',
    highlight: 'Proteção Total',
  },
  {
    icon: Layers,
    title: '3. Telhas Shingle',
    description: 'Camada final Owens Corning (Oakridge ou Supreme)',
    highlight: 'Acabamento Superior',
  },
];

export function RoofingSystemSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Mais que telhas, um{' '}
            <span className="text-primary">sistema completo</span> de cobertura
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cada camada do sistema trabalha em conjunto para garantir máxima proteção, 
            durabilidade e eficiência térmica para sua casa.
          </p>
        </div>

        {/* System Layers Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {systemLayers.map((layer, index) => (
            <Card 
              key={index} 
              className="border-2 hover:border-primary/50 transition-colors bg-background"
            >
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <layer.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                  {layer.highlight}
                </span>
                <CardTitle className="text-xl">{layer.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{layer.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Investment Section */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="grid md:grid-cols-2">
            <div className="aspect-video md:aspect-auto">
              <img
                src="/images/roofing-system-layers.png"
                alt="Sistema de cobertura Shingle em camadas"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-8 md:p-10 flex flex-col justify-center bg-background">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Investimento que vale a pena
              </h3>
              <p className="text-muted-foreground mb-6">
                As telhas Shingle oferecem o melhor custo-benefício a longo prazo. 
                Com vida útil de até 50 anos e baixa manutenção, você economiza 
                enquanto valoriza seu imóvel.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="group"
                  onClick={() => window.open('https://drystore.com.br/blog', '_blank')}
                >
                  Entenda o custo-benefício
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
