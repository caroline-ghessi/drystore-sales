import { useSystemConfig } from '@/hooks/useSystemConfigs';

export interface ValidationConfig {
  strictValidation: boolean;
  requireSpecifications: boolean;
  blockZeroPrices: boolean;
}

const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  strictValidation: false,
  requireSpecifications: false,
  blockZeroPrices: false
};

export function useCalculatorValidation() {
  const { data: config, isLoading } = useSystemConfig('calculator_strict_validation');
  
  const validationConfig: ValidationConfig = {
    ...DEFAULT_VALIDATION_CONFIG,
    ...(config?.value || {})
  };

  return {
    config: validationConfig,
    isLoading,
    isStrictMode: validationConfig.strictValidation
  };
}