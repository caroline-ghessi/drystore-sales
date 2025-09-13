import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Info, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SystemRecommendationCardProps {
  recommendation: {
    recommendedSystem: string;
    score: number;
    reasons: string[];
    alternatives: Array<{ system: string; score: number; reason: string }>;
  };
  currentSystem: string;
  onAcceptRecommendation: () => void;
  onDismiss: () => void;
}

export function SystemRecommendationCard({
  recommendation,
  currentSystem,
  onAcceptRecommendation,
  onDismiss
}: SystemRecommendationCardProps) {
  const isRecommendedSelected = currentSystem === recommendation.recommendedSystem.toLowerCase().replace(/\s+/g, '_');
  const shouldShowRecommendation = !isRecommendedSelected;

  if (!shouldShowRecommendation) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Sistema recomendado selecionado:</strong> {recommendation.recommendedSystem}
        </AlertDescription>
      </Alert>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 40) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 20) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 40) return "Altamente Recomendado";
    if (score >= 20) return "Recomendado";
    return "Adequação Baixa";
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Recomendação do Sistema
          </CardTitle>
          <Badge className={getScoreColor(recommendation.score)}>
            {getScoreLabel(recommendation.score)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="p-4 bg-white rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-blue-900">
              {recommendation.recommendedSystem}
            </h4>
            <Badge variant="secondary" className="text-xs">
              Score: {recommendation.score}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600 font-medium">Motivos da recomendação:</p>
            <ul className="space-y-1">
              {recommendation.reasons.map((reason, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {recommendation.alternatives.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700">Alternativas viáveis:</h5>
            <div className="space-y-2">
              {recommendation.alternatives.map((alt, index) => (
                <div key={index} className="p-3 bg-white rounded border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{alt.system}</span>
                    <Badge variant="outline" className="text-xs">
                      Score: {alt.score}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{alt.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={onAcceptRecommendation}
            className="flex-1"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aceitar Sugestão
          </Button>
          <Button
            onClick={onDismiss}
            variant="outline"
            size="sm"
          >
            Manter Atual
          </Button>
        </div>

        {currentSystem && currentSystem !== recommendation.recommendedSystem.toLowerCase().replace(/\s+/g, '_') && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 text-sm">
              O sistema selecionado pode não ser o mais adequado para essas condições. 
              Considere a recomendação técnica acima.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}