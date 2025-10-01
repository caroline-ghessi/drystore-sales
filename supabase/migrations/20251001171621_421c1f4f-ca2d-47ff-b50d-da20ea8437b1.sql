-- Create crawl_jobs table to track Firecrawl async operations
CREATE TABLE IF NOT EXISTS public.crawl_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firecrawl_job_id TEXT NOT NULL UNIQUE,
  agent_category product_category NOT NULL,
  source_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_pages INTEGER DEFAULT 0,
  processed_pages INTEGER DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'crawl',
  options JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  webhook_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crawl_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Enable all for authenticated users on crawl_jobs"
  ON public.crawl_jobs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_crawl_jobs_firecrawl_id ON public.crawl_jobs(firecrawl_job_id);
CREATE INDEX idx_crawl_jobs_status ON public.crawl_jobs(status);
CREATE INDEX idx_crawl_jobs_category ON public.crawl_jobs(agent_category);

-- Trigger for updated_at
CREATE TRIGGER update_crawl_jobs_updated_at
  BEFORE UPDATE ON public.crawl_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();