import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { OrderBumpCard } from '@/components/proposals/OrderBumpCard';
import { useOrderBumps } from '@/hooks/useOrderBumps';
import { useProposalActions } from '@/hooks/useProposalActions';
import { ArrowLeft, Phone, Mail, Calendar, Clock, CheckCircle2, FileText, Gift, Check, X, MessageCircle, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

interface ProposalItem {
  id: string;
  custom_name: string | null;
  description: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Proposal {
  id: string;
  proposal_number: string;
  title: string;
  description: string | null;
  status: string;
  category?: string;
  total_value: number;
  discount_percentage: number;
  discount_value: number;
  final_value: number;
  payment_terms?: string | null;
  delivery_time?: string | null;
  valid_until: string;
  created_at: string;
  accepted_at: string | null;
  vendor: {
    display_name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    department: string | null;
  };
  items: ProposalItem[];
}

export default function ClientProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { client } = useClientAuth();
  const { toast } = useToast();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { bumps, isLoading: bumpsLoading, registerDisplay, updateInteraction } = useOrderBumps(
    id || '',
    proposal
  );

  const { acceptProposal, rejectProposal, markAsViewed, loading: actionLoading } = useProposalActions();

  useEffect(() => {
    fetchProposal();
  }, [id, client]);

  useEffect(() => {
    if (proposal && id) {
      markAsViewed(id);
    }
  }, [proposal, id]);

  const fetchProposal = async () => {
    if (!client || !id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('proposals')
        .select(`
          *,
          profiles!proposals_created_by_fkey (
            display_name,
            email,
            phone,
            avatar_url,
            department
          ),
          proposal_items (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setProposal({
        ...data,
        vendor: data.profiles,
        items: data.proposal_items || [],
      });
    } catch (error) {
      console.error('Error fetching proposal:', error);
      toast({
        title: 'Erro ao carregar proposta',
        description: 'Não foi possível carregar os detalhes da proposta.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá ${name}, gostaria de falar sobre a proposta ${proposal?.proposal_number}.`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const handleAcceptWithBump = async () => {
    if (!id || !bumps || bumps.length === 0) return;
    
    const result = await acceptProposal({
      proposalId: id,
      includeOrderBump: true,
      orderBumpRuleId: bumps[0].id,
    });

    if (result.success) {
      setTimeout(() => navigate('/client'), 2000);
    }
  };

  const handleAcceptOnly = async () => {
    if (!id) return;
    
    const result = await acceptProposal({
      proposalId: id,
      includeOrderBump: false,
      orderBumpRuleId: bumps && bumps.length > 0 ? bumps[0].id : undefined,
    });

    if (result.success) {
      setTimeout(() => navigate('/client'), 2000);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    
    const result = await rejectProposal(id, rejectReason);

    if (result.success) {
      setRejectDialogOpen(false);
      setTimeout(() => navigate('/client'), 2000);
    }
  };

  const canInteract = proposal && !['accepted', 'rejected', 'expired'].includes(proposal.status);
  const totalSavings = bumps && bumps.length > 0 && bumps[0].bump_discount_percentage 
    ? (proposal?.final_value || 0) * (bumps[0].bump_discount_percentage / 100)
    : 0;

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando proposta...</p>
          </div>
        </div>
      </ClientLayout>
    );
  }

  if (!proposal) {
    return (
      <ClientLayout>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Proposta não encontrada</h2>
          <Button onClick={() => navigate('/client')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </ClientLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Rascunho', variant: 'secondary' as const },
      sent: { label: 'Enviada', variant: 'default' as const },
      viewed: { label: 'Visualizada', variant: 'default' as const },
      accepted: { label: 'Aceita', variant: 'default' as const },
      rejected: { label: 'Recusada', variant: 'destructive' as const },
      expired: { label: 'Expirada', variant: 'secondary' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate('/client')} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Cabeçalho da Proposta */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl">{proposal.title}</CardTitle>
                  {getStatusBadge(proposal.status)}
                </div>
                <CardDescription>
                  Proposta #{proposal.proposal_number}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {proposal.description && (
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-muted-foreground">{proposal.description}</p>
              </div>
            )}

            <Separator />

            {/* Informações de Datas */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Criada em:</span>
                <span>{new Date(proposal.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Válida até:</span>
                <span>{new Date(proposal.valid_until).toLocaleDateString('pt-BR')}</span>
              </div>
              
              {proposal.accepted_at && (
                <div className="flex items-center gap-2 col-span-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Aceita em:</span>
                  <span>{new Date(proposal.accepted_at).toLocaleDateString('pt-BR')}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Informações do Vendedor - DESTAQUE MAIOR */}
            <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Seu Consultor de Vendas</h3>
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/30">
                  <AvatarImage src={proposal.vendor.avatar_url || undefined} />
                  <AvatarFallback className="text-lg font-semibold">
                    {proposal.vendor.display_name?.charAt(0) || 'V'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{proposal.vendor.display_name}</p>
                  {proposal.vendor.department && (
                    <Badge variant="secondary" className="mb-2">
                      {proposal.vendor.department}
                    </Badge>
                  )}
                  {proposal.vendor.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                      <Mail className="h-3 w-3" />
                      {proposal.vendor.email}
                    </p>
                  )}
                  {proposal.vendor.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {proposal.vendor.phone}
                    </p>
                  )}
                </div>
                {proposal.vendor.phone && (
                  <Button
                    size="lg"
                    className="bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => openWhatsApp(proposal.vendor.phone!, proposal.vendor.display_name)}
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Itens da Proposta */}
        <Card>
          <CardHeader>
            <CardTitle>Itens da Proposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proposal.items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {index + 1}. {item.custom_name || 'Item'}
                      </h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity}x {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Resumo de Valores */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(proposal.total_value)}</span>
              </div>
              
              {proposal.discount_value > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto ({proposal.discount_percentage}%):</span>
                  <span>- {formatCurrency(proposal.discount_value)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(proposal.final_value)}</span>
              </div>
            </div>

            {/* Termos e Condições */}
            {(proposal.payment_terms || proposal.delivery_time) && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                  {proposal.payment_terms && (
                    <div>
                      <span className="font-medium">Condições de pagamento: </span>
                      <span className="text-muted-foreground">{proposal.payment_terms}</span>
                    </div>
                  )}
                  {proposal.delivery_time && (
                    <div>
                      <span className="font-medium">Prazo de entrega: </span>
                      <span className="text-muted-foreground">{proposal.delivery_time}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Order Bumps - ANTES dos botões de ação */}
        {bumps && bumps.length > 0 && canInteract && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gift className="w-6 h-6 text-primary" />
                <CardTitle className="text-xl">🎁 Oferta Exclusiva para Você!</CardTitle>
              </div>
              <CardDescription>
                Aproveite esta promoção especial ao aceitar sua proposta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bumps.map((bump) => (
                <OrderBumpCard
                  key={bump.id}
                  proposalId={proposal.id}
                  rule={bump}
                  onDisplay={() => registerDisplay(bump.id)}
                  onInteraction={(action) => updateInteraction({ ruleId: bump.id, action })}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Ações sobre a Proposta */}
        {canInteract && (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Ações sobre a Proposta</CardTitle>
              <CardDescription>
                Escolha como deseja prosseguir com esta proposta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Botão PRINCIPAL - Aceitar com Promoção */}
              {bumps && bumps.length > 0 && (
                <Button
                  onClick={handleAcceptWithBump}
                  disabled={actionLoading}
                  size="lg"
                  className="w-full h-auto py-6 text-lg font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Gift className="w-6 h-6 mr-3" />
                  <div className="flex flex-col items-start">
                    <span>ACEITAR PROPOSTA + PROMOÇÃO</span>
                    {totalSavings > 0 && (
                      <span className="text-sm font-normal opacity-90">
                        💰 Economize {formatCurrency(totalSavings)}
                      </span>
                    )}
                  </div>
                </Button>
              )}

              {/* Botão Secundário - Aceitar Apenas Proposta */}
              <Button
                onClick={handleAcceptOnly}
                disabled={actionLoading}
                size="lg"
                variant="default"
                className="w-full"
              >
                <Check className="w-5 h-5 mr-2" />
                Aceitar Apenas a Proposta
              </Button>

              <Separator />

              {/* Botão Terciário - Recusar */}
              <Button
                onClick={() => setRejectDialogOpen(true)}
                disabled={actionLoading}
                size="lg"
                variant="destructive"
                className="w-full"
              >
                <X className="w-5 h-5 mr-2" />
                Recusar Proposta
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Status de proposta já processada */}
        {!canInteract && (
          <Card className="border-muted">
            <CardContent className="py-8 text-center">
              {proposal?.status === 'accepted' && (
                <>
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-xl font-semibold mb-2">Proposta Aceita</h3>
                  <p className="text-muted-foreground">
                    Esta proposta já foi aceita. Em breve entraremos em contato.
                  </p>
                </>
              )}
              {proposal?.status === 'rejected' && (
                <>
                  <X className="w-16 h-16 mx-auto mb-4 text-red-500" />
                  <h3 className="text-xl font-semibold mb-2">Proposta Recusada</h3>
                  <p className="text-muted-foreground">
                    Esta proposta foi recusada anteriormente.
                  </p>
                </>
              )}
              {proposal?.status === 'expired' && (
                <>
                  <Clock className="w-16 h-16 mx-auto mb-4 text-amber-500" />
                  <h3 className="text-xl font-semibold mb-2">Proposta Expirada</h3>
                  <p className="text-muted-foreground">
                    Esta proposta já expirou. Entre em contato para uma nova proposta.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Confirmação de Recusa */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recusar Proposta</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja recusar esta proposta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Gostaria de compartilhar o motivo? (Opcional)
            </label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Valor acima do orçamento, prazo não adequado, etc."
              className="min-h-[100px]"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Recusa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ClientLayout>
  );
}
