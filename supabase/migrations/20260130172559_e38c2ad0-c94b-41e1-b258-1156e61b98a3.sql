-- Add output_schema column to agent_configs table
-- This allows storing custom JSON output schemas for each agent
ALTER TABLE public.agent_configs 
ADD COLUMN IF NOT EXISTS output_schema JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.agent_configs.output_schema IS 'Custom JSON output schema for the agent. If empty, uses default from code.';