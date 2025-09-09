-- Create vendor_user_mapping table to connect vendors with user profiles
CREATE TABLE public.vendor_user_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_type VARCHAR NOT NULL DEFAULT 'sales_rep',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one user can only be mapped to one vendor
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.vendor_user_mapping ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all for authenticated users on vendor_user_mapping" 
ON public.vendor_user_mapping 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_vendor_user_mapping_vendor_id ON public.vendor_user_mapping(vendor_id);
CREATE INDEX idx_vendor_user_mapping_user_id ON public.vendor_user_mapping(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_vendor_user_mapping_updated_at
  BEFORE UPDATE ON public.vendor_user_mapping
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();