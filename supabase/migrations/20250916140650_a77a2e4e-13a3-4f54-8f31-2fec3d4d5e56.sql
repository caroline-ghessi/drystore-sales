-- Create commission rules table
CREATE TABLE public.commission_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discount_min NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount_max NUMERIC(5,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT
);

-- Enable RLS
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage commission rules" 
ON public.commission_rules 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Supervisors can view commission rules" 
ON public.commission_rules 
FOR SELECT 
USING (has_role(auth.uid(), 'supervisor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Insert default commission rules (inverse relationship: more discount = less commission)
INSERT INTO public.commission_rules (discount_min, discount_max, commission_rate, description) VALUES
(0.00, 5.00, 8.00, 'Comissão máxima - desconto baixo'),
(5.01, 10.00, 6.00, 'Comissão alta - desconto moderado'),
(10.01, 15.00, 4.00, 'Comissão média - desconto alto'),
(15.01, 100.00, 2.00, 'Comissão mínima - desconto muito alto');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_commission_rules_updated_at
BEFORE UPDATE ON public.commission_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();