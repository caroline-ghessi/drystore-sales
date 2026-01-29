-- Corrigir modelo do agente quality_monitor para modelo válido da Anthropic
UPDATE agent_configs 
SET llm_model = 'claude-sonnet-4-20250514',
    max_tokens = 2000,
    updated_at = now()
WHERE agent_type = 'quality_monitor';