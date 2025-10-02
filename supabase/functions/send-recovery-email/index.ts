import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { Resend } from "https://esm.sh/resend@4.0.0";

// Interface
interface RecoveryRequest {
  email: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sistema de Logging
function logWithTimestamp(level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL', requestId: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] [${requestId}] ${message}`;
  
  if (data) {
    console.log(logEntry, data);
  } else {
    console.log(logEntry);
  }
}

// Validação do ambiente
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

// Função de envio via Resend API
async function sendRecoveryEmail(email: string, recoveryLink: string, requestId: string): Promise<{ success: boolean; error?: string; emailId?: string }> {
  try {
    logWithTimestamp('DEBUG', requestId, '🔧 Iniciando envio via Resend API');
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não encontrada');
    }

    const resend = new Resend(resendApiKey);

    // HTML do email de recuperação
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Recuperação de Senha - DryStore</h1>
        <p>Olá,</p>
        <p>Você solicitou a recuperação de senha para sua conta na DryStore.</p>
        <p>Para definir uma nova senha, clique no botão abaixo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${recoveryLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Redefinir Senha</a>
        </div>
        <p style="color: #666; font-size: 14px;">Ou copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; color: #2563eb; font-size: 12px;">${recoveryLink}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Se você não solicitou a recuperação de senha, ignore este email. Este link expira em 1 hora.
        </p>
        <p>Obrigado!</p>
        <p><strong>Equipe DryStore</strong></p>
      </div>
    `;

    const emailResult = await resend.emails.send({
      from: 'DryStore <comunicacao@comercial.drystore.com.br>',
      to: [email],
      subject: 'Recuperação de Senha - DryStore',
      html: emailHtml
    });

    if (emailResult.data) {
      logWithTimestamp('INFO', requestId, '✅ Email de recuperação enviado com sucesso', { 
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

// Handler principal
const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID().substring(0, 8);

  // Log inicial - FORÇANDO DEPLOYMENT
  console.log('=== EDGE FUNCTION SEND-RECOVERY-EMAIL INICIADA ===');
  logWithTimestamp('INFO', requestId, '🚀 Nova requisição de recuperação de senha', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(req.headers)
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

    logWithTimestamp('INFO', requestId, '✅ Ambiente validado');

    // FASE 2: Parse e validação da requisição
    const body = await req.json();
    logWithTimestamp('DEBUG', requestId, '📨 Body da requisição parseado', {
      email: body.email
    });

    const { email }: RecoveryRequest = body;

    if (!email) {
      logWithTimestamp('WARNING', requestId, '❌ Email não fornecido');
      return new Response(
        JSON.stringify({ success: false, error: 'Email obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logWithTimestamp('INFO', requestId, '📧 Processando recuperação de senha', { email });

    // FASE 3: Inicialização do Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // FASE 4: Gerar link de recuperação via Supabase Admin
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://a8d68d6e-4efd-4093-966f-bddf0a89dc45.lovableproject.com/reset-password'
      }
    });

    if (linkError || !linkData.properties?.action_link) {
      logWithTimestamp('ERROR', requestId, '❌ Falha ao gerar link de recuperação', { error: linkError });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não foi possível gerar o link de recuperação',
          details: linkError?.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recoveryLink = linkData.properties.action_link;
    logWithTimestamp('INFO', requestId, '✅ Link de recuperação gerado', { 
      linkPreview: recoveryLink.substring(0, 100) + '...'
    });

    // FASE 5: Enviar email via Resend
    const resendResult = await sendRecoveryEmail(email, recoveryLink, requestId);

    if (resendResult.success) {
      logWithTimestamp('INFO', requestId, '🎉 Recuperação de senha enviada com sucesso', {
        emailId: resendResult.emailId
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email de recuperação enviado com sucesso',
          emailId: resendResult.emailId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(`Falha no envio do email: ${resendResult.error}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    logWithTimestamp('ERROR', requestId, '💥 ERRO CRÍTICO', { 
      error: errorMessage,
      stack: errorStack
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
