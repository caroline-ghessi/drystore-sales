import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { Resend } from "https://esm.sh/resend@4.0.0";

// Interfaces
interface InviteRequest {
  email: string;
  displayName: string;
  role: 'admin' | 'supervisor' | 'atendente' | 'vendedor';
  department?: string;
  customUserId?: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sistema de Logging Robusto
function logWithTimestamp(level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL', requestId: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] [${requestId}] ${message}`;
  
  if (data) {
    console.log(logEntry, data);
  } else {
    console.log(logEntry);
  }
}

// Validação robusta do ambiente
function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  if (!supabaseUrl) errors.push('SUPABASE_URL não configurada');
  if (!supabaseServiceKey) errors.push('SUPABASE_SERVICE_ROLE_KEY não configurada');
  if (!resendApiKey) errors.push('RESEND_API_KEY não configurada');

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Função de envio via Resend API (Fallback)
async function sendDirectInviteEmail(email: string, displayName: string, role: string, requestId: string, confirmationLink?: string): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    logWithTimestamp('DEBUG', requestId, '🔧 Iniciando envio via Resend API diretamente');
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não encontrada');
    }

    const resend = new Resend(resendApiKey);

    // HTML do email sempre com link de ativação
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Bem-vindo à DryStore!</h1>
        <p>Olá <strong>${displayName}</strong>,</p>
        <p>Você foi convidado para participar da plataforma DryStore como <strong>${role}</strong>.</p>
        ${confirmationLink ? `
        <p>Para ativar sua conta, clique no botão abaixo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Ativar Conta</a>
        </div>
        <p style="color: #666; font-size: 14px;">Ou copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; color: #2563eb; font-size: 12px;">${confirmationLink}</p>
        ` : `
        <p><strong>Importante:</strong> Você receberá um email adicional com o link de ativação da conta.</p>
        `}
        <p>Obrigado!</p>
        <p><strong>Equipe DryStore</strong></p>
      </div>
    `;

    const emailResult = await resend.emails.send({
      from: 'DryStore <comunicacao@comercial.drystore.com.br>',
      to: [email],
      subject: `Convite para ${role} - DryStore`,
      html: emailHtml
    });

    if (emailResult.data) {
      logWithTimestamp('INFO', requestId, '✅ Email enviado com sucesso via Resend', { 
        emailId: emailResult.data.id 
      });
      return { success: true, emailId: emailResult.data.id };
    } else {
      logWithTimestamp('ERROR', requestId, '❌ Falha no envio via Resend', emailResult.error);
      return { success: false, error: emailResult.error?.message || 'Erro desconhecido no Resend' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logWithTimestamp('ERROR', requestId, '💥 Erro crítico no Resend', { error: errorMessage });
    return { success: false, error: `Erro no Resend: ${errorMessage}` };
  }
}

// Handler principal com sistema híbrido otimizado
const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID().substring(0, 8);

  logWithTimestamp('INFO', requestId, '🚀 SISTEMA HÍBRIDO ROBUSTO - Nova requisição recebida', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    logWithTimestamp('DEBUG', requestId, 'Requisição OPTIONS - retornando CORS headers');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // FASE 1: Validação do ambiente
    logWithTimestamp('DEBUG', requestId, '🔍 Validando configurações do ambiente...');
    
    const envValidation = validateEnvironment();
    if (!envValidation.isValid) {
      logWithTimestamp('CRITICAL', requestId, '💥 CONFIGURAÇÃO INVÁLIDA', { errors: envValidation.errors });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Configuração inválida', 
          details: envValidation.errors 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logWithTimestamp('INFO', requestId, '✅ Ambiente validado - todas as configurações presentes');

    // FASE 2: Parse e validação da requisição
    const body = await req.json();
    logWithTimestamp('DEBUG', requestId, '📨 Body da requisição parseado', {
      email: body.email,
      displayName: body.displayName,
      role: body.role,
      hasCustomUserId: !!body.customUserId
    });

    const { email, displayName, role, department, customUserId }: InviteRequest = body;

    // Validação dos dados de entrada
    if (!email || !displayName || !role) {
      logWithTimestamp('WARNING', requestId, '❌ Dados de entrada inválidos', { email, displayName, role });
      return new Response(
        JSON.stringify({ success: false, error: 'Dados obrigatórios ausentes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logWithTimestamp('INFO', requestId, '👤 Processando convite para usuário', {
      email,
      displayName,
      role,
      department: department || 'N/A',
      customUserId: customUserId || 'N/A'
    });

    // FASE 3: Inicialização do Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // FASE 4: SISTEMA HÍBRIDO COM TIMEOUT OTIMIZADO
    logWithTimestamp('INFO', requestId, '🔄 FASE 1: Tentando SMTP nativo do Supabase (timeout 10s)');

    let smtpSuccess = false;
    let smtpError = '';

    try {
      // Timeout de 10 segundos para SMTP nativo
      const smtpPromise = supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          display_name: displayName,
          invited_role: role,
          department: department || ''
        }
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout SMTP - 10s excedido')), 10000)
      );

      const smtpResult = await Promise.race([smtpPromise, timeoutPromise]) as any;

      if (smtpResult.data?.user) {
        logWithTimestamp('INFO', requestId, '🎉 SUCESSO - Email enviado via SMTP nativo', {
          userId: smtpResult.data.user.id,
          method: 'supabase_smtp'
        });
        smtpSuccess = true;
      } else if (smtpResult.error) {
        throw new Error(smtpResult.error.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      smtpError = errorMessage;
      logWithTimestamp('WARNING', requestId, '❌ SMTP nativo falhou', { error: smtpError });
    }

    // FASE 5: FALLBACK AUTOMÁTICO PARA RESEND
    if (!smtpSuccess) {
      logWithTimestamp('INFO', requestId, '🔄 FASE 2: SMTP falhou - ativando fallback Resend imediato');

      // Primeiro criar o usuário no Supabase
      try {
        const userResult = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: false,
          user_metadata: {
            display_name: displayName,
            invited_role: role,
            department: department || ''
          }
        });

        let userId = null;
        if (userResult.error) {
          if (userResult.error.message?.includes('already been registered')) {
            logWithTimestamp('INFO', requestId, '👤 Usuário já existe - buscando ID', { email });
            // Buscar o usuário existente para obter o ID
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = existingUsers.users.find(u => u.email === email);
            userId = existingUser?.id;
          } else {
            throw new Error(`Erro ao criar usuário: ${userResult.error.message}`);
          }
        } else {
          logWithTimestamp('INFO', requestId, '✅ Usuário criado com sucesso', { userId: userResult.data.user?.id });
          userId = userResult.data.user?.id;
        }

        // Gerar link de confirmação usando generateLink
        let confirmationLink = null;
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'invite',
          email: email,
          options: {
            redirectTo: 'https://a8d68d6e-4efd-4093-966f-bddf0a89dc45.lovableproject.com/'
          }
        });

        if (!linkError && linkData.properties?.action_link) {
          confirmationLink = linkData.properties.action_link;
          logWithTimestamp('INFO', requestId, '✅ Link de confirmação gerado', { 
            hasLink: !!confirmationLink,
            linkPreview: confirmationLink?.substring(0, 100) + '...'
          });
        } else {
          logWithTimestamp('WARNING', requestId, '⚠️ Falha ao gerar link de confirmação', { error: linkError });
        }

        // Enviar email via Resend com link de confirmação
        const resendResult = await sendDirectInviteEmail(email, displayName, role, requestId, confirmationLink || undefined);

        if (resendResult.success) {
          logWithTimestamp('INFO', requestId, '🎉 SISTEMA HÍBRIDO SUCESSO - Fallback Resend funcionou', {
            method: 'resend_fallback',
            emailId: resendResult.emailId
          });

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Convite enviado com sucesso via fallback',
              method: 'resend_fallback',
              diagnostics: {
                smtp_attempted: true,
                smtp_error: smtpError,
                fallback_used: true,
                fallback_success: true
              }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          throw new Error(`Fallback Resend falhou: ${resendResult.error}`);
        }
      } catch (fallbackError) {
        const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        logWithTimestamp('CRITICAL', requestId, '💥 FALLBACK CRÍTICO - Resend também falhou', {
          fallback_error: fallbackErrorMessage
        });

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Sistema híbrido falhou completamente',
            diagnostics: {
              smtp_error: smtpError,
              fallback_error: fallbackErrorMessage,
              timestamp: new Date().toISOString()
            }
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Retorno para sucesso do SMTP nativo
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Convite enviado com sucesso via SMTP nativo',
        method: 'supabase_smtp',
        diagnostics: {
          smtp_success: true,
          fallback_needed: false
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    const errorConstructor = error instanceof Error ? error.constructor.name : 'Unknown';
    
    logWithTimestamp('ERROR', requestId, '💥 ERRO CRÍTICO NA FUNÇÃO PRINCIPAL', { 
      error: errorMessage,
      stack: errorStack,
      errorType: errorConstructor
    });
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      requestId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);