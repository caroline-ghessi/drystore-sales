-- Adicionar novas categorias e unidades necessárias
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'impermeabilizacao_mapei';
ALTER TYPE product_category ADD VALUE IF NOT EXISTS 'preparacao_piso_mapei';

-- Adicionar unidades necessárias para produtos MAPEI
ALTER TYPE product_unit ADD VALUE IF NOT EXISTS 'kit';
ALTER TYPE product_unit ADD VALUE IF NOT EXISTS 'balde';
ALTER TYPE product_unit ADD VALUE IF NOT EXISTS 'galao';
ALTER TYPE product_unit ADD VALUE IF NOT EXISTS 'rolo';