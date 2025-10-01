import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-firecrawl-signature',
};

// Supabase setup
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 Webhook received from Firecrawl');

    // Parse webhook payload
    const payload = await req.json();
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    const { type, id: firecrawlJobId, data, status } = payload;

    // Validate webhook type
    if (type !== 'crawl.completed' && type !== 'crawl.failed') {
      console.log(`⚠️ Ignoring webhook type: ${type}`);
      return new Response(JSON.stringify({ message: 'Webhook type not handled' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the job in our database
    const { data: job, error: jobError } = await supabase
      .from('crawl_jobs')
      .select('*')
      .eq('firecrawl_job_id', firecrawlJobId)
      .single();

    if (jobError || !job) {
      console.error('❌ Job not found:', firecrawlJobId, jobError);
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Job found:', job.id);

    // Check if already processed (idempotence)
    if (job.status === 'completed' || job.status === 'failed') {
      console.log('⚠️ Job already processed, skipping');
      return new Response(JSON.stringify({ message: 'Job already processed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle failed crawl
    if (type === 'crawl.failed' || status === 'failed') {
      await supabase
        .from('crawl_jobs')
        .update({
          status: 'failed',
          error_message: payload.error || 'Crawl failed',
          webhook_received_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      console.log('❌ Crawl failed:', payload.error);
      return new Response(JSON.stringify({ message: 'Crawl failed', error: payload.error }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process successful crawl
    if (!data || !Array.isArray(data)) {
      console.error('❌ Invalid data format');
      await supabase
        .from('crawl_jobs')
        .update({
          status: 'failed',
          error_message: 'Invalid data format received from Firecrawl',
          webhook_received_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      return new Response(JSON.stringify({ error: 'Invalid data format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📄 Processing ${data.length} pages`);

    const processedFiles: any[] = [];
    let processedCount = 0;

    // Process each crawled page
    for (const page of data) {
      try {
        const markdown = page.markdown || page.content;
        const pageUrl = page.url || page.metadata?.sourceURL;

        if (!markdown || !pageUrl) {
          console.warn('⚠️ Skipping page without content or URL');
          continue;
        }

        // Generate filename
        const urlObj = new URL(pageUrl);
        const sanitizedPath = urlObj.pathname
          .replace(/^\/+|\/+$/g, '')
          .replace(/\//g, '-')
          .replace(/[^a-zA-Z0-9-_]/g, '_')
          .substring(0, 100);
        const filename = `${sanitizedPath || 'index'}-${Date.now()}.md`;
        const storagePath = `${job.agent_category}/${filename}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('agent-knowledge')
          .upload(storagePath, markdown, {
            contentType: 'text/markdown',
            upsert: false,
          });

        if (uploadError) {
          console.error('❌ Upload error:', uploadError);
          continue;
        }

        console.log('✅ Uploaded:', storagePath);

        // Insert into agent_knowledge_files
        const { data: knowledgeFile, error: insertError } = await supabase
          .from('agent_knowledge_files')
          .insert({
            file_name: filename,
            file_type: 'text/markdown',
            storage_path: storagePath,
            file_size: new TextEncoder().encode(markdown).length,
            agent_category: job.agent_category,
            extracted_content: markdown,
            processing_status: 'pending',
            metadata: {
              source_type: 'web',
              source_url: pageUrl,
              crawl_job_id: job.id,
              firecrawl_job_id: firecrawlJobId,
              crawled_at: new Date().toISOString(),
            },
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Insert error:', insertError);
          continue;
        }

        processedFiles.push(knowledgeFile);
        processedCount++;

        // Invoke generate-embeddings in background
        supabase.functions
          .invoke('generate-embeddings', {
            body: { fileId: knowledgeFile.id },
          })
          .then(() => console.log('✅ Embeddings generation triggered for:', knowledgeFile.id))
          .catch((err) => console.error('❌ Failed to trigger embeddings:', err));
      } catch (pageError) {
        console.error('❌ Error processing page:', pageError);
      }
    }

    // Update job status
    await supabase
      .from('crawl_jobs')
      .update({
        status: 'completed',
        processed_pages: processedCount,
        total_pages: data.length,
        webhook_received_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    console.log(`✅ Webhook processed successfully: ${processedCount}/${data.length} pages`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        processedFiles: processedCount,
        totalPages: data.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
