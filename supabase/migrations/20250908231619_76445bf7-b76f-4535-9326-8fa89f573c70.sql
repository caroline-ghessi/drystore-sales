-- Create saved_calculations table for storing intermediate calculations
CREATE TABLE public.saved_calculations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_type product_category NOT NULL,
  client_data jsonb NOT NULL DEFAULT '{}',
  calculation_input jsonb NOT NULL DEFAULT '{}',
  calculation_result jsonb NOT NULL DEFAULT '{}',
  name character varying NOT NULL,
  status character varying NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready_to_propose')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_calculations ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved_calculations
CREATE POLICY "Users can manage their own calculations"
ON public.saved_calculations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add update trigger for updated_at
CREATE TRIGGER update_saved_calculations_updated_at
  BEFORE UPDATE ON public.saved_calculations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_saved_calculations_user_id ON public.saved_calculations (user_id);
CREATE INDEX idx_saved_calculations_product_type ON public.saved_calculations (product_type);
CREATE INDEX idx_saved_calculations_status ON public.saved_calculations (status);