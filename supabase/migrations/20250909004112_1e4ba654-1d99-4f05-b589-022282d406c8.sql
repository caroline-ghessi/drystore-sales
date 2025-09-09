-- Criar produtos reais de telha shingle baseados na documentação técnica
-- Produtos principais: Telhas Shingle

-- Telha Shingle Oakridge (30 anos garantia)
INSERT INTO public.products (
  code, 
  name, 
  description, 
  category, 
  subcategory, 
  unit, 
  base_price, 
  cost, 
  specifications, 
  supplier, 
  is_active
) VALUES (
  'SH-OAK-FAR',
  'Telha Shingle Oakridge - Fardo',
  'Telha asfáltica tipo shingle Owens Corning Oakridge. Garantia 30 anos, resistência ao vento até 209 km/h. Rendimento: 3m² por fardo. Dimensões: 45cm x 150cm (3 abas).',
  'telha_shingle',
  'telha_principal',
  'unidade',
  0, -- Preço será preenchido posteriormente
  0, -- Custo será preenchido posteriormente
  '{
    "garantia_anos": 30,
    "resistencia_vento_kmh": 209,
    "rendimento_m2": 3.0,
    "dimensoes": "45cm x 150cm",
    "abas": 3,
    "linha": "OAKRIDGE",
    "uso": "cobertura_principal"
  }'::jsonb,
  'Owens Corning',
  true
);

-- Telha Shingle Supreme (25 anos garantia) - para starter
INSERT INTO public.products (
  code, 
  name, 
  description, 
  category, 
  subcategory, 
  unit, 
  base_price, 
  cost, 
  specifications, 
  supplier, 
  is_active
) VALUES (
  'SH-SUP-FAR',
  'Telha Shingle Supreme - Fardo',
  'Telha asfáltica tipo shingle Owens Corning Supreme. Garantia 25 anos, resistência ao vento até 100 km/h. Rendimento: 3m² por fardo para cobertura ou 6m lineares para starter. Dimensões: 45cm x 150cm (3 abas).',
  'telha_shingle',
  'telha_starter',
  'unidade',
  0, -- Preço será preenchido posteriormente
  0, -- Custo será preenchido posteriormente
  '{
    "garantia_anos": 25,
    "resistencia_vento_kmh": 100,
    "rendimento_m2": 3.0,
    "rendimento_starter_ml": 6.0,
    "dimensoes": "45cm x 150cm",
    "abas": 3,
    "linha": "SUPREME",
    "uso": "starter_cumeeira"
  }'::jsonb,
  'Owens Corning',
  true
);

-- OSB 11,1mm para base
INSERT INTO public.products (
  code, 
  name, 
  description, 
  category, 
  subcategory, 
  unit, 
  base_price, 
  cost, 
  specifications, 
  supplier, 
  is_active
) VALUES (
  'SH-OSB-11',
  'Placa OSB 11,1mm - 1,20x2,40m',
  'Placa OSB (Oriented Strand Board) para base de telhado shingle. Espessura 11,1mm. Dimensões: 1,20m x 2,40m = 2,88m² por placa.',
  'telha_shingle',
  'base_estrutural',
  'peca',
  0, -- Preço será preenchido posteriormente
  0, -- Custo será preenchido posteriormente
  '{
    "espessura_mm": 11.1,
    "dimensoes": "1,20m x 2,40m",
    "area_m2": 2.88,
    "material": "OSB",
    "uso": "base_telhado"
  }'::jsonb,
  'Nacional',
  true
);

-- Manta de Subcobertura RhinoRoof
INSERT INTO public.products (
  code, 
  name, 
  description, 
  category, 
  subcategory, 
  unit, 
  base_price, 
  cost, 
  specifications, 
  supplier, 
  is_active
) VALUES (
  'SH-RHI-87',
  'Manta RhinoRoof - Rolo 1,1x87m',
  'Manta de subcobertura asfáltica RhinoRoof. Densidade mínima 300g/m². Rolo: 1,1m x 87m = 95,7m² nominal (86m² úteis considerando sobreposições).',
  'telha_shingle',
  'subcobertura',
  'unidade',
  0, -- Preço será preenchido posteriormente
  0, -- Custo será preenchido posteriormente
  '{
    "largura_m": 1.1,
    "comprimento_m": 87,
    "area_nominal_m2": 95.7,
    "area_util_m2": 86.0,
    "densidade_gm2": 300,
    "material": "asfaltico",
    "sobreposicao_cm": 10
  }'::jsonb,
  'RhinoRoof',
  true
);

-- Pregos para Telhas
INSERT INTO public.products (
  code, 
  name, 
  description, 
  category, 
  subcategory, 
  unit, 
  base_price, 
  cost, 
  specifications, 
  supplier, 
  is_active
) VALUES (
  'SH-PRG-TEL',
  'Pregos para Telha Shingle - Caixa 7.200un',
  'Pregos para fixação de telhas shingle. Especificação: 3,1mm x 22mm para pregadeira pneumática. Caixa com 7.200 pregos. Uso: 4-6 pregos por telha.',
  'telha_shingle',
  'fixacao',
  'unidade',
  0, -- Preço será preenchido posteriormente
  0, -- Custo será preenchido posteriormente
  '{
    "diametro_mm": 3.1,
    "comprimento_mm": 22,
    "quantidade_caixa": 7200,
    "uso": "fixacao_telha",
    "consumo_por_telha": 4
  }'::jsonb,
  'Nacional',
  true
);

-- Pregos para OSB
INSERT INTO public.products (
  code, 
  name, 
  description, 
  category, 
  subcategory, 
  unit, 
  base_price, 
  cost, 
  specifications, 
  supplier, 
  is_active
) VALUES (
  'SH-PRG-OSB',
  'Pregos para OSB - Caixa 5kg',
  'Pregos para fixação de placas OSB na estrutura do telhado. Fixação a cada 15cm nas bordas e 30cm no centro. Consumo: ~50 pregos por placa.',
  'telha_shingle',
  'fixacao',
  'kg',
  0, -- Preço será preenchido posteriormente
  0, -- Custo será preenchido posteriormente
  '{
    "material": "aco",
    "uso": "fixacao_osb",
    "consumo_por_placa": 50,
    "espacamento_borda_cm": 15,
    "espacamento_centro_cm": 30
  }'::jsonb,
  'Nacional',
  true
);

-- Grampos para Manta
INSERT INTO public.products (
  code, 
  name, 
  description, 
  category, 
  subcategory, 
  unit, 
  base_price, 
  cost, 
  specifications, 
  supplier, 
  is_active
) VALUES (
  'SH-GRA-MAN',
  'Grampos para Manta - Caixa 100un',
  'Grampos ou pregos com caps (arruelas) para fixação da manta de subcobertura. Consumo: ~100 unidades por rolo de manta.',
  'telha_shingle',
  'fixacao',
  'unidade',
  0, -- Preço será preenchido posteriormente
  0, -- Custo será preenchido posteriormente
  '{
    "tipo": "grampo_cap",
    "uso": "fixacao_manta",
    "consumo_por_rolo": 100,
    "material": "aco_galvanizado"
  }'::jsonb,
  'Nacional',
  true
);

-- Aerador de Telhado
INSERT INTO public.products (
  code, 
  name, 
  description, 
  category, 
  subcategory, 
  unit, 
  base_price, 
  cost, 
  specifications, 
  supplier, 
  is_active
) VALUES (
  'SH-AER-DRY',
  'Aerador Drystore para Telhado',
  'Aerador de telhado para ventilação do sistema shingle. NFVA: 72 cm² por unidade. Aplicação da regra 1/300 (1m² ventilação para cada 300m² de telhado).',
  'telha_shingle',
  'ventilacao',
  'peca',
  0, -- Preço será preenchido posteriormente
  0, -- Custo será preenchido posteriormente
  '{
    "nfva_cm2": 72,
    "regra_ventilacao": "1/300",
    "tipo": "aerador_saida",
    "material": "plastico_resistente"
  }'::jsonb,
  'Drystore',
  true
);

-- Cumeeira Ventilada
INSERT INTO public.products (
  code, 
  name, 
  description, 
  category, 
  subcategory, 
  unit, 
  base_price, 
  cost, 
  specifications, 
  supplier, 
  is_active
) VALUES (
  'SH-CUM-VEN',
  'Cumeeira Ventilada - Metro Linear',
  'Cumeeira ventilada para sistema de ventilação do telhado shingle. NFVA: 141 cm² por metro linear. Alternativa aos aeradores pontuais.',
  'telha_shingle',
  'ventilacao',
  'ml',
  0, -- Preço será preenchido posteriormente
  0, -- Custo será preenchido posteriormente
  '{
    "nfva_cm2_ml": 141,
    "tipo": "cumeeira_ventilada",
    "aplicacao": "ventilacao_continua",
    "material": "plastico_uv"
  }'::jsonb,
  'Nacional',
  true
);

-- Comentário informativo sobre o sistema
COMMENT ON TABLE public.products IS 'Produtos do sistema de telhas shingle baseados na documentação técnica real da Owens Corning. Preços serão definidos posteriormente conforme negociações comerciais.';