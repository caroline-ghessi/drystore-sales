import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProductWarningProps {
  productType: string;
  missingProducts: string[];
  onNavigateToProducts: () => void;
}

export function ProductWarning({ productType, missingProducts, onNavigateToProducts }: ProductWarningProps) {
  if (missingProducts.length === 0) return null;

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <div className="space-y-2">
          <p className="font-medium">Produtos não configurados para {productType}:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {missingProducts.map((product, index) => (
              <li key={index}>{product}</li>
            ))}
          </ul>
          <p className="text-sm">
            Os cálculos estão usando valores padrão. Para usar preços atualizados,{' '}
            <button
              onClick={onNavigateToProducts}
              className="text-amber-700 underline hover:text-amber-900"
            >
              configure os produtos aqui
            </button>
            .
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}