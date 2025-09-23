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

// Helper para logs estruturados com timestamp
function logWithTimestamp(level: 'INFO' | 'ERROR' | 'DEBUG', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Validar configurações essenciais
function validateEnvironment() {
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = requiredVars.filter(varName => !Deno.env.get(varName));
  
  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente obrigatórias não encontradas: ${missing.join(', ')}`);
  }
  
  logWithTimestamp('DEBUG', 'Validação de ambiente concluída', {
    supabase_url: Deno.env.get('SUPABASE_URL'),
    has_service_key: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  });
}

const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  
  logWithTimestamp('INFO', `[${requestId}] Nova requisição de convite recebida`, {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  if (req.method === 'OPTIONS') {
    logWithTimestamp('DEBUG', `[${requestId}] Requisição OPTIONS - retornando CORS headers`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validar ambiente antes de processar
    validateEnvironment();
    
    logWithTimestamp('INFO', `[${requestId}] Iniciando configuração do cliente Supabase`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    logWithTimestamp('INFO', `[${requestId}] Cliente Supabase configurado com sucesso`);
    
    // Parse e validação do body da requisição
    let requestBody: InviteRequest;
    try {
      requestBody = await req.json();
      logWithTimestamp('DEBUG', `[${requestId}] Body da requisição parseado`, {
        email: requestBody.email,
        displayName: requestBody.displayName,
        role: requestBody.role,
        hasCustomUserId: !!requestBody.customUserId
      });
    } catch (parseError) {
      logWithTimestamp('ERROR', `[${requestId}] Erro ao fazer parse do JSON da requisição`, { parseError });
      throw new Error('JSON inválido na requisição');
    }
    
    const { email, displayName, department, role, customUserId } = requestBody;

    // Validações de entrada
    if (!email || !email.includes('@')) {
      throw new Error('Email é obrigatório e deve ser válido');
    }
    if (!displayName || displayName.trim().length === 0) {
      throw new Error('Nome de exibição é obrigatório');
    }
    if (!['admin', 'supervisor', 'atendente', 'vendedor'].includes(role)) {
      throw new Error('Role deve ser: admin, supervisor, atendente ou vendedor');
    }

    logWithTimestamp('INFO', `[${requestId}] Processando convite para usuário`, {
      email,
      displayName,
      role,
      department: department || 'N/A',
      customUserId: customUserId || 'N/A'
    });

    // Determinar URL de redirecionamento
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/set-password`;

    logWithTimestamp('DEBUG', `[${requestId}] URL de redirecionamento configurada`, { 
      baseUrl, 
      redirectUrl 
    });

    // Configurar opções do convite
    const inviteOptions: any = {
      data: {
        display_name: displayName,
        department: department || '',
        invited_role: role,
        request_id: requestId // Para rastreamento
      },
      redirectTo: redirectUrl
    };

    // Se temos um customUserId (para vendedores), usar no convite
    if (customUserId) {
      inviteOptions.data.custom_user_id = customUserId;
      logWithTimestamp('DEBUG', `[${requestId}] Custom User ID adicionado ao convite`, { customUserId });
    }

    logWithTimestamp('INFO', `[${requestId}] Enviando convite via Supabase Auth (SMTP nativo)`);
    
    // Criar convite no Supabase Auth com retry
    let inviteData, inviteError;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      logWithTimestamp('DEBUG', `[${requestId}] Tentativa ${attempts}/${maxAttempts} de envio do convite`);
      
      const result = await supabaseAdmin.auth.admin.inviteUserByEmail(email, inviteOptions);
      inviteData = result.data;
      inviteError = result.error;
      
      if (!inviteError) {
        logWithTimestamp('INFO', `[${requestId}] Convite enviado com sucesso na tentativa ${attempts}`);
        break;
      }
      
      logWithTimestamp('ERROR', `[${requestId}] Tentativa ${attempts} falhou`, {
        error: inviteError,
        errorCode: inviteError.code,
        errorMessage: inviteError.message
      });
      
      // Se é erro de configuração SMTP, não tentar novamente
      if (inviteError.message?.includes('535') || 
          inviteError.message?.includes('API key') ||
          inviteError.message?.includes('SMTP')) {
        logWithTimestamp('ERROR', `[${requestId}] Erro de configuração SMTP detectado - não tentando novamente`, {
          errorDetails: inviteError
        });
        break;
      }
      
      // Aguardar antes da próxima tentativa
      if (attempts < maxAttempts) {
        const delay = attempts * 1000; // 1s, 2s, 3s...
        logWithTimestamp('DEBUG', `[${requestId}] Aguardando ${delay}ms antes da próxima tentativa`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (inviteError) {
      logWithTimestamp('ERROR', `[${requestId}] Falha definitiva ao criar convite após ${attempts} tentativas`, {
        error: inviteError,
        errorCode: inviteError.code,
        errorMessage: inviteError.message,
        errorDetails: inviteError
      });
      
      // Diagnóstico detalhado do erro
      let diagnosticInfo = '';
      if (inviteError.message?.includes('535')) {
        diagnosticInfo = 'Erro 535 indica problema de autenticação SMTP. Verifique se o SMTP do Resend está corretamente configurado no Dashboard do Supabase (Authentication > Settings).';
      } else if (inviteError.message?.includes('API key')) {
        diagnosticInfo = 'Erro de API key indica que as credenciais SMTP não estão corretas. Verifique se a API key do Resend está configurada como senha SMTP.';
      } else if (inviteError.message?.includes('SMTP')) {
        diagnosticInfo = 'Erro SMTP genérico. Verifique todas as configurações SMTP no Dashboard do Supabase.';
      }
      
      throw new Error(`Erro ao criar convite: ${inviteError.message}. ${diagnosticInfo}`);
    }

    // Log do sucesso com detalhes completos
    const successData = {
      userId: inviteData.user?.id,
      email: email,
      role: role,
      redirectUrl: redirectUrl,
      requestId: requestId,
      attempts: attempts,
      inviteData: inviteData
    };

    logWithTimestamp('INFO', `[${requestId}] ✅ CONVITE CRIADO COM SUCESSO`, successData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Convite enviado com sucesso via SMTP nativo do Supabase',
        inviteId: inviteData.user?.id,
        requestId: requestId,
        attempts: attempts
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    logWithTimestamp('ERROR', `[${requestId}] ERRO CRÍTICO na função send-invite-email`, {
      error: error.message,
      stack: error.stack,
      errorType: error.constructor.name
    });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro interno do servidor',
        details: error.toString(),
        requestId: requestId,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);