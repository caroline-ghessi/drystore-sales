-- IMPLEMENTAÇÃO RLS PARA TABELA MESSAGES
-- Seguindo o plano de segurança elaborado

-- 1. Verificar políticas existentes
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'messages';

-- 2. Remover política permissiva atual
DROP POLICY IF EXISTS "Enable all for authenticated users" ON messages;
DROP POLICY IF EXISTS "Enable all for system" ON messages;

-- 3. FASE 2: IMPLEMENTAR POLÍTICAS RLS GRANULARES

-- 3.1 Política para Admins e Supervisores (acesso completo)
CREATE POLICY "Admins and supervisors can access all messages"
ON messages FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));

-- 3.2 Políticas para Atendentes (conversas atribuídas)
CREATE POLICY "Atendentes can read messages from assigned conversations"
ON messages FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'atendente'::app_role) AND
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE assigned_agent_id = auth.uid() 
       OR current_agent_id = auth.uid()
       OR status IN ('waiting', 'in_bot')
  )
);

CREATE POLICY "Atendentes can create messages in assigned conversations"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'atendente'::app_role) AND
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE assigned_agent_id = auth.uid() 
       OR current_agent_id = auth.uid()
       OR status IN ('waiting', 'in_bot')
  )
);

CREATE POLICY "Atendentes can update messages in assigned conversations"
ON messages FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'atendente'::app_role) AND
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE assigned_agent_id = auth.uid() 
       OR current_agent_id = auth.uid()
  )
);

-- 3.3 Política para Vendedores (acesso limitado para contexto de propostas)
CREATE POLICY "Vendors can read messages for proposal context"
ON messages FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'vendedor'::app_role) AND
  conversation_id IN (
    SELECT conversation_id FROM proposals WHERE created_by = auth.uid()
  )
);

-- 4. FASE 5: AUDITORIA E MONITORAMENTO

-- 4.1 Tabela de log de acesso a mensagens
CREATE TABLE IF NOT EXISTS message_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  message_id UUID,
  conversation_id UUID REFERENCES conversations(id),
  access_type TEXT NOT NULL,
  content_accessed BOOLEAN DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE message_access_log ENABLE ROW LEVEL SECURITY;

-- Política para auditoria (apenas admins podem ver)
CREATE POLICY "Only admins can view message access logs"
ON message_access_log FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política para inserção de logs (sistema pode inserir)
CREATE POLICY "System can insert message access logs"
ON message_access_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. FASE 3: VIEW SANITIZADA PARA ANALYTICS
CREATE OR REPLACE VIEW message_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  sender_type,
  COUNT(*) as total_messages,
  AVG(LENGTH(content)) as avg_message_length,
  conversation_id
FROM messages
GROUP BY DATE_TRUNC('day', created_at), sender_type, conversation_id;

-- Habilitar RLS na view (herda das tabelas base)
ALTER VIEW message_analytics SET (security_barrier = true);

-- 6. Função para log de acesso (para uso futuro em triggers se necessário)
CREATE OR REPLACE FUNCTION log_message_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log apenas para usuários não-admin acessando conteúdo sensível
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    INSERT INTO message_access_log (
      user_id, message_id, conversation_id, access_type, content_accessed
    ) VALUES (
      auth.uid(), 
      CASE WHEN TG_OP = 'SELECT' THEN OLD.id ELSE NEW.id END,
      CASE WHEN TG_OP = 'SELECT' THEN OLD.conversation_id ELSE NEW.conversation_id END,
      TG_OP, 
      true
    );
  END IF;
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;