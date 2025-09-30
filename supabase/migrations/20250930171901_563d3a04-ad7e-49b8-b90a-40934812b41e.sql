-- Add pdf_url column to proposals table
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

COMMENT ON COLUMN proposals.pdf_url IS 'URL do PDF (temporária da PDF.co ou permanente do Supabase Storage)';