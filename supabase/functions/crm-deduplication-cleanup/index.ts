import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DuplicateGroup {
  customer_phone: string;
  vendor_id: string;
  product_category: string | null;
  opportunity_ids: string[];
  oldest_id: string;
  duplicates_to_remove: string[];
}

interface CleanupResult {
  groups_processed: number;
  duplicates_removed: number;
  duplicates_kept: number;
  logs_created: number;
  errors: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { mode = 'preview', limit = 100 } = await req.json().catch(() => ({}));

    console.log(`[CRM Deduplication] Starting cleanup - mode: ${mode}, limit: ${limit}`);

    // Step 1: Find duplicate groups (same phone + same vendor - ignoring category)
    const { data: rawOpportunities, error: fetchError } = await supabase
      .from('crm_opportunities')
      .select(`
        id,
        title,
        product_category,
        vendor_id,
        stage,
        value,
        created_at,
        duplicate_of_id,
        customer:crm_customers!inner(phone, name)
      `)
      .is('duplicate_of_id', null)
      .not('stage', 'in', '("closed_won","closed_lost")')
      .order('created_at', { ascending: true })
      .limit(10000);

    if (fetchError) {
      throw new Error(`Failed to fetch opportunities: ${fetchError.message}`);
    }

    console.log(`[CRM Deduplication] Fetched ${rawOpportunities?.length || 0} active opportunities`);

    // Group by phone + vendor_id only (ignoring product_category)
    const groups = new Map<string, typeof rawOpportunities>();
    
    for (const opp of rawOpportunities || []) {
      const phone = (opp.customer as any)?.phone;
      if (!phone || !opp.vendor_id) continue;
      
      // KEY CHANGE: Ignore product_category in grouping
      const key = `${phone}|${opp.vendor_id}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(opp);
    }

    // Filter to only groups with duplicates
    const duplicateGroups: DuplicateGroup[] = [];
    
    for (const [key, opps] of groups.entries()) {
      if (opps.length > 1) {
        const [phone, vendor_id] = key.split('|');
        const sortedOpps = opps.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // Get category from oldest, or first one with a defined category
        const keepOpp = sortedOpps[0];
        const definedCategory = sortedOpps.find(o => o.product_category)?.product_category || keepOpp.product_category;
        
        duplicateGroups.push({
          customer_phone: phone,
          vendor_id: vendor_id,
          product_category: definedCategory,
          opportunity_ids: sortedOpps.map(o => o.id),
          oldest_id: sortedOpps[0].id,
          duplicates_to_remove: sortedOpps.slice(1).map(o => o.id)
        });
      }
    }

    console.log(`[CRM Deduplication] Found ${duplicateGroups.length} duplicate groups`);

    // Limit processing
    const groupsToProcess = duplicateGroups.slice(0, limit);
    
    const result: CleanupResult = {
      groups_processed: 0,
      duplicates_removed: 0,
      duplicates_kept: groupsToProcess.length,
      logs_created: 0,
      errors: []
    };

    // Preview mode - just return what would be cleaned
    if (mode === 'preview') {
      const preview = groupsToProcess.map(g => ({
        customer_phone: g.customer_phone,
        vendor_id: g.vendor_id,
        product_category: g.product_category,
        total_in_group: g.opportunity_ids.length,
        will_keep: g.oldest_id,
        will_remove: g.duplicates_to_remove,
        will_remove_count: g.duplicates_to_remove.length
      }));

      return new Response(
        JSON.stringify({
          success: true,
          mode: 'preview',
          total_duplicate_groups: duplicateGroups.length,
          groups_in_preview: preview.length,
          total_duplicates_to_remove: preview.reduce((sum, g) => sum + g.will_remove_count, 0),
          preview
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute mode - actually clean up
    for (const group of groupsToProcess) {
      try {
        // Mark duplicates as removed by setting duplicate_of_id
        for (const duplicateId of group.duplicates_to_remove) {
          const { error: updateError } = await supabase
            .from('crm_opportunities')
            .update({
              duplicate_of_id: group.oldest_id,
              validation_status: 'duplicate_removed',
              updated_at: new Date().toISOString()
            })
            .eq('id', duplicateId);

          if (updateError) {
            result.errors.push(`Failed to update ${duplicateId}: ${updateError.message}`);
            continue;
          }

          // Log the action
          const { error: logError } = await supabase
            .from('crm_opportunity_match_log')
            .insert({
              vendor_id: group.vendor_id,
              customer_phone: group.customer_phone,
              product_category: group.product_category,
              source: 'cleanup_batch',
              decision: 'cleanup_duplicate_removed',
              decided_by: 'system:crm-deduplication-cleanup',
              confidence: 1.0,
              existing_opportunity_id: group.oldest_id,
              new_opportunity_id: duplicateId,
              reasoning: `Duplicata identificada via limpeza em lote. Mantido: ${group.oldest_id}`,
              metadata: {
                cleanup_batch: true,
                group_size: group.opportunity_ids.length,
                removed_at: new Date().toISOString()
              }
            });

          if (logError) {
            console.warn(`Failed to log action for ${duplicateId}: ${logError.message}`);
          } else {
            result.logs_created++;
          }

          result.duplicates_removed++;
        }

        result.groups_processed++;
      } catch (groupError) {
        result.errors.push(`Error processing group ${group.customer_phone}: ${groupError}`);
      }
    }

    console.log(`[CRM Deduplication] Cleanup complete:`, result);

    return new Response(
      JSON.stringify({
        success: true,
        mode: 'execute',
        ...result,
        remaining_groups: duplicateGroups.length - groupsToProcess.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CRM Deduplication] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
