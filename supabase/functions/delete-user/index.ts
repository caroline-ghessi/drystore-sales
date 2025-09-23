import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteUserRequest {
  userId: string;
  deleteType: 'soft' | 'hard';
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

    const { userId, deleteType = 'soft' }: DeleteUserRequest = await req.json();

    console.log('🗑️ Delete user request:', { userId, deleteType });

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

    if (deleteType === 'soft') {
      // Soft delete: apenas desativar o usuário
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (profileError) {
        throw profileError;
      }

      console.log('✅ User soft deleted successfully');
      return new Response(
        JSON.stringify({ success: true, message: 'User deactivated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // Hard delete: remover completamente
      
      // 1. Deletar roles
      await supabaseClient
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // 2. Deletar profile
      await supabaseClient
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      // 3. Deletar do auth (usando service role)
      const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(userId);
      
      if (authDeleteError) {
        throw authDeleteError;
      }

      console.log('✅ User hard deleted successfully');
      return new Response(
        JSON.stringify({ success: true, message: 'User deleted permanently' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});