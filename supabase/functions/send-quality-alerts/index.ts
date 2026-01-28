import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QualityAlert {
  id: string;
  vendor_id: string;
  analysis_id: string | null;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  resolved: boolean;
  notified_at: string | null;
}

interface VendorInfo {
  id: string;
  name: string;
}

interface AnalysisInfo {
  quality_score: number;
  criteria_scores: Record<string, unknown>;
  conversation_id: number;
}

interface ConversationInfo {
  customer_name: string | null;
  customer_phone: string;
  metadata?: { is_internal_contact?: boolean } | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { alertType, targetPhone } = await req.json();

    if (!alertType || !targetPhone) {
      return new Response(
        JSON.stringify({ error: 'alertType e targetPhone são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const leadBotToken = Deno.env.get('LEAD_BOT_WHAPI_TOKEN');
    if (!leadBotToken) {
      return new Response(
        JSON.stringify({ error: 'LEAD_BOT_WHAPI_TOKEN não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-quality-alerts] Iniciando envio de alertas. Tipo: ${alertType}, Destino: ${targetPhone}`);

    let alerts: QualityAlert[] = [];
    let messageText = '';

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');

    if (alertType === 'critical') {
      // Buscar alertas críticos não notificados das últimas 24h
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('quality_alerts')
        .select('*')
        .in('severity', ['critical', 'high'])
        .eq('resolved', false)
        .is('notified_at', null)
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar alertas: ${error.message}`);
      }

      alerts = data || [];

      if (alerts.length === 0) {
        console.log('[send-quality-alerts] Nenhum alerta crítico pendente');
        return new Response(
          JSON.stringify({ message: 'Nenhum alerta crítico pendente', sent: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Agrupar alertas por vendedor
      const alertsByVendor: Record<string, QualityAlert[]> = {};
      for (const alert of alerts) {
        if (!alertsByVendor[alert.vendor_id]) {
          alertsByVendor[alert.vendor_id] = [];
        }
        alertsByVendor[alert.vendor_id].push(alert);
      }

      // Buscar nomes dos vendedores
      const vendorIds = Object.keys(alertsByVendor);
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id, name')
        .in('id', vendorIds);

      const vendorMap: Record<string, string> = {};
      (vendors || []).forEach((v: VendorInfo) => {
        vendorMap[v.id] = v.name;
      });

      // Construir mensagem
      messageText = `🔴 *ALERTAS CRÍTICOS DE QUALIDADE*\n\n📅 Data: ${formattedDate}\n\n`;

      for (const [vendorId, vendorAlerts] of Object.entries(alertsByVendor)) {
        const vendorName = vendorMap[vendorId] || 'Vendedor Desconhecido';
        messageText += `⚠️ *VENDEDOR: ${vendorName}*\n`;

        for (const alert of vendorAlerts) {
          // Buscar dados da análise se disponível
          let score = 'N/A';
          let customerName = 'Cliente';
          
          if (alert.analysis_id) {
            const { data: analysis } = await supabase
              .from('vendor_quality_analysis')
              .select('quality_score, criteria_scores, conversation_id')
              .eq('id', alert.analysis_id)
              .single();

            if (analysis) {
              // Buscar conversa para verificar se é contato interno
              const { data: conversation } = await supabase
                .from('vendor_conversations')
                .select('customer_name, customer_phone, metadata')
                .eq('id', (analysis as AnalysisInfo).conversation_id)
                .single();

              // SKIP alertas de contatos internos
              if (conversation?.metadata?.is_internal_contact) {
                console.log(`[send-quality-alerts] Skipping alert for internal contact: ${(analysis as AnalysisInfo).conversation_id}`);
                continue;
              }

              score = `${(analysis as AnalysisInfo).quality_score}/100`;
              
              if (conversation) {
                customerName = (conversation as ConversationInfo).customer_name || 
                  `Cliente (${(conversation as ConversationInfo).customer_phone.slice(-4)})`;
              }
            }
          }

          messageText += `• Cliente: ${customerName}\n`;
          messageText += `  Score: ${score}\n`;
          messageText += `  Problema: ${alert.description || alert.alert_type}\n\n`;
        }
      }

      messageText += `Total: ${alerts.length} atendimento(s) crítico(s)\n`;
      messageText += `⚡ Ação requerida: Intervenção urgente`;

    } else if (alertType === 'weekly') {
      // Buscar alertas médios (amarelos) da última semana
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekStart = new Date(weekAgo);
      weekStart.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('quality_alerts')
        .select('*')
        .eq('severity', 'medium')
        .eq('resolved', false)
        .is('notified_at', null)
        .gte('created_at', weekStart.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar alertas: ${error.message}`);
      }

      alerts = data || [];

      if (alerts.length === 0) {
        console.log('[send-quality-alerts] Nenhum alerta de atenção na semana');
        return new Response(
          JSON.stringify({ message: 'Nenhum alerta de atenção na semana', sent: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Agrupar por vendedor e calcular médias
      const vendorStats: Record<string, { 
        alerts: QualityAlert[]; 
        scores: number[]; 
        issues: Record<string, number>;
      }> = {};

      for (const alert of alerts) {
        if (!vendorStats[alert.vendor_id]) {
          vendorStats[alert.vendor_id] = { alerts: [], scores: [], issues: {} };
        }
        vendorStats[alert.vendor_id].alerts.push(alert);
        
        const issueType = alert.alert_type || 'Outros';
        vendorStats[alert.vendor_id].issues[issueType] = 
          (vendorStats[alert.vendor_id].issues[issueType] || 0) + 1;

        // Buscar score da análise
        if (alert.analysis_id) {
          const { data: analysis } = await supabase
            .from('vendor_quality_analysis')
            .select('quality_score')
            .eq('id', alert.analysis_id)
            .single();

          if (analysis) {
            vendorStats[alert.vendor_id].scores.push((analysis as { quality_score: number }).quality_score);
          }
        }
      }

      // Buscar nomes dos vendedores
      const vendorIds = Object.keys(vendorStats);
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id, name')
        .in('id', vendorIds);

      const vendorMap: Record<string, string> = {};
      (vendors || []).forEach((v: VendorInfo) => {
        vendorMap[v.id] = v.name;
      });

      // Formatar datas da semana
      const weekEndFormatted = now.toLocaleDateString('pt-BR');
      const weekStartFormatted = weekStart.toLocaleDateString('pt-BR');

      messageText = `📊 *ACOMPANHAMENTO SEMANAL DE QUALIDADE*\n\n`;
      messageText += `📅 Semana: ${weekStartFormatted} a ${weekEndFormatted}\n\n`;
      messageText += `🟡 *ALERTAS DE ATENÇÃO*\n\n`;

      for (const [vendorId, stats] of Object.entries(vendorStats)) {
        const vendorName = vendorMap[vendorId] || 'Vendedor Desconhecido';
        const avgScore = stats.scores.length > 0 
          ? Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length)
          : 'N/A';

        // Encontrar principal problema
        const mainIssue = Object.entries(stats.issues)
          .sort(([,a], [,b]) => b - a)[0];

        messageText += `*VENDEDOR: ${vendorName}*\n`;
        messageText += `• ${stats.alerts.length} atendimento(s) com pontuação média\n`;
        messageText += `• Score médio: ${avgScore}/100\n`;
        messageText += `• Principal ponto: ${mainIssue ? mainIssue[0] : 'Vários'}\n\n`;
      }

      messageText += `📈 Recomendação: Treinamento em técnicas SPIN e acompanhamento`;

    } else {
      return new Response(
        JSON.stringify({ error: 'alertType inválido. Use "critical" ou "weekly"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enviar mensagem via WHAPI
    console.log(`[send-quality-alerts] Enviando mensagem para ${targetPhone}...`);
    
    const whapiResponse = await fetch('https://gate.whapi.cloud/messages/text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${leadBotToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: targetPhone,
        body: messageText
      }),
    });

    const whapiData = await whapiResponse.json();

    if (!whapiResponse.ok) {
      throw new Error(`Erro na WHAPI: ${whapiData.message || JSON.stringify(whapiData)}`);
    }

    console.log(`[send-quality-alerts] Mensagem enviada com sucesso. ID: ${whapiData.id}`);

    // Marcar alertas como notificados
    const alertIds = alerts.map(a => a.id);
    const { error: updateError } = await supabase
      .from('quality_alerts')
      .update({ notified_at: now.toISOString() })
      .in('id', alertIds);

    if (updateError) {
      console.error('[send-quality-alerts] Erro ao atualizar notified_at:', updateError);
    }

    // Log do envio
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'send-quality-alerts',
      message: `Alertas ${alertType} enviados com sucesso`,
      data: {
        alert_type: alertType,
        target_phone: targetPhone,
        alerts_count: alerts.length,
        whapi_message_id: whapiData.id
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `${alerts.length} alerta(s) enviado(s) com sucesso`,
        sent: true,
        alerts_count: alerts.length,
        whapi_message_id: whapiData.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[send-quality-alerts] Erro:', errorMessage);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'send-quality-alerts',
      message: 'Erro ao enviar alertas de qualidade',
      data: { error: errorMessage }
    });

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
