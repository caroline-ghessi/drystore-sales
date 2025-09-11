-- Atualizar configuração do agente summarizer para versão mais moderna
UPDATE agent_configs 
SET 
  llm_model = 'claude-3-5-sonnet-20241022',
  max_tokens = 2000,
  temperature = 0.3,
  updated_at = now()
WHERE agent_type = 'summarizer' AND is_active = true;