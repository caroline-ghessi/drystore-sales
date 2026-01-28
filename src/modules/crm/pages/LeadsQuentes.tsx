import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function LeadsQuentes() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center max-w-md px-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Lightbulb className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Insights IA
        </h1>
        
        <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary font-semibold rounded-full text-sm mb-4">
          Em Breve
        </span>
        
        <p className="text-muted-foreground mb-8">
          Estamos desenvolvendo recursos avançados de inteligência artificial 
          para ajudá-lo a identificar as melhores oportunidades e tomar 
          decisões mais inteligentes.
        </p>
        
        <Button onClick={() => navigate('/crm/pipeline')}>
          Voltar ao Pipeline
        </Button>
      </div>
    </div>
  );
}
