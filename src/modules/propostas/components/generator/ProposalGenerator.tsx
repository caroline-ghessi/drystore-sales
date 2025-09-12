import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Zap, Calculator, FileText, Download, Save, Trash2, Sun } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ProductType, ClientData } from '../../types/proposal.types';
import { BatteryBackupResult } from '../../types/calculation.types';
import { useAIGeneration } from '../../hooks/useAIGeneration';
import { useProposalCalculator } from '../../hooks/useProposalCalculator';
import { useSavedCalculations } from '../../hooks/useSavedCalculations';
import { SimpleSolarCalculator } from '../calculator/SimpleSolarCalculator';
import { SolarCalculator } from '../calculator/SolarCalculator';
import { BatteryBackupCalculator } from '../calculator/BatteryBackupCalculator';
import { ShingleCalculatorWrapper } from '../calculator/ShingleCalculatorWrapper';
import { DrywallCalculatorWrapper } from '../calculator/DrywallCalculatorWrapper';
import { ForroDrywallCalculator } from '../calculator/ForroDrywallCalculator';
import { AcousticMineralCeilingWrapper } from '../calculator/AcousticMineralCeilingWrapper';
import { ProposalResult } from './ProposalResult';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface ProposalGeneratorProps {
  projectContextId?: string;
  onProposalGenerated?: (proposal: any) => void;
}

export function ProposalGenerator({ projectContextId, onProposalGenerated }: ProposalGeneratorProps) {
  const [step, setStep] = useState(1);
  const [productType, setProductType] = useState<ProductType>('solar');
  
  // Installation cost management
  const [includeInstallation, setIncludeInstallation] = useState(false);
  const [installationCost, setInstallationCost] = useState(0);
  const [clientData, setClientData] = useState<ClientData>({
    name: '',
    phone: '',
    email: ''
  });
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [calculationName, setCalculationName] = useState('');
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isGenerating, generatedProposal, generateFromContext, generateProposal } = useAIGeneration();
  const calculator = useProposalCalculator(productType);  
  const savedCalculations = useSavedCalculations();

  useEffect(() => {
    if (projectContextId) {
      handleGenerateFromContext();
    }
  }, [projectContextId]);

  const handleGenerateFromContext = async () => {
    if (!projectContextId) return;
    
    const proposal = await generateFromContext(projectContextId);
    if (proposal && onProposalGenerated) {
      onProposalGenerated(proposal);
    }
  };

  const handleManualGeneration = async () => {
    console.log('=== INICIANDO GERAÇÃO MANUAL ===');
    console.log('Calculator result disponível:', !!calculator.calculationResult);
    console.log('Calculator result:', calculator.calculationResult);
    
    if (!calculator.calculationResult) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, complete os cálculos primeiro."
      });
      return;
    }

    try {
      setIsGeneratingProposal(true);
      
      // Gerar itens da proposta usando a função do calculator
      const proposalItems = calculator.generateProposalItems();
      console.log('Itens da proposta gerados:', proposalItems);
      
      const request = {
        calculationId: undefined, // Edge function precisará ser ajustada para lidar com isso
        clientData,
        productType,
        calculationInput: calculator.calculationInput!,
        templatePreferences: {
          tone: 'friendly' as const,
          includeWarranty: true,
          includeTestimonials: false,
          includeTechnicalSpecs: true
        },
        pricing: {
          ...calculator.calculationResult,
          items: proposalItems
        }
      };

      console.log('Enviando request para edge function:', request);

      const { data, error } = await supabase.functions.invoke('generate-proposal', {
        body: request
      });

      console.log('Resposta da edge function:', { data, error });

      if (error) {
        console.error('Erro da edge function:', error);
        throw new Error(error.message || 'Falha na geração da proposta');
      }

      if (data && data.success) {
        toast({
          title: "Sucesso",
          description: "Proposta gerada com sucesso!"
        });
        if (data.acceptanceLink) {
          window.open(data.acceptanceLink, '_blank');
        }
      } else {
        throw new Error(data?.error || 'Falha na geração da proposta');
      }
    } catch (error: any) {
      console.error('Erro na geração manual:', error);
      toast({
        variant: "destructive", 
        title: "Erro",
        description: error.message || 'Erro inesperado na geração da proposta'
      });
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  const handleSaveCalculation = () => {
    setSaveDialogOpen(true);
  };

  const confirmSaveCalculation = () => {
    if (!calculationName.trim() || !calculator.calculationResult || !calculator.calculationInput) {
      alert('Por favor, preencha o nome do cálculo');
      return;
    }

    savedCalculations.saveCalculation({
      name: calculationName,
      product_type: productType,
      client_data: clientData,
      calculation_input: calculator.calculationInput,
      calculation_result: calculator.calculationResult,
      status: 'draft'
    });

    setSaveDialogOpen(false);
    setCalculationName('');
    // Navigate to saved calculations page
    navigate('/propostas/calculos-salvos');
  };

  const handleDiscardCalculation = () => {
    if (confirm('Tem certeza que deseja descartar este cálculo?')) {
      // Reset the form to step 1
      setStep(1);
      setClientData({ name: '', phone: '', email: '' });
    }
  };

  const renderCalculator = () => {
    console.log('🚨 renderCalculator() CHAMADO');
    console.log('🚨 productType na renderização:', productType);
    
    switch (productType) {
      case 'solar':
        console.log('✅ Renderizando SimpleSolarCalculator');
        return <SimpleSolarCalculator onCalculate={calculator.calculate} clientData={clientData} />;
      case 'solar_advanced':
        console.log('✅ Renderizando SolarCalculator');
        return <SolarCalculator onCalculate={calculator.calculate} />;
      case 'battery_backup':
        console.log('🔋 Renderizando BatteryBackupCalculator');
        console.log('🔋 calculator.calculate:', calculator.calculate);
        console.log('🔋 calculator.calculationResult:', calculator.calculationResult);
        return <BatteryBackupCalculator 
          onCalculate={calculator.calculate}
          calculationResult={calculator.calculationResult as BatteryBackupResult}
          onSaveCalculation={handleSaveCalculation}
          onGenerateProposal={handleManualGeneration}
        />;
      case 'shingle':
        console.log('✅ Renderizando ShingleCalculatorWrapper');
        return <ShingleCalculatorWrapper onCalculate={calculator.calculate} />;
      case 'drywall':
        console.log('✅ Renderizando DrywallCalculatorWrapper');
        return <DrywallCalculatorWrapper onCalculate={calculator.calculate} />;
      case 'forro_drywall':
        console.log('✅ Renderizando ForroDrywallCalculator');
        return <ForroDrywallCalculator onCalculate={calculator.calculate} />;
      case 'acoustic_mineral_ceiling':
        console.log('✅ Renderizando AcousticMineralCeilingWrapper');
        return <AcousticMineralCeilingWrapper onCalculate={(data) => calculator.calculate(data.input)} />;
      default:
        console.log('❌ ProductType não reconhecido:', productType);
        return (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Calculadora para {productType} em desenvolvimento
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  if (projectContextId && isGenerating) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h3 className="text-lg font-semibold">Gerando Proposta com IA</h3>
            <p className="text-muted-foreground text-center">
              Analisando as conversas do WhatsApp e gerando uma proposta personalizada...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerador de Propostas</h2>
          <p className="text-muted-foreground">
            {projectContextId 
              ? 'Proposta gerada automaticamente das conversas' 
              : 'Crie propostas personalizadas com IA'
            }
          </p>
        </div>
        <Badge variant={projectContextId ? 'default' : 'secondary'}>
          {projectContextId ? 'Automático' : 'Manual'}
        </Badge>
      </div>

      {!projectContextId && (
        <>
          {/* Step Navigator */}
          <div className="flex items-center space-x-4 mb-6">
            {[
              { number: 1, title: 'Produto', icon: Calculator },
              { number: 2, title: 'Cliente', icon: FileText },
              { number:3, title: 'Cálculos', icon: Zap },
              { number: 4, title: 'Geração', icon: Download }
            ].map((stepItem) => (
              <div key={stepItem.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= stepItem.number 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <stepItem.icon className="h-5 w-5" />
                </div>
                <span className="ml-2 text-sm font-medium">{stepItem.title}</span>
                {stepItem.number < 4 && (
                  <div className={`ml-4 h-px w-8 ${
                    step > stepItem.number ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Product Selection */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Selecione o Produto</CardTitle>
                <CardDescription>
                  Escolha o tipo de produto para a proposta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { value: 'solar', label: 'Energia Solar', description: 'Sistemas fotovoltaicos simplificados' },
                    { value: 'solar_advanced', label: 'Solar Avançado', description: 'Cálculo robusto com todas configurações' },
                    { value: 'battery_backup', label: 'Sistema de Backup', description: 'Baterias + inversor híbrido' },
                    { value: 'shingle', label: 'Telha Shingle', description: 'Telhados e coberturas' },
                    { value: 'drywall', label: 'Drywall', description: 'Divisórias e paredes' },
                    { value: 'forro_drywall', label: 'Forro Drywall', description: 'Sistema completo de forro drywall' },
                    { value: 'acoustic_mineral_ceiling', label: 'Forro Mineral Acústico', description: 'Forros minerais com isolamento acústico' }
                  ].map((product) => (
                    <Card 
                      key={product.value}
                      className={`cursor-pointer transition-all ${
                        productType === product.value 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setProductType(product.value as ProductType)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-semibold">{product.label}</h4>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <Button onClick={() => setStep(2)} className="w-full">
                  Próximo: Dados do Cliente
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Client Data */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Dados do Cliente</CardTitle>
                <CardDescription>
                  Informações para personalizar a proposta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={clientData.name}
                      onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                      placeholder="Nome do cliente"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">WhatsApp *</Label>
                    <Input
                      id="phone"
                      value={clientData.phone}
                      onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                      placeholder="(11) 99999-9999 - WhatsApp"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">E-mail (opcional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={clientData.email || ''}
                      onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                      placeholder="cliente@email.com (opcional)"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                  <Button 
                    onClick={() => setStep(3)}
                    disabled={!clientData.name || !clientData.phone}
                    className="flex-1"
                  >
                    Próximo: Cálculos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Calculations */}
          {step === 3 && (
            <div className="space-y-4">
              {renderCalculator()}
              
              {calculator.calculationResult && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumo dos Cálculos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {calculator.calculationSummary?.keyMetrics.map((metric, index) => (
                          <div key={index} className="text-center">
                            <p className="text-2xl font-bold text-primary">
                              {metric.value}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {metric.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Equipment List for Solar Calculations */}
                  {(productType === 'solar' || productType === 'solar_advanced') && calculator.calculationSummary?.proposalItems && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Sun className="mr-2 h-5 w-5 text-yellow-500" />
                          Lista de Equipamentos
                        </CardTitle>
                        <CardDescription>
                          Equipamentos quantificados para o sistema solar fotovoltaico
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Painéis Solares */}
                        {calculator.calculationSummary.proposalItems.filter(item => 
                          item.id === '1').map((item, index) => (
                          <div key={`panel-${index}`}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-blue-700">Painéis Solares Fotovoltaicos</h4>
                              <Badge variant="secondary">Geração de Energia</Badge>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-200">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {item.quantity}x {item.description}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Potência: {item.specifications.power || 'N/A'} | 
                                    Eficiência: {item.specifications.efficiency || 'N/A'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Modelo: {item.specifications.model || 'N/A'} | 
                                    Marca: {item.specifications.brand || 'N/A'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg">
                                    R$ {item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Inversores */}
                        {calculator.calculationSummary.proposalItems.filter(item => 
                          item.id === '2').map((item, index) => (
                          <div key={`inverter-${index}`}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-orange-700">Inversor Solar</h4>
                              <Badge variant="secondary">Conversão DC/AC</Badge>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-200">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {item.quantity}x {item.description}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Potência: {item.specifications.power || 'N/A'} | 
                                    Eficiência: {item.specifications.efficiency || 'N/A'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Modelo: {item.specifications.model || 'N/A'} | 
                                    Marca: {item.specifications.brand || 'N/A'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg">
                                    R$ {item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Estrutura de Fixação */}
                        {calculator.calculationSummary.proposalItems.filter(item => 
                          item.id === '3').map((item, index) => (
                          <div key={`structure-${index}`}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-green-700">Estrutura de Fixação</h4>
                              <Badge variant="secondary">Suporte</Badge>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-200">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {item.quantity}x {item.description}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Material: {item.specifications.material || 'N/A'} | 
                                    Tipo: {item.specifications.type || 'N/A'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Para {item.specifications.panels || item.quantity} painéis
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg">
                                    R$ {item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Material Elétrico */}
                        {calculator.calculationSummary.proposalItems.filter(item => 
                          item.id === '4').map((item, index) => (
                          <div key={`electrical-${index}`}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-purple-700">Material Elétrico</h4>
                              <Badge variant="secondary">Proteção & Cabeamento</Badge>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-200">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {item.quantity}x {item.description}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Cabos, Conectores MC4, Disjuntores
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Sistema de Proteção e Aterramento
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg">
                                    R$ {item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Documentação */}
                        {calculator.calculationSummary.proposalItems.filter(item => 
                          item.id === '5').map((item, index) => (
                          <div key={`documentation-${index}`}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-teal-700">Documentação e Homologação</h4>
                              <Badge variant="secondary">Regulamentação</Badge>
                            </div>
                            <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-200">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium">
                                    {item.quantity}x {item.description}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Projeto Executivo, ART/RRT
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Aprovação junto à concessionária
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg">
                                    R$ {item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        <Separator />

                        {/* Subtotal Products */}
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold text-lg">SUBTOTAL PRODUTOS:</p>
                            <p className="font-bold text-2xl text-slate-700">
                              R$ {calculator.calculationSummary.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        {/* Optional Installation */}
                        <div className="border-2 border-dashed border-slate-300 p-4 rounded-lg">
                          <div className="flex items-center space-x-2 mb-3">
                            <Checkbox
                              id="includeInstallation"
                              checked={includeInstallation}
                              onCheckedChange={(checked) => setIncludeInstallation(checked as boolean)}
                            />
                            <Label htmlFor="includeInstallation" className="font-medium">
                              ⚠️ Incluir instalação/mão de obra (Opcional)
                            </Label>
                          </div>
                          {includeInstallation && (
                            <div className="ml-6">
                              <Label htmlFor="installationCost">Valor da Instalação (R$):</Label>
                              <Input
                                id="installationCost"
                                type="number"
                                value={installationCost}
                                onChange={(e) => setInstallationCost(Number(e.target.value) || 0)}
                                placeholder="Digite o valor da mão de obra"
                                className="mt-1"
                              />
                            </div>
                          )}
                        </div>

                        {/* Final Total */}
                        <div className="bg-primary/10 p-6 rounded-lg border-2 border-primary/20">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-lg">VALOR TOTAL DO SISTEMA:</p>
                              <p className="text-sm text-muted-foreground">
                                {includeInstallation ? 'Produtos + Instalação' : 'Apenas Produtos'}
                              </p>
                            </div>
                            <p className="font-bold text-3xl text-primary">
                              R$ {(calculator.calculationSummary.totalCost + (includeInstallation ? installationCost : 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Equipment List for Shingle Calculations */}
                  {productType === 'shingle' && calculator.calculationSummary?.proposalItems && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Badge className="mr-2 bg-amber-500 text-white">🏠</Badge>
                          Lista de Materiais - Telhas Shingle
                        </CardTitle>
                        <CardDescription>
                          Materiais quantificados para o sistema de cobertura
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {calculator.calculationSummary.proposalItems.map((item, index) => {
                          // Determine category and styling based on item name/description
                          let categoryInfo = { name: 'Material', color: 'gray', bgColor: 'gray-50', borderColor: 'gray-200' };
                          
                          if (item.name?.toLowerCase().includes('telha') || item.name?.toLowerCase().includes('shingle')) {
                            categoryInfo = { name: 'Cobertura', color: 'red-700', bgColor: 'red-50', borderColor: 'red-200' };
                          } else if (item.name?.toLowerCase().includes('osb') || item.name?.toLowerCase().includes('madeira')) {
                            categoryInfo = { name: 'Estrutura', color: 'amber-700', bgColor: 'amber-50', borderColor: 'amber-200' };
                          } else if (item.name?.toLowerCase().includes('subcobertura') || item.name?.toLowerCase().includes('manta')) {
                            categoryInfo = { name: 'Impermeabilização', color: 'blue-700', bgColor: 'blue-50', borderColor: 'blue-200' };
                          } else if (item.name?.toLowerCase().includes('cumeeira') || item.name?.toLowerCase().includes('acabamento')) {
                            categoryInfo = { name: 'Acabamento', color: 'green-700', bgColor: 'green-50', borderColor: 'green-200' };
                          } else if (item.name?.toLowerCase().includes('mão') || item.name?.toLowerCase().includes('instalação')) {
                            categoryInfo = { name: 'Serviços', color: 'purple-700', bgColor: 'purple-50', borderColor: 'purple-200' };
                          }

                          return (
                            <div key={`shingle-item-${index}`}>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className={`font-semibold text-${categoryInfo.color}`}>{item.name}</h4>
                                <Badge variant="secondary">{categoryInfo.name}</Badge>
                              </div>
                              <div className={`bg-${categoryInfo.bgColor} p-4 rounded-lg border-l-4 border-${categoryInfo.borderColor}`}>
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      {item.quantity} {item.unit} - {item.description}
                                    </p>
                                    {item.unitPrice > 0 && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Preço unitário: R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / {item.unit}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-lg">
                                      R$ {item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <Separator />

                        {/* Total for Shingle */}
                        <div className="bg-amber-50 p-6 rounded-lg border-2 border-amber-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-lg text-amber-800">VALOR TOTAL DO SISTEMA:</p>
                              <p className="text-sm text-amber-600">Materiais para cobertura</p>
                            </div>
                            <p className="font-bold text-3xl text-amber-700">
                              R$ {calculator.calculationSummary.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Equipment List for Battery Backup Calculations */}
                  {productType === 'battery_backup' && calculator.calculationSummary?.proposalItems && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Zap className="mr-2 h-5 w-5 text-blue-500" />
                          Lista de Equipamentos
                        </CardTitle>
                        <CardDescription>
                          Sistema completo de backup de energia
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {calculator.calculationSummary.proposalItems
                          .filter(item => item.category === 'batteries' || item.name?.toLowerCase().includes('bateria'))
                          .map((battery, idx) => (
                            <div key={idx} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <div className="flex items-center mb-2">
                                <Zap className="h-4 w-4 text-blue-600 mr-2" />
                                <h4 className="font-semibold text-blue-800">Bateria</h4>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">Modelo</p>
                                  <p className="font-medium">{battery.name || 'Bateria de Lítio'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Quantidade</p>
                                  <p className="font-medium">{battery.quantity} unidades</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Especificações</p>
                                  <p className="text-sm">{typeof battery.specifications === 'string' ? battery.specifications : 'Lítio LiFePO4'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">Valor Total</p>
                                  <p className="font-bold text-lg text-blue-600">
                                    R$ {battery.totalPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}

                        {calculator.calculationSummary.proposalItems
                          .filter(item => item.category === 'inverters' || item.name?.toLowerCase().includes('inversor'))
                          .map((inverter, idx) => (
                            <div key={idx} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                              <div className="flex items-center mb-2">
                                <Zap className="h-4 w-4 text-yellow-600 mr-2" />
                                <h4 className="font-semibold text-yellow-800">Inversor</h4>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">Modelo</p>
                                  <p className="font-medium">{inverter.name || 'Inversor Híbrido'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Quantidade</p>
                                  <p className="font-medium">{inverter.quantity} unidades</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Especificações</p>
                                  <p className="text-sm">{typeof inverter.specifications === 'string' ? inverter.specifications : 'Híbrido com MPPT'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">Valor Total</p>
                                  <p className="font-bold text-lg text-yellow-600">
                                    R$ {inverter.totalPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}

                        {calculator.calculationSummary.proposalItems
                          .filter(item => item.category === 'protection' || item.name?.toLowerCase().includes('proteção'))
                          .map((protection, idx) => (
                            <div key={idx} className="bg-red-50 p-4 rounded-lg border border-red-200">
                              <div className="flex items-center mb-2">
                                <Zap className="h-4 w-4 text-red-600 mr-2" />
                                <h4 className="font-semibold text-red-800">Sistema de Proteção</h4>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">Componentes</p>
                                  <p className="font-medium">{protection.name || 'Sistema de Proteção'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Quantidade</p>
                                  <p className="font-medium">{protection.quantity} conjunto</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Especificações</p>
                                  <p className="text-sm">{typeof protection.specifications === 'string' ? protection.specifications : 'Disjuntores, DPS, Aterramento'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">Valor Total</p>
                                  <p className="font-bold text-lg text-red-600">
                                    R$ {protection.totalPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}

                        {calculator.calculationSummary.proposalItems
                          .filter(item => item.category === 'monitoring' || item.name?.toLowerCase().includes('monitoramento'))
                          .map((monitoring, idx) => (
                            <div key={idx} className="bg-green-50 p-4 rounded-lg border border-green-200">
                              <div className="flex items-center mb-2">
                                <Zap className="h-4 w-4 text-green-600 mr-2" />
                                <h4 className="font-semibold text-green-800">Sistema de Monitoramento</h4>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">Sistema</p>
                                  <p className="font-medium">{monitoring.name || 'Monitoramento Wi-Fi'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Quantidade</p>
                                  <p className="font-medium">{monitoring.quantity} unidade</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Especificações</p>
                                  <p className="text-sm">{typeof monitoring.specifications === 'string' ? monitoring.specifications : 'Monitoramento via Wi-Fi'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">Valor Total</p>
                                  <p className="font-bold text-lg text-green-600">
                                    R$ {monitoring.totalPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}

                        <Separator />

                        {/* Total for Battery Backup */}
                        <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-lg text-blue-800">VALOR TOTAL DO SISTEMA:</p>
                              <p className="text-sm text-blue-600">Sistema completo de backup de energia</p>
                            </div>
                            <p className="font-bold text-3xl text-blue-700">
                              R$ {calculator.calculationSummary.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Original Summary Card for non-solar/non-shingle/non-battery or when no proposalItems */}
                  {((productType !== 'solar' && productType !== 'solar_advanced' && productType !== 'shingle' && productType !== 'battery_backup') || !calculator.calculationSummary?.proposalItems) && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Resumo dos Cálculos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                          <p className="text-lg font-semibold">
                            Valor Total: R$ {calculator.calculationSummary?.totalCost.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2
                            })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Voltar
                </Button>
                <Button 
                  onClick={() => setStep(4)}
                  disabled={!calculator.calculationResult}
                  className="flex-1"
                >
                  Próximo: Gerar Proposta
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Generation */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Finalizar Cálculo</CardTitle>
                <CardDescription>
                  Escolha o que fazer com os cálculos realizados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Resumo do Cálculo:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Cliente: {clientData.name}</li>
                    <li>• Produto: {productType}</li>
                    <li>• Valor: R$ {calculator.calculationSummary?.totalCost.toLocaleString('pt-BR')}</li>
                  </ul>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button 
                    variant="outline"
                    onClick={handleSaveCalculation}
                    disabled={savedCalculations.isSaving}
                  >
                    {savedCalculations.isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar Cálculo
                  </Button>
                  
                  <Button 
                    variant="destructive"
                    onClick={handleDiscardCalculation}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Descartar
                  </Button>
                  
                  <Button 
                    onClick={handleManualGeneration}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Gerar Proposta
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex justify-center">
                  <Button variant="ghost" onClick={() => setStep(3)}>
                    Voltar aos Cálculos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Save Calculation Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Cálculo</DialogTitle>
            <DialogDescription>
              Digite um nome para identificar este cálculo posteriormente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="calculation-name">Nome do Cálculo</Label>
              <Input
                id="calculation-name"
                value={calculationName}
                onChange={(e) => setCalculationName(e.target.value)}
                placeholder="Ex: Projeto João Silva - Solar Residencial"
                className="mt-1"
              />
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Cliente:</strong> {clientData.name}<br />
                <strong>Produto:</strong> {productType}<br />
                <strong>Valor:</strong> R$ {calculator.calculationSummary?.totalCost.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmSaveCalculation}
              disabled={!calculationName.trim() || savedCalculations.isSaving}
            >
              {savedCalculations.isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated Proposal Preview */}
      {generatedProposal && (
        <ProposalResult 
          proposal={{
            id: generatedProposal.proposalId || '',
            number: generatedProposal.proposalData?.id || 'N/A',
            title: generatedProposal.proposalData?.client?.name ? `Proposta - ${generatedProposal.proposalData.client.name}` : 'Proposta',
            total: generatedProposal.proposalData?.total || 0,
            validUntil: generatedProposal.proposalData?.validityDays ? 
              new Date(Date.now() + (generatedProposal.proposalData.validityDays * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : 
              new Date().toISOString().split('T')[0],
            status: generatedProposal.proposalData?.status || 'generated',
            acceptanceLink: generatedProposal.acceptanceLink,
            uniqueId: generatedProposal.uniqueId
          }}
          generatedContent={generatedProposal.generatedContent}
        />
      )}
    </div>
  );
}