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
    if (isGenerating) return null;
    
    setIsGenerating(true);
    setGenerationStatus('Iniciando geração do PDF...');
    
    const maxRetries = 2;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        attempt++;
        console.log(`🔄 PDF generation attempt ${attempt}/${maxRetries}...`);
        
        if (attempt > 1) {
          setGenerationStatus(`Tentativa ${attempt}/${maxRetries}... Aguarde...`);
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          setGenerationStatus('Gerando PDF via PDF.co...');
        }
        
        const { data, error } = await supabase.functions.invoke('generate-pdf-proposal', {
          body: {
            proposalData: options.proposalData,
            templateId: options.templateId || getTemplateIdForProduct(options.proposalData.project_type || 'telha_shingle'),
            options: {
              orientation: options.options?.orientation || 'portrait',
              margins: options.options?.margins || { top: 20, right: 20, bottom: 20, left: 20 }
            }
          }
        });

        if (error) {
          console.error('❌ PDF generation error:', error);
          throw new Error(`Erro na função: ${error.message}`);
        }

        if (!data?.success || !data?.pdfUrl) {
          throw new Error(data?.error || 'Resposta inválida da geração de PDF');
        }

        console.log('✅ PDF generated successfully:', {
          url: data.pdfUrl,
          isCompressed: data.isCompressed,
          originalSize: data.originalSize,
          finalSize: data.finalSize
        });
        
        setGeneratedPdfs(prev => ({
          ...prev,
          [options.proposalData.id]: {
            url: data.pdfUrl,
            isCompressed: data.isCompressed || false,
            originalSize: data.originalSize,
            finalSize: data.finalSize,
            compressionRatio: data.compressionRatio
          }
        }));

        const statusMessage = data.isCompressed 
          ? `PDF gerado e comprimido com sucesso! (${data.compressionRatio}% economia)`
          : 'PDF gerado com sucesso!';
        setGenerationStatus(statusMessage);
        
        // Clear status after 3 seconds
        setTimeout(() => setGenerationStatus(''), 3000);
        
        return {
          url: data.pdfUrl,
          isCompressed: data.isCompressed || false
        };

      } catch (error: any) {
        console.error(`❌ PDF generation attempt ${attempt} failed:`, error);
        
        if (attempt >= maxRetries) {
          const finalError = `Falha após ${maxRetries} tentativas: ${error.message}`;
          setGenerationStatus(finalError);
          
          toast({
            variant: "destructive",
            title: "Erro na Geração do PDF",
            description: finalError
          });
          
          // Clear error status after 5 seconds
          setTimeout(() => setGenerationStatus(''), 5000);
          
          throw new Error(finalError);
        }
        
        console.log(`⏳ Will retry in 2 seconds... (${maxRetries - attempt} attempts remaining)`);
      }
    }
    
    return null;
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