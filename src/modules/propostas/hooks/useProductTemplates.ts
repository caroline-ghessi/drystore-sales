import { useQuery } from '@tanstack/react-query';
import { ProductType } from '../types/proposal.types';
import { ProductTemplateService } from '../services/product-templates.service';
import { ProductSpecificTemplate } from '../types/product-templates.types';

export const useProductTemplate = (productType: ProductType) => {
  return useQuery({
    queryKey: ['product-template', productType],
    queryFn: () => ProductTemplateService.getTemplate(productType),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAllProductTemplates = () => {
  return useQuery({
    queryKey: ['all-product-templates'],
    queryFn: () => ProductTemplateService.getAllTemplates(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useTemplatePreview = (
  productType: ProductType, 
  calculationData?: any
) => {
  const { data: template } = useProductTemplate(productType);
  
  if (!template || !calculationData) {
    return null;
  }

  return {
    template,
    kpis: template.generateKPIs(calculationData),
    technicalSpecs: template.generateTechnicalSpecs(calculationData),
    benefits: template.generateBenefits(calculationData)
  };
};