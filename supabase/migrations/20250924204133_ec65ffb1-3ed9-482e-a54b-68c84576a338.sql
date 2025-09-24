-- Create table to track PDF generations
CREATE TABLE proposal_pdfs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL,
  template_id VARCHAR NOT NULL,
  pdf_url TEXT,
  job_id VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'processing',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE proposal_pdfs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their proposal PDFs" 
ON proposal_pdfs 
FOR SELECT 
USING (
  proposal_id IN (
    SELECT id FROM proposals WHERE created_by = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'supervisor')
  )
);

CREATE POLICY "Users can create proposal PDFs" 
ON proposal_pdfs 
FOR INSERT 
WITH CHECK (
  proposal_id IN (
    SELECT id FROM proposals WHERE created_by = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'supervisor')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_proposal_pdfs_updated_at
BEFORE UPDATE ON proposal_pdfs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_proposal_pdfs_proposal_id ON proposal_pdfs(proposal_id);
CREATE INDEX idx_proposal_pdfs_status ON proposal_pdfs(status);