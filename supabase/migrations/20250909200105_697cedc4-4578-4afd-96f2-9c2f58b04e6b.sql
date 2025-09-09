-- Create solar equipment table with Amerisolar and Livoltek specifications
CREATE TABLE public.solar_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR NOT NULL, -- 'panel', 'inverter', 'battery'
  brand VARCHAR NOT NULL,
  model VARCHAR NOT NULL,
  specifications JSONB NOT NULL DEFAULT '{}',
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.solar_equipment ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Enable all for authenticated users on solar_equipment" 
ON public.solar_equipment 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add battery_backup to product_category enum
-- First check if the enum exists and add new values
DO $$ 
BEGIN
  -- Check if battery_backup doesn't exist in product_category
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e 
    JOIN pg_type t ON e.enumtypid = t.oid 
    WHERE t.typname = 'product_category' AND e.enumlabel = 'battery_backup'
  ) THEN
    ALTER TYPE product_category ADD VALUE 'battery_backup';
  END IF;
END $$;

-- Insert Amerisolar 550W panels
INSERT INTO public.solar_equipment (category, brand, model, specifications, price) VALUES 
(
  'panel',
  'Amerisolar',
  'AS-6M-550W',
  '{
    "power": 550,
    "technology": "Monocristalino Half-Cell",
    "efficiency": 0.21,
    "dimensions": {"width": 1.13, "height": 2.28, "thickness": 0.035},
    "weight": 27.5,
    "vmp": 41.0,
    "imp": 13.4,
    "voc": 49.0,
    "isc": 14.2,
    "temp_coef_power": -0.35,
    "temp_coef_voc": -0.28,
    "temp_coef_isc": 0.048
  }',
  1800
);

-- Insert Livoltek Inverters
INSERT INTO public.solar_equipment (category, brand, model, specifications, price) VALUES 
(
  'inverter',
  'Livoltek',
  'GF1-3K',
  '{
    "power_continuous": 3000,
    "power_peak": 6000,
    "input_voltage": "120-500V",
    "mppt_voltage": "120-500V",
    "battery_voltage": 48,
    "efficiency": 0.97,
    "type": "hybrid",
    "phases": 1
  }',
  4500
),
(
  'inverter',
  'Livoltek',
  'GF1-5K',
  '{
    "power_continuous": 5000,
    "power_peak": 10000,
    "input_voltage": "120-500V",
    "mppt_voltage": "120-500V",
    "battery_voltage": 48,
    "efficiency": 0.97,
    "type": "hybrid",
    "phases": 1
  }',
  7200
);

-- Insert Livoltek Batteries
INSERT INTO public.solar_equipment (category, brand, model, specifications, price) VALUES 
(
  'battery',
  'Livoltek',
  'BLF-B51100',
  '{
    "capacity_kwh": 5.12,
    "voltage": 51.2,
    "capacity_ah": 100,
    "technology": "LiFePO4",
    "cycles": 6000,
    "dod": 0.9,
    "weight": 55,
    "dimensions": {"width": 0.45, "height": 0.13, "depth": 0.69},
    "max_parallel": 5,
    "operating_temp": {"min": -10, "max": 55}
  }',
  12800
),
(
  'battery',
  'Livoltek',
  'BLF-B51150',
  '{
    "capacity_kwh": 7.68,
    "voltage": 51.2,
    "capacity_ah": 150,
    "technology": "LiFePO4",
    "cycles": 6000,
    "dod": 0.9,
    "weight": 82,
    "dimensions": {"width": 0.45, "height": 0.20, "depth": 0.69},
    "max_parallel": 5,
    "operating_temp": {"min": -10, "max": 55}
  }',
  18500
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_solar_equipment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_solar_equipment_updated_at
BEFORE UPDATE ON public.solar_equipment
FOR EACH ROW
EXECUTE FUNCTION public.update_solar_equipment_updated_at();