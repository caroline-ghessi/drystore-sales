import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔄 Starting product catalog synchronization...');
  
  const syncStarted = new Date().toISOString();
  let syncLog = {
    sync_started_at: syncStarted,
    status: 'running',
    total_products: 0,
    error_message: null as string | null
  };

  try {
    // 1. Forçar fetch do XML atualizado
    console.log('📥 Fetching fresh product catalog...');
    const catalogResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/fetch-product-catalog`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ forceRefresh: true, query: '' })
      }
    );

    if (!catalogResponse.ok) {
      throw new Error('Failed to fetch product catalog');
    }

    const catalogData = await catalogResponse.json();
    console.log(`✅ Fetched ${catalogData.totalProducts} products`);
    
    syncLog.total_products = catalogData.totalProducts;

    // 2. Criar/Atualizar arquivo na base de conhecimento
    const fileName = `catalogo-produtos-drystore-${new Date().toISOString().split('T')[0]}.json`;
    const productText = catalogData.products
      .map((p: any) => `${p.name} - ${p.brand} - R$ ${p.price.toFixed(2)} - ${p.category} - SKU: ${p.sku}`)
      .join('\n');

    // Upload do catálogo como arquivo de conhecimento
    const fileBlob = new Blob([productText], { type: 'text/plain' });
    const storagePath = `ferramentas/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('agent-knowledge')
      .upload(storagePath, fileBlob, {
        contentType: 'text/plain',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      throw uploadError;
    }

    console.log('✅ Catalog uploaded to storage');

    // 3. Criar registro na tabela agent_knowledge_files
    const { data: fileRecord, error: insertError } = await supabase
      .from('agent_knowledge_files')
      .insert({
        file_name: fileName,
        file_type: 'text/plain',
        storage_path: storagePath,
        file_size: fileBlob.size,
        agent_category: 'ferramentas',
        extracted_content: productText,
        processing_status: 'pending',
        metadata: {
          source: 'xml_sync',
          total_products: catalogData.totalProducts,
          last_update: catalogData.lastUpdate,
          sync_timestamp: syncStarted
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      throw insertError;
    }

    console.log(`✅ Knowledge file created: ${fileRecord.id}`);

    // 4. Gerar embeddings
    console.log('🧠 Generating embeddings...');
    const embeddingResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-embeddings`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId: fileRecord.id,
          generateChunks: true
        })
      }
    );

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      throw new Error(`Embedding generation failed: ${errorText}`);
    }

    const embeddingResult = await embeddingResponse.json();
    console.log('✅ Embeddings generated:', embeddingResult);

    // 5. Log de sucesso
    syncLog.status = 'completed';
    
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'sync-product-catalog',
      message: 'Product catalog synchronized successfully',
      data: syncLog
    });

    console.log('✅ Synchronization completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Catalog synchronized successfully',
      totalProducts: syncLog.total_products,
      fileId: fileRecord.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Synchronization failed:', error);
    
    syncLog.status = 'failed';
    syncLog.error_message = error instanceof Error ? error.message : String(error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'sync-product-catalog',
      message: 'Product catalog synchronization failed',
      data: syncLog
    });

    return new Response(JSON.stringify({
      success: false,
      error: syncLog.error_message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
