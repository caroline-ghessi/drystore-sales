import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { email } = await req.json();

    if (!email) {
      throw new Error('Email é obrigatório');
    }

    console.log('🔍 Verificando status do convite para:', email);

    // Buscar usuário no auth.users
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      throw usersError;
    }

    const user = users.users.find(u => u.email === email);
    
    let status = 'not_sent';
    if (user) {
      status = user.email_confirmed_at ? 'confirmed' : 'pending';
    }

    console.log('📧 Status do convite:', { email, status, userId: user?.id });

    return new Response(
      JSON.stringify({ 
        email,
        status,
        user_id: user?.id,
        confirmed_at: user?.email_confirmed_at,
        created_at: user?.created_at
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Erro no check-invite-status:', error);
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