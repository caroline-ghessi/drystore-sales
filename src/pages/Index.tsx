import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Building2, ArrowLeft, Users, MessageCircle } from 'lucide-react';

export default function Index() {
  const [userType, setUserType] = useState<'client' | 'vendor'>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
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
    setMessage('');

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await signUp(email, password);
    
    if (error) {
      if (error.message.includes('User already registered')) {
        setError('Este email já está cadastrado. Use a aba "Entrar" para fazer login.');
      } else {
        setError(error.message);
      }
    } else {
      setMessage('Verifique seu email para confirmar a conta e então faça login.');
    }
    
    setLoading(false);
  };

  const handleClientSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

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

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
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
                : 'Entre com suas credenciais ou crie uma nova conta'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userType === 'client' ? (
              // Client WhatsApp Login
              <form onSubmit={handleClientSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp (com DDD)</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                    required
                    maxLength={15}
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
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Entrar</TabsTrigger>
                  <TabsTrigger value="signup">Cadastrar</TabsTrigger>
                </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Senha</Label>
                    <Input
                      id="signin-password"
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
                      className="text-sm text-muted-foreground hover:text-primary"
                      onClick={() => setShowResetForm(true)}
                    >
                      Esqueci minha senha
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {message && (
                    <Alert>
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
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
              Para demonstração, você pode desabilitar "Confirm email" nas configurações do Supabase para acelerar o teste.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
