import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CancelInviteRequest {
  email: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email }: CancelInviteRequest = await req.json();

    console.log('🚫 Cancel invite request:', { email });

    // Verificar permissões do usuário que está fazendo a requisição
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o usuário tem permissão de admin
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar usuário por email no auth
    const { data: users } = await supabaseClient.auth.admin.listUsers();
    const targetUser = users.users.find(u => u.email === email);

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o convite ainda está pendente (email não confirmado)
    if (targetUser.email_confirmed_at) {
      return new Response(
        JSON.stringify({ error: 'Invite already accepted, cannot cancel' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deletar usuário do auth (cancela o convite)
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(targetUser.id);
    
    if (deleteError) {
      throw deleteError;
    }

    // Deletar profile se existir
    await supabaseClient
      .from('profiles')
      .delete()
      .eq('user_id', targetUser.id);

    // Deletar roles se existirem
    await supabaseClient
      .from('user_roles')
      .delete()
      .eq('user_id', targetUser.id);

    console.log('✅ Invite cancelled successfully');
    return new Response(
      JSON.stringify({ success: true, message: 'Invite cancelled successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error cancelling invite:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});