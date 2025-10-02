import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function OrderBumpAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['order-bump-detailed-analytics'],
    queryFn: async () => {
      // Buscar todas as regras
      const { data: rules, error: rulesError } = await supabase
        .from('order_bump_rules')
        .select('*');

      if (rulesError) throw rulesError;

      // Buscar todas as interações
      const { data: bumps, error: bumpsError } = await supabase
        .from('proposal_order_bumps')
        .select('*');

      if (bumpsError) throw bumpsError;

      // Calcular métricas por regra
      const ruleAnalytics = rules?.map(rule => {
        const ruleBumps = bumps?.filter(b => b.rule_id === rule.id) || [];
        const displays = ruleBumps.length;
        const clicks = ruleBumps.filter(b => ['clicked', 'accepted'].includes(b.status)).length;
        const accepted = ruleBumps.filter(b => b.status === 'accepted').length;
        const ctr = displays > 0 ? (clicks / displays) * 100 : 0;
        const conversionRate = displays > 0 ? (accepted / displays) * 100 : 0;

        return {
          rule,
          displays,
          clicks,
          accepted,
          ctr,
          conversionRate,
        };
      }) || [];

      // Ordenar por conversão
      ruleAnalytics.sort((a, b) => b.conversionRate - a.conversionRate);

      return ruleAnalytics;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics || analytics.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance por Regra</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analytics.map(({ rule, displays, clicks, accepted, ctr, conversionRate }) => (
            <div key={rule.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{rule.name}</h4>
                  <p className="text-sm text-muted-foreground">{rule.bump_title}</p>
                </div>
                {rule.is_active ? (
                  <Badge variant="default">Ativa</Badge>
                ) : (
                  <Badge variant="secondary">Inativa</Badge>
                )}
              </div>

              <div className="grid grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{displays}</div>
                  <div className="text-xs text-muted-foreground">Exibições</div>
                </div>

                <div>
                  <div className="text-2xl font-bold">{clicks}</div>
                  <div className="text-xs text-muted-foreground">Cliques</div>
                </div>

                <div>
                  <div className="text-2xl font-bold text-green-600">{accepted}</div>
                  <div className="text-xs text-muted-foreground">Aceitos</div>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="text-2xl font-bold">{ctr.toFixed(1)}%</div>
                    {ctr > 5 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">CTR</div>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="text-2xl font-bold text-green-600">
                      {conversionRate.toFixed(1)}%
                    </div>
                    {conversionRate > 3 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Conversão</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
