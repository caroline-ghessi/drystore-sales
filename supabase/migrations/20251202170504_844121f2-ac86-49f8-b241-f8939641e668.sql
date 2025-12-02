-- Remover tabelas não utilizadas (todas vazias e sem dependências)
-- Verificação completa confirmou: 0 registros, sem uso no código, sem FKs dependentes

DROP TABLE IF EXISTS public.calculation_templates CASCADE;
DROP TABLE IF EXISTS public.crm_pipeline_stages CASCADE;
DROP TABLE IF EXISTS public.crm_customer_segments CASCADE;
DROP TABLE IF EXISTS public.crm_tasks CASCADE;
DROP TABLE IF EXISTS public.proposal_templates CASCADE;
DROP TABLE IF EXISTS public.proposal_workflows CASCADE;
DROP TABLE IF EXISTS public.product_categories CASCADE;
DROP TABLE IF EXISTS public.product_suppliers CASCADE;
DROP TABLE IF EXISTS public.sales_quotas CASCADE;
DROP TABLE IF EXISTS public.agent_prompt_history CASCADE;
DROP TABLE IF EXISTS public.vendor_data_access_log CASCADE;
DROP TABLE IF EXISTS public.message_access_log CASCADE;
DROP TABLE IF EXISTS public.conversation_analytics CASCADE;