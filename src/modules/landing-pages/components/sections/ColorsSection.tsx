import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ColorOption {
  name: string;
  line: 'Supreme' | 'Oakridge';
  sampleImage: string;
  houseImage: string;
}

const COLORS: ColorOption[] = [
  // Linha Supreme (5 cores)
  { name: 'Chocolate', line: 'Supreme', sampleImage: '/placeholder.svg', houseImage: '/placeholder.svg' },
  { name: 'Cinza Grafite', line: 'Supreme', sampleImage: '/placeholder.svg', houseImage: '/placeholder.svg' },
  { name: 'Black', line: 'Supreme', sampleImage: '/placeholder.svg', houseImage: '/placeholder.svg' },
  { name: 'State Gray', line: 'Supreme', sampleImage: '/placeholder.svg', houseImage: '/placeholder.svg' },
  { name: 'Areia', line: 'Supreme', sampleImage: '/placeholder.svg', houseImage: '/placeholder.svg' },
  
  // Linha Oakridge (5 cores)
  { name: 'Desert Tan', line: 'Oakridge', sampleImage: '/placeholder.svg', houseImage: '/placeholder.svg' },
  { name: 'Driftwood', line: 'Oakridge', sampleImage: '/placeholder.svg', houseImage: '/placeholder.svg' },
  { name: 'Onyx Black', line: 'Oakridge', sampleImage: '/placeholder.svg', houseImage: '/placeholder.svg' },
  { name: 'Estate Gray', line: 'Oakridge', sampleImage: '/placeholder.svg', houseImage: '/placeholder.svg' },
  { name: 'Brownwood', line: 'Oakridge', sampleImage: '/placeholder.svg', houseImage: '/placeholder.svg' },
];

type FilterType = 'all' | 'Supreme' | 'Oakridge';

export function ColorsSection() {
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredColors = filter === 'all' 
    ? COLORS 
    : COLORS.filter(color => color.line === filter);

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Escolha a Cor Perfeita para Sua Casa
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Oferecemos 10 cores exclusivas nas linhas Supreme e Oakridge da Owens Corning
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-2 mb-10">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-drystore-orange hover:bg-drystore-orange/90' : ''}
          >
            Todas
          </Button>
          <Button
            variant={filter === 'Supreme' ? 'default' : 'outline'}
            onClick={() => setFilter('Supreme')}
            className={filter === 'Supreme' ? 'bg-drystore-orange hover:bg-drystore-orange/90' : ''}
          >
            Supreme
          </Button>
          <Button
            variant={filter === 'Oakridge' ? 'default' : 'outline'}
            onClick={() => setFilter('Oakridge')}
            className={filter === 'Oakridge' ? 'bg-drystore-orange hover:bg-drystore-orange/90' : ''}
          >
            Oakridge
          </Button>
        </div>

        {/* Colors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {filteredColors.map((color) => (
            <Card 
              key={`${color.line}-${color.name}`}
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
            >
              <CardContent className="p-0">
                {/* Images Container */}
                <div className="grid grid-cols-2 aspect-[2/1]">
                  <div className="relative overflow-hidden">
                    <img
                      src={color.sampleImage}
                      alt={`Amostra ${color.name}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="relative overflow-hidden">
                    <img
                      src={color.houseImage}
                      alt={`Casa com telha ${color.name}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                </div>
                
                {/* Label */}
                <div className="p-3 bg-card">
                  <p className="font-semibold text-foreground text-sm">{color.name}</p>
                  <p className="text-xs text-muted-foreground">Linha {color.line}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Não encontrou a cor ideal? Entre em contato para ver amostras físicas.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              const contactSection = document.getElementById('contato');
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="border-drystore-orange text-drystore-orange hover:bg-drystore-orange hover:text-white"
          >
            Solicitar Amostras
          </Button>
        </div>
      </div>
    </section>
  );
}
