-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Enable all for authenticated users" ON vendor_conversations;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON vendor_messages;

-- Create granular RLS policies for vendor_conversations
CREATE POLICY "Admins and supervisors can view all vendor conversations"
ON vendor_conversations
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
);

CREATE POLICY "Admins and supervisors can manage all vendor conversations"
ON vendor_conversations
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
);

-- Create granular RLS policies for vendor_messages
CREATE POLICY "Admins and supervisors can view all vendor messages"
ON vendor_messages
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
);

CREATE POLICY "Admins and supervisors can manage all vendor messages"
ON vendor_messages
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
);

-- Create audit log for vendor data access
CREATE TABLE IF NOT EXISTS vendor_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  vendor_id uuid,
  conversation_id bigint,
  action_type varchar(50) NOT NULL,
  accessed_data jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE vendor_data_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view vendor access logs"
ON vendor_data_access_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert vendor access logs"
ON vendor_data_access_log
FOR INSERT
TO authenticated
WITH CHECK (true);