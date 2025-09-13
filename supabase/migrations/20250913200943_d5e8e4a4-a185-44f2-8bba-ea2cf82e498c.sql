-- Cadastrar produtos estruturais de forro mineral acústico
INSERT INTO public.products (
    code, name, description, category, subcategory, unit, base_price, cost, supplier, is_active, specifications
) VALUES

-- Perfis principais
('FMA001', 'Perfil Principal (Main Runner) 3,66m', 'Perfil principal de sustentação para forro mineral acústico, barra de 3,66m', 'forro_mineral_acustico', 'estrutural', 'peca', 0.00, 0.00, 'A definir', true, '{"length_meters": 3.66, "type": "main_profile", "compatibility": ["all_modulations"]}'),

-- Perfis secundários
('FMA002', 'Perfil Secundário 1250mm', 'Perfil secundário para modulações retangulares 625x1250mm e 600x1200mm', 'forro_mineral_acustico', 'estrutural', 'peca', 0.00, 0.00, 'A definir', true, '{"length_meters": 1.25, "type": "secondary_profile", "compatibility": ["625x1250", "600x1200"]}'),

('FMA003', 'Perfil Secundário 625mm', 'Perfil secundário para modulações quadradas 625x625mm e 600x600mm', 'forro_mineral_acustico', 'estrutural', 'peca', 0.00, 0.00, 'A definir', true, '{"length_meters": 0.625, "type": "secondary_profile", "compatibility": ["625x625", "600x600"]}'),

-- Sistema de suspensão
('FMA004', 'Reguladores de Suspensão', 'Reguladores para ajuste de altura do sistema de suspensão', 'forro_mineral_acustico', 'suspensao', 'unidade', 0.00, 0.00, 'A definir', true, '{"type": "suspension_regulator", "adjustable_height": true}'),

-- Acessórios especiais
('FMA005', 'Clips de União Tegular', 'Clips especiais para fixação de placas com borda tegular (rebaixada)', 'forro_mineral_acustico', 'acessorios', 'unidade', 0.00, 0.00, 'A definir', true, '{"type": "tegular_clip", "edge_type": "tegular", "usage_per_100m2": 20}'),

('FMA006', 'Suportes para Luminárias', 'Suportes especiais para instalação de luminárias embutidas', 'forro_mineral_acustico', 'acessorios', 'unidade', 0.00, 0.00, 'A definir', true, '{"type": "light_support", "supports_per_fixture": 4, "compatible_fixtures": ["60x60", "60x120", "embutidas"]}}');