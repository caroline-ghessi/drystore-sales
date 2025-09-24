import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[${requestId}] 🧪 TESTE DE CONFIGURAÇÃO INICIADO`);

  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment_check: {},
      supabase_check: {},
      resend_check: {},
      overall_status: 'unknown'
    };

    // 1. Verificar variáveis de ambiente
    console.log(`[${requestId}] 📋 Verificando variáveis de ambiente...`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    diagnostics.environment_check = {
      supabase_url: !!supabaseUrl ? 'PRESENTE' : 'AUSENTE',
      supabase_service_key: !!supabaseServiceKey ? 'PRESENTE' : 'AUSENTE',
      resend_api_key: !!resendApiKey ? 'PRESENTE' : 'AUSENTE',
      all_present: !!(supabaseUrl && supabaseServiceKey && resendApiKey)
    };

    console.log(`[${requestId}] ✅ Ambiente:`, diagnostics.environment_check);

    // 2. Testar conexão Supabase
    console.log(`[${requestId}] 🔗 Testando conexão Supabase...`);
    
    try {
      const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });

      if (error) {
        throw new Error(`Erro Supabase: ${error.message}`);
      }

      diagnostics.supabase_check = {
        connection: 'SUCESSO',
        can_list_users: true,
        user_count: data?.users?.length || 0
      };

      console.log(`[${requestId}] ✅ Supabase conectado com sucesso`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      diagnostics.supabase_check = {
        connection: 'FALHA',
        error: errorMessage
      };
      console.log(`[${requestId}] ❌ Falha na conexão Supabase:`, errorMessage);
    }

    // 3. Testar conexão Resend
    console.log(`[${requestId}] 📧 Testando conexão Resend...`);
    
    try {
      const resend = new Resend(resendApiKey!);

      // Teste simples: tentar buscar domínios (não envia email)
      const domainsResult = await resend.domains.list();

      diagnostics.resend_check = {
        connection: 'SUCESSO',
        api_key_valid: true,
        domains_accessible: true
      };

      console.log(`[${requestId}] ✅ Resend conectado com sucesso`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      diagnostics.resend_check = {
        connection: 'FALHA',
        api_key_valid: false,
        error: errorMessage
      };
      console.log(`[${requestId}] ❌ Falha na conexão Resend:`, errorMessage);
    }

    // 4. Determinar status geral
    const allChecksPass = 
      diagnostics.environment_check.all_present &&
      diagnostics.supabase_check.connection === 'SUCESSO' &&
      diagnostics.resend_check.connection === 'SUCESSO';

    diagnostics.overall_status = allChecksPass ? 'TUDO_OK' : 'PROBLEMAS_DETECTADOS';

    console.log(`[${requestId}] 🎯 Status geral: ${diagnostics.overall_status}`);

    return new Response(
      JSON.stringify({
        success: allChecksPass,
        message: allChecksPass ? 'Todas as configurações estão funcionando' : 'Problemas detectados nas configurações',
        diagnostics,
        requestId
      }),
      { 
        status: allChecksPass ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`[${requestId}] 💥 ERRO CRÍTICO NO TESTE:`, errorMessage);
    
    return new Response(JSON.stringify({
      success: false,
      status: 'ERRO_CRÍTICO',
      message: 'Falha na execução dos testes',
      details: errorMessage,
      request_id: requestId,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
    console.log(`[${requestId}] 💥 ERRO CRÍTICO NO TESTE:`, error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro crítico no teste de configuração',
        details: error.message,
        requestId
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);