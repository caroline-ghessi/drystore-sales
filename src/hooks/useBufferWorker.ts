import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const WORKER_INTERVAL = 60000; // 60 segundos

export function useBufferWorker() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const processBuffers = async () => {
      // Evitar execuções simultâneas
      if (isProcessingRef.current) {
        console.log('[BufferWorker] Already processing, skipping...');
        return;
      }

      try {
        isProcessingRef.current = true;
        console.log('[BufferWorker] Checking for pending buffers...');

        const { data, error } = await supabase.functions.invoke('process-pending-buffers', {
          body: {}
        });

        if (error) {
          console.error('[BufferWorker] Error invoking worker:', error);
          return;
        }

        if (data?.stats?.processed > 0) {
          console.log(`[BufferWorker] Processed ${data.stats.processed} buffers`);
        } else {
          console.log('[BufferWorker] No buffers to process');
        }

      } catch (error) {
        console.error('[BufferWorker] Exception in worker:', error);
      } finally {
        isProcessingRef.current = false;
      }
    };

    // Executar imediatamente ao montar (após 5 segundos)
    const initialTimeout = setTimeout(() => {
      processBuffers();
    }, 5000);

    // Configurar intervalo para execuções periódicas
    intervalRef.current = setInterval(processBuffers, WORKER_INTERVAL);

    console.log('[BufferWorker] Worker started - will run every 60 seconds');

    // Cleanup
    return () => {
      if (initialTimeout) clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('[BufferWorker] Worker stopped');
      }
    };
  }, []);

  // Função para forçar processamento manual
  const processNow = async () => {
    if (isProcessingRef.current) {
      console.log('[BufferWorker] Already processing');
      return { success: false, message: 'Already processing' };
    }

    try {
      isProcessingRef.current = true;
      console.log('[BufferWorker] Manual processing triggered');

      const { data, error } = await supabase.functions.invoke('process-pending-buffers', {
        body: {}
      });

      if (error) {
        console.error('[BufferWorker] Error in manual processing:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('[BufferWorker] Exception in manual processing:', error);
      return { success: false, error };
    } finally {
      isProcessingRef.current = false;
    }
  };

  return { processNow };
}
