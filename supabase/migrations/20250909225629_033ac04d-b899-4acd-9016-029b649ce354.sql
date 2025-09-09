-- Inserir produtos de Drywall Divisórias com preços zerados

-- Placas Knauf
INSERT INTO public.products (code, name, description, category, subcategory, unit, base_price, cost, supplier, specifications, is_active) VALUES
('KNAUF-ST-12.5', 'Knauf ST 12,5mm (1,20x2,40m)', 'Placa de gesso acartonado standard para áreas secas', 'drywall_divisorias', 'placas_knauf', 'peça', 0, 0, 'Knauf', '{"dimensions": "1.20x2.40m", "area": 2.88, "thickness": "12.5mm", "color": "branca", "application": "areas_secas", "weight": "9.5kg/m2"}', true),
('KNAUF-RU-12.5', 'Knauf RU 12,5mm Verde (1,20x2,40m)', 'Placa resistente à umidade para banheiros e cozinhas', 'drywall_divisorias', 'placas_knauf', 'peça', 0, 0, 'Knauf', '{"dimensions": "1.20x2.40m", "area": 2.88, "thickness": "12.5mm", "color": "verde", "application": "areas_umidas", "absorption": "5%"}', true),
('KNAUF-RF-12.5', 'Knauf RF 12,5mm Rosa (1,20x2,40m)', 'Placa resistente ao fogo - 60 minutos', 'drywall_divisorias', 'placas_knauf', 'peça', 0, 0, 'Knauf', '{"dimensions": "1.20x2.40m", "area": 2.88, "thickness": "12.5mm", "color": "rosa", "application": "protecao_fogo", "fire_resistance": "60min"}', true),
('KNAUF-RF-15', 'Knauf RF 15mm Rosa (1,20x2,40m)', 'Placa resistente ao fogo - 90 minutos', 'drywall_divisorias', 'placas_knauf', 'peça', 0, 0, 'Knauf', '{"dimensions": "1.20x2.40m", "area": 2.88, "thickness": "15mm", "color": "rosa", "application": "protecao_fogo", "fire_resistance": "90min"}', true);

-- Placas Placo Performa
INSERT INTO public.products (code, name, description, category, subcategory, unit, base_price, cost, supplier, specifications, is_active) VALUES
('PLACO-PERFORMA-12.5', 'Placo Performa 12,5mm (1,20x2,40m)', 'Placa de alta performance - suporta 50kg direto', 'drywall_divisorias', 'placas_placo', 'peça', 0, 0, 'Placo', '{"dimensions": "1.20x2.40m", "area": 2.88, "thickness": "12.5mm", "color": "amarela", "load_capacity": "50kg", "noise_reduction": "50%", "impact_resistance": "50%"}', true),
('PLACO-PERFORMA-RU-12.5', 'Placo Performa RU 12,5mm (1,20x2,40m)', 'Placo Performa + resistência à umidade', 'drywall_divisorias', 'placas_placo', 'peça', 0, 0, 'Placo', '{"dimensions": "1.20x2.40m", "area": 2.88, "thickness": "12.5mm", "color": "amarela_ru", "load_capacity": "50kg", "moisture_resistant": true}', true);

-- Perfis Ananda Metais - Montantes
INSERT INTO public.products (code, name, description, category, subcategory, unit, base_price, cost, supplier, specifications, is_active) VALUES
('ANANDA-M48', 'Montante M48 (3,00m)', 'Perfil vertical 48mm x 3m - paredes simples', 'drywall_divisorias', 'perfis_montantes', 'barra', 0, 0, 'Ananda Metais', '{"length": 3.0, "width": 48, "thickness": "0.50mm", "application": "paredes_simples"}', true),
('ANANDA-M70', 'Montante M70 (3,00m)', 'Perfil vertical 70mm x 3m - paredes médias', 'drywall_divisorias', 'perfis_montantes', 'barra', 0, 0, 'Ananda Metais', '{"length": 3.0, "width": 70, "thickness": "0.50mm", "application": "paredes_medias"}', true),
('ANANDA-M90', 'Montante M90 (3,00m)', 'Perfil vertical 90mm x 3m - paredes reforçadas', 'drywall_divisorias', 'perfis_montantes', 'barra', 0, 0, 'Ananda Metais', '{"length": 3.0, "width": 90, "thickness": "0.50mm", "application": "paredes_reforcadas"}', true);

-- Perfis Ananda Metais - Guias
INSERT INTO public.products (code, name, description, category, subcategory, unit, base_price, cost, supplier, specifications, is_active) VALUES
('ANANDA-G48', 'Guia G48 (3,00m)', 'Perfil horizontal 48mm x 3m - base/topo M48', 'drywall_divisorias', 'perfis_guias', 'barra', 0, 0, 'Ananda Metais', '{"length": 3.0, "width": 48, "thickness": "0.50mm", "compatible_with": "M48"}', true),
('ANANDA-G70', 'Guia G70 (3,00m)', 'Perfil horizontal 70mm x 3m - base/topo M70', 'drywall_divisorias', 'perfis_guias', 'barra', 0, 0, 'Ananda Metais', '{"length": 3.0, "width": 70, "thickness": "0.50mm", "compatible_with": "M70"}', true),
('ANANDA-G90', 'Guia G90 (3,00m)', 'Perfil horizontal 90mm x 3m - base/topo M90', 'drywall_divisorias', 'perfis_guias', 'barra', 0, 0, 'Ananda Metais', '{"length": 3.0, "width": 90, "thickness": "0.50mm", "compatible_with": "M90"}', true);

-- Parafusos e Fixação
INSERT INTO public.products (code, name, description, category, subcategory, unit, base_price, cost, supplier, specifications, is_active) VALUES
('PARAFUSO-25MM', 'Parafuso Drywall 25mm', 'Parafuso para fixação placa no perfil metálico', 'drywall_divisorias', 'fixacao', 'unidade', 0, 0, 'Diversos', '{"length": "25mm", "application": "placa_metal", "head_type": "philips"}', true),
('PARAFUSO-35MM', 'Parafuso Drywall 35mm', 'Parafuso para segunda camada de placas', 'drywall_divisorias', 'fixacao', 'unidade', 0, 0, 'Diversos', '{"length": "35mm", "application": "dupla_placa", "head_type": "philips"}', true),
('PARAFUSO-13MM', 'Parafuso Metal-Metal 13mm', 'Parafuso para fixação de perfis metálicos', 'drywall_divisorias', 'fixacao', 'unidade', 0, 0, 'Diversos', '{"length": "13mm", "application": "metal_metal", "head_type": "philips"}', true);

-- Materiais de Acabamento
INSERT INTO public.products (code, name, description, category, subcategory, unit, base_price, cost, supplier, specifications, is_active) VALUES
('MASSA-DRYWALL-PO', 'Massa para Drywall em Pó', 'Massa para tratamento de juntas - saco 20kg', 'drywall_divisorias', 'acabamento', 'kg', 0, 0, 'Diversos', '{"package": "20kg", "application": "juntas", "drying_time": "24h"}', true),
('MASSA-DRYWALL-PRONTA', 'Massa para Drywall Pronta', 'Massa pronta para uso - balde 18kg', 'drywall_divisorias', 'acabamento', 'kg', 0, 0, 'Diversos', '{"package": "18kg", "application": "juntas", "ready_to_use": true}', true),
('FITA-JUNTAS', 'Fita para Juntas de Drywall', 'Fita de papel microperfurada - rolo 150m', 'drywall_divisorias', 'acabamento', 'metro', 0, 0, 'Diversos', '{"length": "150m", "material": "papel", "perforation": "micro"}', true),
('BANDA-ACUSTICA', 'Banda Acústica', 'Banda para isolamento acústico nas guias', 'drywall_divisorias', 'acabamento', 'metro', 0, 0, 'Diversos', '{"application": "isolamento_acustico", "installation": "guias"}', true);

-- Isolamento
INSERT INTO public.products (code, name, description, category, subcategory, unit, base_price, cost, supplier, specifications, is_active) VALUES
('LA-VIDRO-50MM', 'Lã de Vidro 50mm', 'Rolo lã de vidro 50mm - 15m² (1,20x12,5m)', 'drywall_divisorias', 'isolamento', 'rolo', 0, 0, 'Diversos', '{"thickness": "50mm", "area": 15, "dimensions": "1.20x12.5m", "density": "12-20kg/m3", "application": "M48_M70"}', true),
('LA-VIDRO-100MM', 'Lã de Vidro 100mm', 'Rolo lã de vidro 100mm - 15m² (1,20x12,5m)', 'drywall_divisorias', 'isolamento', 'rolo', 0, 0, 'Diversos', '{"thickness": "100mm", "area": 15, "dimensions": "1.20x12.5m", "density": "12-20kg/m3", "application": "M90"}', true),
('LA-ROCHA-50MM', 'Lã de Rocha 50mm', 'Rolo lã de rocha 50mm - 15m² (1,20x12,5m)', 'drywall_divisorias', 'isolamento', 'rolo', 0, 0, 'Diversos', '{"thickness": "50mm", "area": 15, "dimensions": "1.20x12.5m", "density": "32-40kg/m3", "fire_resistance": true}', true),
('LA-ROCHA-100MM', 'Lã de Rocha 100mm', 'Rolo lã de rocha 100mm - 15m² (1,20x12,5m)', 'drywall_divisorias', 'isolamento', 'rolo', 0, 0, 'Diversos', '{"thickness": "100mm", "area": 15, "dimensions": "1.20x12.5m", "density": "32-40kg/m3", "fire_resistance": true}', true);

-- Materiais Alternativos
INSERT INTO public.products (code, name, description, category, subcategory, unit, base_price, cost, supplier, specifications, is_active) VALUES
('OSB-11MM', 'OSB 11,1mm (1,20x2,40m)', 'Placa OSB para reforço ou acabamento rústico', 'drywall_divisorias', 'alternativo', 'peça', 0, 0, 'Diversos', '{"dimensions": "1.20x2.40m", "area": 2.88, "thickness": "11.1mm", "application": "reforco_rustico"}', true),
('OSB-15MM', 'OSB 15mm (1,20x2,40m)', 'Placa OSB para reforços estruturais', 'drywall_divisorias', 'alternativo', 'peça', 0, 0, 'Diversos', '{"dimensions": "1.20x2.40m", "area": 2.88, "thickness": "15mm", "application": "reforco_estrutural"}', true),
('CIMENTICIA-6MM', 'Placa Cimentícia 6mm (1,20x2,40m)', 'Para áreas externas ou acabamento industrial', 'drywall_divisorias', 'alternativo', 'peça', 0, 0, 'Diversos', '{"dimensions": "1.20x2.40m", "area": 2.88, "thickness": "6mm", "application": "externo_industrial"}', true),
('CIMENTICIA-8MM', 'Placa Cimentícia 8mm (1,20x2,40m)', 'Para áreas externas ou acabamento industrial', 'drywall_divisorias', 'alternativo', 'peça', 0, 0, 'Diversos', '{"dimensions": "1.20x2.40m", "area": 2.88, "thickness": "8mm", "application": "externo_industrial"}', true),
('CIMENTICIA-10MM', 'Placa Cimentícia 10mm (1,20x2,40m)', 'Para áreas externas ou acabamento industrial', 'drywall_divisorias', 'alternativo', 'peça', 0, 0, 'Diversos', '{"dimensions": "1.20x2.40m", "area": 2.88, "thickness": "10mm", "application": "externo_industrial"}', true);

-- Buchas Especiais para Placo Performa
INSERT INTO public.products (code, name, description, category, subcategory, unit, base_price, cost, supplier, specifications, is_active) VALUES
('BUCHA-TOGGLE-BOLT', 'Bucha Toggle Bolt', 'Bucha especial para Placo Performa - até 50kg', 'drywall_divisorias', 'fixacao_especial', 'unidade', 0, 0, 'Diversos', '{"load_capacity": "50kg", "application": "placo_performa", "type": "toggle_bolt"}', true),
('BUCHA-BASCULANTE', 'Bucha Metálica Basculante', 'Para cargas de 15-30kg em placas padrão', 'drywall_divisorias', 'fixacao_especial', 'unidade', 0, 0, 'Diversos', '{"load_capacity": "15-30kg", "application": "placas_padrao", "type": "basculante"}', true),
('BUCHA-PLASTICA', 'Bucha Plástica para Drywall', 'Para cargas até 15kg direto na placa', 'drywall_divisorias', 'fixacao_especial', 'unidade', 0, 0, 'Diversos', '{"load_capacity": "15kg", "application": "cargas_leves", "type": "plastica"}', true);