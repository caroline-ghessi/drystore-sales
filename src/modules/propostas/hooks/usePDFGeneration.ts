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
  const { toast } = useToast();

  const generatePDF = async (options: PDFGenerationOptions): Promise<string | null> => {
    try {
      setIsGenerating(true);

      console.log('🔄 Generating PDF with options:', options);

      const { data, error } = await supabase.functions.invoke('generate-pdf-proposal', {
        body: options
      });

      if (error) {
        throw new Error(error.message || 'Erro na geração do PDF');
      }

      const result: PDFGenerationResult = data;

      if (!result.success) {
        throw new Error(result.error || 'Falha na geração do PDF');
      }

      if (!result.pdfUrl) {
        throw new Error('URL do PDF não foi retornada');
      }

      // Store in local state for quick access
      if (options.proposalId) {
        setGeneratedPdfs(prev => ({
          ...prev,
          [options.proposalId!]: result.pdfUrl!
        }));
      }

      toast({
        title: "PDF Gerado",
        description: "O PDF da proposta foi gerado com sucesso!"
      });

      console.log('✅ PDF generated successfully:', result.pdfUrl);
      return result.pdfUrl;

    } catch (error: any) {
      console.error('❌ PDF generation error:', error);
      
      toast({
        variant: "destructive",
        title: "Erro na Geração do PDF",
        description: error.message || 'Erro inesperado ao gerar PDF'
      });

      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async (options: PDFGenerationOptions): Promise<void> => {
    const pdfUrl = await generatePDF(options);
    
    if (pdfUrl) {
      // Open PDF in new tab for download
      window.open(pdfUrl, '_blank');
    }
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
    downloadPDF,
    previewPDF,
    getTemplateIdForProduct
  };
}