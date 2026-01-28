import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Lightbulb, Clock, Sparkles } from 'lucide-react';
import { OpportunityDetail } from '../../hooks/useOpportunityDetail';

interface AIInsightsProps {
  opportunity: OpportunityDetail | undefined;
}

interface Insight {
  type: 'risk' | 'suggestion' | 'timing';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}

export function AIInsights({ opportunity }: AIInsightsProps) {
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];

    if (!opportunity) return insights;

    // Risk insight based on temperature
    if (opportunity.temperature === 'cold') {
      insights.push({
        type: 'risk',
        title: 'Risco Detectado',
        description: 'Cliente com baixo engajamento. Considere reativar o contato.',
        icon: AlertTriangle,
        className: 'bg-red-50 border-red-100',
      });
    } else if (opportunity.objections && opportunity.objections.length > 0) {
      insights.push({
        type: 'risk',
        title: 'Objeções Identificadas',
        description: opportunity.objections[0] || 'Cliente demonstrou hesitação sobre o investimento.',
        icon: AlertTriangle,
        className: 'bg-red-50 border-red-100',
      });
    }

    // Suggestion insight
    if (opportunity.value > 50000) {
      insights.push({
        type: 'suggestion',
        title: 'Sugestão',
        description: 'Para negociações de alto valor, ofereça parcelamento ou desconto por pagamento à vista.',
        icon: Lightbulb,
        className: 'bg-amber-50 border-amber-100',
      });
    } else if (opportunity.stage === 'proposal' || opportunity.stage === 'negotiation') {
      insights.push({
        type: 'suggestion',
        title: 'Sugestão',
        description: 'Agende um follow-up em até 48h para manter o momentum da negociação.',
        icon: Lightbulb,
        className: 'bg-amber-50 border-amber-100',
      });
    }

    // AI Confidence insight
    if (opportunity.ai_confidence && opportunity.ai_confidence > 0.8) {
      insights.push({
        type: 'suggestion',
        title: 'Alta Confiança IA',
        description: `A IA tem ${Math.round(opportunity.ai_confidence * 100)}% de confiança nesta oportunidade.`,
        icon: Sparkles,
        className: 'bg-green-50 border-green-100',
      });
    }

    return insights;
  };

  const insights = generateInsights();

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Insights da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum insight disponível para esta negociação.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Insights da IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => {
          const IconComponent = insight.icon;
          return (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg border ${insight.className}`}
            >
              <IconComponent className={`h-5 w-5 shrink-0 mt-0.5 ${
                insight.type === 'risk' ? 'text-red-600' :
                insight.type === 'suggestion' ? 'text-amber-600' :
                'text-blue-600'
              }`} />
              <div>
                <h4 className={`text-sm font-medium ${
                  insight.type === 'risk' ? 'text-red-700' :
                  insight.type === 'suggestion' ? 'text-amber-700' :
                  'text-blue-700'
                }`}>
                  {insight.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {insight.description}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
