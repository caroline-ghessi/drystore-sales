import { UnifiedProduct } from '@/modules/propostas/hooks/useUnifiedProducts';
import { ValidationConfig } from '../hooks/useCalculatorValidation';

export interface ValidationError {
  type: 'missing_product' | 'zero_price' | 'missing_specs' | 'invalid_data';
  message: string;
  product?: string;
  category?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  canProceed: boolean;
}

export class ValidationService {
  static validateProduct(
    product: UnifiedProduct | null, 
    category: string,
    config: ValidationConfig,
    requiredSpecs?: string[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Se produto não existe
    if (!product) {
      if (config.strictValidation) {
        errors.push({
          type: 'missing_product',
          message: `Produto da categoria "${category}" não encontrado no cadastro`,
          category
        });
      }
      return errors;
    }

    // Validar preço zero em modo estrito
    if (config.strictValidation && config.blockZeroPrices) {
      if (!product.base_price || product.base_price <= 0) {
        errors.push({
          type: 'zero_price',
          message: `Produto "${product.name}" sem preço definido (R$ 0,00)`,
          product: product.name,
          category
        });
      }
    }

    // Validar especificações obrigatórias
    if (config.strictValidation && config.requireSpecifications && requiredSpecs) {
      const specs = product.specifications || {};
      const missingSpecs = requiredSpecs.filter(spec => !specs[spec]);
      
      if (missingSpecs.length > 0) {
        errors.push({
          type: 'missing_specs',
          message: `Produto "${product.name}" sem especificações: ${missingSpecs.join(', ')}`,
          product: product.name,
          category
        });
      }
    }

    return errors;
  }

  static validateProducts(
    products: UnifiedProduct[],
    requiredCategories: string[],
    config: ValidationConfig
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    for (const category of requiredCategories) {
      const categoryProducts = products.filter(p => 
        p.category?.toLowerCase() === category.toLowerCase() && p.is_active
      );

      if (categoryProducts.length === 0) {
        const error = {
          type: 'missing_product' as const,
          message: `Nenhum produto ativo encontrado na categoria "${category}"`,
          category
        };

        if (config.strictValidation) {
          errors.push(error);
        } else {
          warnings.push(error);
        }
        continue;
      }

      // Validar cada produto da categoria
      for (const product of categoryProducts) {
        const productErrors = this.validateProduct(product, category, config);
        errors.push(...productErrors);
      }
    }

    // No modo não-estrito, pode prosseguir mesmo com warnings
    const canProceed = config.strictValidation ? errors.length === 0 : true;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed
    };
  }

  static formatValidationMessage(result: ValidationResult, config: ValidationConfig): string {
    if (result.isValid) {
      return "Todos os produtos estão válidos para cálculo.";
    }

    if (!config.strictValidation && result.canProceed) {
      return "Cálculo permitido no modo de teste. Alguns produtos podem ter informações incompletas.";
    }

    const errorCount = result.errors.length;
    const warningCount = result.warnings.length;
    
    let message = '';
    
    if (errorCount > 0) {
      message += `${errorCount} erro(s) encontrado(s): `;
      message += result.errors.map(e => e.message).join('; ');
    }
    
    if (warningCount > 0) {
      if (message) message += ' ';
      message += `${warningCount} aviso(s): `;
      message += result.warnings.map(w => w.message).join('; ');
    }

    return message;
  }
}