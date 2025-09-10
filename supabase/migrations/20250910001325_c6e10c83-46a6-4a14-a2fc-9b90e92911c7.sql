-- Add 'forro_mineral_acustico' to product_category enum
ALTER TYPE product_category ADD VALUE 'forro_mineral_acustico';

-- Insert the 10 acoustic mineral ceiling models into products table
INSERT INTO public.products (code, name, description, category, subcategory, unit, base_price, cost, supplier, specifications, is_active) VALUES
('ALCOR-625', 'Forro Mineral Acústico ALCOR', 'Placa mineral com alta absorção acústica, ideal para ambientes que exigem controle de ruído e conforto acústico.', 'forro_mineral_acustico', '625x625mm', 'm2', 45.00, 32.00, 'Armstrong', '{
  "nrc": 0.95,
  "weight_kg_m2": 3.2,
  "thickness_mm": 15,
  "edge_type": "tegular",
  "modulations": ["625x625"],
  "humidity_resistance": false,
  "fire_rating": "A2-s1,d0",
  "light_reflectance": 85,
  "surface_finish": "smooth"
}', true),

('APUS-625', 'Forro Mineral Acústico APUS', 'Placa mineral com excelente desempenho acústico e estético, superfície lisa e uniforme.', 'forro_mineral_acustico', '625x625mm', 'm2', 42.00, 29.50, 'Armstrong', '{
  "nrc": 0.90,
  "weight_kg_m2": 3.0,
  "thickness_mm": 15,
  "edge_type": "tegular",
  "modulations": ["625x625"],
  "humidity_resistance": false,
  "fire_rating": "A2-s1,d0",
  "light_reflectance": 82,
  "surface_finish": "smooth"
}', true),

('LUCIDA-625', 'Forro Mineral Acústico LÚCIDA', 'Placa mineral de alta qualidade com acabamento premium e excelente absorção sonora.', 'forro_mineral_acustico', '625x625mm', 'm2', 48.00, 34.00, 'Armstrong', '{
  "nrc": 0.85,
  "weight_kg_m2": 3.5,
  "thickness_mm": 15,
  "edge_type": "tegular",
  "modulations": ["625x625"],
  "humidity_resistance": true,
  "fire_rating": "A2-s1,d0",
  "light_reflectance": 88,
  "surface_finish": "textured"
}', true),

('NAVI-625', 'Forro Mineral Acústico NAVI', 'Solução econômica com bom desempenho acústico para ambientes comerciais e residenciais.', 'forro_mineral_acustico', '625x625mm', 'm2', 38.00, 26.50, 'Armstrong', '{
  "nrc": 0.75,
  "weight_kg_m2": 2.8,
  "thickness_mm": 12,
  "edge_type": "square",
  "modulations": ["625x625"],
  "humidity_resistance": false,
  "fire_rating": "A2-s1,d0",
  "light_reflectance": 78,
  "surface_finish": "smooth"
}', true),

('ADHARA-625', 'Forro Mineral Acústico ADHARA', 'Placa mineral com design diferenciado e alta performance acústica para projetos especiais.', 'forro_mineral_acustico', '625x625mm', 'm2', 52.00, 37.50, 'Armstrong', '{
  "nrc": 0.92,
  "weight_kg_m2": 3.3,
  "thickness_mm": 18,
  "edge_type": "tegular",
  "modulations": ["625x625"],
  "humidity_resistance": true,
  "fire_rating": "A1",
  "light_reflectance": 90,
  "surface_finish": "micro_perforated"
}', true),

('KYROS-625', 'Forro Mineral Acústico KYROS', 'Placa mineral robusta com excelente durabilidade e resistência à umidade.', 'forro_mineral_acustico', '625x625mm', 'm2', 46.00, 33.00, 'Armstrong', '{
  "nrc": 0.88,
  "weight_kg_m2": 3.4,
  "thickness_mm": 15,
  "edge_type": "tegular",
  "modulations": ["625x625"],
  "humidity_resistance": true,
  "fire_rating": "A2-s1,d0",
  "light_reflectance": 83,
  "surface_finish": "smooth"
}', true),

('LYRA-625', 'Forro Mineral Acústico LYRA', 'Placa mineral com padrão decorativo e alta absorção acústica para ambientes sofisticados.', 'forro_mineral_acustico', '625x625mm', 'm2', 49.00, 35.00, 'Armstrong', '{
  "nrc": 0.87,
  "weight_kg_m2": 3.1,
  "thickness_mm": 15,
  "edge_type": "tegular",
  "modulations": ["625x625"],
  "humidity_resistance": false,
  "fire_rating": "A2-s1,d0",
  "light_reflectance": 85,
  "surface_finish": "patterned"
}', true),

('ECOMIN-625', 'Forro Mineral Acústico ECOMIN', 'Solução sustentável com componentes reciclados e boa performance acústica.', 'forro_mineral_acustico', '625x625mm', 'm2', 40.00, 28.00, 'Armstrong', '{
  "nrc": 0.80,
  "weight_kg_m2": 2.9,
  "thickness_mm": 12,
  "edge_type": "square",
  "modulations": ["625x625"],
  "humidity_resistance": false,
  "fire_rating": "A2-s1,d0",
  "light_reflectance": 80,
  "surface_finish": "smooth"
}', true),

('THERMATEX-625', 'Forro Mineral Acústico THERMATEX', 'Placa mineral com propriedades térmicas adicionais e excelente isolamento acústico.', 'forro_mineral_acustico', '625x625mm', 'm2', 55.00, 40.00, 'Knauf', '{
  "nrc": 0.93,
  "weight_kg_m2": 3.6,
  "thickness_mm": 20,
  "edge_type": "tegular",
  "modulations": ["625x625"],
  "humidity_resistance": true,
  "fire_rating": "A1",
  "light_reflectance": 87,
  "surface_finish": "micro_perforated"
}', true),

('TOPIQ-PRIME-625', 'Forro Mineral Acústico TOPIQ PRIME', 'Linha premium com máxima performance acústica e acabamento superior.', 'forro_mineral_acustico', '625x625mm', 'm2', 58.00, 42.50, 'Knauf', '{
  "nrc": 0.98,
  "weight_kg_m2": 3.8,
  "thickness_mm": 22,
  "edge_type": "tegular",
  "modulations": ["625x625"],
  "humidity_resistance": true,
  "fire_rating": "A1",
  "light_reflectance": 92,
  "surface_finish": "premium_smooth"
}', true);