-- Adicionar categorias MAPEI ao enum product_category
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'impermeabilizacao_mapei';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'preparacao_piso_mapei';