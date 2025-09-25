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

  const generatePDFWithCompression = async (options: PDFGenerationOptions): Promise<{url: string, isCompressed: boolean} | null> => {
    try {
      setIsGenerating(true);
      setGenerationStatus('🔄 Gerando PDF profissional...');

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

      setGenerationStatus('📦 Otimizando arquivo...');

      // Try to compress PDF
      let finalUrl = result.pdfUrl;
      let isCompressed = false;

      try {
        const compressResponse = await supabase.functions.invoke('compress-pdf', {
          body: {
            pdfUrl: result.pdfUrl,
            compressionLevel: 'medium',
            options: {
              name: `proposal-${options.proposalId || 'temp'}-compressed.pdf`
            }
          }
        });

        if (compressResponse.data?.success && compressResponse.data.compressedUrl) {
          finalUrl = compressResponse.data.compressedUrl;
          isCompressed = true;
          console.log('✅ PDF compressed successfully, saved:', compressResponse.data.compressionRatio + '% space');
        }
      } catch (compressionError) {
        console.warn('⚠️ PDF compression failed, using original:', compressionError);
      }

      // Save PDF to database if proposalId exists
      if (options.proposalId) {
        try {
          const { error: saveError } = await supabase
            .from('proposal_pdfs')
            .insert({
              proposal_id: options.proposalId,
              pdf_url: finalUrl,
              is_compressed: isCompressed,
              template_id: options.templateId,
              created_at: new Date().toISOString()
            });

          if (saveError) {
            console.warn('⚠️ Could not save PDF to database:', saveError);
          }
        } catch (saveError) {
          console.warn('⚠️ Database save failed:', saveError);
        }

        setGeneratedPdfs(prev => ({
          ...prev,
          [options.proposalId!]: finalUrl
        }));
      }

      setGenerationStatus('✅ PDF pronto para download!');

      console.log('✅ PDF generated successfully:', finalUrl);
      return { url: finalUrl, isCompressed };

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
      setGenerationStatus('');
    }
  };

  const generatePDF = async (options: PDFGenerationOptions): Promise<string | null> => {
    const result = await generatePDFWithCompression(options);
    return result?.url || null;
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
    generatePDFWithCompression,
    downloadPDF,
    previewPDF,
    getTemplateIdForProduct,
    generationStatus
  };
}