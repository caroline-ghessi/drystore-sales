-- Parte 1: Adicionar novo tipo de agente ao enum
ALTER TYPE agent_type ADD VALUE IF NOT EXISTS 'crm_validator';