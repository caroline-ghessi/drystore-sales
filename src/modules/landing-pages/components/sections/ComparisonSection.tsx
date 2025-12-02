import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const comparisonData = [
  {
    feature: 'Durabilidade',
    shingle: '30+ anos',
    ceramica: '20-25 anos',
    fibrocimento: '15-20 anos',
    metalica: '20-25 anos',
  },
  {
    feature: 'Resistência a intempéries',
    shingle: 'Excelente',
    ceramica: 'Boa',
    fibrocimento: 'Regular',
    metalica: 'Boa',
  },
  {
    feature: 'Isolamento térmico',
    shingle: 'Superior',
    ceramica: 'Bom',
    fibrocimento: 'Regular',
    metalica: 'Baixo',
  },
  {
    feature: 'Isolamento acústico',
    shingle: 'Excelente',
    ceramica: 'Bom',
    fibrocimento: 'Regular',
    metalica: 'Baixo',
  },
  {
    feature: 'Peso (kg/m²)',
    shingle: '8-12',
    ceramica: '45-60',
    fibrocimento: '20-25',
    metalica: '5-8',
  },
  {
    feature: 'Variedade de cores',
    shingle: 'Alta',
    ceramica: 'Média',
    fibrocimento: 'Baixa',
    metalica: 'Média',
  },
  {
    feature: 'Facilidade de instalação',
    shingle: 'Fácil',
    ceramica: 'Complexa',
    fibrocimento: 'Média',
    metalica: 'Média',
  },
  {
    feature: 'Manutenção',
    shingle: 'Mínima',
    ceramica: 'Regular',
    fibrocimento: 'Frequente',
    metalica: 'Regular',
  },
];

const advantages = [
  {
    title: 'Maior Durabilidade',
    description: 'Com mais de 30 anos de vida útil, as telhas shingle superam significativamente outras opções do mercado.',
  },
  {
    title: 'Peso Reduzido',
    description: '8x mais leves que as telhas cerâmicas, permitindo estruturas mais econômicas e seguras.',
  },
  {
    title: 'Isolamento Superior',
    description: 'Excelente isolamento térmico e acústico, proporcionando maior conforto interno.',
  },
  {
    title: 'Estética Diferenciada',
    description: 'Visual sofisticado e moderno que valoriza qualquer tipo de arquitetura.',
  },
  {
    title: 'Instalação Simplificada',
    description: 'Processo de instalação mais rápido e menos complexo que telhas convencionais.',
  },
  {
    title: 'Manutenção Mínima',
    description: 'Praticamente livre de manutenção, gerando economia a longo prazo.',
  },
];

export function ComparisonSection() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Por que escolher <span className="text-primary">telhas shingle</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Compare as telhas shingle com outras opções do mercado e descubra por que elas são a melhor escolha para seu projeto.
          </p>
        </div>

        {/* Tabela de Comparação */}
        <div className="mb-16">
          <Card className="overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-center text-2xl font-bold">
                Comparativo Técnico
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead className="font-bold text-foreground">Características</TableHead>
                      <TableHead className="font-bold text-primary text-center">Shingle</TableHead>
                      <TableHead className="font-bold text-muted-foreground text-center">Cerâmica</TableHead>
                      <TableHead className="font-bold text-muted-foreground text-center">Fibrocimento</TableHead>
                      <TableHead className="font-bold text-muted-foreground text-center">Metálica</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonData.map((row, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-foreground">
                          {row.feature}
                        </TableCell>
                        <TableCell className="text-center bg-primary/5 font-semibold text-primary">
                          {row.shingle}
                        </TableCell>
                        <TableCell className="text-center">{row.ceramica}</TableCell>
                        <TableCell className="text-center">{row.fibrocimento}</TableCell>
                        <TableCell className="text-center">{row.metalica}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vantagens das Telhas Shingle */}
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Principais <span className="text-primary">Vantagens</span> das Telhas Shingle
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advantages.map((advantage, index) => (
              <Card key={index} className="border border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{advantage.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{advantage.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Seção de Custo-Benefício */}
        <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-6">
                Investimento que <span className="text-primary">compensa</span>
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Economia na estrutura:</strong> Por serem mais leves, reduzem custos com madeiramento e fundação.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Menor custo de mão de obra:</strong> Instalação mais rápida significa economia em mão de obra.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Economia energética:</strong> Melhor isolamento térmico reduz custos com climatização.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Valorização do imóvel:</strong> Estética diferenciada aumenta o valor de revenda.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <img
                src="/images/shingle-house-comparison.jpg"
                alt="Casa moderna com telhas shingle"
                className="rounded-lg shadow-md mb-4"
                loading="lazy"
              />
              <p className="text-sm text-muted-foreground italic">
                Casa com telhas shingle: durabilidade e beleza que valorizam seu investimento
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
