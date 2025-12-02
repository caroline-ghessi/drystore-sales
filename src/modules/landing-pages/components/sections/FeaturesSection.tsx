import { Building, Shield, Calendar, Clock } from 'lucide-react';

const features = [
  {
    icon: Building,
    title: 'Alta Durabilidade',
    description: 'Resistência comprovada de 50 anos ou mais, suportando condições climáticas extremas.',
  },
  {
    icon: Shield,
    title: 'Desempenho Térmico',
    description: 'Isolamento térmico superior que ajuda a manter sua casa confortável e reduzir custos de energia.',
  },
  {
    icon: Calendar,
    title: 'Garantia Extendida',
    description: 'Garantia de fábrica de 25 a 30 anos dependendo da linha escolhida.',
  },
  {
    icon: Clock,
    title: 'Instalação Rápida',
    description: 'Sistema de instalação eficiente que reduz o tempo de obra e minimiza transtornos.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Por que escolher telhas <span className="text-primary">Owens Corning</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Importadas diretamente dos Estados Unidos, as telhas Owens Corning são reconhecidas pela Forbes Home como a segunda melhor marca do mercado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-card p-6 rounded-lg border border-border hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="mb-4">
                  <Icon className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
