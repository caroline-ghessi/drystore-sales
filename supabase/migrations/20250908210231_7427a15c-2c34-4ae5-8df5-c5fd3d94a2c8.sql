-- Insert Knauf/Ananda products
INSERT INTO public.products (code, name, description, category, subcategory, unit, base_price, cost, supplier, specifications, is_active) VALUES
-- Placas Knauf Standard  
('KNF-ST-120240', 'Placa Knauf Standard 1,20x2,40m', 'Placa gesso acartonado Standard para áreas secas', 'forro_knauf', 'placas_st', 'peca', 0, 0, 'Knauf', '{"dimensions": "1,20x2,40m", "area": 2.88, "weight": "9.5kg/m²", "color": "branca", "edge": "BR"}', true),
('KNF-ST-120180', 'Placa Knauf Standard 1,20x1,80m', 'Placa gesso acartonado Standard para áreas secas', 'forro_knauf', 'placas_st', 'peca', 0, 0, 'Knauf', '{"dimensions": "1,20x1,80m", "area": 2.16, "weight": "9.5kg/m²", "color": "branca", "edge": "BR"}', true),
('KNF-ST-120250', 'Placa Knauf Standard 1,20x2,50m', 'Placa gesso acartonado Standard para áreas secas', 'forro_knauf', 'placas_st', 'peca', 0, 0, 'Knauf', '{"dimensions": "1,20x2,50m", "area": 3.00, "weight": "9.5kg/m²", "color": "branca", "edge": "BR"}', true),

-- Placas Knauf RU (Resistente Umidade)
('KNF-RU-120240', 'Placa Knauf RU 1,20x2,40m', 'Placa gesso acartonado resistente à umidade', 'forro_knauf', 'placas_ru', 'peca', 0, 0, 'Knauf', '{"dimensions": "1,20x2,40m", "area": 2.88, "weight": "9.5kg/m²", "color": "verde", "edge": "BR"}', true),
('KNF-RU-120180', 'Placa Knauf RU 1,20x1,80m', 'Placa gesso acartonado resistente à umidade', 'forro_knauf', 'placas_ru', 'peca', 0, 0, 'Knauf', '{"dimensions": "1,20x1,80m", "area": 2.16, "weight": "9.5kg/m²", "color": "verde", "edge": "BR"}', true),
('KNF-RU-120250', 'Placa Knauf RU 1,20x2,50m', 'Placa gesso acartonado resistente à umidade', 'forro_knauf', 'placas_ru', 'peca', 0, 0, 'Knauf', '{"dimensions": "1,20x2,50m", "area": 3.00, "weight": "9.5kg/m²", "color": "verde", "edge": "BR"}', true),

-- Placas Knauf RF (Resistente Fogo)
('KNF-RF-120240', 'Placa Knauf RF 1,20x2,40m', 'Placa gesso acartonado resistente ao fogo', 'forro_knauf', 'placas_rf', 'peca', 0, 0, 'Knauf', '{"dimensions": "1,20x2,40m", "area": 2.88, "weight": "12kg/m²", "color": "rosa", "edge": "BR"}', true),
('KNF-RF-120180', 'Placa Knauf RF 1,20x1,80m', 'Placa gesso acartonado resistente ao fogo', 'forro_knauf', 'placas_rf', 'peca', 0, 0, 'Knauf', '{"dimensions": "1,20x1,80m", "area": 2.16, "weight": "12kg/m²", "color": "rosa", "edge": "BR"}', true),

-- Perfis Ananda Metais
('AND-F530-3M', 'Perfil F530 3,00m', 'Perfil canaleta estrutural para forro', 'forro_knauf', 'perfis', 'ml', 0, 0, 'Ananda Metais', '{"dimensions": "46x18mm", "length": "3.00m", "thickness": "0.50mm", "material": "aço galvanizado"}', true),
('AND-TAB-4048-3M', 'Tabica Lisa 40x48mm 3,00m', 'Tabica perimetral para acabamento', 'forro_knauf', 'acabamento', 'ml', 0, 0, 'Ananda Metais', '{"dimensions": "40x48mm", "length": "3.00m", "function": "acabamento perimetral"}', true),
('AND-TAB-5050-3M', 'Tabica Lisa 50x50mm 3,00m', 'Tabica perimetral para acabamento', 'forro_knauf', 'acabamento', 'ml', 0, 0, 'Ananda Metais', '{"dimensions": "50x50mm", "length": "3.00m", "function": "acabamento perimetral"}', true),
('AND-TAB-7650-3M', 'Tabica Lisa 76x50mm 3,00m', 'Tabica perimetral para acabamento', 'forro_knauf', 'acabamento', 'ml', 0, 0, 'Ananda Metais', '{"dimensions": "76x50mm", "length": "3.00m", "function": "acabamento perimetral"}', true),
('AND-CANT-2530-3M', 'Cantoneira Perimetral 25x30mm', 'Apoio perimetral alternativo', 'forro_knauf', 'acabamento', 'ml', 0, 0, 'Ananda Metais', '{"dimensions": "25x30mm", "length": "3.00m", "function": "apoio perimetral"}', true),

-- Sistema de Suspensão
('SUP-TIR-34', 'Tirante Ø3,4mm', 'Arame galvanizado para suspensão', 'forro_knauf', 'suspensao', 'peca', 0, 0, 'Genérico', '{"diameter": "3.4mm", "material": "arame galvanizado", "function": "suspensão estrutura"}', true),
('SUP-PEN-REG', 'Suporte Nivelador Regulável', 'Pendural para nivelamento e fixação', 'forro_knauf', 'suspensao', 'peca', 0, 0, 'Genérico', '{"max_load": "3.4 daN", "type": "regulável", "function": "nivelamento"}', true),

-- Parafusos e Fixação
('PAR-AGU-39x25', 'Parafuso Ponta Agulha 3,9x25mm', 'Para fixação placa em perfil', 'forro_knauf', 'fixacao', 'unidade', 0, 0, 'Genérico', '{"dimensions": "3.9x25mm", "type": "ponta agulha", "use": "placa/perfil"}', true),
('PAR-BRO-42x13', 'Parafuso Ponta Broca 4,2x13mm', 'Para união perfil com perfil', 'forro_knauf', 'fixacao', 'unidade', 0, 0, 'Genérico', '{"dimensions": "4.2x13mm", "type": "ponta broca", "use": "perfil/perfil"}', true),
('BUC-LAJ-8', 'Bucha para Laje Ø8mm', 'Fixação estrutural na laje', 'forro_knauf', 'fixacao', 'unidade', 0, 0, 'Genérico', '{"diameter": "8mm", "use": "fixação laje", "material": "nylon"}', true),

-- Materiais de Acabamento
('MAS-JUN-PO', 'Massa para Juntas em Pó', 'Tratamento de juntas e acabamento', 'forro_knauf', 'acabamento', 'kg', 0, 0, 'Genérico', '{"type": "em pó", "yield": "0.35 kg/m²", "application": "tratamento juntas"}', true),
('MAS-JUN-PRON', 'Massa para Juntas Pronta', 'Massa pronta para tratamento de juntas', 'forro_knauf', 'acabamento', 'kg', 0, 0, 'Genérico', '{"type": "pronta", "yield": "0.70 kg/m²", "application": "tratamento juntas"}', true),
('FIT-TEL-50', 'Fita Telada 50mm', 'Fita para reforço de juntas', 'forro_knauf', 'acabamento', 'ml', 0, 0, 'Genérico', '{"width": "50mm", "type": "telada", "yield": "3.0 m/m²"}', true),
('FIT-PAP-50', 'Fita Papel Microperfurado 50mm', 'Fita papel para juntas', 'forro_knauf', 'acabamento', 'ml', 0, 0, 'Genérico', '{"width": "50mm", "type": "papel microperfurado", "yield": "3.0 m/m²"}', true),

-- Isolamento (opcional)
('ISO-LAV-50', 'Lã de Vidro 50mm', 'Isolamento térmico/acústico', 'forro_knauf', 'isolamento', 'm2', 0, 0, 'Genérico', '{"thickness": "50mm", "density": "32kg/m³", "yield": "1.05 m²/m²"}', true),
('ISO-PET-50', 'Lã de PET 50mm', 'Isolamento sustentável', 'forro_knauf', 'isolamento', 'm2', 0, 0, 'Genérico', '{"thickness": "50mm", "material": "PET reciclado", "yield": "1.05 m²/m²"}', true),

-- Acessórios Especiais
('ALC-40x40', 'Alçapão 40x40cm', 'Acesso para manutenção', 'forro_knauf', 'acessorios', 'peca', 0, 0, 'Genérico', '{"dimensions": "40x40cm", "function": "acesso técnico", "material": "alumínio"}', true),
('CAI-SPOT-10', 'Caixa para Spot Ø10cm', 'Caixa para luminária embutida', 'forro_knauf', 'acessorios', 'peca', 0, 0, 'Genérico', '{"diameter": "10cm", "function": "luminária embutida", "material": "plástico"}', true),
('DIF-AR-15x15', 'Difusor Ar Condicionado 15x15cm', 'Difusor para climatização', 'forro_knauf', 'acessorios', 'peca', 0, 0, 'Genérico', '{"dimensions": "15x15cm", "function": "climatização", "material": "alumínio"}', true);