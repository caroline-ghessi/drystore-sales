-- Corrigir oportunidades que vieram do bot para source correto
-- Isso atualiza as 168 oportunidades que foram criadas como vendor_whatsapp mas vieram do bot

-- 1. Atualizar crm_opportunities
WITH bot_originated_opps AS (
  SELECT 
    o.id as opp_id,
    conv.id as bot_conversation_id
  FROM crm_opportunities o
  JOIN crm_customers c ON c.id = o.customer_id
  JOIN conversations conv ON conv.whatsapp_number = c.phone
  WHERE o.source = 'vendor_whatsapp'
)
UPDATE crm_opportunities o
SET 
  source = 'whatsapp',
  conversation_id = boo.bot_conversation_id,
  probability = GREATEST(COALESCE(probability, 0), 20)
FROM bot_originated_opps boo
WHERE o.id = boo.opp_id;

-- 2. Atualizar crm_customers correspondentes
UPDATE crm_customers c
SET 
  source = 'whatsapp',
  conversation_id = conv.id
FROM conversations conv
WHERE conv.whatsapp_number = c.phone
AND c.source = 'vendor_whatsapp';