-- Add missing columns to proposals table for client data and calculation data storage
ALTER TABLE public.proposals 
ADD COLUMN client_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN calculation_data JSONB DEFAULT '{}'::jsonb;