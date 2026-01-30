-- Corrigir modelos inválidos para modelos válidos de API direta

-- Corrigir 'claude-3' -> 'claude-3-5-sonnet-20241022'
UPDATE agent_configs 
SET llm_model = 'claude-3-5-sonnet-20241022' 
WHERE llm_model = 'claude-3';

-- Corrigir 'claude-sonnet-4-20250514' (modelo inexistente) -> 'claude-3-5-sonnet-20241022'
UPDATE agent_configs 
SET llm_model = 'claude-3-5-sonnet-20241022' 
WHERE llm_model = 'claude-sonnet-4-20250514';

-- Corrigir modelos Lovable Gateway (google/*) para Claude API direta
UPDATE agent_configs 
SET llm_model = 'claude-3-5-sonnet-20241022' 
WHERE llm_model LIKE 'google/%';

-- Corrigir modelos Lovable Gateway (openai/*) para OpenAI API direta
UPDATE agent_configs 
SET llm_model = 'gpt-4o' 
WHERE llm_model LIKE 'openai/%';

-- Log da correção para auditoria
INSERT INTO system_logs (level, source, message, data)
VALUES (
  'info',
  'migration-fix-llm-models',
  'Modelos LLM corrigidos para API direta',
  jsonb_build_object(
    'migrated_at', now(),
    'corrections', jsonb_build_object(
      'claude-3', 'claude-3-5-sonnet-20241022',
      'claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022',
      'google/*', 'claude-3-5-sonnet-20241022',
      'openai/*', 'gpt-4o'
    )
  )
);