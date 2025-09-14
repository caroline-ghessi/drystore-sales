import { ProductType } from './proposal.types';

export interface ProductKPI {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
  icon?: string;
}

export interface ProductWarranty {
  component: string;
  duration: string;
  details: string;
}

export interface ProductTechnicalSpec {
  category: string;
  specifications: Array<{
    name: string;
    value: string;
    unit?: string;
  }>;
}

export interface ProductTemplateConfig {
  productType: ProductType;
  displayName: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryColor: string;
  accentColor: string;
  kpiSection: {
    title: string;
    kpis: ProductKPI[];
  };
  warrantySection: {
    title: string;
    warranties: ProductWarranty[];
  };
  technicalSection: {
    title: string;
    specs: ProductTechnicalSpec[];
  };
  benefitsSection: {
    title: string;
    benefits: string[];
  };
  additionalInfo?: {
    certifications?: string[];
    compliance?: string[];
    recommendations?: string[];
  };
}

export interface ProductSpecificTemplate {
  config: ProductTemplateConfig;
  generateKPIs: (calculationResult: any) => ProductKPI[];
  generateTechnicalSpecs: (calculationResult: any) => ProductTechnicalSpec[];
  generateBenefits: (calculationResult: any) => string[];
  customSections?: Array<{
    title: string;
    content: string;
    order: number;
  }>;
}

export interface TemplateRenderData {
  proposal: any;
  client: any;
  items: any[];
  template: ProductSpecificTemplate;
  calculationData?: any;
}