import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCategory } from '@/types/bot.types';

export interface CrawlJob {
  id: string;
  firecrawl_job_id: string;
  agent_category: ProductCategory;
  source_url: string;
  status: string;
  total_pages: number;
  processed_pages: number;
  mode: string;
  options: any;
  error_message: string | null;
  webhook_received_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useCrawlJobs = (agentCategory?: ProductCategory) => {
  return useQuery({
    queryKey: ['crawl-jobs', agentCategory],
    queryFn: async () => {
      let query = supabase
        .from('crawl_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (agentCategory) {
        query = query.eq('agent_category', agentCategory);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as CrawlJob[];
    },
    refetchInterval: (query) => {
      // Refetch every 5 seconds if there are pending or processing jobs
      const hasPendingJobs = query.state.data?.some(
        (job) => job.status === 'pending' || job.status === 'processing'
      );
      return hasPendingJobs ? 5000 : false;
    },
  });
};

export const useCrawlJob = (jobId: string) => {
  return useQuery({
    queryKey: ['crawl-job', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crawl_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        throw error;
      }

      return data as CrawlJob;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Refetch every 5 seconds until job is completed or failed
      const status = query.state.data?.status;
      return status === 'pending' || status === 'processing' ? 5000 : false;
    },
  });
};
