-- Resetar arquivo de ferramentas que está travado
UPDATE agent_knowledge_files 
SET processing_status = 'extracted', 
    updated_at = NOW()
WHERE id = '2b81417a-2124-4e91-9ef0-9f9fcdb52538';