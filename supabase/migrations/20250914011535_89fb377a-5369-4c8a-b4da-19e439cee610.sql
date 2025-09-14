-- Cadastrar produtos faltantes identificados nas calculadoras

-- 1. Kit de estruturas para energia solar (dimensionado por quantidade de módulos)
INSERT INTO public.products (
  code, name, description, category, subcategory, unit, base_price, cost, 
  specifications, is_active, supplier
) VALUES (
  'SOL-EST-KIT', 
  'Kit de Estruturas para Painéis Solares', 
  'Kit completo de estruturas de fixação para painéis solares (dimensionado por kWp)', 
  'energia_solar', 
  'estrutura', 
  'kwp', 
  600.00, 
  450.00,
  '{"coverage_area": 1, "yield_per_unit": 1, "installation_factor": 1.0, "weight": 15, "material": "aluminio_anodizado", "fixation_type": "telha_ceramica_metalica"}',
  true,
  'Estruturas Solares Ltda'
);

-- 2. Projeto e Documentação Solar (com faixas de valores por kWp)
INSERT INTO public.products (
  code, name, description, category, subcategory, unit, base_price, cost,
  specifications, is_active, supplier
) VALUES (
  'SOL-PROJ-DOC',
  'Projeto e Documentação Solar',
  'Serviços de projeto elétrico, ART, aprovação na concessionária e documentação completa',
  'energia_solar',
  'servico',
  'kwp',
  300.00,
  200.00,
  '{"service_type": "projeto_documentacao", "includes": ["projeto_eletrico", "art", "aprovacao_concessionaria", "homologacao"], "complexity_factor": 1.0, "processing_time_days": 30}',
  true,
  'Engenharia Solar Pro'
);

-- 3. Acessórios de Segurança para Battery Backup (DPS, etc)
INSERT INTO public.products (
  code, name, description, category, subcategory, unit, base_price, cost,
  specifications, is_active, supplier  
) VALUES (
  'BAT-ACESS-SEG',
  'Acessórios de Segurança para Battery Backup',
  'Kit de acessórios de segurança: DPS, disjuntores, cabos, fusíveis e conectores',
  'battery_backup',
  'acessorio',
  'kw',
  500.00,
  350.00,
  '{"includes": ["dps_cc", "dps_ca", "disjuntores", "fusivel_cc", "cabos_cc", "cabos_ca", "conectores", "terminal_terra"], "power_factor": 1.0, "protection_class": "IP65"}',
  true,
  'Proteção Elétrica Ltda'
);

-- 4. Mão de obra para instalação solar (para ser usado opcionalmente)
INSERT INTO public.products (
  code, name, description, category, subcategory, unit, base_price, cost,
  specifications, is_active, supplier
) VALUES (
  'SOL-INST-MO',
  'Instalação de Sistema Solar',
  'Mão de obra especializada para instalação completa de sistema solar fotovoltaico',
  'energia_solar',
  'servico', 
  'kwp',
  800.00,
  600.00,
  '{"service_type": "instalacao", "complexity_factor": 1.0, "includes": ["montagem_estruturas", "fixacao_modulos", "conexoes_eletricas", "teste_sistema"], "warranty_years": 5, "installation_time_days": 2}',
  true,
  'Instalações Solares Pro'
);

-- 5. Acessórios para telhas shingle (complementando o que falta)
INSERT INTO public.products (
  code, name, description, category, subcategory, unit, base_price, cost,
  specifications, is_active, supplier
) VALUES (
  'SH-ACESS-COMP',
  'Kit de Acessórios Complementares Shingle',
  'Kit com pregos, selantes, fitas e outros acessórios para instalação completa',
  'telha_shingle',
  'acessorio',
  'm2',
  15.00,
  10.00,
  '{"coverage_area": 10, "includes": ["pregos_galvanizados", "selante_poliuretano", "fita_vedacao", "conectores"], "yield_per_unit": 10}',
  true,
  'Acessórios Telhado Ltda'
);

-- 6. Equipamentos auxiliares para instalação de telhas shingle  
INSERT INTO public.products (
  code, name, description, category, subcategory, unit, base_price, cost,
  specifications, is_active, supplier
) VALUES (
  'SH-EQUIP-AUX',
  'Equipamentos Auxiliares para Instalação',
  'Locação de equipamentos auxiliares: andaimes, ferramentas e EPIs',
  'telha_shingle', 
  'servico',
  'm2',
  5.00,
  3.00,
  '{"service_type": "locacao_equipamentos", "includes": ["andaimes", "ferramentas", "epis", "transporte"], "coverage_area": 100}',
  true,
  'Locação de Equipamentos Telhado'
);