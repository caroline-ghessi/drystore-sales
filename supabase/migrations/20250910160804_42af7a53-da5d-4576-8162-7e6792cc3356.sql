-- Create Caroline's profile and admin role directly
-- First, create a profile for caroline@drystore.com.br
INSERT INTO public.profiles (user_id, display_name, email, is_active)
VALUES (
  gen_random_uuid(),
  'Caroline',
  'caroline@drystore.com.br',
  true
);

-- Get the user_id that was just created for Caroline
DO $$
DECLARE
  caroline_user_id UUID;
BEGIN
  -- Get Caroline's user_id
  SELECT user_id INTO caroline_user_id 
  FROM public.profiles 
  WHERE email = 'caroline@drystore.com.br';
  
  -- Create admin role for Caroline
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (caroline_user_id, 'admin', caroline_user_id);
END $$;