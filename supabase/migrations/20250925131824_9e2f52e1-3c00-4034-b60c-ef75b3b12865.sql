-- Add is_compressed column to proposal_pdfs table
ALTER TABLE public.proposal_pdfs 
ADD COLUMN IF NOT EXISTS is_compressed boolean DEFAULT false;

-- Add index for better performance  
CREATE INDEX IF NOT EXISTS idx_proposal_pdfs_proposal_id ON public.proposal_pdfs(proposal_id);

-- Update the status column to include new statuses
ALTER TABLE public.proposal_pdfs 
ALTER COLUMN status TYPE varchar(50);

-- Set default status to 'completed'
ALTER TABLE public.proposal_pdfs 
ALTER COLUMN status SET DEFAULT 'completed';