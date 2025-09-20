-- CORREÇÃO DOS PROBLEMAS DE SEGURANÇA DETECTADOS PELO LINTER
-- Relacionados à implementação RLS da tabela messages

-- 1. Corrigir a view message_analytics removendo security_barrier
-- que estava causando o erro "Security Definer View"
DROP VIEW IF EXISTS message_analytics;

-- Recriar a view sem security_barrier
CREATE VIEW message_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  sender_type,
  COUNT(*) as total_messages,
  AVG(LENGTH(content)) as avg_message_length,
  conversation_id
FROM messages
GROUP BY DATE_TRUNC('day', created_at), sender_type, conversation_id;

-- 2. A função log_message_access já tem search_path definido corretamente
-- Não precisa alteração

-- 3. Adicionar política RLS para a view message_analytics
-- Usuários podem ver analytics apenas das conversas que têm acesso
CREATE POLICY "Users can view message analytics for accessible conversations"
ON message_analytics FOR SELECT
TO authenticated
USING (
  -- Admins e supervisors podem ver tudo
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role) OR
  -- Atendentes podem ver analytics das conversas atribuídas
  (has_role(auth.uid(), 'atendente'::app_role) AND
   conversation_id IN (
     SELECT id FROM conversations 
     WHERE assigned_agent_id = auth.uid() 
        OR current_agent_id = auth.uid()
   )) OR
  -- Vendedores podem ver analytics das conversas com propostas
  (has_role(auth.uid(), 'vendedor'::app_role) AND
   conversation_id IN (
     SELECT conversation_id FROM proposals WHERE created_by = auth.uid()
   ))
);

-- Habilitar RLS na view
ALTER VIEW message_analytics ENABLE ROW LEVEL SECURITY;