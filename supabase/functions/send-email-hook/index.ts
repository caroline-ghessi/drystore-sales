import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret);
    
    console.log('📧 Interceptando email de autenticação...');
    
    let webhookPayload;
    try {
      webhookPayload = wh.verify(payload, headers) as {
        user: {
          email: string;
          id: string;
          user_metadata?: any;
          raw_user_meta_data?: any;
        };
        email_data: {
          token: string;
          token_hash: string;
          redirect_to: string;
          email_action_type: string;
          site_url: string;
        };
      };
    } catch (error) {
      console.error('❌ Erro na verificação do webhook:', error);
      throw error;
    }
    
    const { user, email_data } = webhookPayload;
    const { token, token_hash, redirect_to, email_action_type } = email_data;
    
    console.log('📝 Detalhes do email:', {
      email: user.email,
      action: email_action_type,
      userId: user.id
    });
    
    // Determinar o tipo de email e gerar conteúdo apropriado
    let subject = '';
    let htmlContent = '';
    
    const displayName = user.raw_user_meta_data?.display_name || user.user_metadata?.display_name || user.email;
    const role = user.raw_user_meta_data?.invited_role || 'usuário';
    const department = user.raw_user_meta_data?.department || '';
    
    if (email_action_type === 'invite') {
      subject = `Convite para DryStore AI - ${role}`;
      
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Convite para DryStore AI</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">DryStore AI</h1>
              <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Sistema Inteligente de Atendimento</p>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Olá, ${displayName}!</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Você foi convidado(a) para fazer parte da equipe do <strong>DryStore AI</strong> como <strong>${role}</strong>.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Para aceitar o convite e configurar sua conta, clique no botão abaixo:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                Aceitar Convite e Configurar Senha
              </a>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 30px 0;">
              <h3 style="color: #555; margin-top: 0;">Detalhes do seu acesso:</h3>
              <ul style="color: #666;">
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Cargo:</strong> ${role}</li>
                ${department ? `<li><strong>Departamento:</strong> ${department}</li>` : ''}
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              <strong>Importante:</strong> Este link é válido por 24 horas. Após aceitar o convite, você poderá definir sua senha e acessar o sistema.
            </p>
            
            <p style="font-size: 14px; color: #666;">
              Se você não solicitou este convite, pode ignorar este email com segurança.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              DryStore AI - Sistema Inteligente de Atendimento<br>
              Este é um email automático, não responda.
            </p>
          </body>
        </html>
      `;
    } else if (email_action_type === 'recovery') {
      subject = 'Recuperação de Senha - DryStore AI';
      
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Recuperação de Senha - DryStore AI</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">DryStore AI</h1>
              <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Sistema Inteligente de Atendimento</p>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Recuperação de Senha</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Você solicitou a recuperação da sua senha no <strong>DryStore AI</strong>.
            </p>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Para redefinir sua senha, clique no botão abaixo:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                Redefinir Senha
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              <strong>Importante:</strong> Este link é válido por 1 hora por segurança.
            </p>
            
            <p style="font-size: 14px; color: #666;">
              Se você não solicitou esta recuperação, pode ignorar este email com segurança.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              DryStore AI - Sistema Inteligente de Atendimento<br>
              Este é um email automático, não responda.
            </p>
          </body>
        </html>
      `;
    } else {
      // Fallback para outros tipos de email
      subject = 'DryStore AI - Confirmação necessária';
      
      htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>DryStore AI - Confirmação</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">DryStore AI</h1>
              <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Sistema Inteligente de Atendimento</p>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Confirmação necessária</h2>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Para confirmar sua ação no <strong>DryStore AI</strong>, clique no botão abaixo:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
                Confirmar
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              DryStore AI - Sistema Inteligente de Atendimento<br>
              Este é um email automático, não responda.
            </p>
          </body>
        </html>
      `;
    }
    
    // Enviar email via Resend
    const emailResult = await resend.emails.send({
      from: 'DryStore AI <comunicacao@comercial.drystore.com.br>',
      to: [user.email],
      subject: subject,
      html: htmlContent,
    });

    if (emailResult.error) {
      console.error('❌ Erro ao enviar email via Resend:', emailResult.error);
      throw emailResult.error;
    }

    console.log('✅ Email enviado com sucesso via Resend:', {
      emailId: emailResult.data?.id,
      to: user.email,
      subject: subject,
      action: email_action_type
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email enviado com sucesso',
        emailId: emailResult.data?.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Erro no send-email-hook:', error);
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