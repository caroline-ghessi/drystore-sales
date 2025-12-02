-- Função para limpar logs antigos (mais de 30 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM system_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log da limpeza executada
  INSERT INTO system_logs (level, source, message, data)
  VALUES ('info', 'cleanup_old_logs', 'Old logs cleaned up', 
          jsonb_build_object('deleted_count', deleted_count, 'executed_at', NOW()));
  
  RETURN deleted_count;
END;
$$;