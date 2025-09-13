-- Adicionar novas categorias e unidades necessárias
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'impermeabilizacao_mapei';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'preparacao_piso_mapei';

-- Adicionar unidades necessárias para produtos MAPEI
ALTER TYPE product_unit ADD VALUE IF NOT EXISTS 'kit';
ALTER TYPE product_unit ADD VALUE IF NOT EXISTS 'balde';
ALTER TYPE product_unit ADD VALUE IF NOT EXISTS 'galao';
ALTER TYPE product_unit ADD VALUE IF NOT EXISTS 'rolo';

-- Inserir produtos MAPEI de impermeabilização
INSERT INTO public.products (code, name, description, category, subcategory, unit, base_price, cost, supplier, specifications, is_active) VALUES

-- Sistemas de Impermeabilização MAPEI
('MAPELASTIC-32KG', 'MAPELASTIC Kit', 'Sistema de impermeabilização bicomponente à base de cimento modificado com polímeros e membrana líquida sintética. Para aplicações internas e externas.', 'impermeabilizacao_mapei', 'sistema_bicomponente', 'kit', 450.00, 360.00, 'MAPEI Brasil', '{"consumption_per_m2": 3.0, "coverage_m2": 10.5, "components": ["Componente A - 24kg", "Componente B - 8kg"], "thickness_mm": 2.0, "colors": ["cinza"], "pot_life_minutes": 60, "curing_time_hours": 24}', true),

('MAPELASTIC-SMART-30KG', 'MAPELASTIC SMART Kit', 'Sistema de impermeabilização monocomponente pronto para uso, à base de cimento modificado com polímeros. Aplicação rápida e fácil.', 'impermeabilizacao_mapei', 'sistema_monocomponente', 'kit', 380.00, 304.00, 'MAPEI Brasil', '{"consumption_per_m2": 2.5, "coverage_m2": 12.0, "components": ["Componente único - 30kg"], "thickness_mm": 1.5, "colors": ["cinza"], "pot_life_minutes": 45, "curing_time_hours": 12}', true),

('MAPELASTIC-FOUNDATION-32KG', 'MAPELASTIC FOUNDATION Kit', 'Sistema de impermeabilização para fundações e subsolos, resistente à pressão negativa da água. Para aplicações enterradas.', 'impermeabilizacao_mapei', 'sistema_fundacao', 'kit', 520.00, 416.00, 'MAPEI Brasil', '{"consumption_per_m2": 3.5, "coverage_m2": 9.0, "components": ["Componente A - 24kg", "Componente B - 8kg"], "thickness_mm": 2.5, "colors": ["cinza"], "pot_life_minutes": 90, "curing_time_hours": 48}', true),

('AQUADEFENSE-15KG', 'AQUADEFENSE', 'Membrana líquida de impermeabilização monocomponente pronta para uso. Aplicação rápida, ideal para reformas e obras com prazo reduzido.', 'impermeabilizacao_mapei', 'membrana_liquida', 'balde', 320.00, 256.00, 'MAPEI Brasil', '{"consumption_per_m2": 1.0, "coverage_m2": 15.0, "components": ["Membrana líquida - 15kg"], "thickness_mm": 1.0, "colors": ["verde"], "pot_life_minutes": 30, "curing_time_hours": 6}', true),

-- Primers MAPEI
('PRIMER-G-10KG', 'PRIMER G', 'Primer consolidante à base de resinas sintéticas em dispersão aquosa. Para preparação de substratos porosos antes da impermeabilização.', 'impermeabilizacao_mapei', 'primer', 'galao', 85.00, 68.00, 'MAPEI Brasil', '{"consumption_per_m2": 0.2, "coverage_m2": 50.0, "dilution_ratio": "1:1", "colors": ["incolor"], "drying_time_hours": 2}', true),

('ECO-PRIM-GRIP-5KG', 'ECO PRIM GRIP', 'Primer de aderência concentrado à base de resinas sintéticas. Melhora a aderência da impermeabilização em substratos lisos.', 'impermeabilizacao_mapei', 'primer', 'balde', 120.00, 96.00, 'MAPEI Brasil', '{"consumption_per_m2": 0.15, "coverage_m2": 33.0, "dilution_ratio": "1:3", "colors": ["rosa"], "drying_time_hours": 4}', true),

-- Acessórios MAPEI
('MAPEBAND-10M', 'MAPEBAND', 'Fita elastomérica autoadesiva para vedação de juntas e cantos em sistemas de impermeabilização MAPEI.', 'impermeabilizacao_mapei', 'acessorio', 'rolo', 45.00, 36.00, 'MAPEI Brasil', '{"width_mm": 120, "length_m": 10, "thickness_mm": 1.5, "adhesive": "sim", "colors": ["cinza"]}', true),

('MAPEBAND-CORNER-10UN', 'MAPEBAND Corner', 'Cantoneiras pré-formadas em material elastomérico para vedação de cantos internos e externos.', 'impermeabilizacao_mapei', 'acessorio', 'unidade', 8.50, 6.80, 'MAPEI Brasil', '{"dimensions": "120x120mm", "quantity_per_pack": 10, "colors": ["cinza"], "application": ["cantos_internos", "cantos_externos"]}', true),

('MAPENET-150-1M2', 'MAPENET 150', 'Tela de fibra de vidro para reforço de impermeabilizações em áreas críticas como juntas e fissuras.', 'impermeabilizacao_mapei', 'acessorio', 'm2', 12.00, 9.60, 'MAPEI Brasil', '{"weight_g_m2": 150, "mesh_size_mm": 4, "colors": ["branco"], "roll_width_m": 1.0}', true),

-- Produtos de Preparação de Piso MAPEI
('ULTRAPLAN-ECO-23KG', 'ULTRAPLAN ECO', 'Massa niveladora autonivelante à base de cimento, para correção de pisos internos de 1 a 10mm.', 'preparacao_piso_mapei', 'massa_niveladora', 'saco', 95.00, 76.00, 'MAPEI Brasil', '{"consumption_per_m2_per_mm": 1.6, "thickness_min_mm": 1, "thickness_max_mm": 10, "pot_life_minutes": 20, "traffic_time_hours": 3}', true),

('NOVOPLAN-MAXI-25KG', 'NOVOPLAN MAXI', 'Massa regularizadora à base de cimento para correção de pisos internos e externos de 3 a 30mm.', 'preparacao_piso_mapei', 'massa_regularizadora', 'saco', 110.00, 88.00, 'MAPEI Brasil', '{"consumption_per_m2_per_mm": 1.8, "thickness_min_mm": 3, "thickness_max_mm": 30, "pot_life_minutes": 30, "traffic_time_hours": 24}', true),

('PLANIPATCH-25KG', 'PLANIPATCH', 'Massa para reparo e regularização de pisos de concreto, para correções pontuais e alisamento.', 'preparacao_piso_mapei', 'massa_reparo', 'saco', 75.00, 60.00, 'MAPEI Brasil', '{"consumption_per_m2_per_mm": 1.5, "thickness_min_mm": 1, "thickness_max_mm": 20, "pot_life_minutes": 45, "traffic_time_hours": 12}', true),

-- Primers para Preparação de Piso
('PRIMER-P-5KG', 'PRIMER P', 'Primer à base de resinas sintéticas para preparação de substratos antes da aplicação de massas niveladoras.', 'preparacao_piso_mapei', 'primer', 'balde', 65.00, 52.00, 'MAPEI Brasil', '{"consumption_per_m2": 0.1, "coverage_m2": 50.0, "dilution_ratio": "puro", "colors": ["incolor"], "drying_time_hours": 1}', true),

('ECO-PRIM-T-10KG', 'ECO PRIM T', 'Primer consolidante e bloqueador de umidade para substratos absorventes e com umidade residual.', 'preparacao_piso_mapei', 'primer', 'galao', 85.00, 68.00, 'MAPEI Brasil', '{"consumption_per_m2": 0.15, "coverage_m2": 67.0, "dilution_ratio": "1:1", "colors": ["transparente"], "drying_time_hours": 3}', true);