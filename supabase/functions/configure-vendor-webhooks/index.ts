import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { vendor_id, action } = await req.json();

    if (!vendor_id) {
      return new Response(JSON.stringify({ error: 'vendor_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get vendor details
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, name, phone_number, whapi_channel_id')
      .eq('id', vendor_id)
      .single();

    if (vendorError || !vendor) {
      return new Response(JSON.stringify({ error: 'Vendor not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const vendorToken = Deno.env.get(`VENDOR_TOKEN_${vendor.id}`);
    if (!vendorToken) {
      return new Response(JSON.stringify({ error: 'Vendor token not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const webhookUrl = `https://groqsnnytvjabgeaekkw.supabase.co/functions/v1/vendor-whatsapp-webhook`;

    if (action === 'configure') {
      // Configure webhook on Whapi
      const whapiResponse = await fetch(`https://gate.whapi.cloud/settings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${vendorToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhooks: [{
            url: webhookUrl,
            events: ['messages', 'statuses'],
            mode: 'method'
          }]
        })
      });

      if (!whapiResponse.ok) {
        const errorText = await whapiResponse.text();
        throw new Error(`Whapi webhook configuration failed: ${whapiResponse.status} - ${errorText}`);
      }

      const result = await whapiResponse.json();

      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'configure-vendor-webhooks',
        message: 'Webhook configured successfully',
        data: {
          vendor_id: vendor.id,
          vendor_name: vendor.name,
          webhook_url: webhookUrl,
          whapi_response: result
        }
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Webhook configured successfully',
        vendor: {
          id: vendor.id,
          name: vendor.name,
          webhook_url: webhookUrl
        },
        whapi_response: result
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'test') {
      // Test webhook by sending a test message
      const testMessage = `🔧 Teste de conectividade do sistema de monitoramento - ${new Date().toLocaleString('pt-BR')}`;
      
      // Send test message to vendor's own number
      const sendResponse = await fetch(`https://gate.whapi.cloud/messages/text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vendorToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: vendor.phone_number,
          body: testMessage
        })
      });

      if (!sendResponse.ok) {
        const errorText = await sendResponse.text();
        throw new Error(`Test message send failed: ${sendResponse.status} - ${errorText}`);
      }

      const sendResult = await sendResponse.json();

      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'configure-vendor-webhooks',
        message: 'Test message sent',
        data: {
          vendor_id: vendor.id,
          vendor_name: vendor.name,
          message_id: sendResult.id,
          test_message: testMessage
        }
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Test message sent successfully',
        vendor: {
          id: vendor.id,
          name: vendor.name,
          phone: vendor.phone_number
        },
        test_result: sendResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'status') {
      // Get webhook status from Whapi
      const statusResponse = await fetch(`https://gate.whapi.cloud/settings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${vendorToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        throw new Error(`Status check failed: ${statusResponse.status} - ${errorText}`);
      }

      const statusResult = await statusResponse.json();

      return new Response(JSON.stringify({
        success: true,
        vendor: {
          id: vendor.id,
          name: vendor.name,
          whapi_channel_id: vendor.whapi_channel_id
        },
        webhook_status: statusResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action. Use: configure, test, or status' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'configure-vendor-webhooks',
      message: 'Configuration failed',
      data: { error: error.message }
    });

    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});