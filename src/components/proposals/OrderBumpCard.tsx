import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { OrderBumpRule } from "@/hooks/useOrderBumps";
import { useEffect } from "react";

interface OrderBumpCardProps {
  proposalId: string;
  rule: OrderBumpRule;
  onInteraction: (action: 'clicked' | 'accepted' | 'rejected') => void;
  onDisplay?: () => void;
}

export function OrderBumpCard({ proposalId, rule, onInteraction, onDisplay }: OrderBumpCardProps) {
  useEffect(() => {
    // Registrar exibição quando o componente montar
    if (onDisplay) {
      onDisplay();
    }
  }, [onDisplay]);

  const handleInterest = () => {
    onInteraction('accepted');
  };

  const handleDismiss = () => {
    onInteraction('rejected');
  };

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const discountedPrice = rule.bump_price && rule.bump_discount_percentage
    ? rule.bump_price * (1 - rule.bump_discount_percentage / 100)
    : rule.bump_price;

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16" />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Oferta Exclusiva
              </Badge>
            </div>
            <CardTitle className="text-xl">{rule.bump_title}</CardTitle>
            <CardDescription className="mt-2">
              {rule.bump_description}
            </CardDescription>
          </div>
          
          {rule.bump_image_url && (
            <img
              src={rule.bump_image_url}
              alt={rule.bump_title}
              className="w-24 h-24 object-cover rounded-lg"
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {rule.bump_price && (
          <div className="flex items-baseline gap-2">
            {rule.bump_discount_percentage && (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(rule.bump_price)}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {rule.bump_discount_percentage}% OFF
                </Badge>
              </>
            )}
            <span className="text-2xl font-bold text-primary">
              {formatPrice(discountedPrice)}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleInterest}
            className="flex-1"
          >
            Tenho Interesse
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
          >
            Não, obrigado
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
