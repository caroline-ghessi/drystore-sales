import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'npm:resend@4.0.0';

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
    has_service_key: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    has_resend_key: !!Deno.env.get('RESEND_API_KEY')
  });
}

// Função para envio direto via Resend API como fallback
async function sendDirectInviteEmail(email: string, displayName: string, role: string, requestId: string) {
  const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
  
  const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'http://localhost:3000';
  const inviteUrl = `${baseUrl}/set-password`;
  
  const { data, error } = await resend.emails.send({
    from: 'Sistema DryStore <onboarding@resend.dev>',
    to: [email],
    subject: 'Convite para acessar o Sistema DryStore',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Você foi convidado para o Sistema DryStore</h2>
        <p>Olá <strong>${displayName}</strong>,</p>
        <p>Você foi convidado para acessar o Sistema DryStore como <strong>${role}</strong>.</p>
        <p>Para ativar sua conta, clique no botão abaixo:</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${inviteUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Ativar Conta
          </a>
        </div>
        <p>Ou copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; color: #666;">${inviteUrl}</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Se você não solicitou este convite, pode ignorar este email.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Erro no Resend: ${error.message}`);
  }

  logWithTimestamp('INFO', `[${requestId}] Email enviado via Resend API diretamente`, {
    emailId: data?.id,
    to: email
  });

  return data;
}

const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  
  logWithTimestamp('INFO', `[${requestId}] 🚀 Sistema Híbrido - Nova requisição de convite recebida`, {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  if (req.method === 'OPTIONS') {
    logWithTimestamp('DEBUG', `[${requestId}] Requisição OPTIONS - retornando CORS headers`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validar ambiente antes de processar
    validateEnvironment();
    
    logWithTimestamp('INFO', `[${requestId}] ✅ Ambiente validado - iniciando processamento`);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Parse e validação do body da requisição
    let requestBody: InviteRequest;
    try {
      requestBody = await req.json();
      logWithTimestamp('INFO', `[${requestId}] 📨 Body da requisição parseado`, {
        email: requestBody.email,
        displayName: requestBody.displayName,
        role: requestBody.role,
        hasCustomUserId: !!requestBody.customUserId
      });
    } catch (parseError) {
      logWithTimestamp('ERROR', `[${requestId}] ❌ Erro ao fazer parse do JSON da requisição`, { parseError });
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

    logWithTimestamp('INFO', `[${requestId}] 👤 Processando convite para usuário`, {
      email,
      displayName,
      role,
      department: department || 'N/A',
      customUserId: customUserId || 'N/A'
    });

    // FASE 1: TENTAR SMTP NATIVO DO SUPABASE
    logWithTimestamp('INFO', `[${requestId}] 🔄 FASE 1: Tentando SMTP nativo do Supabase`);
    
    const baseUrl = supabaseUrl.replace('.supabase.co', '.lovableproject.com');
    const redirectUrl = `${baseUrl}/set-password`;

    const inviteOptions: any = {
      data: {
        display_name: displayName,
        department: department || '',
        invited_role: role,
        request_id: requestId
      },
      redirectTo: redirectUrl
    };

    if (customUserId) {
      inviteOptions.data.custom_user_id = customUserId;
    }
    
    let inviteSuccess = false;
    let smtpResult = null;
    let smtpError = null;

    try {
      // Tentar SMTP nativo com retry limitado
      let attempts = 0;
      const maxAttempts = 2; // Reduzir tentativas para falhar mais rápido

      while (attempts < maxAttempts && !inviteSuccess) {
        attempts++;
        
        logWithTimestamp('DEBUG', `[${requestId}] 🔄 Tentativa ${attempts}/${maxAttempts} via SMTP nativo`);
        
        const result = await supabaseAdmin.auth.admin.inviteUserByEmail(email, inviteOptions);
        
        if (!result.error) {
          smtpResult = result.data;
          inviteSuccess = true;
          logWithTimestamp('INFO', `[${requestId}] ✅ SUCESSO - SMTP nativo funcionou na tentativa ${attempts}`, {
            userId: result.data.user?.id,
            method: 'smtp_native'
          });
          break;
        }
        
        smtpError = result.error;
        logWithTimestamp('ERROR', `[${requestId}] ❌ Tentativa ${attempts} falhou via SMTP`, {
          error: result.error.message,
          code: result.error.code
        });
        
        // Se é erro de configuração SMTP, sair do loop rapidamente
        if (result.error.message?.includes('535') || 
            result.error.message?.includes('API key') ||
            result.error.message?.includes('SMTP')) {
          logWithTimestamp('WARNING', `[${requestId}] ⚠️ Erro SMTP detectado - pulando para fallback`, {
            errorType: 'smtp_config_error'
          });
          break;
        }
        
        // Aguardar apenas se não for o último attempt
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error: any) {
      logWithTimestamp('ERROR', `[${requestId}] ❌ Erro crítico no SMTP nativo`, {
        error: error.message
      });
      smtpError = error;
    }

    // FASE 2: FALLBACK PARA RESEND DIRETO
    if (!inviteSuccess) {
      logWithTimestamp('INFO', `[${requestId}] 🔄 FASE 2: SMTP falhou - tentando Resend API diretamente`);
      
      try {
        // Verificar se temos a API key do Resend
        if (!Deno.env.get('RESEND_API_KEY')) {
          throw new Error('RESEND_API_KEY não configurada para fallback');
        }

        // Primeiro, criar o usuário no Supabase sem enviar email
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          email_confirm: false, // Não confirmar automaticamente
          user_metadata: {
            display_name: displayName,
            department: department || '',
            invited_role: role,
            request_id: requestId,
            created_via: 'fallback_resend'
          }
        });

        if (userError) {
          // Se usuário já existe, tentar buscar
          if (userError.message?.includes('already exists') || userError.message?.includes('already registered')) {
            logWithTimestamp('INFO', `[${requestId}] 👤 Usuário já existe - prosseguindo com envio de email`, {
              email: email
            });
          } else {
            logWithTimestamp('ERROR', `[${requestId}] ❌ Erro ao criar usuário`, { userError });
            throw new Error(`Erro ao criar usuário: ${userError.message}`);
          }
        }

        // Enviar email via Resend API
        const resendResult = await sendDirectInviteEmail(email, displayName, role, requestId);
        
        logWithTimestamp('INFO', `[${requestId}] ✅ SUCESSO - Fallback Resend funcionou!`, {
          emailId: resendResult?.id,
          userId: userData?.user?.id,
          method: 'resend_fallback'
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Convite enviado com sucesso via Resend (fallback)',
            method: 'resend_fallback',
            inviteId: userData?.user?.id,
            emailId: resendResult?.id,
            requestId: requestId,
            diagnostics: {
              smtp_error: smtpError?.message,
              fallback_used: true
            }
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );

      } catch (fallbackError: any) {
        logWithTimestamp('ERROR', `[${requestId}] ❌ FALHA CRÍTICA - Ambos os métodos falharam`, {
          smtp_error: smtpError?.message,
          fallback_error: fallbackError.message
        });
        
        throw new Error(`Sistema híbrido falhou - SMTP: ${smtpError?.message || 'erro desconhecido'}, Resend: ${fallbackError.message}`);  
      }
    }

    // SUCESSO VIA SMTP NATIVO
    logWithTimestamp('INFO', `[${requestId}] 🎉 CONVITE ENVIADO COM SUCESSO VIA SMTP NATIVO`, {
      userId: smtpResult?.user?.id,
      email: email,
      role: role,
      method: 'smtp_native'
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Convite enviado com sucesso via SMTP nativo do Supabase',
        method: 'smtp_native',
        inviteId: smtpResult?.user?.id,
        requestId: requestId,
        diagnostics: {
          smtp_working: true,
          fallback_used: false
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    logWithTimestamp('ERROR', `[${requestId}] 💥 ERRO CRÍTICO GERAL`, {
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
        timestamp: new Date().toISOString(),
        system: 'hybrid_email_system'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);