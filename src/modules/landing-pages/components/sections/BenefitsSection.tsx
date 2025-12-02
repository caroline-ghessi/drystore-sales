import { LucideIcon } from 'lucide-react';

export interface Benefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface BenefitsSectionProps {
  title?: string;
  subtitle?: string;
  benefits: Benefit[];
}

export function BenefitsSection({
  title = 'Por que escolher a Drystore?',
  subtitle,
  benefits,
}: BenefitsSectionProps) {
  return (
    <section className="py-16 px-4 md:px-8 bg-muted/50">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Grid de benefícios */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
