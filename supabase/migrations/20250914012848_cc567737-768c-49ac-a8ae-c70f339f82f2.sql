-- Add kWp unit to enum
ALTER TYPE product_unit ADD VALUE 'kwp';

-- Update solar project product to use kWp unit
UPDATE products 
SET unit = 'kwp'
WHERE code = 'PROJ-SOLAR-001';

-- Delete the kit product
DELETE FROM products 
WHERE code = 'KIT-SHINGLE-ACESS-001';

-- Insert individual shingle accessory products
INSERT INTO products (code, name, description, category, subcategory, unit, base_price, cost, supplier, specifications, is_active) VALUES
('PREGO-GALV-SHINGLE-001', 'Pregos Galvanizados para Shingle', 'Pregos galvanizados específicos para fixação de telhas shingle, resistentes à corrosão', 'telha_shingle', 'acessorios', 'kg', 28.50, 22.80, 'Fornecedor Geral', '{"material": "aço galvanizado", "comprimento_mm": 25, "diametro_mm": 3.5, "resistencia_corrosao": "alta", "quantidade_por_kg": "aproximadamente 400 unidades"}', true),

('SELANTE-PU-SHINGLE-001', 'Selante Poliuretano para Vedação Shingle', 'Selante de poliuretano para vedação de juntas e fixações em telhados shingle', 'telha_shingle', 'acessorios', 'unidade', 45.90, 36.72, 'Fornecedor Geral', '{"volume_ml": 300, "tipo": "poliuretano", "cor": "transparente", "temperatura_aplicacao": "-10°C a +35°C", "tempo_cura_horas": 24, "resistencia_uv": "alta"}', true),

('FITA-VEDACAO-SHINGLE-001', 'Fita de Vedação para Shingle', 'Fita autoadesiva para vedação de juntas e sobreposições em telhados shingle', 'telha_shingle', 'acessorios', 'ml', 12.80, 10.24, 'Fornecedor Geral', '{"largura_mm": 50, "espessura_mm": 1.5, "material": "asfalto modificado", "adesivo": "acrílico", "temperatura_aplicacao": "5°C a 40°C", "resistencia_uv": "alta"}', true),

('CONECT-PARAF-SHINGLE-001', 'Conectores e Parafusos para Shingle', 'Kit de conectores e parafusos para fixação de cumeeiras e acessórios em telhados shingle', 'telha_shingle', 'acessorios', 'unidade', 8.90, 7.12, 'Fornecedor Geral', '{"tipo": "parafuso autoatarraxante", "material": "aço inox", "comprimento_mm": 65, "cabeca": "sextavada", "vedacao": "com arruela de borracha EPDM", "quantidade_por_unidade": 50}', true),

('FITA-AUTOAD-AGUAS-001', 'Fita Autoadesiva para Águas Furtadas', 'Fita autoadesiva específica para vedação de águas furtadas em telhados shingle', 'telha_shingle', 'acessorios', 'ml', 18.75, 15.00, 'Fornecedor Geral', '{"largura_mm": 75, "espessura_mm": 2.0, "material": "asfalto modificado com polímeros", "adesivo": "butílico", "flexibilidade": "alta", "resistencia_temperatura": "-20°C a +80°C", "resistencia_uv": "excelente", "aplicacao": "águas furtadas e cantos internos"}', true);