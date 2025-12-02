import { Building2, Calendar, Shield } from 'lucide-react';

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="text-primary">22 anos</span> de experiência transformando telhados
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              A Drystore é especialista em importação de materiais de construção de alta qualidade. Nosso compromisso é trazer ao Brasil os melhores produtos do mercado internacional.
            </p>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-4 mt-1">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Mais de duas décadas de história</h3>
                  <p className="text-muted-foreground">
                    Desde 2001 no mercado, com milhares de clientes satisfeitos e projetos concluídos em todo o Brasil.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-4 mt-1">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Produtos premium</h3>
                  <p className="text-muted-foreground">
                    Importamos exclusivamente da Owens Corning, segunda melhor marca segundo o ranking Forbes Home.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-primary/10 p-2 rounded-full mr-4 mt-1">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Suporte completo</h3>
                  <p className="text-muted-foreground">
                    Oferecemos consultoria técnica, orçamento detalhado e acompanhamento da sua obra.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <img
                alt="Telhado residencial com telhas Owens Corning"
                className="w-full h-full object-cover"
                src="/lovable-uploads/c2005111-ac1a-438c-a78a-a19ed6d58f76.jpg"
                loading="lazy"
              />
            </div>
            <div className="aspect-square bg-muted rounded-lg overflow-hidden mt-8">
              <img
                alt="Detalhe de telha Owens Corning"
                className="w-full h-full object-cover"
                src="/lovable-uploads/60898375-f132-4f86-aac0-7bba133fc768.jpg"
                loading="lazy"
              />
            </div>
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <img
                alt="Equipe de instalação Drystore"
                className="w-full h-full object-cover"
                src="/lovable-uploads/9556deda-692e-4287-be04-e14e38dc2413.jpg"
                loading="lazy"
              />
            </div>
            <div className="aspect-square bg-muted rounded-lg overflow-hidden mt-8">
              <img
                alt="Casa com telhado Owens Corning"
                className="w-full h-full object-cover"
                src="/lovable-uploads/6f7fffe1-3955-4da8-ab37-b64f51db7b5e.jpg"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
