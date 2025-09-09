-- Create vendor permissions table (vendor_user_mapping already exists)
CREATE TABLE public.vendor_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_level VARCHAR NOT NULL DEFAULT 'basic' CHECK (access_level IN ('basic', 'intermediate', 'advanced')),
  max_discount_percentage NUMERIC DEFAULT 5.0,
  max_proposal_value NUMERIC DEFAULT 100000,
  allowed_product_categories JSONB DEFAULT '[]'::jsonb,
  can_access_calculator BOOLEAN DEFAULT true,
  can_generate_proposals BOOLEAN DEFAULT true,
  can_save_calculations BOOLEAN DEFAULT true,
  can_view_ranking BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(vendor_id, user_id)
);

-- Enable RLS
ALTER TABLE public.vendor_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendor_permissions
CREATE POLICY "Admins and supervisors can manage all vendor permissions"
ON public.vendor_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Vendors can view their own permissions"
ON public.vendor_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Update proposals RLS to restrict vendors to their own proposals
DROP POLICY IF EXISTS "Enable all for authenticated users on proposals" ON proposals;

CREATE POLICY "Admins and supervisors can manage all proposals"
ON public.proposals
FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'supervisor'));

CREATE POLICY "Vendors can manage their own proposals"
ON public.proposals
FOR ALL
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_vendor_permissions_updated_at
BEFORE UPDATE ON public.vendor_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();