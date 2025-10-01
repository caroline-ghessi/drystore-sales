-- Remove a constraint UNIQUE de firecrawl_job_id
ALTER TABLE public.crawl_jobs 
  DROP CONSTRAINT IF EXISTS crawl_jobs_firecrawl_job_id_key;

-- Permite NULL em firecrawl_job_id (para jobs pendentes)
ALTER TABLE public.crawl_jobs 
  ALTER COLUMN firecrawl_job_id DROP NOT NULL;

-- Adiciona índice não-único para performance
CREATE INDEX IF NOT EXISTS idx_crawl_jobs_firecrawl_job_id 
  ON public.crawl_jobs(firecrawl_job_id) 
  WHERE firecrawl_job_id IS NOT NULL;