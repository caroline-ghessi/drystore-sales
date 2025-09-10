import { ProductType, ProposalData, ClientData } from './proposal.types';
import { CalculationInput, CalculationResult } from './calculation.types';

export interface AIGenerationRequest {
  projectContextId?: string;
  clientData: ClientData;
  productType: ProductType;
  calculationInput: CalculationInput;
  customRequirements?: string[];
  templatePreferences?: {
    tone: 'formal' | 'friendly' | 'technical';
    includeWarranty: boolean;
    includeTestimonials: boolean;
    includeTechnicalSpecs: boolean;
  };
}

export interface AIGenerationResult {
  proposalData: ProposalData;
  generatedContent: {
    executiveSummary: string;
    technicalDescription: string;
    benefitsHighlights: string[];
    recommendedPaymentTerms: string;
    deliverySchedule: string;
    warrantyTerms: string;
  };
  calculations: CalculationResult;
  confidence: number; // 0-100
  suggestions: string[];
  acceptanceLink?: string;
  proposalId?: string;
  uniqueId?: string;
}

export interface ContextAnalysis {
  clientNeeds: string[];
  productRequirements: Record<string, any>;
  urgencyLevel: 'low' | 'medium' | 'high';
  budgetIndications?: {
    min?: number;
    max?: number;
    preferred?: number;
  };
  timelineRequirements?: {
    preferred?: string;
    deadline?: string;
  };
  specialRequirements: string[];
}

export interface PDFGenerationOptions {
  template: 'standard' | 'technical' | 'executive' | 'compact';
  includeImages: boolean;
  includeTechnicalSpecs: boolean;
  includeTermsAndConditions: boolean;
  watermark?: string;
  headerLogo?: string;
  footerText?: string;
}

export interface PDFGenerationResult {
  pdfUrl: string;
  pdfBuffer?: Buffer;
  fileName: string;
  fileSize: number;
  generatedAt: Date;
}

export interface ExportOptions extends PDFGenerationOptions {
  format: 'pdf' | 'docx' | 'html';
  quality: 'draft' | 'standard' | 'high';
  compression: boolean;
}