import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WhatsAppInput } from '@/components/ui/whatsapp-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Building2, ArrowLeft, Users, MessageCircle } from 'lucide-react';

export default function Index() {
  const [userType, setUserType] = useState<'client' | 'vendor'>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [debugClick, setDebugClick] = useState(false);
  
  const { signIn, user } = useAuth();
  const { signInWithWhatsApp, client } = useClientAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
    if (client) {
      navigate('/cliente');
    }

    // Verificar se há erro na URL (ex: erro de convite)
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      if (error === 'access_denied' && errorDescription?.includes('Email link is invalid')) {
        setError('O link de convite expirou ou já foi usado. Solicite um novo convite.');
      } else {
        setError(errorDescription || 'Erro no processo de autenticação.');
      }
    }
  }, [user, client, navigate, searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos. Verifique suas credenciais.');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Email não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.');
      } else {
        setError(error.message);
      }
    } else {
      navigate('/home');
    }
    
    setLoading(false);
  };


  const handleClientSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    

    // Normalizar WhatsApp para formato brasileiro
    const normalizedWhatsApp = whatsapp.replace(/\D/g, '');
    
    if (normalizedWhatsApp.length !== 11) {
      setError('Informe um WhatsApp válido com 11 dígitos (DDD + número)');
      setLoading(false);
      return;
    }

    const { error } = await signInWithWhatsApp(normalizedWhatsApp);
    
    if (error) {
      setError(error.message);
    } else {
      navigate('/cliente');
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔄 Iniciando recuperação de senha para:', resetEmail);
    
    if (!resetEmail) {
      console.log('❌ Email vazio');
      setResetMessage({
        type: 'error',
        text: 'Por favor, digite seu email.'
      });
      return;
    }

    setResetLoading(true);
    setResetMessage(null);

    try {
      // Logs detalhados para debug
      console.log('🌐 Supabase URL:', 'https://groqsnnytvjabgeaekkw.supabase.co');
      console.log('📍 Endpoint:', 'https://groqsnnytvjabgeaekkw.supabase.co/functions/v1/send-recovery-email');
      console.log('📤 Chamando Edge Function send-recovery-email');
      console.log('📧 Email:', resetEmail);
      
      const { data, error } = await supabase.functions.invoke('send-recovery-email', {
        body: { email: resetEmail }
      });

      console.log('📥 Resposta completa do Edge Function:', JSON.stringify({ data, error }, null, 2));

      if (error) {
        console.error('❌ Erro ao chamar Edge Function:', error);
        console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
        setResetMessage({
          type: 'error',
          text: `Erro ao enviar email de recuperação: ${error.message || 'Tente novamente.'}`
        });
      } else if (data?.success) {
        console.log('✅ Email de recuperação enviado com sucesso!');
        console.log('✅ Email ID:', data.emailId);
        setResetMessage({
          type: 'success',
          text: 'Email de recuperação enviado! Verifique sua caixa de entrada.'
        });
        setResetEmail('');
      } else {
        console.error('❌ Resposta inesperada do Edge Function:', data);
        setResetMessage({
          type: 'error',
          text: data?.error || 'Erro ao enviar email. Tente novamente.'
        });
      }
    } catch (err) {
      console.error('❌ Erro inesperado:', err);
      console.error('❌ Stack:', err instanceof Error ? err.stack : 'No stack');
      setResetMessage({
        type: 'error',
        text: 'Erro inesperado. Tente novamente.'
      });
    } finally {
      setResetLoading(false);
      console.log('✅ Processo de recuperação finalizado');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-4">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            <span className="text-primary">Dry</span>store Sales
          </h1>
          <p className="text-muted-foreground mt-2">Portal de Vendas e Atendimento</p>
        </div>

        {/* User Type Selector */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={userType === 'client' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setUserType('client')}
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Cliente
            </Button>
            <Button
              variant={userType === 'vendor' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setUserType('vendor')}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Vendedor/Admin
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {userType === 'client' ? 'Acesso do Cliente' : 'Acesso de Vendedores e Admins'}
            </CardTitle>
            <CardDescription>
              {userType === 'client' 
                ? 'Digite seu WhatsApp para ver suas propostas' 
                : 'Entre com suas credenciais de acesso'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userType === 'client' ? (
              // Client WhatsApp Login
              <form onSubmit={handleClientSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp (com DDD)</Label>
                  <WhatsAppInput
                    id="whatsapp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite o WhatsApp usado nas suas propostas
                  </p>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ver Minhas Propostas
                </Button>
              </form>
            ) : (
              // Vendor/Admin Login
              <>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                  
                  <div className="text-center">
                    <Button 
                      type="button" 
                      variant="link" 
                      className={`text-sm text-muted-foreground hover:text-primary transition-all ${debugClick ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => {
                        console.log('🔘 Botão "Esqueci minha senha" clicado');
                        setDebugClick(true);
                        setTimeout(() => setDebugClick(false), 300);
                        
                        try {
                          setShowResetForm(true);
                          console.log('✅ showResetForm definido como true');
                        } catch (err) {
                          console.error('❌ Erro ao definir showResetForm:', err);
                        }
                      }}
                    >
                      Esqueci minha senha
                    </Button>
                  </div>
                </form>

                {showResetForm && (
                  <div className="mt-6 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2 mb-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowResetForm(false);
                          setResetMessage(null);
                          setResetEmail('');
                        }}
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                      </Button>
                      <h3 className="text-sm font-semibold">Recuperar Senha</h3>
                    </div>

                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Digite o email da sua conta para receber o link de recuperação
                        </p>
                      </div>

                      {resetMessage && (
                        <Alert variant={resetMessage.type === 'error' ? 'destructive' : 'default'}>
                          <AlertDescription>{resetMessage.text}</AlertDescription>
                        </Alert>
                      )}

                      <Button type="submit" className="w-full" disabled={resetLoading}>
                        {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enviar Email de Recuperação
                      </Button>
                    </form>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-muted-foreground mt-6">
          <p className="mb-2">
            <span className="font-semibold text-primary">DryStore</span> - Mais de 22 anos construindo soluções
          </p>
          {userType === 'client' && (
            <p className="text-xs">
              Não encontrou suas propostas? Entre em contato conosco pelo WhatsApp
            </p>
          )}
          {userType === 'vendor' && (
            <p className="text-xs">
              Acesso restrito a vendedores e administradores autorizados
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
