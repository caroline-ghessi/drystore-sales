import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface PDFGenerationOptions {
  proposalId?: string;
  proposalData?: any;
  templateId: string;
  options?: {
    async?: boolean;
    name?: string;
    orientation?: 'Portrait' | 'Landscape';
    margins?: string;
  };
}

interface PDFGenerationResult {
  success: boolean;
  pdfUrl?: string;
  error?: string;
  jobId?: string;
}

export function usePDFGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfs, setGeneratedPdfs] = useState<Record<string, string>>({});
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const { toast } = useToast();

  const generatePDFWithCompression = async (options: PDFGenerationOptions): Promise<{url: string, isCompressed: boolean, proposalId?: string, status?: string} | null> => {
    console.log('🚀 Starting async PDF generation...', options);
    setIsGenerating(true);
    setGenerationStatus('Iniciando processamento da proposta...');

    try {
      setGenerationStatus('Criando proposta...');

      // Adicionar created_by se não existir
      const proposalData = {
        ...options.proposalData,
        created_by: options.proposalData.created_by || (await supabase.auth.getUser()).data.user?.id
      };

      const { data, error } = await supabase.functions.invoke('generate-pdf-proposal-async', {
        body: {
          proposalData,
          templateId: options.templateId || getTemplateIdForProduct(proposalData.project_type || 'shingle'),
          shouldSaveToPermanentStorage: true,
          templatePreferences: {
            tone: 'professional',
            includeWarranty: true,
            includeTechnicalSpecs: true
          }
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Erro do sistema: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha na geração da proposta');
      }

      console.log('✅ Proposal created, PDF processing in background:', data);
      
      setGenerationStatus('Proposta criada! PDF sendo processado...');
      
      // Mostrar mensagem de sucesso para o usuário
      toast({
        title: "Proposta criada com sucesso!",
        description: "Seu PDF está sendo processado. Você será notificado quando estiver pronto.",
        duration: 8000,
      });

      const proposalKey = data.proposalId || `temp_${Date.now()}`;
      setGeneratedPdfs(prev => ({...prev, 
        [proposalKey]: {
          url: data.pdfUrl, 
          proposalId: data.proposalId,
          isCompressed: false, // Será comprimido em background
          status: 'processing'
        }
      }));

      return {
        url: data.pdfUrl,
        isCompressed: false,
        proposalId: data.proposalId,
        status: 'processing'
      };

    } catch (error: any) {
      console.error('❌ Proposal creation failed:', error);
      setGenerationStatus('Erro na criação da proposta');
      
      toast({
        title: "Erro na criação da proposta",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      });

      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = async (options: PDFGenerationOptions): Promise<string | null> => {
    const result = await generatePDFWithCompression(options);
    return result?.url || null;
  };

  const downloadPDF = async (options: PDFGenerationOptions): Promise<string | null> => {
    const pdfUrl = await generatePDF(options);
    
    if (pdfUrl) {
      // Open PDF in new tab for download
      window.open(pdfUrl, '_blank');
      return pdfUrl;
    }
    return null;
  };

  const previewPDF = async (options: PDFGenerationOptions): Promise<void> => {
    const pdfUrl = await generatePDF(options);
    
    if (pdfUrl) {
      // Open PDF in new tab for preview
      const previewWindow = window.open(pdfUrl, '_blank');
      if (!previewWindow) {
        toast({
          variant: "destructive",
          title: "Bloqueador de Pop-up",
          description: "Permita pop-ups para visualizar o PDF"
        });
      }
    }
  };

  const getTemplateIdForProduct = (productType: string): string => {
    switch (productType) {
      case 'shingle':
        return '14564'; // Template ID for shingle proposals
      case 'solar':
      case 'solar_advanced':
        return '14564'; // TODO: Create specific solar template
      case 'battery_backup':
        return '14564'; // TODO: Create specific battery template
      default:
        return '14564'; // Default template
    }
  };

  return {
    isGenerating,
    generatedPdfs,
    generatePDF,
    generatePDFWithCompression,
    downloadPDF,
    previewPDF,
    getTemplateIdForProduct,
    generationStatus
  };
}