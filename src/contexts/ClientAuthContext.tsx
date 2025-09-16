import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ClientData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
}

interface ClientAuthContextType {
  client: ClientData | null;
  loading: boolean;
  signInWithWhatsApp: (whatsapp: string) => Promise<{ error: any }>;
  signOut: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se existe sessão de cliente salva
    const savedClient = localStorage.getItem('drystore_client_session');
    if (savedClient) {
      try {
        setClient(JSON.parse(savedClient));
      } catch (error) {
        localStorage.removeItem('drystore_client_session');
      }
    }
    setLoading(false);
  }, []);

  const signInWithWhatsApp = async (whatsapp: string) => {
    setLoading(true);
    
    try {
      // Normalizar formato do WhatsApp (remover caracteres especiais)
      const normalizedPhone = whatsapp.replace(/\D/g, '');
      
      // Buscar cliente na tabela crm_customers pelo telefone
      const { data, error } = await supabase
        .from('crm_customers')
        .select('id, name, phone, email, city, state')
        .eq('phone', normalizedPhone)
        .single();

      if (error || !data) {
        return { 
          error: { 
            message: 'Nenhuma proposta encontrada para este WhatsApp. Verifique o número ou entre em contato conosco.' 
          } 
        };
      }

      const clientData: ClientData = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        city: data.city,
        state: data.state
      };

      setClient(clientData);
      localStorage.setItem('drystore_client_session', JSON.stringify(clientData));
      
      return { error: null };
    } catch (error) {
      return { error: { message: 'Erro ao verificar WhatsApp. Tente novamente.' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setClient(null);
    localStorage.removeItem('drystore_client_session');
  };

  const value = {
    client,
    loading,
    signInWithWhatsApp,
    signOut,
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
}