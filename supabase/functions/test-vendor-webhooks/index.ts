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

    // Get all active vendors
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, name, phone_number, whapi_channel_id, token_configured, is_active')
      .eq('is_active', true);

    if (vendorsError) {
      throw new Error(`Error fetching vendors: ${vendorsError.message}`);
    }

    const results = [];

    for (const vendor of vendors) {
      const vendorToken = Deno.env.get(`VENDOR_TOKEN_${vendor.id}`);
      
      let tokenStatus = 'missing';
      let webhookStatus = 'unknown';
      let lastMessage = null;
      
      if (vendorToken) {
        tokenStatus = 'configured';
        
        // Test Whapi connection
        try {
          const whapiResponse = await fetch(`https://gate.whapi.cloud/messages`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${vendorToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (whapiResponse.ok) {
            webhookStatus = 'api_connected';
          } else {
            webhookStatus = `api_error_${whapiResponse.status}`;
          }
        } catch (error) {
          webhookStatus = `api_failed: ${error.message}`;
        }
      }

      // Check last message received
      const { data: lastMessages } = await supabase
        .from('vendor_messages')
        .select('timestamp_whatsapp, content, from_me')
        .eq('vendor_id', vendor.id)
        .order('timestamp_whatsapp', { ascending: false })
        .limit(1);

      if (lastMessages && lastMessages.length > 0) {
        lastMessage = {
          timestamp: lastMessages[0].timestamp_whatsapp,
          content: lastMessages[0].content?.substring(0, 50) + '...',
          from_me: lastMessages[0].from_me
        };
      }

      results.push({
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        phone_number: vendor.phone_number,
        whapi_channel_id: vendor.whapi_channel_id,
        token_status: tokenStatus,
        webhook_status: webhookStatus,
        last_message: lastMessage
      });

      // Log detailed test results
      await supabase.from('system_logs').insert({
        level: 'info',
        source: 'test-vendor-webhooks',
        message: `Vendor webhook test completed`,
        data: {
          vendor_id: vendor.id,
          vendor_name: vendor.name,
          token_status: tokenStatus,
          webhook_status: webhookStatus,
          last_message_date: lastMessage?.timestamp || 'never'
        }
      });
    }

    // Summary log
    const summary = {
      total_vendors: results.length,
      with_tokens: results.filter(r => r.token_status === 'configured').length,
      api_connected: results.filter(r => r.webhook_status === 'api_connected').length,
      with_recent_messages: results.filter(r => r.last_message && 
        new Date(r.last_message.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length
    };

    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'test-vendor-webhooks',
      message: 'Vendor webhook test summary',
      data: summary
    });

    return new Response(JSON.stringify({
      success: true,
      summary,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'test-vendor-webhooks',
      message: 'Test failed',
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