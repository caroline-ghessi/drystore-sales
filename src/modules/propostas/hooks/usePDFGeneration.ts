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

  const generatePDFWithCompression = async (options: PDFGenerationOptions, retryCount = 0): Promise<{url: string, isCompressed: boolean, proposalId?: string, status?: string} | null> => {
    console.log('🚀 Starting async PDF generation...', { ...options, retryCount });
    setIsGenerating(true);
    setGenerationStatus('Iniciando processamento da proposta...');

    try {
      setGenerationStatus('Criando proposta...');

      // Verificar se usuário está logado
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      // Se proposalData não foi fornecido mas temos proposalId, buscar do banco
      if (!options.proposalData && options.proposalId) {
        console.log('📥 Proposal data not provided, fetching from database...');
        const { data: fetchedProposal, error: fetchError } = await supabase
          .from('proposals')
          .select('*')
          .eq('id', options.proposalId)
          .single();
        
        if (fetchError || !fetchedProposal) {
          throw new Error('Proposta não encontrada no banco de dados');
        }
        
        options.proposalData = fetchedProposal;
      }

      // Adicionar created_by se não existir
      const proposalData = {
        ...options.proposalData,
        created_by: options.proposalData?.created_by || userData.user.id
      };

      console.log('📤 Invoking edge function with data:', {
        hasProposalData: !!proposalData,
        templateId: options.templateId || getTemplateIdForProduct(proposalData.project_type || 'shingle'),
        userId: proposalData.created_by
      });

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

      console.log('📥 Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        
        // Tentar retry automático para alguns tipos de erro
        if (retryCount < 2 && (
          error.message?.includes('timeout') || 
          error.message?.includes('network') ||
          error.message?.includes('500')
        )) {
          console.log(`🔄 Retrying request (attempt ${retryCount + 1}/3)...`);
          setGenerationStatus(`Tentando novamente... (${retryCount + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
          return generatePDFWithCompression(options, retryCount + 1);
        }
        
        throw new Error(`Erro do sistema: ${error.message || 'Falha na comunicação com servidor'}`);
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