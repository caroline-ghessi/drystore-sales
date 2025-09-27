-- Adicionar coluna de status do PDF nas propostas
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS pdf_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS pdf_error TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS pdf_processing_started_at TIMESTAMP WITH TIME ZONE;

-- Criar tabela para notificações de usuário
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notificações
CREATE POLICY "Users can view their own notifications" 
ON user_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON user_notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
ON user_notifications 
FOR INSERT 
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_user_notifications_updated_at
BEFORE UPDATE ON user_notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();