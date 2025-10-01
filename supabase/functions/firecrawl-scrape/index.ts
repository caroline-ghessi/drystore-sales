import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Verificar variáveis de ambiente
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables');
}

console.log('🔧 Environment variables check:', {
  hasSupabaseUrl: !!supabaseUrl,
  hasSupabaseKey: !!supabaseServiceKey,
  hasFirecrawlKey: !!firecrawlApiKey,
  supabaseUrlPreview: supabaseUrl?.substring(0, 20) + '...',
  firecrawlKeyPreview: firecrawlApiKey?.substring(0, 10) + '...'
});

Deno.serve(async (req) => {
  console.log('🚀 Function started - method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Processing Firecrawl request');
    const { url, agentCategory, mode, options = {} } = await req.json();

    // Validation
    if (!url || !agentCategory) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: url and agentCategory',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured in environment variables');
    }

    console.log(`📝 Mode: ${mode}, Category: ${agentCategory}, URL: ${url}`);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For CRAWL mode: use webhook approach (async)
    if (mode === 'crawl') {
      console.log('🕷️ Starting async crawl with webhook');

      // Generate webhook URL
      const webhookUrl = `${supabaseUrl}/functions/v1/firecrawl-webhook`;
      console.log('🔗 Webhook URL:', webhookUrl);

      // Create job record BEFORE calling Firecrawl
      const { data: job, error: jobError } = await supabase
        .from('crawl_jobs')
        .insert({
          firecrawl_job_id: 'pending', // Will be updated after Firecrawl response
          agent_category: agentCategory,
          source_url: url,
          status: 'pending',
          mode: 'crawl',
          options: options || {},
        })
        .select()
        .single();

      if (jobError || !job) {
        console.error('❌ Failed to create job:', jobError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to create crawl job',
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log('✅ Job created:', job.id);

      // Prepare Firecrawl crawl payload
      const crawlPayload: any = {
        url,
        formats: ['markdown'],
        webhook: webhookUrl,
      };

      // Add optional crawl parameters
      if (options.maxDepth) {
        crawlPayload.limit = options.maxDepth;
      }
      if (options.includePatterns && options.includePatterns.length > 0) {
        crawlPayload.includePaths = options.includePatterns;
      }
      if (options.excludePatterns && options.excludePatterns.length > 0) {
        crawlPayload.excludePaths = options.excludePatterns;
      }

      console.log('🚀 Calling Firecrawl crawl API with webhook');

      // Call Firecrawl /v2/crawl endpoint
      const firecrawlResponse = await fetch('https://api.firecrawl.dev/v2/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firecrawlApiKey}`,
        },
        body: JSON.stringify(crawlPayload),
      });

      const firecrawlData = await firecrawlResponse.json();
      console.log('📦 Firecrawl response:', JSON.stringify(firecrawlData, null, 2));

      if (!firecrawlResponse.ok) {
        console.error('❌ Firecrawl API error:', firecrawlData);
        
        // Update job status to failed
        await supabase
          .from('crawl_jobs')
          .update({
            status: 'failed',
            error_message: firecrawlData.error || 'Firecrawl API error',
          })
          .eq('id', job.id);

        return new Response(
          JSON.stringify({
            success: false,
            error: firecrawlData.error || 'Firecrawl API request failed',
          }),
          {
            status: firecrawlResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Extract Firecrawl job ID from response
      const firecrawlJobId = firecrawlData.id;
      if (!firecrawlJobId) {
        console.error('❌ No job ID in Firecrawl response');
        
        await supabase
          .from('crawl_jobs')
          .update({
            status: 'failed',
            error_message: 'No job ID received from Firecrawl',
          })
          .eq('id', job.id);

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid response from Firecrawl',
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Update job with Firecrawl job ID
      await supabase
        .from('crawl_jobs')
        .update({
          firecrawl_job_id: firecrawlJobId,
          status: 'processing',
        })
        .eq('id', job.id);

      console.log('✅ Crawl job started:', firecrawlJobId);

      // Return immediate response (202 Accepted)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Crawl job started. You will be notified when complete.',
          jobId: job.id,
          firecrawlJobId: firecrawlJobId,
          status: 'processing',
        }),
        {
          status: 202,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // For SCRAPE mode: synchronous processing (immediate response)
    console.log('📄 Starting synchronous scrape');

    const scrapePayload = {
      url,
      formats: ['markdown'],
    };

    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`,
      },
      body: JSON.stringify(scrapePayload),
    });

    const firecrawlData = await firecrawlResponse.json();

    if (!firecrawlResponse.ok) {
      console.error('❌ Firecrawl API error:', firecrawlData);
      return new Response(
        JSON.stringify({
          success: false,
          error: firecrawlData.error || 'Firecrawl API request failed',
        }),
        {
          status: firecrawlResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract markdown from response
    const markdown = firecrawlData.data?.markdown || firecrawlData.data?.content;
    if (!markdown) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No content returned from Firecrawl',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate filename
    const urlObj = new URL(url);
    const sanitizedPath = urlObj.pathname
      .replace(/^\/+|\/+$/g, '')
      .replace(/\//g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 100);
    const filename = `${sanitizedPath || 'index'}-${Date.now()}.md`;
    const storagePath = `${agentCategory}/${filename}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('agent-knowledge')
      .upload(storagePath, markdown, {
        contentType: 'text/markdown',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to upload file: ${uploadError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert into agent_knowledge_files
    const { data: knowledgeFile, error: insertError } = await supabase
      .from('agent_knowledge_files')
      .insert({
        file_name: filename,
        file_type: 'text/markdown',
        storage_path: storagePath,
        file_size: new TextEncoder().encode(markdown).length,
        agent_category: agentCategory,
        extracted_content: markdown,
        processing_status: 'pending',
        metadata: {
          source_type: 'web',
          source_url: url,
          scraped_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to insert file record: ${insertError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Trigger embeddings generation in background
    supabase.functions
      .invoke('generate-embeddings', {
        body: { fileId: knowledgeFile.id },
      })
      .then(() => console.log('✅ Embeddings generation triggered'))
      .catch((err) => console.error('❌ Failed to trigger embeddings:', err));

    console.log('✅ Scrape completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully scraped page',
        processedFiles: 1,
        files: [knowledgeFile],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Firecrawl processing error:', error);
    
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    console.error('❌ Error name:', errorInstance.name);
    console.error('❌ Error message:', errorInstance.message);
    console.error('❌ Error stack:', errorInstance.stack);
    
    // Log adicional para debug
    console.error('❌ Request URL:', req.url);
    console.error('❌ Request method:', req.method);
    
    let errorMessage = 'Unknown error occurred';
    let errorDetails = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack
      };
    } else {
      errorMessage = String(error);
    }
    
    // Resposta de erro melhorada
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      errorDetails,
      timestamp: new Date().toISOString(),
      endpoint: 'firecrawl-scrape',
      debug: {
        hasFirecrawlKey: !!firecrawlApiKey,
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseServiceKey
      }
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});