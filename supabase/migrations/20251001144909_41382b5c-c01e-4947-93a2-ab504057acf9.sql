-- Criar cron job para processar a fila de mensagens WhatsApp a cada minuto
SELECT cron.schedule(
  'process-queue-worker-every-minute',
  '* * * * *', -- A cada minuto
  $$
  SELECT
    net.http_post(
        url:='https://groqsnnytvjabgeaekkw.supabase.co/functions/v1/process-queue-worker',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyb3Fzbm55dHZqYWJnZWFla2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1OTU3ODcsImV4cCI6MjA2ODE3MTc4N30.HWBJVbSSShx1P8bqa4dvO9jCsCDybt2rhgPPBy8zEVs"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);