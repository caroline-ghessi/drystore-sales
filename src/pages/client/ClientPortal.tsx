import React, { useState, useEffect } from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OrderBumpCard } from '@/components/proposals/OrderBumpCard';
import { useOrderBumps } from '@/hooks/useOrderBumps';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MessageCircle,
  User,
  Phone,
  Star,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Proposal {
  id: string;
  proposal_number: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
  valid_until?: string;
  accepted_at?: string;
  created_by: string;
  vendorInfo?: {
    name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    department?: string;
  };
}

export default function ClientPortal() {
  const { client } = useClientAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (client) {
      fetchProposals();
    }
  }, [client]);

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select(`
          id,
          proposal_number,
          title,
          description,
          status,
          created_at,
          valid_until,
          accepted_at,
          created_by,
          profiles!created_by (
            display_name,
            email,
            phone,
            avatar_url,
            department
          )
        `)
        .eq('customer_id', client?.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const proposalsWithVendor = data?.map(proposal => ({
        ...proposal,
        vendorInfo: proposal.profiles ? {
          name: proposal.profiles.display_name,
          email: proposal.profiles.email,
          phone: proposal.profiles.phone,
          avatar_url: proposal.profiles.avatar_url,
          department: proposal.profiles.department
        } : undefined
      })) as Proposal[];

      setProposals(proposalsWithVendor || []);
    } catch (error) {
      console.error('Erro ao buscar propostas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />Rascunho</Badge>;
      case 'sent':
        return <Badge variant="outline" className="gap-1"><FileText className="w-3 h-3" />Enviada</Badge>;
      case 'accepted':
        return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="w-3 h-3" />Aceita</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Recusada</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="gap-1"><AlertTriangle className="w-3 h-3" />Expirada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'expired':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const filterProposals = (proposals: Proposal[], filter: string) => {
    switch (filter) {
      case 'open':
        return proposals.filter(p => ['sent', 'viewed', 'under_review'].includes(p.status));
      case 'accepted':
        return proposals.filter(p => p.status === 'accepted');
      case 'rejected':
        return proposals.filter(p => p.status === 'rejected');
      case 'expired':
        return proposals.filter(p => p.status === 'expired');
      default:
        return proposals;
    }
  };

  const openWhatsApp = (vendorPhone?: string) => {
    if (!vendorPhone) return;
    
    const cleanPhone = vendorPhone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá! Sou ${client?.name} e gostaria de conversar sobre minhas propostas.`);
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredProposals = filterProposals(proposals, activeTab);

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo, {client?.name}!
          </h2>
          <p className="text-muted-foreground">
            Acompanhe suas propostas e mantenha contato com sua equipe de vendas
          </p>
        </div>

        {/* Vendor Info Card */}
        {proposals.length > 0 && proposals[0].vendorInfo && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Seu Consultor de Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={proposals[0].vendorInfo.avatar_url} />
                  <AvatarFallback>
                    {proposals[0].vendorInfo.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{proposals[0].vendorInfo.name}</h3>
                    <Badge variant="secondary" className="gap-1">
                      <Star className="w-3 h-3" />
                      {proposals[0].vendorInfo.department || 'Especialista'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">
                    {proposals[0].vendorInfo.email}
                  </p>
                  {proposals[0].vendorInfo.phone && (
                    <Button 
                      onClick={() => openWhatsApp(proposals[0].vendorInfo?.phone)}
                      className="bg-green-500 hover:bg-green-600 text-white gap-2"
                      size="sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Conversar no WhatsApp
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proposals Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Suas Propostas ({proposals.length})
            </CardTitle>
            <CardDescription>
              Acompanhe o status de todas as suas propostas comerciais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="open">Abertas</TabsTrigger>
                <TabsTrigger value="accepted">Aceitas</TabsTrigger>
                <TabsTrigger value="rejected">Recusadas</TabsTrigger>
                <TabsTrigger value="expired">Expiradas</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {filteredProposals.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Nenhuma proposta encontrada
                    </h3>
                    <p className="text-muted-foreground">
                      Não há propostas nesta categoria no momento.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredProposals.map((proposal) => (
                      <Card key={proposal.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = `/client/proposta/${proposal.id}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="mt-1">
                                {getStatusIcon(proposal.status)}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">{proposal.title}</h3>
                                  {getStatusBadge(proposal.status)}
                                </div>
                                
                                <p className="text-sm text-muted-foreground mb-3">
                                  Proposta #{proposal.proposal_number}
                                </p>
                                
                                {proposal.description && (
                                  <p className="text-sm text-foreground mb-4">
                                    {proposal.description}
                                  </p>
                                )}

                                {/* Vendedor */}
                                {proposal.vendorInfo && (
                                  <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-md">
                                    <Avatar className="w-8 h-8">
                                      <AvatarImage src={proposal.vendorInfo.avatar_url} />
                                      <AvatarFallback className="text-xs">
                                        {proposal.vendorInfo.name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-medium">{proposal.vendorInfo.name}</p>
                                      {proposal.vendorInfo.phone && (
                                        <p className="text-xs text-muted-foreground">{proposal.vendorInfo.phone}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Criada em {format(new Date(proposal.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                                  </div>
                                  
                                  {proposal.valid_until && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      Válida até {format(new Date(proposal.valid_until), 'dd/MM/yyyy', { locale: ptBR })}
                                    </div>
                                  )}
                                  
                                  {proposal.accepted_at && (
                                    <div className="flex items-center gap-1 text-green-600">
                                      <CheckCircle className="w-4 h-4" />
                                      Aceita em {format(new Date(proposal.accepted_at), 'dd/MM/yyyy', { locale: ptBR })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}

function ProposalOrderBumps({ proposalId }: { proposalId: string }) {
  const { bumps, isLoading, registerDisplay, updateInteraction } = useOrderBumps(proposalId);

  if (isLoading || !bumps || bumps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {bumps.map((bump) => (
        <OrderBumpCard
          key={bump.id}
          proposalId={proposalId}
          rule={bump}
          onDisplay={() => registerDisplay(bump.id)}
          onInteraction={(action) => updateInteraction({ ruleId: bump.id, action })}
        />
      ))}
    </div>
  );
}