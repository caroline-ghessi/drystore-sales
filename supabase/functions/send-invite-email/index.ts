import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  displayName: string;
  department?: string;
  role: 'admin' | 'supervisor' | 'atendente' | 'vendedor';
  customUserId?: string; // Para sincronizar com vendor ID
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const { email, displayName, department, role, customUserId }: InviteRequest = await req.json();

    console.log('Processando convite para:', { email, displayName, role, customUserId });

    // Determinar URL de redirecionamento
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/set-password`;

    console.log('URL de redirecionamento:', redirectUrl);

    // Criar convite no Supabase Auth
    const inviteOptions: any = {
      data: {
        display_name: displayName,
        department: department || '',
        invited_role: role
      },
      redirectTo: redirectUrl
    };

    // Se temos um customUserId (para vendedores), usar no convite
    if (customUserId) {
      inviteOptions.data.custom_user_id = customUserId;
    }

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      inviteOptions
    );

    if (inviteError) {
      console.error('Erro ao criar convite:', inviteError);
      throw new Error(`Erro ao criar convite: ${inviteError.message}`);
    }

    console.log('✅ Convite criado com sucesso via Supabase Auth (SMTP nativo):', {
      userId: inviteData.user?.id,
      email: email,
      role: role,
      redirectUrl: redirectUrl
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Convite enviado com sucesso',
        inviteId: inviteData.user?.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Erro no send-invite-email:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);