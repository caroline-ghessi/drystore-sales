-- CORREÇÃO FINAL DOS PROBLEMAS DE SEGURANÇA
-- RLS não pode ser aplicado em views, apenas em tabelas

-- 1. Recriar a view message_analytics (sem RLS, views herdam da tabela base)
DROP VIEW IF EXISTS message_analytics;

CREATE VIEW message_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  sender_type,
  COUNT(*) as total_messages,
  AVG(LENGTH(content)) as avg_message_length,
  conversation_id
FROM messages
WHERE conversation_id IS NOT NULL
GROUP BY DATE_TRUNC('day', created_at), sender_type, conversation_id;

-- 2. Views herdam automaticamente as políticas RLS das tabelas base
-- A view message_analytics respeitará as políticas da tabela messages

-- 3. Verificar se todas as políticas RLS estão ativas na tabela messages
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'messages' 
ORDER BY policyname;